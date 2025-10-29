const express = require('express');
const router = express.Router();
const { Leitura, Colaborador, Dispositivo } = require('../models/index');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');
const { Op } = require('sequelize');

function buildWhere(query) {
  const { from, to, tag, colaboradorId, status } = query;
  const where = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) where.hora = { [Op.gte]: d };
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) where.hora = { ...(where.hora || {}), [Op.lte]: d };
  }
  if (tag) where.tag_uid = tag;
  if (colaboradorId) where.colaborador_id = colaboradorId;
  if (status === 'autorizado') where.autorizado = true;
  if (status === 'negado') where.autorizado = false;
  return where;
}

// Função principal exportada com io
module.exports = (io) => {
 // === ROTA PÚBLICA PARA ARDUINO (sem token) ===
router.post('/arduino', async (req, res) => {
  try {
    const { uid, nome, autorizado, timestamp, ip } = req.body;

    if (!uid || !timestamp) {
      return res.status(400).json({ error: 'UID e timestamp são obrigatórios' });
    }

    // tenta achar o colaborador pela tag UID
    const colaborador = await Colaborador.findOne({ where: { tag_uid: uid } });

    // cria a leitura vinculando colaborador e dispositivo (se aplicável)
    const leitura = await Leitura.create({
      tag_uid: uid,
      colaborador_id: colaborador ? colaborador.id : null,
      autorizado,
      hora: new Date(timestamp),
      ip,
      raw_payload: { nome, origem: 'arduino' }
    });

    console.log(`Leitura do Arduino: ${uid} - ${colaborador ? colaborador.nome : 'Sem vínculo'} (${autorizado ? 'LIBERADO' : 'NEGADO'})`);

    // busca a leitura já com joins (colaborador + dispositivo)
    const leituraCompleta = await Leitura.findByPk(leitura.id, {
      include: [{ model: Colaborador }, { model: Dispositivo }]
    });

    // envia para todos os navegadores conectados
    io.emit('novaLeitura', leituraCompleta);

    res.status(201).json({ ok: true, id: leitura.id });
  } catch (err) {
    console.error('Erro ao salvar leitura do Arduino:', err);
    res.status(500).json({ error: 'Erro ao salvar leitura do Arduino' });
  }
});


  // === ROTAS PROTEGIDAS ===
  router.get('/', auth, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      const where = buildWhere(req.query);

      const { count, rows } = await Leitura.findAndCountAll({
        where,
        include: [{ model: Colaborador }, { model: Dispositivo }],
        order: [['hora', 'DESC']],
        offset: parseInt(offset),
        limit: parseInt(limit)
      });

      res.json({ data: rows, total: count, page: Number(page), lastPage: Math.ceil(count / limit) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao listar leituras' });
    }
  });

  // === EXPORTAR CSV ===
  router.get('/export', auth, async (req, res) => {
    try {
      const where = buildWhere(req.query);

      const rows = await Leitura.findAll({
        where,
        include: [{ model: Colaborador }, { model: Dispositivo }],
        order: [['hora', 'DESC']]
      });

      const flat = rows.map(r => ({
        id: r.id,
        hora: r.hora,
        tag_uid: r.tag_uid,
        autorizado: r.autorizado,
        colaborador: r.colaborador?.nome || '',
        dispositivo: r.dispositivo?.nome || '',
        ip: r.ip || '',
        raw_payload: r.raw_payload ? JSON.stringify(r.raw_payload) : ''
      }));

      const parser = new Parser();
      const csv = parser.parse(flat);

      res.header('Content-Type', 'text/csv');
      res.attachment('leituras_export.csv');
      return res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao exportar leituras' });
    }
  });

  return router;
};
