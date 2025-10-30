const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// URL da sua API no Render
const RENDER_API = "https://tccsmartpoint.onrender.com/api/leituras/arduino";

// Recebe do Arduino (HTTP)
app.post("/api/leituras/arduino", async (req, res) => {
  try {
    console.log("📥 Dados recebidos do Arduino:", req.body);

    // Reenvia para o Render via HTTPS
    const response = await axios.post(RENDER_API, req.body, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ Enviado ao Render:", response.status);
    res.status(200).json({ ok: true, enviado: true });
  } catch (err) {
    console.error("❌ Erro ao enviar para Render:", err.message);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// Porta local
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Proxy rodando em http://localhost:${PORT}`);
});
