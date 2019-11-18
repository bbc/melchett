import nock from 'nock';
import { HttpClient } from './../../lib/client';

describe('melchett client', () => {
    describe('GET', () => {
        beforeAll(async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' })
        });
    
        it('resolves with expected response', async () => {
            const client = new HttpClient({ name: 'test' });
            const response = await client.get('http://testurl.com/x')
    
            expect(response.status).toEqual(200);
            expect(response.body).toMatchObject({ data: 1 });
        });
    });

    describe('POST', () => {
        describe('request', () => {
            it('resolves with expected response', async () => {
                nock('http://testurl.com')
                    .post('/x')
                    .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' });
    
                const client = new HttpClient({ name: 'test' });
                const response = await client.post('http://testurl.com/x', { foo: 'bar' });
    
                expect(response.status).toEqual(200);
                expect(response.body).toMatchObject({ data: 1 });
            });
        });
    
        describe('client', () => {
            it('sets expected headers', async () => {
    
            });
    
            it('sends with expected body', async () => {
    
            });
        });
    });

    describe('receives a not found failed http response', () => {
        it('receives a 404 response', async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(404, undefined, { 'x-response-time': '500', 'content-length': '500' })
            const client = new HttpClient({ name: 'test' });
            await expect(client.get('http://testurl.com/x'))
                .rejects
                .toMatchObject({ error_name: 'ESTATUS404', error_message: 'Status code 404 received for http://testurl.com/x' });
        });
    });
    
    describe('receives a successful response ', () => {
        beforeAll(async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, "");
        });
    
        it('with data that is not an object', async () => {
            const client = new HttpClient({ name: 'test' });
            await expect(client.get('http://testurl.com/x'))
                .rejects
                .toMatchObject({ error_name: 'ENOTJSON', error_message: 'Response data was not an object' });
        });
    });
    
    describe('receives a successful response ', () => {
        beforeAll(async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, undefined);
        });
    
        it('with missing response data', async () => {
            const client = new HttpClient({ name: 'test' });
            await expect(client.get('http://testurl.com/x'))
                .rejects
                .toMatchObject({ error_name: 'ENOTJSON', error_message: 'Response data was not an object' });
        });
    });
    
    describe('circuit breakers', () => {
        const config = {
            "name": "test",
            "circuitBreaker": {
                "errorThresholdPercentage": 0,
                "resetTimeout": 1000
            }
        }
    
        beforeAll(async () => {
            nock('http://testurl.com')
                .persist()
                .get('/x')
                .reply(500, undefined);
        });
    
        it('should fire the open circuit breaker', async () => {
            const client = new HttpClient(config);

            await client.get('http://testurl.com/x')
                .catch(async _ => {
                    await expect(client.get('http://testurl.com/x'))
                        .rejects
                        .toMatchObject({ error_name: `ECIRCUITBREAKER`, error_message: `Circuit breaker is open for test` });
                });
        });
    
        it('should close the circuit breaker', async () => {
            const client = new HttpClient(config);

            try {
                await client.get('http://testurl.com/x');
                await client.get('http://testurl.com/x');
            } catch (ex) { }

            return await new Promise((resolve, reject) => {
                setTimeout(async () => {
                    resolve(await expect(client.get('http://testurl.com/x'))
                            .rejects
                            .toMatchObject({ error_name: `ESTATUS500`, error_message: `Status code 500 received for http://testurl.com/x` }));
                }, 2000)
            });
        });
    
        afterAll(() => {
            nock.cleanAll()
        });
    });
    
    describe('Timeouts ', () => {
        beforeAll(async () => {
            nock('http://testurl.com')
                .get('/x')
                .delayConnection(2500)
                .reply(200, { data: 1 }, { 'x-response-time': '2000', 'content-length': '500' })
        });
    
        it('should return a timeout error', async () => {
            const client = new HttpClient({ name: 'test' });
            await expect(client.get('http://testurl.com/x'))
                .rejects
                .toMatchObject({ error_name: `ETIMEDOUT`, error_message: 'Timeout exceeded' });
        });
    });
});
