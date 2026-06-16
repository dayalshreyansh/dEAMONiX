const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redis.on('connect', () => console.log('📡 [Redis] Task queue connected.'));

module.exports = redis;