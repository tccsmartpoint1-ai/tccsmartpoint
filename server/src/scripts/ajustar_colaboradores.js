// server/src/scripts/ajustar_colaboradores.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { DataTypes } = require('sequelize');
const { sequelize } = require('../models'); // importa o Sequelize configurado

async function run() {
  const qi = sequelize.getQueryInterface();

  try {
    console.log('Adicionando colunas em "colaboradores"...');

    await qi.addColumn('colaboradores', 'data_admissao', {
      type: DataTypes.DATEONLY,
      allowNull: true,
    });

    await qi.addColumn('colaboradores', 'funcao', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await qi.addColumn('colaboradores', 'departamento', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await qi.addColumn('colaboradores', 'jornada', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await qi.addColumn('colaboradores', 'escala', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await qi.addColumn('colaboradores', 'banco_horas_ativo', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    console.log('OK, colunas criadas com sucesso.');
  } catch (err) {
    console.error('Erro ao ajustar tabela colaboradores:');
    console.error(err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
