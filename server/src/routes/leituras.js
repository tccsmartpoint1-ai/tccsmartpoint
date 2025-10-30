const express = require('express');
const router = express.Router();
const { LeiturasReais, Colaboradores, Dispositivos } = require('../models/index');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');
const { Op } = require('sequelize');

// ==== FILTROS DE CONSULTA ====
function buildWhere(query) {
  const { from, to, tag, colaboradorId, status } = query;
  const where = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) where.data = { [Op.gte]: d };
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) where.data = { ...(where.data || {}), [Op.lte]: d };
  }
  if (tag) where.tag_uid = tag;
  if (colaboradorId) where.colaborador_id = colaboradorId;
  if (status === 'autorizado') where.autorizado = true;
  if (status === 'negado') where.autorizado = false;
  return where;
}

// ==== EXPORTAÇÃO DO MÓDULO COM SOCKET ====
module.exports = (io) => {

  // === ROTA PÚBLICA PARA O ARDUINO (sem token) ===
  router.post('/arduino', async (req, res) => {
    try {
      const { rfid, nome, dispositivo, autorizado } = req.body;

      if (!rfid) {
        return res.status(400).json({ error: 'Campo rfid é obrigatório' });
      }

      // Tenta localizar colaborador pelo RFID
      const colaborador = await Colaboradores.findOne({
        include: [{ model: require('../models').Tags, where: { uid: rfid } }]
      });

      // Tenta localizar o dispositivo pelo nome (ou usa 1)
      const disp = await Dispositivos.findOne({ where: { nome: dispositivo } });

      // Cria o registro
      const leitura = await LeiturasReais.create({
        tag_uid: rfid,
        colaborador_id: colaborador ? colaborador.id : null,
        dispositivo_id: disp ? disp.id : null,
        autorizado: autorizado ?? !!colaborador,
        tipo_batida: 'entrada',
        mensagem: colaborador ? 'Acesso permitido' : 'Cartão não reconhecido',
        raw_payload: req.body,
        ip: req.ip
      });

      // Emite evento em tempo real
      io.emit('novaLeitura', leitura);

      res.status(201).json({ ok: true, id: leitura.id });
    } catch (err) {
      console.error('Erro ao salvar leitura do Arduino:', err);
      res.status(500).json({ error: 'Erro ao salvar leitura do Arduino' });
    }
  });

  // === ROTA PROTEGIDA (listagem) ===
  router.get('/', auth, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      const where = buildWhere(req.query);

      const { count, rows } = await LeiturasReais.findAndCountAll({
        where,
        include: [{ model: Colaboradores }, { model: Dispositivos }],
        order: [['id', 'DESC']],
        offset: parseInt(offset),
        limit: parseInt(limit)
      });

      res.json({ data: rows, total: count, page: Number(page), lastPage: Math.ceil(count / limit) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao listar leituras reais' });
    }
  });

  // === EXPORTAR CSV ===
  router.get('/export', auth, async (req, res) => {
    try {
      const where = buildWhere(req.query);
      const rows = await LeiturasReais.findAll({
        where,
        include: [{ model: Colaboradores }, { model: Dispositivos }],
        order: [['id', 'DESC']]
      });

      const flat = rows.map(r => ({
        id: r.id,
        data: r.data,
        hora: r.hora,
        tag_uid: r.tag_uid,
        tipo_batida: r.tipo_batida,
        autorizado: r.autorizado,
        colaborador: r.Colaboradore?.nome || '',
        dispositivo: r.Dispositivo?.nome || '',
        mensagem: r.mensagem || ''
      }));

      const parser = new Parser();
      const csv = parser.parse(flat);

      res.header('Content-Type', 'text/csv');
      res.attachment('leituras_reais.csv');
      return res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao exportar leituras reais' });
    }
  });

  return router;
};
