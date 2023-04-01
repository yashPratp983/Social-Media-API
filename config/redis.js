const redis = require('redis');

let client;

const connectRedis = async () => {
    client = redis.createClient(6379);

    client.on('error', err => console.log('Redis Client Error', err));

    client.on('connect', () => {
        console.log('Redis client connected');
    });

    await client.connect();
    console.log(client);
}

module.exports = connectRedis;
