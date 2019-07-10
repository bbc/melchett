const axios = require('axios');
import { HttpClient } from '../lib/index';

jest.mock('axios');

beforeEach(() => {
    //@ts-ignore
    axios.mockClear();
    
});

const axiosMockSetUp = function(mockResponse) {
    if(mockResponse.status === 200) {
        axios.create = jest.fn(client => { 
            return {
                get:() => Promise.resolve(
                    mockResponse
                ), 
                post:() => Promise.resolve( //TODO: This
                    mockResponse
                )
            }
        });
    }
    else {
        axios.create = jest.fn(client => { 
            return {
                get:() => Promise.reject(
                    mockResponse
                ), 
                post:() => Promise.reject( //TODO: This
                    mockResponse
                )
            }
        });
    }
}

describe('makes a http call', () => {
    it('receives a 200 response', async () => {
        const mockResponse = {
            data:1,
            status:200,
            headers: {'x-response-time': 500, 'content-length': 500}
        }
        axiosMockSetUp(mockResponse)
        const client = new HttpClient({name: 'test'});
        const response = await client.get('url', 'requestId')
        expect(response).toBe(1);
    })

    it('receives a 404 response', async () => {
        const mockResponse = {
            response : {
                status:404,
                headers: {'x-response-time': 500, 'content-length': 500}
            },
            message: 'Failed request'
        }
        axiosMockSetUp(mockResponse)
        const client = new HttpClient({name: 'test'});
        const response = await client.get('url', 'requestId')
        expect(response).toEqual({name:'ESTATUS404', message:'Status code 404 received for url', details:'Failed request'});
    })

    it('has an open circuit breaker', async () => {
        const mockResponse = {
            response : {
                status:404,
                headers: {'x-response-time': 500, 'content-length': 500}
            },
            message: 'Failed request'
        }
    })

});