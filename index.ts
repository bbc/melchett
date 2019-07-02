const Catbox = require('catbox');
const Memory = require('catbox-memory');
const config = require('../config/config.json');
const axios = require('axios');

import { logger } from './common/logger';

const USER_AGENT = 'itv/' + process.env.npm_package_name + '/' + process.env.npm_package_version;
const TIMEOUT = 1500;
const TIMEOUT_CATCH = (TIMEOUT * 1000) * 2 + 500;
const DO_NOT_VARY = ['X-Amzn-Trace-Id', 'X-Correlation-Id', 'response-id'];

const isCircuitBreakerOpen = (err: HttpClientError) => /Circuit breaker is open/.test(err.message);
const didTimeout = (err: HttpClientError) => /ETIMEDOUT/.test(err.message);
const didSocketTimeout = (err: HttpClientError) => /ESOCKETTIMEDOUT/.test(err.message);
const hasCertificateError = (err: HttpClientError) => /certificate/.test(err.message);

interface HttpClientConfig {
    name: string,
  }
  
  const enum HandlerMethod {
    GET = 'get',
    POST = 'post'
  }
  
  type HttpClientError = {
    body: any,
    statusCode: number,
    message: string
  };
  
  const maxByteSize = config.catbox.maxMBSize * 1024 * 1024;
  const memoryCache = new Catbox.Client(new Memory({ maxByteSize }));


export class HttpClient {  client: any;
    name: string;
  
    constructor (config: HttpClientConfig) {
      const { name } = config;
      this.name = name;
  
      this.client = axios.create({
        timeout: TIMEOUT,
        headers: USER_AGENT
      });
      
    }
  
    private handler(type: HandlerMethod, url: string, headers = {}, requestId: string, body?: any) {
      if (requestId) headers['X-Correlation-Id'] = requestId;
      const logParts = { url, client: this.name, type: 'upstream', requestId };
  
      const request = new Promise((resolve, reject) => {
        const callback = (err: { body: any, statusCode: number, message: string }, successBody: any, res: { elapsedTime: number, headers?: any, statusCode?: number } = { elapsedTime: 0 }) => {
          const body = successBody || err.body;
  
          const logPartsWithDuration = {
            ...logParts,
            ...res.elapsedTime && { duration: res.elapsedTime },
            ...res.statusCode && { statusCode: res.statusCode },
            ...res.headers && res.headers['content-length'] && { resLength: res.headers['content-length'] }
          };
  
          const customReject = args => reject({ ...logPartsWithDuration, ...args });
  
          if (err) {
            if (err.statusCode) {
              const errorBody = err.body;
              let error = JSON.stringify(errorBody);
              if (errorBody && errorBody.error) {
                error = errorBody.error.details;
              }
              return customReject({
                name: `ESTATUS${err.statusCode}`,
                message: `Status code ${err.statusCode} received for ${url}`,
                details: error || ''
              });
            }
  
            if (isCircuitBreakerOpen(err)) {
              return customReject({
                name: `ECIRCUITBREAKER`,
                message: `Circuit breaker is open for ${this.name}`
              });
            }
  
            if (didTimeout(err)) {
              return customReject({
                name: `ETIMEOUT`,
                message: `Request timed out while requesting ${this.name} data`
              });
            }
  
            if (didSocketTimeout(err)) {
              return customReject({
                name: `ESOCKETTIMEDOUT`,
                message: `Socket timed out while requesting ${this.name} data`
              });
            }
  
            if (hasCertificateError(err)) {
              return customReject({
                name: `ECERTIFICATE`,
                message: `Certificate error while requesting ${this.name} data`
              });
            }
  
            return customReject({
              name: `EUNKNOWN`,
              message: err.message
            });
          }
  
          if (typeof body !== 'object') {
            return customReject({
              name: 'ENOTJSON',
              message: 'Response was not parsed as JSON'
            });
          }
  
          if (body.error) {
            return customReject({
              name: 'ERESPONSEERROR',
              message: body.error
            });
          }
  
          // @ts-ignore
          logger.info(logPartsWithDuration);
  
          return resolve(body);
        };
  
        if (type === HandlerMethod.POST) {
          return this.client.post(url, body, { headers }).asResponse().then(callback);
        }
        this.client.get(url, { headers }).asResponse().then(callback);
      });
  
      const timeout = new Promise((resolve, reject) => setTimeout(() => reject({
        name: 'ETIMEOUT',
        message: `Timed out while requesting ${this.name} data`,
        duration: TIMEOUT_CATCH,
        ...logParts
      }), TIMEOUT_CATCH));
  
      return Promise.race([ request, timeout ]);
    }
  
    get(url: string, requestId: string, headers?: object): Promise<any> {
      // (async () => console.log(await this.client.get(url, { headers }).asResponse()))();
      return this.handler(HandlerMethod.GET, url, headers, requestId);
    }
  
    post(url: string, body: any, requestId: string, headers: object): Promise<any> {
      return this.handler(HandlerMethod.POST, url, headers, requestId, body);
    }
  }