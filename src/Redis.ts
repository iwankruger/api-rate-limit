import redis, { RedisClient} from 'redis';
import redisConfig from './redisConfig.json'
const env = process.env.NODE_ENV || 'development';
const config: {port: number, host: string} = redisConfig[env as keyof typeof redisConfig];


export class Redis {
    private static instance: RedisClient;

    static getInstance(): RedisClient {
        if (!Redis.instance) {
            Redis.instance = redis.createClient(config.port, config.host)
        }

        return Redis.instance;
    }
}