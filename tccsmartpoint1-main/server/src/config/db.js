const { Sequelize } = require('sequelize');

// variáveis obrigatórias (mas sem travar o app)
const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME', 'DB_DIALECT'];

for (const k of requiredVars) {
  if (!process.env[k] || process.env[k].trim() === '') {
    console.warn(`[AVISO] Variável de ambiente ausente ou vazia: ${k}`);
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME || '',
  process.env.DB_USER || '',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    }
  }
);

module.exports = { sequelize };
