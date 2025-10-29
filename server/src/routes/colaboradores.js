const express = require('express');
const router = express.Router();
const { Colaborador, Tag } = require('../models/index');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// Listar (paginação simples + busca por nome)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const offset = (page - 1) * limit;
    const where = q ? { nome: { [Op.like]: `%${q}%` } } : {};

    const rows = await Colaborador.findAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['nome', 'ASC']]
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar colaboradores' });
  }
});

// Criar
router.post('/', auth, async (req, res) => {
  try {
    const { nome, cpf, email, ativo = true } = req.body;
    if (!nome || !cpf) {
      return res.status(400).json({ error: 'Nome e CPF são obrigatórios' });
    }

    const existing = await Colaborador.findOne({ where: { cpf } });
    if (existing) return res.status(400).json({ error: 'CPF já cadastrado' });

    const created = await Colaborador.create({ nome, cpf, email, ativo });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editar
router.put('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const reg = await Colaborador.findByPk(id);
    if (!reg) return res.status(404).json({ error: 'Colaborador não encontrado' });

    await reg.update(req.body);
    res.json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remover
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const reg = await Colaborador.findByPk(id);
    if (!reg) return res.status(404).json({ error: 'Colaborador não encontrado' });

    await reg.destroy();
    await Tag.update({ colaborador_id: null }, { where: { colaborador_id: id } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover colaborador' });
  }
});

module.exports = router;
