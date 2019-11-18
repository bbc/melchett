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
  body?: any,
  id?: string
}

interface Logger {
  debug: (message?: any, ...args: any[]) => void,
  error: (message?: any, ...args: any[]) => void,
  info: (message?: any, ...args: any[]) => void,
  log: (message?: any, ...args: any[]) => void,
  warn: (message?: any, ...args: any[]) => void
}

type MiddlewareContext = {
  client: {
    name: string,
    state?: {
      circuit?: any
    }
  },
  request: RequestConfig,
  response?: any,
  error?: any
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
  logger?: Logger
}
