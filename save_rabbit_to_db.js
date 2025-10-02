const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

// ===========================
// MySQL Configuration
// ===========================
const dbConfig = {
  host: 'localhost',
  user: 'aqua_secure',
  password: 'passwordku123',
  database: 'aqua_secure',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Buat pool koneksi agar tidak membuat koneksi baru tiap insert
const pool = mysql.createPool(dbConfig);

// ===========================
// MQTT Configuration
// ===========================
const mqttOptions = {
  username: '/vh_jojolvin:jojo_alvin', // sesuaikan vhost & username
  password: '77665544',
  clientId: 'mqtt_to_db_' + Math.random().toString(16).slice(2),
  reconnectPeriod: 1000,
};

const MQTT_URL = 'ws://195.35.23.135:15675/ws';
const MQTT_TOPIC = 'RK.ULTRASONIC';

const client = mqtt.connect(MQTT_URL, mqttOptions);

// ===========================
// Function: Save to Database
// ===========================
async function saveToDB(deviceId, waterLevel, relayStatus) {
  try {
    const sql = `
      INSERT INTO device_history (device_id, water_level, relay, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    await pool.execute(sql, [deviceId, waterLevel, relayStatus]);
    console.log(
      `[DB] Saved Device ${deviceId} | Water: ${waterLevel}% | Relay: ${relayStatus}`
    );
  } catch (err) {
    console.error('[DB] Insert Error:', err.message);
  }
}

// ===========================
// MQTT Event Handlers
// ===========================

// Connected
client.on('connect', () => {
  console.log('[MQTT] Connected to broker');
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) console.error('[MQTT] Subscribe error:', err.message);
    else console.log(`[MQTT] Subscribed to topic: ${MQTT_TOPIC}`);
  });
});

// Incoming message
client.on('message', async (topic, message) => {
  if (topic !== MQTT_TOPIC) return;

  try {
    const payload = JSON.parse(message.toString());
    const waterLevel = Number(payload.water_level ?? 0);
    const relayStatus = Number(payload.relay ?? 0);
    const deviceId = 1; // Tank 1

    await saveToDB(deviceId, waterLevel, relayStatus);
  } catch (err) {
    console.error('[MQTT] Message parse error:', err.message);
  }
});

// Error handling
client.on('error', (err) => console.error('[MQTT] Error:', err.message));
client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));
client.on('offline', () => console.log('[MQTT] Client offline'));
client.on('close', () => console.log('[MQTT] Connection closed'));
