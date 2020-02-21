interface Hook {
  preRequest: (request) => {},
  postResponse: (response) => {}
}

interface CircuitBreakerConfig {
  errorThresholdPercentage: number,
  resetTimeout: number
}

interface CacheConfig {
  cacheTtl?: number,
  doNotVary?: string[],
  ignoreErrors?: boolean
}

interface CacheStore {
  isReady: () => boolean,
  get: (key: { segment: string, id: string }) => Promise<any>,
  set: (key: { segment: string, id: string }, value: any, ttl: number) => Promise<any>,
  start: () => Promise<any>
}

type CacheCombined = CacheConfig & { store: CacheStore };

interface RequestConfig {
  method: 'get' | 'post',
  url: string,
  headers?: any,
  data?: any,
  id?: string,
  cancel?: (arg0: string | object) => void,
  cancelToken?: any
}

type MiddlewareContext = {
  client: {
    name: string,
    userAgent: string,
    state?: {
      circuit?: any
    }
  },
  request: RequestConfig,
  response?: any,
  error?: any,
  time?: {
    start: number,
    end?: number,
    elapsed?: number
  }
};

type MiddlewareFunc = (context: MiddlewareContext, next: () => {}) => {};

interface HttpClientConfig {
  name?: string,
  timeout?: number,
  cache?: {
    store: CacheStore
  } & CacheConfig,
  circuitBreaker?: CircuitBreakerConfig,
  successPredicate?: (status: number) => boolean,
  userAgent?: string,
  timingHeader?: string,
  agentOptions?: {
    cert?: string | Buffer | Array<string | Buffer>,
    ca?: string | Buffer | Array<string | Buffer>,
    key?: string | Buffer | Array<Buffer | Object>
  }
}
