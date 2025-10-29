const express = require('express');
const router = express.Router();
const { Tag, Colaborador } = require('../models/index');
const auth = require('../middleware/auth');

// Listar todas as tags
router.get('/', auth, async (req, res) => {
  try {
    const tags = await Tag.findAll({
      include: [{ model: Colaborador, attributes: ['id', 'nome', 'cpf'] }]
    });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova tag
router.post('/', auth, async (req, res) => {
  try {
    const { uid, descricao, colaborador_id, ativo = true } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID é obrigatório' });

    const existing = await Tag.findOne({ where: { uid } });
    if (existing) return res.status(400).json({ error: 'UID já cadastrado' });

    if (colaborador_id) {
      const colab = await Colaborador.findByPk(colaborador_id);
      if (!colab) return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    const created = await Tag.create({ uid, descricao, colaborador_id, ativo });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Atualizar tag
router.put('/:id', auth, async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag não encontrada' });

    const { uid, descricao, colaborador_id, ativo } = req.body;

    if (colaborador_id) {
      const colab = await Colaborador.findByPk(colaborador_id);
      if (!colab) return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    await tag.update({ uid, descricao, colaborador_id, ativo });
    res.json(tag);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// "Desativar" tag (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag não encontrada' });

    await tag.update({ ativo: false });
    res.json({ success: true, message: 'Tag desativada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
