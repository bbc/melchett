// import { Client as Catbox } from  '@hapi/catbox';
// import Memory from '@hapi/catbox-memory';
const axios = require('axios');
// import wrapper from 'axios-cache-plugin'
// import { setupCache } from 'axios-cache-adapter'

import { logger } from '../common/logger';
import { stripHeaders } from '../common/stripHeaders';

const USER_AGENT = 'itv/' + process.env.npm_package_name + '/' + process.env.npm_package_version;
const TIMEOUT = 1500;
// const TIMEOUT_CATCH = (TIMEOUT * 1000) * 2 + 500;
const DO_NOT_VARY = ['X-Amzn-Trace-Id', 'X-Correlation-Id', 'response-id'];

// const isCircuitBreakerOpen = (error: HttpClientError) => /Circuit breaker is open/.test(error.message);
// const didTimeout = (error: HttpClientError) => /ETIMEDOUT/.test(error.message);
// const didSocketTimeout = (error: HttpClientError) => /ESOCKETTIMEDOUT/.test(error.message);
// const hasCertificateError = (error: HttpClientError) => /certificate/.test(error.message);

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
  message: string
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
    
    let newHeaders = stripHeaders(headers, DO_NOT_VARY);
    
    const successHandler = (response) => {
      let logData = logHandler(logParts, response);
      logger.info(logData);
      return response.data;
    };

    const errorHandler = (error) => {
      console.log('Failed', error);
      let customError = {}
      if(error.response) {
        if(error.response.status) {
          customError = {
            name: `ESTATUS${error.response.status}`,
            message: `Status code ${error.response.status} received for ${url}`,
            details: error.message || ''
          }
        
        }
        
      
      //   if (err) {
      //     if (err.statusCode) {
      //       const errorBody = err.body;
      //       let error = JSON.stringify(errorBody);
      //       if (errorBody && errorBody.error) {
      //         error = errorBody.error.details;
      //       }
      //       return customReject({
      //         name: `ESTATUS${err.statusCode}`,
      //         message: `Status code ${err.statusCode} received for ${url}`,
      //         details: error || ''
      //       });
      //     }

      //     if (isCircuitBreakerOpen(err)) {
      //       return customReject({
      //         name: `ECIRCUITBREAKER`,
      //         message: `Circuit breaker is open for ${this.name}`
      //       });
      //     }

      //     if (didTimeout(err)) {
      //       return customReject({
      //         name: `ETIMEOUT`,
      //         message: `Request timed out while requesting ${this.name} data`
      //       });
      //     }

      //     if (didSocketTimeout(err)) {
      //       return customReject({
      //         name: `ESOCKETTIMEDOUT`,
      //         message: `Socket timed out while requesting ${this.name} data`
      //       });
      //     }

      //     if (hasCertificateError(err)) {
      //       return customReject({
      //         name: `ECERTIFICATE`,
      //         message: `Certificate error while requesting ${this.name} data`
      //       });
      //     }

      //     return customReject({
      //       name: `EUNKNOWN`,
      //       message: err.message
      //     });
      //   }

      //   if (typeof body !== 'object') {
      //     return customReject({
      //       name: 'ENOTJSON',
      //       message: 'Response was not parsed as JSON'
      //     });
      //   }

      //   if (body.error) {
      //     return customReject({
      //       name: 'ERESPONSEERROR',
      //       message: body.error
      //     });
      //   }
        
        
      //   let logData = logHandler(logParts, error.response, );
      //   console.log('The Error log Data', logData);
      // ...logData, //TODO: Add this to thre return
        
        console.log('Custom Error', {...customError});
        return { ...customError }
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