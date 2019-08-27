import nock from 'nock';
import { HttpClient } from './../../lib/client';

describe('melchett client', () => {
    // TODO add describe for testing headers
    // TODO test failing request
    // TODO test all 'meaningfull' the status codes
    // TODO test multiple client concurrency

    describe('GET', () => {
        afterEach(() => {
            nock.cleanAll()
        });

        it('resolves with expected response', async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' })

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

        it('times out of the upstream', async () => {
            nock('http://testurl.com')
                .get('/x')
                .replyWithError({ code: 'ECONNABORTED', message: 'timeout of 1500ms exceeded', stack: 'foo' })

            const client = new HttpClient({ name: 'test' });

            let error
            try {
                await client.get('http://testurl.com/x');
            } catch (err) {
                error = err
            }

            expect(error).toEqual(expect.objectContaining({
                "error_message": "timeout of 1500ms exceeded",
                "error_name": "ECONNABORTED",
            }))
        });

        it.skip('socket timeout', async () => {
            nock('http://testurl.com')
                .get('y')
                .socketDelay(500)

            const client = new HttpClient({ name: 'test' });

            let error
            try {
                await client.get('http://testurl.com/y');
            } catch (err) {
                error = err
            }

            expect(error).toEqual(expect.objectContaining({
                "error_message": "timeout of 1500ms exceeded",
                "error_name": "ECONNABORTED",
            }))
        });

        it('generic error', async () => {
            nock('http://testurl.com')
                .get('/z')
                .replyWithError({ code: 'EXXX', message: 'generic error', stack: 'foo' })

            const client = new HttpClient({ name: 'test' });

            let error
            try {
                await client.get('http://testurl.com/z');
            } catch (err) {
                error = err
            }

            expect(error).toEqual(expect.objectContaining({
                "error_message": "generic error",
                "error_name": "EXXX",
            }))
        });
    });

    describe('POST', () => {
        describe('request', () => {
            afterAll(() => {
                nock.cleanAll()
            });

            it('resolves with expected response', async () => {
                nock('http://testurl.com')
                    .post('/a')
                    .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' });

                const client = new HttpClient({ name: 'test' });
                const response = await client.post('http://testurl.com/a', { foo: 'bar' });

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

            it('times out of the upstream', async () => {
                nock('http://testurl.com')
                    .post('/x')
                    .replyWithError({ code: 'ECONNABORTED', message: 'timeout of 1500ms exceeded', stack: 'foo' })

                const client = new HttpClient({ name: 'test' });

                let error
                try {
                    await client.post('http://testurl.com/x', { foo: 'bar' });
                } catch (err) {
                    error = err
                }

                expect(error).toEqual(expect.objectContaining({
                    "error_message": "timeout of 1500ms exceeded",
                    "error_name": "ECONNABORTED",
                }))
            });

            it.skip('socket timeout', async () => {
                nock('http://testurl.com')
                    .post('y')
                    .socketDelay(500)

                const client = new HttpClient({ name: 'test' });

                let error
                try {
                    await client.post('http://testurl.com/y', { foo: 'bar' });
                } catch (err) {
                    error = err
                }

                expect(error).toEqual(expect.objectContaining({
                    "error_message": "timeout of 1500ms exceeded",
                    "error_name": "ECONNABORTED",
                }))
            });

            it('generic error', async () => {
                nock('http://testurl.com')
                    .post('/z')
                    .replyWithError({ code: 'EXXX', message: 'generic error', stack: 'foo' })

                const client = new HttpClient({ name: 'test' });

                let error
                try {
                    await client.post('http://testurl.com/z', { foo: 'bar' });
                } catch (err) {
                    error = err
                }

                expect(error).toEqual(expect.objectContaining({
                    "error_message": "generic error",
                    "error_name": "EXXX",
                }))
            });
        });

        describe('client', () => {
            it('sets expected headers', async () => {

            });

            it('sends with expected body', async () => {

            });
        });
    });

    describe('receives failed http response', () => {
        it('receives a 404 response', async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(404)

            const client = new HttpClient({ name: 'test' });

            let error
            try {
                await client.get('http://testurl.com/x');
            } catch (e) {
                error = e
            }

            expect(error).toEqual({ error_name: 'ESTATUS404', error_message: 'Status code 404 received' });
        });
    });

    describe('receives a successful response ', () => {
        it('with data that is not an object', async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, "");
            const client = new HttpClient({ name: 'test' });

            let error
            try {
                await client.get('http://testurl.com/x');
            } catch (e) {
                error = e
            }

            expect(error).toEqual({ error_name: 'ENOTJSON', error_message: 'Response data was not an object' });
        });

        it('with missing response data', async () => {
            nock('http://testurl.com')
                .get('/x')
                .reply(200, undefined);

            const client = new HttpClient({ name: 'test' });

            let error
            try {
                await client.get('http://testurl.com/x');
            } catch (e) {
                error = e
            }

            expect(error).toEqual({ error_name: 'ENOTJSON', error_message: 'Response data was not an object' });
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

        beforeEach(async () => {
            nock('http://testurl.com')
                .persist()
                .get('/x')
                .reply(500, undefined);
        });

        afterAll(() => {
            nock.cleanAll()
        });

        it.only('should fire the open circuit breaker', async () => {
            const client = new HttpClient(config);
            try {
                await client.get('http://testurl.com/x');
            } catch (error) {
                console.log(error, 'xxxx')
            }

            let error
            try {
                await client.get('http://testurl.com/x');
            } catch (e) {
                error = e
            }

            expect(error).toEqual({ error_name: `ECIRCUITBREAKER`, error_message: `Circuit breaker is open for test` });
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
            let error
            try {
                const client = new HttpClient({ name: 'test' });
                await client.get('http://testurl.com/x');
            } catch (e) {
                error = e
            }
            expect(error).toEqual({ error_name: `ECONNABORTED`, error_message: 'timeout of 1500ms exceeded' });
        });
    });
});