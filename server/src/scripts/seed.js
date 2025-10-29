const bcrypt = require('bcrypt');
const { sequelize, Admin, Colaborador, Tag, Dispositivo, Leitura } = require('../models/index');

async function seed() {
  try {
    console.log(" Verificando banco...");
    await sequelize.sync({ alter: true }); // mantém dados existentes e só ajusta estrutura
    await sequelize.sync({ alter: process.env.NODE_ENV === 'production' });

    // Verifica se já existe admin
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log("  Banco já populado, nada a fazer.");
      process.exit(0);
      return;
    }

    console.log(" Populando banco inicial...");

    // Admin padrão
    const hash = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      nome: 'Administrador Padrão',
      cpf: '12345678900',
      email: 'admin@rfid.local',
      senha_hash: hash,
      ativo: true
    });
    console.log(" Admin criado:", admin.nome);

    // Colaboradores
    const c1 = await Colaborador.create({ nome: 'João Silva', cpf: '11111111111', email: 'joao@empresa.com' });
    const c2 = await Colaborador.create({ nome: 'Maria Oliveira', cpf: '22222222222', email: 'maria@empresa.com' });
    const c3 = await Colaborador.create({ nome: 'Carlos Souza', cpf: '33333333333', email: 'carlos@empresa.com' });
    console.log(" Colaboradores criados:", [c1.nome, c2.nome, c3.nome]);

    // Dispositivo
    const d = await Dispositivo.create({
      nome: 'Entrada Principal',
      identificador: 'esp32_entrada1',
      descricao: 'Leitor na entrada'
    });
    console.log(" Dispositivo criado:", d.nome);

    // Tags vinculadas
    const t1 = await Tag.create({ uid: '04A3B1C2D3', descricao: 'Cartão João', colaborador_id: c1.id });
    const t2 = await Tag.create({ uid: '08765F9B23', descricao: 'Cartão Maria', colaborador_id: c2.id });
    const t3 = await Tag.create({ uid: '0A1B2C3D4E', descricao: 'Cartão Carlos', colaborador_id: c3.id });
    console.log(" Tags criadas:", [t1.uid, t2.uid, t3.uid]);

    // Leituras de exemplo
    await Leitura.create({ tag_uid: '04A3B1C2D3', colaborador_id: c1.id, dispositivo_id: d.id, autorizado: true, ip: '192.168.0.10' });
    await Leitura.create({ tag_uid: '08765F9B23', colaborador_id: c2.id, dispositivo_id: d.id, autorizado: true, ip: '192.168.0.11' });
    await Leitura.create({ tag_uid: '9999999999', colaborador_id: null, dispositivo_id: d.id, autorizado: false, ip: '192.168.0.12' });

    console.log(" Seed completa");
    process.exit(0);
  } catch (e) {
    console.error(" Erro no seed:", e);
    process.exit(1);
  }
}

seed();
