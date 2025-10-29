const express = require('express');
const router = express.Router();
const { Tag, Colaborador, Dispositivo, Leitura } = require('../models/index');
require('dotenv').config();

function checkAuthorization(tagRecord) {
  return !!(
    tagRecord &&
    tagRecord.ativo &&
    tagRecord.colaborador_id &&
    tagRecord.colaborador?.ativo
  );
}

router.post('/', async (req, res) => {
  // 1) Validar device key
  const deviceKey = req.headers['x-device-key'] || null;
  if (process.env.DEVICE_API_KEY && deviceKey !== process.env.DEVICE_API_KEY) {
    return res.status(403).json({ error: 'device key inválida' });
  }

  const { tag, device, timestamp, raw } = req.body;
  if (!tag) return res.status(400).json({ error: 'tag obrigatória' });

  try {
    // 2) Localizar dispositivo
    let deviceRecord = null;
    if (device) {
      deviceRecord = await Dispositivo.findOne({ where: { identificador: device } });
      if (!deviceRecord) return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    // 3) Localizar tag e colaborador
    const tagRecord = await Tag.findOne({ where: { uid: tag }, include: Colaborador });
    if (!tagRecord) {
      return res.status(404).json({ error: 'Tag não cadastrada' });
    }

    // 4) Verificar autorização
    const autorizado = checkAuthorization(tagRecord);
    const colaboradorId = tagRecord.colaborador_id || null;

    // 5) Preparar dados
    const hora = timestamp ? new Date(timestamp) : new Date();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (raw && JSON.stringify(raw).length > 2000) {
      return res.status(400).json({ error: 'Payload muito grande' });
    }

    // 6) Criar leitura
    const leitura = await Leitura.create({
      tag_uid: tag,
      colaborador_id: colaboradorId,
      dispositivo_id: deviceRecord ? deviceRecord.id : null,
      autorizado,
      hora,
      raw_payload: raw || null,
      ip
    });

    // 7) Emitir via socket.io
    try {
      const io = req.app.get('io');
      if (io) io.emit('new_reading', leitura);
    } catch (e) {
      console.warn('Socket.IO não disponível', e.message);
    }

    return res.json({ success: true, leitura });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;
