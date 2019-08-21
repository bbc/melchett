import axios, { AxiosInstance } from 'axios';
import uuidv4 from 'uuid/v4';
import compose from 'koa-compose';
import { caching } from './middleware/caching';
import { circuitBreaker } from './middleware/circuitBreaker';
import { validStatus } from './middleware/validStatus';
import { validJson } from './middleware/validJson';
import { settleResponse } from './utils/settleResponse';

const request = (client: HttpClient, config: RequestConfig) => {
  const requestId = uuidv4();
  config.headers = config.headers || {};
  config.headers['X-Correlation-Id'] = requestId;

  const context: MiddlewareContext = {
    client: { name: client._config.name },
    request: {
      id: requestId,
      ...config
    }
  };

  const doRequest = async (ctx: MiddlewareContext) => {
    return client._agent.request(ctx.request)
      .then((res) => ctx.response = res)
      .catch((err) => ctx.error = err);
  }

  return client._composedMiddleware(context, doRequest)
    .then(settleResponse(client._config.logger))
    .catch(settleResponse(client._config.logger));
}

class HttpClient {
  _agent: AxiosInstance;
  _config: HttpClientConfig;
  _middleware: MiddlewareFunc[];
  _composedMiddleware;

  constructor(config: HttpClientConfig) {
    const defaults = {
      name: 'http',
      userAgent: 'melchett/v1.0',
      timeout: 1500,
      retries: 1,
      successPredicate: (status: number) => status >= 200 && status < 400
    };

    this._config = { ...defaults, ...config };
    this._middleware = [];

    /**
     * Initialise middleware in correct order
     *    Cache -> Valid JSON -> Valid Status -> Circuit Breaker
     *  */
    if (this._config.cache) {
      this._middleware.push(caching(this._config.cache));
    }

    this._middleware.push(validJson);
    this._middleware.push(validStatus(this._config.successPredicate));

    if (this._config.circuitBreaker) {
      this._middleware.push(circuitBreaker(this._config.circuitBreaker));
    }

    this._composedMiddleware = compose(this._middleware)

    this._agent = axios.create({
      timeout: this._config.timeout,
      headers: {
        'User-Agent': this._config.userAgent,
      },
      validateStatus: () => true
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