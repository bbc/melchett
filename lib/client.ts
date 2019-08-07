import axios, { AxiosInstance } from 'axios';
import uuidv4 from 'uuid/v4';
import compose from 'koa-compose';
import { logging } from './middleware/logging';
import { caching } from './middleware/caching';
import { circuitBreaker } from './middleware/circuitBreaker';
import { validStatus } from './middleware/validStatus';
import { validJson } from './middleware/validJson';
import { CircuitBreaker } from 'opossum';

const request = (client: HttpClient, config: RequestConfig) => {
  const requestId = uuidv4();
  config.headers = config.headers || {};
  config.headers['X-Correlation-Id'] = requestId;

  const context = {
    client: { name: client._config.name },
    request: {
      id: requestId,
      ...config
    }
  };

  const doRequest = async (ctx) => {
    return client._agent.request(ctx.request)
      .then((res) => ctx.response = res)
      .catch((err) => ctx.error = err);
  }

  return client._composedMiddleware(context, doRequest)
    .then((ctx) => Promise.resolve(ctx.response.data))
    .catch((ctx) => {
      if (!ctx.error) {
        ctx.error = {
          name: `EUNKNOWN`,
          message: ctx.message || ''
        }
      }

      return Promise.reject(ctx.error);
    });
}

class HttpClient {
  _agent: AxiosInstance;
  _config: HttpClientConfig;
  _middleware: MiddlewareFunc[];
  _composedMiddleware;

  constructor(config: HttpClientConfig) {
    const defaults = {
      userAgent: 'itv/' + process.env.npm_package_name + '/' + process.env.npm_package_version,
      timeout: 1500,
      retries: 1,
      successPredicate: (status: number) => status >= 200 && status < 500
    };

    this._config = { ...defaults, ...config };
    this._middleware = [];

    /**
     * Initialise middleware in correct order
     *    Cache -> Valid JSON -> Valid Status -> Circuit Breaker -> Logging
     *  */
    if (this._config.cache) {
      this._middleware.push(caching(this._config.cache));
    }

    this._middleware.push(validJson);
    this._middleware.push(validStatus(this._config.successPredicate));
    this._middleware.push(circuitBreaker(this._config.circuitBreaker));

    if (this._config.logger) {
      this._middleware.push(logging(this._config.logger));
    }

    this._composedMiddleware = compose(this._middleware)

    this._agent = axios.create({
      timeout: this._config.timeout,
      headers: {
        'User-Agent': this._config.userAgent,
      },
      validateStatus: (status) => status >= 200 && status < 500
    });
  }

  get(url: string, headers?: object): Promise<any> {
    return request(this, { method: 'get', url, headers });
  }

  post(url: string, body: any, headers?: object): Promise<any> {
    return request(this, { method: 'post', url, headers, body });
  }
}

export {
  HttpClient,
  request
}