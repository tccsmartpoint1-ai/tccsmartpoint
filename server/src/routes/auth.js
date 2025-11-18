const express = require('express');
const router = express.Router();
const { Admin } = require('../models/index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro
router.post('/register', async (req, res) => {
  try {
    const { nome, cpf, email, senha } = req.body;
    if (!nome || !cpf || !email || !senha) {
      return res.status(400).json({ error: 'nome, cpf, email e senha são obrigatórios' });
    }

    const existing = await Admin.findOne({ where: { cpf } });
    if (existing) return res.status(400).json({ error: 'CPF já cadastrado' });

    const existingEmail = await Admin.findOne({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email já cadastrado' });

    const senha_hash = await bcrypt.hash(senha, 10);

    const admin = await Admin.create({ nome, cpf, email, senha_hash });

    res.status(201).json({ message: 'Admin registrado com sucesso!', admin: { id: admin.id, nome: admin.nome, cpf: admin.cpf, email: admin.email } });
  } catch (err) {
    console.error("Erro no /register:", err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log("[LOGIN] Body recebido:", req.body);

  const { cpf, senha } = req.body;
  if (!cpf || !senha) {
    console.log("[LOGIN] Campos obrigatórios faltando");
    return res.status(400).json({ error: 'cpf e senha são obrigatórios' });
  }

  const admin = await Admin.findOne({ where: { cpf } });
  console.log("[LOGIN] Admin encontrado:", admin ? admin.toJSON() : null);

  if (!admin) return res.status(401).json({ error: 'Credenciais inválidas' });

  const match = await bcrypt.compare(senha, admin.senha_hash);
  console.log("[LOGIN] Senha confere?", match);

  if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  console.log("[LOGIN] Token gerado com sucesso");

  const decoded = jwt.decode(token);
  return res.json({
    token,
    expira_em: decoded.exp,
    admin: { id: admin.id, nome: admin.nome, cpf: admin.cpf, email: admin.email }
  });
});
 
// Alterar senha (ADMIN)
router.patch('/senha', require('../middleware/auth'), async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'senhaAtual e novaSenha são obrigatórias' });
    }

    // CORREÇÃO AQUI
    const adminId = req.adminId;

    const admin = await Admin.findByPk(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin não encontrado' });

    const confere = await bcrypt.compare(senhaAtual, admin.senha_hash);
    if (!confere) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const novoHash = await bcrypt.hash(novaSenha, 10);

    admin.senha_hash = novoHash;
    await admin.save();

    return res.json({ message: 'Senha alterada com sucesso!' });

  } catch (err) {
    console.error("Erro ao alterar senha:", err);
    return res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});


module.exports = router;
