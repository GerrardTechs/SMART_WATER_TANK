// worker.js
const amqp = require('amqplib');
const db = require('./config/db');
const axios = require('axios'); // untuk relay endpoint

const RABBIT_HOST = '195.35.23.135';
const RABBIT_PORT = 5672;
const VHOST = '%2Fvh_jojoalvin';
const USERNAME = 'jojo_alvin';
const PASSWORD = '77665544';
const QUEUE = 'RK.ULTRASONIC';

const AMQP_URL = `amqp://${USERNAME}:${PASSWORD}@${RABBIT_HOST}:${RABBIT_PORT}/${VHOST}`;

// 📝 Simpan ke DB
async function saveToDB(deviceId, waterLevel, relayStatus) {
  try {
    const sql = `
      INSERT INTO device_history (device_id, water_level, relay, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    await db.execute(sql, [deviceId, waterLevel, relayStatus]);
    console.log(`[DB] ✅ Device ${deviceId} | Level: ${waterLevel}% | Relay: ${relayStatus ? 'ON' : 'OFF'} saved`);
  } catch (err) {
    console.error('[DB] ❌ Insert Error:', err.message);
  }
}

// ⚡ Relay logic: ON jika < 15%, OFF jika > 75%
async function handleRelay(deviceId, waterLevel) {
  try {
    if (waterLevel > 75) {
      console.log(`[RELAY] 💡 Device ${deviceId} → OFF (karena level ${waterLevel}%)`);
      // axios.post('http://device-api/relay/off', { deviceId });
      return false;
    } else if (waterLevel < 15) {
      console.log(`[RELAY] 💡 Device ${deviceId} → ON (karena level ${waterLevel}%)`);
      // axios.post('http://device-api/relay/on', { deviceId });
      return true;
    } else {
      // level normal → relay tetap OFF
      return false;
    }
  } catch (err) {
    console.error('[RELAY] ❌ Error handling relay:', err.message);
    return false;
  }
}

async function startWorker() {
  try {
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, 'amq.topic', QUEUE);
    console.log(`[AMQP] 🧭 Listening on "${QUEUE}"`);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const content = msg.content.toString().trim();
      console.log(`[AMQP] 📩 Received: "${content}"`);

      const waterLevel = parseFloat(content);
      if (!isNaN(waterLevel)) {
        const deviceId = 1; // sementara hardcode

        // ✅ Tentukan status relay terlebih dahulu
        const relayStatus = await handleRelay(deviceId, waterLevel);

        // ✅ Baru simpan ke DB dengan nilai lengkap
        await saveToDB(deviceId, waterLevel, relayStatus);
      } else {
        console.warn(`[AMQP] ⚠️ Invalid payload: ${content}`);
      }

      channel.ack(msg);
    });
  } catch (err) {
    console.error('[AMQP] ❌ Connection error:', err.message);
    setTimeout(startWorker, 5000);
  }
}

startWorker();
