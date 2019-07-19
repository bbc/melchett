import { Client as Catbox } from  '@hapi/catbox';
import Memory from '@hapi/catbox-memory';
import { logger } from '../common/logger';
import { stripHeaders } from '../common/stripHeaders';

const defaultConfig = require('../config/defaultConfig.json')
const axios = require('axios');
const circuitBreaker = require('opossum');

const USER_AGENT = 'itv/' + process.env.npm_package_name + '/' + process.env.npm_package_version;
const TIMEOUT = 1500;
const DO_NOT_VARY = ['X-Amzn-Trace-Id', 'X-Correlation-Id', 'response-id'];

interface HttpClientConfig {
  name: string,
  circuitBreaker?: {
    errorThresholdPercentage: number,
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

const maxByteSize = 200 * 1024 * 1024;
const memoryCache = new Catbox(new Memory({ maxByteSize }));

export class HttpClient {
  client: any;
  config: HttpClientConfig;
  circuit: any;
  
  constructor(config: HttpClientConfig) {
    this.config = Object.assign(defaultConfig, config);
    this.client = axios.create({
      timeout: TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
      }
    });
    
    this.circuit = circuitBreaker(this.shouldCircuitTrip, this.config.circuitBreaker);
    
    //intercept the request to check for broken circuits
    this.client.interceptors.request.use((config) => {
      // console.log(config);

      if(this.circuit.opened === true) {
        return Promise.reject({name: `ECIRCUITBREAKER`, message: `Circuit breaker is open for ${this.config.name}`});
      }
      return config;
    },
      (error) => {
        return Promise.reject(error);
      }
    );

    //intercept the response to check for malformed responses
    this.client.interceptors.response.use((response) => {
      // console.log(response);
      
      if (typeof response.data !== 'object') {
        return Promise.reject({name: `ENOTJSON`, message: `Response data was not an object`});
      }
      return response;
    },
      (error) => {
        this.circuit.fire(error).catch(() => {});
        return Promise.reject(error);
      }
    );

    
  }


  private shouldCircuitTrip(error) {  //TODO: Better name for function
    if(error.response && error.response.status < 500) {
      return Promise.resolve(error)
    }
    return Promise.reject(error)
  }

  private handler(type: HandlerMethod, url: string, headers = {}, requestId: string, body?: any) {
    if (requestId) headers['X-Correlation-Id'] = requestId;
    const logParts = { url, client: this.config.name, type: 'upstream', requestId };

    let newHeaders = stripHeaders(headers, DO_NOT_VARY); //TODO: Change this - shouldn't actually strip the headers!
    let customError = {}



    const successHandler = (response) => {
      let logData = logHandler(logParts, response);
      logger.info(logData);
      return response.data;
    };

    const errorHandler = (error) => {
      // console.log('---------------------------------------------------');
      // console.log('---------------------------------------------------');
      // console.log('Failed', error.code);
      if (error.response && error.response.status) {
        customError = {
          name: `ESTATUS${error.response.status}`,
          message: `Status code ${error.response.status} received for ${url}`,
          details: error.message || ''
        }
      }
      else if (error.name && error.name === 'ECIRCUITBREAKER' ) {
        customError = {
          name: error.name,
          message: error.message
        }
      }
      else if (error.code && error.code === 'ECONNABORTED') {
        customError = {
          name: error.code,
          message: error.message
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
      // return this.circuit.fire({ method: type, url, newHeaders })
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