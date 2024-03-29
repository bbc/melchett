import nock from 'nock';
import { HttpClient } from '../../lib/client';

const expectedRequest = {
  client: 'test',
  id: expect.any(String),
  method: 'get',
  url: 'http://testurl.com/x'
};

const expectedResponse = {
  body: '',
  headers: {},
  melchettCached: expect.any(Boolean),
  status: expect.any(Number),
  duration: expect.any(Number)
};

describe('melchett client', () => {
  describe('GET', () => {
    beforeAll(async () => {
      nock('http://testurl.com')
        .persist()
        .get('/x')
        .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' });
    });

    it('resolves with expected response', async () => {
      const client = new HttpClient({ name: 'test' });
      const result = await client.get('http://testurl.com/x');

      expect(result.response.status).toEqual(200);
      expect(result.response.body).toMatchObject({ data: 1 });
    });

    describe('client', () => {
      it('sets expected request headers', async () => {
        const client = new HttpClient({ name: 'test' });
        const result = await client.get('http://testurl.com/x', { foo: 'bar' });

        expect(result.request.headers).toEqual(expect.objectContaining({ foo: 'bar' }));
      });
    });
  });

  describe('POST', () => {
    beforeAll(() => {
      nock('http://testurl.com')
        .persist()
        .post('/x')
        .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' });
    });

    afterAll(() => nock.cleanAll());

    describe('request', () => {
      it('resolves with expected response', async () => {
        const client = new HttpClient({ name: 'test' });
        const result = await client.post('http://testurl.com/x', { foo: 'bar' });

        expect(result.response.status).toEqual(200);
        expect(result.response.body).toMatchObject({ data: 1 });
      });
    });

    describe('client', () => {
      it('sets expected request headers', async () => {
        const client = new HttpClient({ name: 'test' });
        const result = await client.post('http://testurl.com/x', {}, { foo: 'bar' });

        expect(result.request.headers).toEqual(expect.objectContaining({ foo: 'bar' }));
      });

      it('sends with expected body', async () => {
        const client = new HttpClient({ name: 'test' });
        const result = await client.post('http://testurl.com/x', { param: 'foo' });

        expect(result.request.body).toEqual(expect.objectContaining({ param: 'foo' }));
      });
    });
  });

  describe('DELETE', () => {
    beforeAll(() => {
      nock('http://testurl.com')
        .persist()
        .delete('/x')
        .reply(200, { data: 1 }, { 'x-response-time': '500', 'content-length': '500' });
    });

    afterAll(() => nock.cleanAll());

    describe('request', () => {
      it('resolves with expected response', async () => {
        const client = new HttpClient({ name: 'test' });
        const result = await client.delete('http://testurl.com/x');

        expect(result.response.status).toEqual(200);
        expect(result.response.body).toMatchObject({ data: 1 });
      });
    });

    describe('client', () => {
      it('sets expected request headers', async () => {
        const client = new HttpClient({ name: 'test' });
        const result = await client.delete('http://testurl.com/x', { foo: 'bar' });

        expect(result.request.headers).toEqual(expect.objectContaining({ foo: 'bar' }));
      });
    });
  });

  describe('receives a not found failed http response', () => {
    it('receives a 404 response', async () => {
      const expectedResponseWithHeaders = {
        ...expectedResponse,
        headers: {
          'content-length': '500',
          'x-response-time': '500'
        }
      };

      nock('http://testurl.com')
        .get('/x')
        .reply(404, undefined, { 'x-response-time': '500', 'content-length': '500' });
      const client = new HttpClient({ name: 'test' });
      await expect(client.get('http://testurl.com/x'))
        .rejects
        .toMatchObject({ request: expectedRequest, response: expectedResponseWithHeaders, error: { name: 'ESTATUS404', message: 'Status code 404 received for http://testurl.com/x' } });
    });
  });

  describe('receives a successful response ', () => {
    beforeAll(async () => {
      nock('http://testurl.com')
        .get('/x')
        .reply(200, '');
    });

    it('with data that is not an object', async () => {
      const client = new HttpClient({ name: 'test' });
      await expect(client.get('http://testurl.com/x'))
        .rejects
        .toMatchObject({ request: expectedRequest, response: expectedResponse, error: { name: 'ENOTJSON', message: 'Response data was not an object' } });
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
        .toMatchObject({ request: expectedRequest, response: expectedResponse, error: { name: 'ENOTJSON', message: 'Response data was not an object' } });
    });
  });

  describe('circuit breakers', () => {
    const config = {
      name: 'test',
      circuitBreaker: {
        errorThresholdPercentage: 0,
        resetTimeout: 1000
      }
    };

    beforeAll(async () => {
      nock('http://testurl.com')
        .persist()
        .get('/x')
        .reply(500, undefined);
    });

    it('should fire the open circuit breaker', async () => {
      const client = new HttpClient(config);

      await client.get('http://testurl.com/x')
        .catch(async () => {
          await expect(client.get('http://testurl.com/x'))
            .rejects
            .toMatchObject({ request: expectedRequest, response: {}, error: { name: 'ECIRCUITBREAKER', message: 'Circuit breaker is open for test' } });
        });
    });

    it('should close the circuit breaker', async () => {
      const client = new HttpClient(config);

      try {
        await client.get('http://testurl.com/x');
        await client.get('http://testurl.com/x');
      } catch (ex) { }

      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(expect(client.get('http://testurl.com/x'))
            .rejects
            .toMatchObject({ request: expectedRequest, response: expectedResponse, error: { name: 'ESTATUS500', message: 'Status code 500 received for http://testurl.com/x' } }));
        }, 2000);
      });
    });

    afterAll(() => {
      nock.cleanAll();
    });
  });

  describe('circuit breakers - multiple clients', () => {
    const config = {
      name: 'test',
      circuitBreaker: {
        errorThresholdPercentage: 10,
        resetTimeout: 1000
      }
    };

    beforeAll(async () => {
      nock('http://testurl.com')
        .persist()
        .get('/x')
        .reply(500, undefined);
    });

    it('should NOT fire the open circuit breaker when running multiple clients', async () => {
      const clients = [
        new HttpClient({ ...config, name: 'C1' }),
        new HttpClient({ ...config, name: 'C2' }),
        new HttpClient({ ...config, name: 'C3' })
      ];

      for (const client of clients) {
        await expect(client.get('http://testurl.com/x'))
          .rejects
          .toMatchObject({
            request: { ...expectedRequest, client: expect.any(String) },
            response: expectedResponse,
            error: { name: 'ESTATUS500', message: 'Status code 500 received for http://testurl.com/x' }
          });
      }
    });

    afterAll(() => {
      nock.cleanAll();
    });
  });

  describe('Timeouts ', () => {
    beforeAll(async () => {
      nock('http://testurl.com')
        .get('/x')
        .delayConnection(2000)
        .reply(200, { data: 1 }, { 'x-response-time': '2000', 'content-length': '500' });
    });

    it('should return a timeout error', async () => {
      const client = new HttpClient({ name: 'test' });
      await expect(client.get('http://testurl.com/x'))
        .rejects
        .toMatchObject({ request: expectedRequest, response: {}, error: { name: 'ETIMEDOUT', message: 'Timeout of 1500ms exceeded' } });
    });
  });

  describe('Redirects', () => {
    describe('303', () => {
      beforeAll(async () => {
        nock('http://testurl.com')
          .post('/one')
          .reply(303, { data: 1 }, { Location: '/two', 'x-response-time': '500', 'content-length': '500' });
        nock('http://testurl.com')
          .get('/two')
          .reply(200, { data: 'successfully redirected 303' }, { 'x-response-time': '500', 'content-length': '500' });
      });

      it('should redirect a 303 and alter the verb to GET', async () => {
        const client = new HttpClient({ name: 'test' });

        const result = await client.post('http://testurl.com/one', { param: 'foo' }, { foo: 'bar' });

        expect(result.response.status).toEqual(200);
        expect(result.response.body).toMatchObject({ data: 'successfully redirected 303' });
        expect(result.request.headers).toEqual(expect.objectContaining({ foo: 'bar' }));
      });
    });

    describe('302', () => {
      beforeAll(async () => {
        nock('http://testurl.com')
          .get('/one')
          .reply(302, { data: 1 }, { Location: '/two', 'x-response-time': '500', 'content-length': '500' });
        nock('http://testurl.com')
          .get('/two')
          .reply(200, { data: 'successfully redirected 302' }, { 'x-response-time': '500', 'content-length': '500' });
      });

      it('should redirect a 302 preserving the method verb', async () => {
        const client = new HttpClient({ name: 'test' });

        const result = await client.get('http://testurl.com/one', { foo: 'bar' });

        expect(result.response.status).toEqual(200);
        expect(result.response.body).toMatchObject({ data: 'successfully redirected 302' });
        expect(result.request.headers).toEqual(expect.objectContaining({ foo: 'bar' }));
      });
    });
  });
});
