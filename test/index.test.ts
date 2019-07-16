const nock = require('nock');
import { HttpClient } from '../lib/index';

describe('receives a successful http response', () => {
    beforeAll(async () => {
        nock('http://testurl.com')
        .get('/x')
        .reply(200, {
            data:1,
            status:200,
            headers: {'x-response-time': 500, 'content-length': 500}
        })
    })

    it('receives a 200 response', async () => {
        const client = new HttpClient({name: 'test'});
        const response = await client.get('http://testurl.com/x', 'requestId')
        expect(response.data).toEqual(1);
        
    })
});


describe('receives a not found failed http response', () => {
    it('receives a 404 response', async () => {
        nock('http://testurl.com')
        .get('/x')
        .reply(404, {
            status:404,
            headers: {'x-response-time': 500, 'content-length': 500}
        })
        const client = new HttpClient({name: 'test'});
        const response = await client.get('http://testurl.com/x', 'requestId')
        expect(response).toEqual({name:'ESTATUS404', message:'Status code 404 received for http://testurl.com/x', details:'Request failed with status code 404'});
    })

    it('receives a 300 response', async () => {
        nock('http://testurl.com')
        .get('/x')
        .reply(300, {
            status:300,
            headers: {'x-response-time': 500, 'content-length': 500}
        })
        const client = new HttpClient({name: 'test'});
        const response = await client.get('http://testurl.com/x', 'requestId')
        expect(response).toEqual({name:'ESTATUS300', message:'Status code 300 received for http://testurl.com/x', details:'Request failed with status code 300'});
    })

});

describe('receives a non object response', () => {
    beforeAll(async () => {
        nock('http://testurl.com')
        .get('/x')
        .reply(200, "");
    })

    it('receives a succesful response with missing response data', async () => {
        const client = new HttpClient({name: 'test'});
        const response = await client.get('http://testurl.com/x', 'requestId')
        console.log(response);
    })
});