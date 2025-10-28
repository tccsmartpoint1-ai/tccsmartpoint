const express = require('express');
const router = express.Router();
const { Dispositivo, Leitura } = require('../models/index');
const auth = require('../middleware/auth');

// Listar dispositivos
router.get('/', auth, async (req, res) => {
  try {
    const dispositivos = await Dispositivo.findAll({ order: [['id', 'ASC']] });
    res.json(dispositivos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar dispositivos' });
  }
});

// Criar dispositivo
router.post('/', auth, async (req, res) => {
  try {
    const { nome, identificador, descricao } = req.body;
    if (!nome || !identificador) {
      return res.status(400).json({ error: 'Nome e identificador são obrigatórios' });
    }

    const existing = await Dispositivo.findOne({ where: { identificador } });
    if (existing) return res.status(400).json({ error: 'Identificador já cadastrado' });

    const dispositivo = await Dispositivo.create({ nome, identificador, descricao });
    res.status(201).json(dispositivo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar dispositivo
router.put('/:id', auth, async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findByPk(req.params.id);
    if (!dispositivo) return res.status(404).json({ error: 'Dispositivo não encontrado' });

    await dispositivo.update(req.body);
    res.json(dispositivo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remover dispositivo
router.delete('/:id', auth, async (req, res) => {
  try {
    const dispositivo = await Dispositivo.findByPk(req.params.id);
    if (!dispositivo) return res.status(404).json({ error: 'Dispositivo não encontrado' });

    // Opcional: limpar leituras relacionadas
    await Leitura.update({ dispositivo_id: null }, { where: { dispositivo_id: req.params.id } });

    await dispositivo.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
