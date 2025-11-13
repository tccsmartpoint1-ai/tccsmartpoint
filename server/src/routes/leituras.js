const express = require('express');
const router = express.Router();
const { LeiturasReais, Colaborador, Dispositivo, Tag } = require('../models/index');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');
const { Op } = require('sequelize');

// ==== FUNÇÃO DE FILTRO PARA CONSULTAS ====
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

module.exports = (io) => {

  // === ROTA PÚBLICA PARA O ARDUINO ===
  router.post('/arduino', async (req, res) => {
    try {
      const { rfid, nome, dispositivo, timestamp } = req.body;

      if (!rfid) {
        return res.status(400).json({ error: 'Campo rfid é obrigatório' });
      }

      const tag = await Tag.findOne({ where: { uid: rfid } });
      const colaborador = tag ? await Colaborador.findByPk(tag.colaborador_id) : null;

      let disp = await Dispositivo.findOne({ where: { nome: dispositivo } });
      if (!disp) {
        disp = await Dispositivo.create({
          nome: dispositivo || 'Desconhecido',
          identificador: dispositivo ? dispositivo.toLowerCase().replace(/\s+/g, '_') : 'sem_nome',
          descricao: 'Criado automaticamente via Arduino'
        });
      }

      const now = timestamp ? new Date(timestamp) : new Date();
      if (isNaN(now.getTime())) {
        return res.status(400).json({ error: 'timestamp inválido' });
      }

      const local = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const dataFormatada = local.toISOString().split('T')[0];
      const horaFormatada = local.toTimeString().split(' ')[0];

      const autorizado = !!colaborador;
      const mensagem = autorizado
        ? `Acesso permitido: ${colaborador.nome}`
        : 'Cartão não reconhecido';

      const leitura = await LeiturasReais.create({
        tag_uid: rfid,
        colaborador_id: colaborador ? colaborador.id : null,
        dispositivo_id: disp ? disp.id : null,
        autorizado,
        tipo_batida: 'entrada',
        data: dataFormatada,
        hora: horaFormatada,
        origem: 'arduino',
        mensagem,
        raw_payload: req.body,
        ip: req.ip
      });

      const leituraCompleta = await LeiturasReais.findByPk(leitura.id, {
        include: [
          { model: Colaborador, as: 'colaborador' },
          { model: Dispositivo, as: 'dispositivo' }
        ]
      });

      io.emit('novaLeitura', leituraCompleta);

      return res.status(200).json({
        status: autorizado ? "ok" : "negado",
        mensagem,
        leitura: leituraCompleta
      });

    } catch (err) {
      console.error('=== ERRO AO SALVAR LEITURA DO ARDUINO ===');
      console.error(err);
      res.status(500).json({
        status: "erro",
        mensagem: "Erro ao salvar leitura do Arduino"
      });
    }
  });

  // === ROTA PROTEGIDA (LISTAGEM) ===
  router.get('/', auth, async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      const where = buildWhere(req.query);

      const { count, rows } = await LeiturasReais.findAndCountAll({
        where,
        include: [
          { model: Colaborador, as: 'colaborador' },
          { model: Dispositivo, as: 'dispositivo' }
        ],
        order: [['id', 'DESC']],
        offset: parseInt(offset),
        limit: parseInt(limit)
      });

      res.json({
        data: rows,
        total: count,
        page: Number(page),
        lastPage: Math.ceil(count / limit)
      });

    } catch (err) {
      console.error('Erro ao listar leituras reais:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // === EXPORTAÇÃO CSV ===
  router.get('/export', auth, async (req, res) => {
    try {
      const where = buildWhere(req.query);
      const rows = await LeiturasReais.findAll({
        where,
        include: [
          { model: Colaborador, as: 'colaborador' },
          { model: Dispositivo, as: 'dispositivo' }
        ],
        order: [['id', 'DESC']]
      });

      const flat = rows.map(r => ({
        id: r.id,
        data: r.data,
        hora: r.hora,
        tag_uid: r.tag_uid,
        tipo_batida: r.tipo_batida,
        autorizado: r.autorizado,
        colaborador: r.colaborador?.nome || '',
        dispositivo: r.dispositivo?.nome || '',
        mensagem: r.mensagem || ''
      }));

      const parser = new Parser();
      const csv = parser.parse(flat);

      res.header('Content-Type', 'text/csv');
      res.attachment('leituras_reais.csv');
      return res.send(csv);

    } catch (err) {
      console.error('Erro ao exportar leituras reais:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
