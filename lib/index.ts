// import { Client as Catbox } from  '@hapi/catbox';
// import Memory from '@hapi/catbox-memory';
const axios = require('axios');
// import wrapper from 'axios-cache-plugin'
// import { setupCache } from 'axios-cache-adapter'

import { logger } from '../common/logger';
import { doNotVaryHeaders } from '../common/doNotVaryHeaders';

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
        'User-Agent': USER_AGENT,
      }
    });

  }

  private handler(type: HandlerMethod, url: string, headers = {}, requestId: string, body?: any) {
    if (requestId) headers['X-Correlation-Id'] = requestId;
    const logParts = { url, client: this.name, type: 'upstream', requestId };
    
    let newHeaders = doNotVaryHeaders(headers, DO_NOT_VARY);
    
    const successHandler = (response) => {
      // console.log(Object.keys(response.data));
      // console.log(response.status);
      // console.log(response.statusText);
      // console.log(response.headers);
      // console.log(response.config);
      let logData = logHandler(logParts, response);
      console.log('The log Data', logData);
      logger.info(logData);

      return response.data;
    };

    const errorHandler = (error) => {
      if(error.response) {
        
        
        
        
        // console.log(error.response);
        let logData = logHandler(logParts, error.response);
        console.log('The Error log Data', logData);
        logger.info(logData);
      }

    }

    const logHandler = (logParts, response) => {
      let duration = response.headers['x-response-time'];
      let statusCode = response.status;
      let contentLength = response.headers['content-length'];

      return {
        ...logParts, duration, statusCode, contentLength
      }

    }


    if (type === HandlerMethod.POST) {
      return this.client.post(url, body, { newHeaders })
        .then(successHandler)
        .catch(errorHandler);
    }
    else {

      return this.client.get(url, { newHeaders })
        .then(successHandler)
        .catch(errorHandler);
    }
  }

  get(url: string, requestId: string, headers?: object): Promise<any> {
    return this.handler(HandlerMethod.GET, url, headers, requestId);
  }

  post(url: string, body: any, requestId: string, headers: object): Promise<any> {
    return this.handler(HandlerMethod.POST, url, headers, requestId, body);
  }
}