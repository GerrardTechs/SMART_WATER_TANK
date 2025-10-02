const bus = require('../utils/pubsub');

function tanksStream(req, res) {
  // header SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // kirim event hello + heartbeat tiap 25 detik (penting untuk proxy)
  res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, t: Date.now() })}\n\n`);
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  // listener untuk event tank/relay
  const onTankUpdate = (payload) => {
    res.write(`event: tank_update\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  const onRelayUpdate = (payload) => {
    res.write(`event: relay_update\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  bus.on('tank_update', onTankUpdate);
  bus.on('relay_update', onRelayUpdate);

  // cleanup
  req.on('close', () => {
    clearInterval(heartbeat);
    bus.off('tank_update', onTankUpdate);
    bus.off('relay_update', onRelayUpdate);
  });
}

module.exports = { tanksStream };
