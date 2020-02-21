import https from 'https';
import axios, { AxiosInstance } from 'axios';
import uuidv4 from 'uuid/v4';
import compose from 'koa-compose';
import { caching } from './middleware/caching';
import { circuitBreaker } from './middleware/circuitBreaker';
import { validStatus } from './middleware/validStatus';
import { validJson } from './middleware/validJson';
import { timer } from './middleware/timer';
import { settleResponse } from './utils/settleResponse';

const version = require('./../package.json').version;

const request = (client: HttpClient, config: RequestConfig) => {
    const requestId = uuidv4();
    config.headers = config.headers || {};
    config.headers['X-Correlation-Id'] = requestId;

    const context: MiddlewareContext = {
        client: {
            name: client._config.name,
            userAgent: client._config.userAgent,
            state: client._state
        },
        request: {
            id: requestId,
            ...config
        }
    };

    const doRequest = async (ctx: MiddlewareContext) => {
        return client._agent.request(Object.freeze(ctx.request))
            .then((res) => ctx.response = res)
            .catch((err) => ctx.error = err);
    }

    return client._composedMiddleware(context, doRequest)
        .then(settleResponse)
        .catch(settleResponse);
}

class HttpClient {
    _agent: AxiosInstance;
    _config: HttpClientConfig;
    _middleware: MiddlewareFunc[];
    _composedMiddleware;
    _state = {};

    constructor(config: HttpClientConfig) {
        const defaults = {
            name: 'http',
            userAgent: `melchett/v${version}`,
            timeout: 1500,
            retries: 1,
            successPredicate: (status: number) => status >= 200 && status < 400
        };

        this._config = { ...defaults, ...config };
        this._middleware = [];
        const httpsAgent = this._config.agentOptions ? new https.Agent({
            ca: this._config.agentOptions.ca,
            cert: this._config.agentOptions.cert,
            key: this._config.agentOptions.key
        }) : undefined;

        /**
     * Initialise middleware in correct order
     *    Cache -> Valid JSON -> Valid Status -> Timer -> Circuit Breaker
     *  */
        if (this._config.cache && this._config.cache.store) {
            this._middleware.push(caching(this._config.cache));
        }

        this._middleware.push(validJson);
        this._middleware.push(validStatus(this._config.successPredicate));
        this._middleware.push(timer(this._config.timingHeader));

        if (this._config.circuitBreaker) {
            this._middleware.push(circuitBreaker(this._config.circuitBreaker));
        }

        this._composedMiddleware = compose(this._middleware)

        this._agent = axios.create({
            timeout: this._config.timeout,
            headers: {
                'User-Agent': this._config.userAgent,
            },
            validateStatus: () => true,
            httpsAgent: httpsAgent
        });
    }

    get(url: string, headers?: object): Promise<any> {
        return request(this, { method: 'get', url, headers });
    }

    post(url: string, body: any, headers?: object): Promise<any> {
        return request(this, { method: 'post', url, headers, data: body });
    }
}

export {
    HttpClient,
    request
}