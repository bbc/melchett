interface Hook {
  preRequest: (request) => {};
  postResponse: (response) => {};
}

interface CircuitBreakerConfig {
  errorThresholdPercentage: number;
  resetTimeout: number;
}

interface CacheConfig {
  cacheTtl?: number;
  doNotVary?: string[];
  ignoreErrors?: boolean;
}

interface CacheStore {
  isReady: () => boolean;
  get: (key: { segment: string; id: string }) => Promise<any>;
  set: (key: { segment: string; id: string }, value: any, ttl: number) => Promise<any>;
  start: () => Promise<any>;
}

type CacheCombined = CacheConfig & { store: CacheStore };

type HeaderObject = Record<string, string | undefined>

interface RequestConfig {
  method: 'get' | 'post' | 'delete';
  url: string;
  headers?: HeaderObject;
  data?: any;
  id?: string;
  cancel?: (arg0: string | object) => void;
  cancelToken?: any;
}

type MiddlewareContext = {
  client: {
    name: string;
    userAgent: string;
    state?: {
      circuit?: any;
    };
  };
  request: RequestConfig;
  response?: {
    data: unknown;
    headers: HeaderObject;
    status: number;
    statusText: string;
    melchettCached?: boolean;
  };
  error?: any;
  time?: {
    start: number;
    end?: number;
    elapsed?: number;
  };
};

type SettledResponse = {
  request: {
    client: string;
    url: string;
    id: string;
    headers: HeaderObject;
    method: RequestConfig['method'];
    body: unknown;
  };
  response: {
    body: unknown;
    headers: HeaderObject;
    status: number;
    duration: number;
    melchettCached: boolean;
  };
}
type RejectedResponse = {
  request: SettledResponse['request'];
  response?: SettledResponse['response'];
  error: any;
}

type MiddlewareFunc = (context: MiddlewareContext, next: () => {}) => {};

interface KeyObject {
  pem: string | Buffer;
  passphrase?: string;
}

interface HttpClientConfig {
  name?: string;
  timeout?: number;
  cache?: {
    store: CacheStore;
  } & CacheConfig;
  circuitBreaker?: CircuitBreakerConfig;
  successPredicate?: (status: number) => boolean;
  userAgent?: string;
  timingHeader?: string;
  agentOptions?: {
    cert?: string | Buffer | Array<string | Buffer>;
    ca?: string | Buffer | Array<string | Buffer>;
    key?: string | Buffer | Array<Buffer | KeyObject>;
  };
}

declare module 'melchett' {
  class HttpClient {
    constructor(config: HttpClientConfig);
    get: (url: string, headers?: HeaderObject) => Promise<SettledResponse>;
    post: (url: string, body: object, headers?: HeaderObject) => Promise<SettledResponse>;
    delete: (url: string, headers?: HeaderObject) => Promise<SettledResponse>;
  }
}
