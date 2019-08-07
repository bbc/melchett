import axios, { AxiosInstance } from 'axios';
import uuidv4 from 'uuid/v4';
import compose from 'koa-compose';
import { logging } from './middleware/logging';
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

  const composedMiddleware = compose(client._middleware);

  const doRequest = async (ctx) => {
    return client._agent.request(ctx.request)
      .then((res) => ctx.response = res)
      .catch((err) => ctx.error = err);
  }

  return composedMiddleware(context, doRequest)
    .then((ctx) => ctx.response.data)
    .catch((ctx) => {
      if (!ctx.error) {
        ctx.error = {
          name: `EUNKNOWN`,
          message: ctx.message || ''
        }
      }

      return ctx.error;
    });
}

class HttpClient {
  _agent: AxiosInstance;
  _config: HttpClientConfig;
  _middleware: MiddlewareFunc[];

  constructor(config: HttpClientConfig) {
    this._config = { ...defaults, ...config };
    this._middleware = [];

    if (this._config.logger) {
      this._middleware.push(logging(this._config.logger));
    }

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

  useCache(cache, config) {
    this._middleware.push(caching(cache, config));
  }
}

export {
  HttpClient,
  request
}