const defaultConfig = require('../config/defaultConfig.json')
// import { Client as Catbox } from  '@hapi/catbox';
// import Memory from '@hapi/catbox-memory';
const axios = require('axios');
const circuitBreaker = require('opossum');
// import wrapper from 'axios-cache-plugin'
// import { setupCache } from 'axios-cache-adapter'

import { logger } from '../common/logger';
import { stripHeaders } from '../common/stripHeaders';

const USER_AGENT = 'itv/' + process.env.npm_package_name + '/' + process.env.npm_package_version;
const TIMEOUT = 1500;
// const TIMEOUT_CATCH = (TIMEOUT * 1000) * 2 + 500;
const DO_NOT_VARY = ['X-Amzn-Trace-Id', 'X-Correlation-Id', 'response-id'];

interface HttpClientConfig {
  name: string,
  circuitBreaker?: {
    errorThresholdPercentage: number,
    timeout: number,
    resetTimeout: number
  }
}

const enum HandlerMethod {
  GET = 'get',
  POST = 'post'
}

type HttpClientError = {
  body: any,
  status: number,
  message: string
};

// const maxByteSize = 200 * 1024 * 1024;
// const memoryCache = new Catbox(new Memory({ maxByteSize }));

export class HttpClient {
  client: any;
  config: HttpClientConfig;
  circuit: any;
  isCircuitBreakerOpen: boolean;
  didTimeout: boolean;

  constructor(config: HttpClientConfig) {
    this.config = Object.assign(defaultConfig, config);
    this.client = axios.create({
      timeout: TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
      }
    });
    this.isCircuitBreakerOpen = false;
    this.didTimeout = false;

    this.circuit = circuitBreaker(this.client.request, this.config.circuitBreaker);

    //intercept the response to check for malformed responses
    this.client.interceptors.response.use(function (response) {
      if (typeof response.data !== 'object') {
        return Promise.reject(new Error('Response data is not an object'));
      }
      return response;
    },
      function (error) {
        return Promise.reject(error);
      }
    );

    // this.client.interceptors.request.use(function (config) {
    //   console.log(config);
    //   // if(this.isCircuitBreakerOpen === true) {
    //   //   return Promise.reject(new Error('Circuit breaker open'));
    //   // }
    //   // else if(this.didTimeout === true) {
    //   //   return Promise.reject(new Error('Request timed out'));
    //   // }
    //   // else {
    //   //   return request;
    //   // }
    // },
    //   function (error) {
    //     return Promise.reject(error);
    //   }
    // );
  }


  private handler(type: HandlerMethod, url: string, headers = {}, requestId: string, body?: any) {
    if (requestId) headers['X-Correlation-Id'] = requestId;
    const logParts = { url, client: this.config.name, type: 'upstream', requestId };

    let newHeaders = stripHeaders(headers, DO_NOT_VARY);
    let customError = {}



    const successHandler = (response) => {
      let logData = logHandler(logParts, response);
      logger.info(logData);
      return response.data;
    };

    const errorHandler = (error) => {
      // console.log('Failed', error);
      if (error.response && error.response.status) {
        customError = {
          name: `ESTATUS${error.response.status}`,
          message: `Status code ${error.response.status} received for ${url}`,
          details: error.message || ''
        }
      }
      else {
        customError = {
          name: `EUNKNOWN`,
          message: error.message
        }
      }
      //   let logData = logHandler(logParts, error.response, );
      // ...logData, //TODO: Add this to thre return
      return { ...customError }

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
      this.circuit.on('timeout', () => { return Promise.reject({ name: `ETIMEOUT`, message: `Request timed out while requesting ${this.config.name} data` }) })
      this.circuit.on('open', () => { return Promise.reject({ name: `ECIRCUITBREAKER`, message: `Circuit breaker is open for ${this.config.name}` }) })

      return this.circuit.fire({ method: type, url, newHeaders })
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