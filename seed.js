require('dotenv').config({ path: './server/.env' });
const bcrypt = require('bcrypt');
const { sequelize, Admin, Colaborador, Tag, Dispositivo, LeiturasReais } = require('./server/src/models/index');

async function seed() {
  try {
    console.log("🔄 Verificando banco...");
    await sequelize.sync({ alter: true });

    // Verifica se já existe admin
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log("✅ Banco já populado, nada a fazer.");
      process.exit(0);
      return;
    }

    console.log("⚙️ Populando banco inicial...");

    // =====================
    // ADMIN PADRÃO
    // =====================
    const hash = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      nome: 'Administrador Padrão',
      cpf: '12345678900',
      email: 'admin@rfid.local',
      senha_hash: hash,
      ativo: true
    });
    console.log("👤 Admin criado:", admin.nome);

    // =====================
    // COLABORADORES
    // =====================
    const c1 = await Colaborador.create({ nome: 'João Silva', cpf: '11111111111', email: 'joao@empresa.com' });
    const c2 = await Colaborador.create({ nome: 'Maria Oliveira', cpf: '22222222222', email: 'maria@empresa.com' });
    const c3 = await Colaborador.create({ nome: 'Carlos Souza', cpf: '33333333333', email: 'carlos@empresa.com' });
    console.log("👥 Colaboradores criados:", [c1.nome, c2.nome, c3.nome]);

    // =====================
    // DISPOSITIVO
    // =====================
    const d = await Dispositivo.create({
      nome: 'Entrada Principal',
      identificador: 'esp32_entrada1',
      descricao: 'Leitor na entrada'
    });
    console.log("📡 Dispositivo criado:", d.nome);

    // =====================
    // TAGS
    // =====================
    const t1 = await Tag.create({ uid: '04A3B1C2D3', descricao: 'Cartão João', colaborador_id: c1.id });
    const t2 = await Tag.create({ uid: '08765F9B23', descricao: 'Cartão Maria', colaborador_id: c2.id });
    const t3 = await Tag.create({ uid: '0A1B2C3D4E', descricao: 'Cartão Carlos', colaborador_id: c3.id });
    console.log("🏷️ Tags criadas:", [t1.uid, t2.uid, t3.uid]);

    // =====================
    // LEITURAS REAIS
    // =====================
    const now = new Date();
    const dataAtual = now.toISOString().split('T')[0];
    const horaAtual = now.toISOString().split('T')[1].split('.')[0];

    await LeiturasReais.create({
      tag_uid: '04A3B1C2D3',
      colaborador_id: c1.id,
      dispositivo_id: d.id,
      autorizado: true,
      tipo_batida: 'entrada',
      data: dataAtual,
      hora: horaAtual,
      origem: 'seed_script',
      mensagem: 'Leitura autorizada - João Silva',
      raw_payload: '{"uid":"04A3B1C2D3","autorizado":true}',
      ip: '192.168.0.10'
    });

    await LeiturasReais.create({
      tag_uid: '08765F9B23',
      colaborador_id: c2.id,
      dispositivo_id: d.id,
      autorizado: true,
      tipo_batida: 'entrada',
      data: dataAtual,
      hora: horaAtual,
      origem: 'seed_script',
      mensagem: 'Leitura autorizada - Maria Oliveira',
      raw_payload: '{"uid":"08765F9B23","autorizado":true}',
      ip: '192.168.0.11'
    });

    await LeiturasReais.create({
      tag_uid: '9999999999',
      colaborador_id: null,
      dispositivo_id: d.id,
      autorizado: false,
      tipo_batida: 'tentativa',
      data: dataAtual,
      hora: horaAtual,
      origem: 'seed_script',
      mensagem: 'Cartão não autorizado',
      raw_payload: '{"uid":"9999999999","autorizado":false}',
      ip: '192.168.0.12'
    });

    console.log("📋 Leituras de exemplo criadas com sucesso!");
    console.log("✅ Seed concluído!");
    process.exit(0);

  } catch (e) {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  }
}

seed();
