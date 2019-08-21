import nock from 'nock';
import { HttpClient } from './../../lib/client';

describe('melchett client', () => {
    // TODO add describe for testing headers
    // TODO test failing request
    // TODO test all 'meaningfull' the status codes
    // TODO test multiple client concurrency

    describe('GET', () => {
        beforeEach(async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' })
        });

        afterAll(() => {
            nock.cleanAll()
        });

        it('resolves with expected response', async () => {
            const client = new HttpClient({ name: 'test' });
            const response = await client.get('http://testurl.com/x')

            expect(response).toEqual({
                status: 200,
                data: 1,
                headers: {
                    "content-length": "500",
                    "content-type": "application/json",
                    "x-response-time": "500",
                }
            });
        });
    });

    describe('POST', () => {
        describe('request', () => {
            afterAll(() => {
                nock.cleanAll()
            });

            it('resolves with expected response', async () => {
                nock('http://testurl.com')
                    .post('/x')
                    .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' });

                const client = new HttpClient({ name: 'test' });
                const response = await client.post('http://testurl.com/x', { foo: 'bar' });

                expect(response).toEqual({
                    status: 200,
                    data: 1,
                    headers: {
                        "content-length": "500",
                        "content-type": "application/json",
                        "x-response-time": "500",
                    }
                });
            });

            it.only('times out of the upstream', async () => {
                nock('http://testurl.com')
                    .post('/x')
                    .delay(2000)
                    .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' });
                    // .replyWithError({ code: 'ETIMEDOUT' })

                const client = new HttpClient({ name: 'test' });
                
                let error
                try {
                    await client.post('http://testurl.com/x', { foo: 'bar' });
                } catch (err) {
                    error = err
                }

                expect(error).toEqual({})
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
            const response = await client.get('http://testurl.com/x');
            expect(response).toEqual({ name: 'ESTATUS404', message: 'Status code 404 received for http://testurl.com/x', details: 'Request failed with status code 404' });
        });

        it('receives a 300 response', async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(300, undefined, { 'x-response-time': '500', 'content-length': '500' })
            const client = new HttpClient({ name: 'test' });
            const response = await client.get('http://testurl.com/x');
            expect(response).toEqual({ name: 'ESTATUS300', message: 'Status code 300 received for http://testurl.com/x', details: 'Request failed with status code 300' });
        });
    });

    describe('receives a successful response ', () => {
        beforeAll(async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, "");
        });

        afterAll(() => {
            nock.cleanAll()
        });

        it('with data that is not an object', async () => {
            const client = new HttpClient({ name: 'test' });
            const response = await client.get('http://testurl.com/x');
            expect(response).toEqual({ name: 'EUNKNOWN', message: 'Response data was not an object' });
        });
    });

    describe('receives a successful response ', () => {
        beforeAll(async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, undefined);
        });

        afterAll(() => {
            nock.cleanAll()
        });

        it('with missing response data', async () => {
            const client = new HttpClient({ name: 'test' });
            const response = await client.get('http://testurl.com/x');
            expect(response).toEqual({ name: 'EUNKNOWN', message: 'Response data was not an object' });
        });
    });

    describe('circuit breakers ', () => {
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

        afterAll(() => {
            nock.cleanAll()
        });

        it('should fire the open circuit breaker', async () => {
            const client = new HttpClient(config);
            await client.get('http://testurl.com/x');
            const response = await client.get('http://testurl.com/x');
            expect(response).toEqual({ name: `ECIRCUITBREAKER`, message: `Circuit breaker is open for test` });
        });

        it('should close the circuit breaker', async () => {
            const client = new HttpClient(config);
            await client.get('http://testurl.com/x');
            await client.get('http://testurl.com/x');

            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    const response = await client.get('http://testurl.com/x');
                    resolve(expect(response).toEqual({ name: `ESTATUS500`, message: `Status code 500 received for http://testurl.com/x`, details: "Request failed with status code 500" }));
                }, 2000)
            });
        });
    });

    describe('Timeouts ', () => {
        beforeAll(async () => {
            nock('http://testurl.com')
                .get('/x')
                .delayConnection(2500)
                .reply(200, { data: 1 }, { 'x-response-time': '2000', 'content-length': '500' })
        });

        afterAll(() => {
            nock.cleanAll()
        });

        it('should return a timeout error', async () => {
            const client = new HttpClient({ name: 'test' });
            const response = await client.get('http://testurl.com/x');
            expect(response).toEqual({ name: `ECONNABORTED`, message: 'timeout of 1500ms exceeded' });
        });
    });
});