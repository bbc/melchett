import axios, { AxiosInstance } from 'axios';
import uuidv4 from 'uuid/v4';
import compose from 'koa-compose';
import { caching } from './middleware/caching';
import { circuit } from './middleware/circuitBreaker';
import { isValidJson } from './middleware/validJson';

const defaults = {
  userAgent: 'itv/' + process.env.npm_package_name + '/' + process.env.npm_package_version,
  timeout: 1500,
  retries: 1,
  circuitBreaker: {
    enabled: true,
    errorThresholdPercentage: 10,
    resetTimeout: 30000
  }
}

export class HttpClient {
  _agent: AxiosInstance;
  _config: HttpClientConfig;
  _middleware: MiddlewareFunc[];

  constructor(config: HttpClientConfig) {
    this._config = { ...defaults, ...config };

    this._agent = axios.create({
      timeout: this._config.timeout,
      headers: {
        'User-Agent': this._config.userAgent,
      },
      validateStatus: (status) => status >= 200 && status < 500
    });
  }

  private request(config: RequestConfig) {
    const requestId = uuidv4();
    config.headers = config.headers || {};
    config.headers['X-Correlation-Id'] = requestId;

    const logParts = { url: config.url, client: this._config.name, type: 'upstream', requestId };

    const successHandler = (response) => {
      // post-response (success): isValidJson, tryCache
      let logData = logHandler(logParts, response);
      this._config.logger.info(logData);
      return response.data;
    }

    const errorHandler = (error) => {
      // post-response (error): openCircuit

      let customError = {}
      if (error.response && error.response.status) {
        customError = {
          name: `ESTATUS${error.response.status}`,
          message: `Status code ${error.response.status} received for ${config.url}`,
          details: error.message || ''
        }
      }
      else if (error.name && error.name === 'ECIRCUITBREAKER') {
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

      let logData = logHandler(logParts, error.response);
      return { ...customError, ...logData }
    }

    const logHandler = (logParts, response) => {
      let duration = response.headers['x-response-time'];
      let statusCode = response.status;
      let contentLength = response.headers['content-length'];

      return {
        ...logParts, duration, statusCode, contentLength
      }
    }

    const response = this._agent.request(config)

    return response
      .then(successHandler)
      .catch(errorHandler);
  }

  get(url: string, headers?: object): Promise<any> {
    return this.request({ method: 'get', url, headers });
  }

  post(url: string, body: any, headers?: object): Promise<any> {
    return this.request({ method: 'post', url, headers, body });
  }

  useCache(cache, config) {
    this._middleware.push(caching(cache, config));
  }
}
