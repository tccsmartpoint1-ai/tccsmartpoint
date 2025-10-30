const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// =====================
// Admin
// =====================
const Admin = sequelize.define('admins', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(150), allowNull: false },
  cpf: { type: DataTypes.STRING(14), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(255), unique: true },
  senha_hash: { type: DataTypes.STRING(255), allowNull: false },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  atualizado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { 
  tableName: 'admins',
  timestamps: false
});

// =====================
// Colaborador
// =====================
const Colaborador = sequelize.define('colaboradores', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(150), allowNull: false },
  cpf: { type: DataTypes.STRING(11), unique: true },
  email: { type: DataTypes.STRING(255) },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  atualizado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { 
  tableName: 'colaboradores',
  timestamps: false,
  hooks: {
    beforeUpdate: (colab) => { colab.atualizado_em = new Date(); }
  }
});

// =====================
// Tag
// =====================
const Tag = sequelize.define('tags', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  uid: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  descricao: { type: DataTypes.STRING(100) },
  colaborador_id: { type: DataTypes.INTEGER, allowNull: true },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { 
  tableName: 'tags',
  timestamps: false
});

// =====================
// Dispositivo
// =====================
const Dispositivo = sequelize.define('dispositivos', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  identificador: { type: DataTypes.STRING(100), unique: true },
  descricao: { type: DataTypes.TEXT },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { 
  tableName: 'dispositivos',
  timestamps: false
});

// =====================
// Leituras Reais (nova tabela principal)
// =====================
const LeiturasReais = sequelize.define('leituras_reais', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tag_uid: { type: DataTypes.STRING(64), allowNull: false },
  colaborador_id: { type: DataTypes.INTEGER, allowNull: true },
  dispositivo_id: { type: DataTypes.INTEGER, allowNull: true },
  autorizado: { type: DataTypes.BOOLEAN, defaultValue: false },
  tipo_batida: { type: DataTypes.STRING(20) },
  data: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  hora: { type: DataTypes.TIME, defaultValue: DataTypes.NOW },
  origem: { type: DataTypes.STRING(50), defaultValue: 'arduino' },
  mensagem: { type: DataTypes.TEXT },
  raw_payload: { type: DataTypes.JSONB },
  ip: { type: DataTypes.STRING(45) },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { 
  tableName: 'leituras_reais',
  timestamps: false
});

// =====================
// Associações
// =====================
Colaborador.hasMany(Tag, { foreignKey: 'colaborador_id' });
Tag.belongsTo(Colaborador, { foreignKey: 'colaborador_id', onDelete: 'SET NULL' });

Colaborador.hasMany(LeiturasReais, { foreignKey: 'colaborador_id' });
LeiturasReais.belongsTo(Colaborador, { foreignKey: 'colaborador_id', onDelete: 'SET NULL' });

Dispositivo.hasMany(LeiturasReais, { foreignKey: 'dispositivo_id' });
LeiturasReais.belongsTo(Dispositivo, { foreignKey: 'dispositivo_id', onDelete: 'CASCADE' });

// =====================
// Exportação unificada
// =====================
module.exports = {
  sequelize,
  Admin,
  Colaborador,
  Tag,
  Dispositivo,
  LeiturasReais
};
