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

const request = (client: HttpClient, config: RequestConfig) => {
  const requestId = uuidv4();
  config.headers = config.headers || {};
  config.headers['X-Correlation-Id'] = requestId;

  const logParts = { url: config.url, client: client._config.name, type: 'upstream', requestId };

  const successHandler = (ctx) => {
    // post-response (success): isValidJson, tryCache
    console.log('response: ', ctx.response);
    let logData = logHandler(logParts, ctx.response);
    client._config.logger.info(logData);
    return ctx.response.data;
  }

  const errorHandler = (ctx) => {
    // post-response (error): openCircuit

    let customError = {}
    if (ctx.response && ctx.response.status) {
      customError = {
        name: `ESTATUS${ctx.response.status}`,
        message: `Status code ${ctx.response.status} received for ${config.url}`,
        details: ctx.message || ''
      }
    }
    else if (ctx.name && ctx.name === 'ECIRCUITBREAKER') {
      customError = {
        name: ctx.name,
        message: ctx.message
      }
    }
    else if (ctx.code && ctx.code === 'ECONNABORTED') {
      customError = {
        name: ctx.code,
        message: ctx.message
      }
    }
    else {
      customError = {
        name: `EUNKNOWN`,
        message: ctx.message
      }
    }

    let logData = logHandler(logParts, ctx.response);
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

  const func1 = async (ctx, next) => {
    console.log('func1 ctx: ', ctx);
    console.log(1);

    // testing short-circuit response
    const res = {
      response: {
        headers: {
          'cache-control': 'no-cache'
        },
        data: '<lol></lol>'
      }
    };

    return res;

    await next();

    // console.log('func2 2nd invoc ctx:', ctx);
    console.log(4);
    return ctx;
  }

  const func2 = async (ctx, next) => {
    console.log('func2 ctx: ', ctx);
    console.log(2);

    await next();

    // console.log('func2 2nd invoc ctx:', ctx);
    console.log(3);
    return ctx;
  }

  client._middleware.push(func1);
  client._middleware.push(func2);

  const composedMiddleware = compose(client._middleware);

  const doRequest = async (ctx) => {
    return client._agent.request(ctx.request)
      .then((res) => ctx.response = res)
      .catch((err) => ctx.error = err);
  }

  return composedMiddleware({ request: config }, doRequest)
    .then(successHandler)
    .catch(errorHandler);
}

class HttpClient {
  _agent: AxiosInstance;
  _config: HttpClientConfig;
  _middleware: MiddlewareFunc[];

  constructor(config: HttpClientConfig) {
    this._config = { ...defaults, ...config };
    this._middleware = [];

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