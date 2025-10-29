require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./src/models/index');

const authRoutes = require('./src/routes/auth');
const colaboradoresRoutes = require('./src/routes/colaboradores');
const dispositivosRoutes = require('./src/routes/dispositivos');
const rfidRoutes = require('./src/routes/rfid');
const tagsRoutes = require('./src/routes/tags');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// ===== Configurações =====
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== Rotas =====
const leiturasRoutes = require('./src/routes/leituras')(io); 
app.use('/api/auth', authRoutes);
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/dispositivos', dispositivosRoutes);
app.use('/api/leituras', leiturasRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/tags', tagsRoutes);

// ===== Rota raiz =====
app.get('/', (req, res) => {
  res.send('Smart Point API online');
});

// ===== Teste =====
app.get('/ping', (_req, res) => {
  console.log('Rota /ping chamada');
  res.json({ status: 'API rodando' });
});

// ===== Rota de status do banco =====
app.get('/status', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'Banco conectado com sucesso!' });
  } catch (error) {
    res.status(500).json({ status: 'Erro ao conectar ao banco', erro: error.message });
  }
});

// ===== Banco e inicialização =====
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB conectado');
    await sequelize.sync();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`API + Front rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('Erro ao iniciar:', err);
    process.exit(1);
  }
}

start();
