interface Hook {
  preRequest: (request) => {},
  postResponse: (response) => {}
}

interface CircuitBreakerConfig {
  errorThresholdPercentage: number,
  resetTimeout: number
}

interface CacheConfig {
  maxSizeInMB: number,
  cacheTtl: number,
  doNotVary: string[]
}

interface RequestConfig {
  method: 'get' | 'post',
  url: string,
  headers?: any,
  body?: any
}

interface Logger {
  debug: (message?: any, ...args: any[]) => void,
  error: (message?: any, ...args: any[]) => void,
  info: (message?: any, ...args: any[]) => void,
  log: (message?: any, ...args: any[]) => void,
  warn: (message?: any, ...args: any[]) => void
}

type MiddlewareContext = {
  request: RequestConfig,
  response?: any
};

type MiddlewareFunc = (context: MiddlewareContext, next: () => {}) => {};

interface HttpClientConfig {
  name: string,
  timeout?: number,
  retries?: number,
  retryDelay?: number,
  successPredicate?: (status: number) => boolean,
  userAgent?: string,
  logger?: Logger
}