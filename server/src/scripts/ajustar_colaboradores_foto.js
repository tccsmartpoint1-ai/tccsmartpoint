// server/src/scripts/ajustar_colaboradores_foto.js
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const { DataTypes } = require("sequelize");
const { sequelize } = require("../models");

async function run() {
  const qi = sequelize.getQueryInterface();

  try {
    console.log('Adicionando coluna "foto_url" em "colaboradores"...');

    await qi.addColumn("colaboradores", "foto_url", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });

    console.log("OK, coluna foto_url criada com sucesso.");
  } catch (err) {
    console.error("Erro ao ajustar tabela colaboradores:");
    console.error(err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
