const { createClient } = require('redis');

let client = null;

try {
  client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: false // ❌ disable infinite retries
    }
  });

  client.on('error', () => {
    console.log('Redis not available, skipping cache');
  });

  client.connect()
    .then(() => console.log('Redis connected'))
    .catch(() => {
      console.log('Redis not running, continuing without cache');
      client = null;
    });

} catch (err) {
  console.log('Redis disabled');
  client = null;
}

module.exports = client;