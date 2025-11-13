const express = require('express');
const router = express.Router();
const { Tag, Colaborador } = require('../models/index');
const auth = require('../middleware/auth');

// ===========================================
// LISTAR TODAS AS TAGS
// ===========================================
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

// ===========================================
// CRIAR TAG
// ===========================================
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

// ===========================================
// EDITAR TAG
// ===========================================
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

// ===========================================
// DESATIVAR TAG (soft delete)
// ===========================================
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

// ===========================================
// *** ATUALIZAR TAG POR COLABORADOR ***
// (usado pelo modal ao editar colaborador)
// ===========================================
router.put('/updateByColab/:colaborador_id', auth, async (req, res) => {
  try {
    const { colaborador_id } = req.params;
    const { uid } = req.body;

    if (!uid) return res.status(400).json({ error: 'UID é obrigatório' });

    const colab = await Colaborador.findByPk(colaborador_id);
    if (!colab) return res.status(404).json({ error: 'Colaborador não encontrado' });

    // Desvincula TAG antiga desse colaborador
    await Tag.update(
      { colaborador_id: null },
      { where: { colaborador_id } }
    );

    // Busca a TAG com esse UID
    let tag = await Tag.findOne({ where: { uid } });

    if (!tag) {
      // Se não existir, cria nova
      tag = await Tag.create({
        uid,
        colaborador_id,
        ativo: true
      });
    } else {
      // Se existir, vincula ao colaborador
      await tag.update({ colaborador_id });
    }

    res.json({ success: true, tag });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===========================================

module.exports = router;
