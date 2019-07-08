// import { Client as Catbox } from  '@hapi/catbox';
// import Memory from '@hapi/catbox-memory';
const axios = require('axios');
import wrapper from 'axios-cache-plugin'
// import { setupCache } from 'axios-cache-adapter'

import { logger } from '../common/logger';

const USER_AGENT = 'itv/' + process.env.npm_package_name + '/' + process.env.npm_package_version;
const TIMEOUT = 1500;
const TIMEOUT_CATCH = (TIMEOUT * 1000) * 2 + 500;
const DO_NOT_VARY = ['X-Amzn-Trace-Id', 'X-Correlation-Id', 'response-id'];

// const isCircuitBreakerOpen = (err: HttpClientError) => /Circuit breaker is open/.test(err.message);
// const didTimeout = (err: HttpClientError) => /ETIMEDOUT/.test(err.message);
// const didSocketTimeout = (err: HttpClientError) => /ESOCKETTIMEDOUT/.test(err.message);
// const hasCertificateError = (err: HttpClientError) => /certificate/.test(err.message);

interface HttpClientConfig {
  name: string
}

const enum HandlerMethod {
  GET = 'get',
  POST = 'post'
}

type HttpClientError = {
  body: any,
  status: number,
  statusText: string
};

// const maxByteSize = 200 * 1024 * 1024;
// const memoryCache = new Catbox(new Memory({ maxByteSize }));

export class HttpClient {
  client: any;
  name: string;

  constructor(config: HttpClientConfig) {
    const { name } = config;
    this.name = name;
    this.client = axios.create({
      timeout: TIMEOUT,
      headers: {
        'User-Agent' : USER_AGENT,
      }
    });

  }

  private handler(type: HandlerMethod, url: string, headers = {}, requestId: string, body?: any) {
    if (requestId) headers['X-Correlation-Id'] = requestId;
    const logParts = { url, client: this.name, type: 'upstream', requestId };

    //header munging remove do not varies from headers (a la flashheart)

    const successHandler = (response) => {
      console.log(response.data);
      return response.data;
    };

    const errorHandler = (error) => {
      console.log(error);

    }

    if (type === HandlerMethod.POST) {
      return this.client.post(url, body, {
        headers
      })
        .then(successHandler)
        .catch(errorHandler);
    }
    else {

        return this.client.get(url, { headers })
        .then(successHandler)
        .catch(errorHandler);
    }
  }

  get(url: string, requestId: string, headers?: object): Promise<any> {
    console.log('url', url);
    return this.handler(HandlerMethod.GET, url, headers, requestId);
  }

  post(url: string, body: any, requestId: string, headers: object): Promise<any> {
    return this.handler(HandlerMethod.POST, url, headers, requestId, body);
  }
}