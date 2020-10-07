//import { User } from '../src/controllers/User';
import { Redis } from '../src/Redis';
import axios from 'axios';
import requestLimitConfig from '../src/requestLimitConfig.json'
const env = process.env.NODE_ENV || 'development';
const limitConfig: {limitWindowSeconds: number, LimitWindowRequestCount: number} = requestLimitConfig[env as keyof typeof requestLimitConfig];

beforeAll(async (done) => {
    Redis.getInstance().on('connect', function() {
        done();
    });    
}, 5000);

afterAll(async (done) => {
    Redis.getInstance().quit();
    done();
}, 5000);

describe('User API Tests', () => {

    test('User: valid request', async (done) => {
        
        axios.get('http://localhost:5000/api/users?api_key=testToken').then((response) => {
              expect(response).toBeDefined();
              expect(response.status).toBeDefined();
              expect(response.status).toBe(200);
              done();
        }).catch(function (error) {
              // handle error
              console.log(error);
              fail();
        });
    });

    test('User: limit request', async (done) => {
        // generate a random test token
        const testToken = 'testToken' + Math.random();
        try {
            for (let i = 0; i <= limitConfig.LimitWindowRequestCount; i++){ 
                const response = await axios.get(`http://localhost:5000/api/users?api_key=${testToken}`);
                console.log(i + ' ' + response.status);
            }
            // the last request will fail if the limiting is working
            // therefore fail the test if this point is reached
            fail();
        } catch (e) {
            console.log();
            expect(e.response).toBeDefined();
            expect(e.response.status).toBeDefined();
            expect(e.response.status).toBe(429);
            done();
        } 
    });


});