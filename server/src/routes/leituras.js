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

// ==== EXPORTAÇÃO DO MÓDULO COM SOCKET ====
module.exports = (io) => {

  // === ROTA PÚBLICA PARA O ARDUINO (sem token) ===
  router.post('/arduino', async (req, res) => {
    try {
      const { rfid, nome, dispositivo, timestamp } = req.body;

      if (!rfid) {
        return res.status(400).json({ error: 'Campo rfid é obrigatório' });
      }

      // === Busca TAG e Colaborador associado ===
      const tag = await Tag.findOne({ where: { uid: rfid } });
      const colaborador = tag ? await Colaborador.findByPk(tag.colaborador_id) : null;

      // === Busca (ou cria) o Dispositivo ===
      let disp = await Dispositivo.findOne({ where: { nome: dispositivo } });
      if (!disp) {
        disp = await Dispositivo.create({
          nome: dispositivo || 'Desconhecido',
          identificador: dispositivo ? dispositivo.toLowerCase().replace(/\s+/g, '_') : 'sem_nome',
          descricao: 'Criado automaticamente via Arduino'
        });
      }

      // === Gera Data/Hora ===
      let dataFormatada, horaFormatada;

      if (timestamp) {
        const d = new Date(timestamp);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: 'timestamp inválido' });
        }
        dataFormatada = d.toISOString().split('T')[0];
        horaFormatada = d.toTimeString().split(' ')[0];
      } else {
        // Usa horário local de São Paulo
        const now = new Date();
        const local = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        dataFormatada = local.toISOString().split('T')[0];
        horaFormatada = local.toTimeString().split(' ')[0];
      }

      // === Define se é autorizado e mensagem ===
      const autorizado = !!colaborador;
      const mensagem = autorizado
        ? `Acesso permitido: ${colaborador.nome}`
        : 'Cartão não reconhecido';

      // === Cria o registro da leitura ===
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

      // === Busca leitura completa com associações ===
      const leituraCompleta = await LeiturasReais.findByPk(leitura.id, {
        include: [{ model: Colaborador }, { model: Dispositivo }]
      });

      io.emit('novaLeitura', leituraCompleta);

      res.status(201).json({
       ok: true,
       id: leitura.id,
       autorizado,
       mensagem,
       colaborador: colaborador ? colaborador.nome : null,
       tag: rfid
      });


    } catch (err) {
      console.error('=== ERRO AO SALVAR LEITURA DO ARDUINO ===');
      console.error('Mensagem:', err.message);
      console.error('Stack:', err.stack);
      res.status(500).json({
        error: 'Erro ao salvar leitura do Arduino',
        details: err.message
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
        include: [{ model: Colaborador }, { model: Dispositivo }],
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
        include: [{ model: Colaborador }, { model: Dispositivo }],
        order: [['id', 'DESC']]
      });

      const flat = rows.map(r => ({
        id: r.id,
        data: r.data,
        hora: r.hora,
        tag_uid: r.tag_uid,
        tipo_batida: r.tipo_batida,
        autorizado: r.autorizado,
        colaborador: r.Colaborador?.nome || '',
        dispositivo: r.Dispositivo?.nome || '',
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
