// worker-amqp.js
const amqp = require('amqplib');
const db = require('./config/db'); // pastikan ini MySQL2 pool/connection

// RabbitMQ Config
const RABBIT_HOST = '195.35.23.135';
const RABBIT_PORT = 5672; // default AMQP port
const VHOST = '/vh_jojoalvin';
const USERNAME = 'jojo_alvin';
const PASSWORD = '77665544';
const QUEUE = 'RK.ULTRASONIC'; // pastikan queue sudah ada

// Connection URL
const AMQP_URL = `amqp://${USERNAME}:${PASSWORD}@${RABBIT_HOST}:${RABBIT_PORT}/${VHOST}`;

async function saveToDB(deviceId, waterLevel) {
  try {
    const sql = `
      INSERT INTO device_history (device_id, water_level, created_at)
      VALUES (?, ?, NOW())
    `;
    await db.execute(sql, [deviceId, waterLevel]);
    console.log(`[DB] Device ${deviceId} | Water Level: ${waterLevel}% saved`);
  } catch (err) {
    console.error('[DB] Insert Error:', err.message);
  }
}

async function startWorker() {
  try {
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: true });

    console.log('[AMQP] Waiting for messages in', QUEUE);

    channel.consume(
      QUEUE,
      async (msg) => {
        if (msg !== null) {
          try {
            const content = msg.content.toString();
            // Jika payload berupa JSON { water_level: 45.3 }
            let waterLevel = parseFloat(content);
            try {
              const json = JSON.parse(content);
              if (json.water_level !== undefined) waterLevel = parseFloat(json.water_level);
            } catch (e) {
              // payload bukan JSON, tetap pakai parseFloat langsung
            }

            if (!isNaN(waterLevel)) {
              const deviceId = 1; // ganti sesuai ID device
              await saveToDB(deviceId, waterLevel);
            } else {
              console.warn('[AMQP] Invalid water level:', content);
            }

            channel.ack(msg); // beri tahu broker sudah diproses
          } catch (err) {
            console.error('[AMQP] Processing error:', err.message);
            channel.nack(msg, false, true); // requeue jika error
          }
        }
      },
      { noAck: false }
    );
  } catch (err) {
    console.error('[AMQP] Connection error:', err.message);
    setTimeout(startWorker, 5000); // reconnect tiap 5 detik
  }
}

startWorker();
