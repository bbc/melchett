import wreck from '@hapi/wreck';
import { caching, isCacheable, getCacheControl, getCacheTtl, getFromCache, storeInCache } from './caching';

const mockCacheStore = {
  isReady: () => true,
  get: () => Promise.resolve(),
  set: () => Promise.resolve(),
  start: () => Promise.resolve()
};

const mockCacheConfig = {
  doNotVary: [],
  cacheTtl: 200,
  ignoreErrors: true
};

describe('Caching middleware', () => {
  describe('handler', () => {
    it('should start cache engine if not ready', async () => {
      // Arrange
      const startFn = jest.fn();
      const cache = {
        store: {
          isReady: () => false,
          get: () => Promise.resolve(),
          set: () => Promise.resolve(),
          start: startFn
        }
      };
      const handler = caching(cache);

      const mockContext: MiddlewareContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} }
      };
      const nextFn = jest.fn();

      // Act
      try {
        await handler(mockContext, nextFn);
      } catch (ex) { }

      // Assert
      expect(startFn).toBeCalledTimes(1);
    });

    it('should return ECACHEINIT if cache start fails', async () => {
      // Arrange
      const cache = {
        store: {
          isReady: () => false,
          get: () => Promise.resolve(),
          set: () => Promise.resolve(),
          start: async () => { throw new Error('test'); }
        },
        ignoreErrors: false
      };
      const handler = caching(cache);

      const mockContext: MiddlewareContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} }
      };
      const nextFn = jest.fn();

      // Act & Assert
      return expect(handler(mockContext, nextFn)).rejects.toMatchObject({
        error: {
          name: 'ECACHEINIT',
          message: 'Cache engine failed to start'
        }
      });
    });

    it('should return next middleware in chain if ignoreErrors is set', async () => {
      // Arrange
      const cache = {
        store: {
          isReady: () => false,
          get: () => Promise.resolve(),
          set: () => Promise.resolve(),
          start: async () => { throw new Error('test'); }
        },
        ignoreErrors: true
      };
      const handler = caching(cache);

      const mockContext: MiddlewareContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} }
      };
      const nextFn = () => 'next middleware';

      // Act & Assert
      return expect(handler(mockContext, nextFn)).resolves.toEqual('next middleware');
    });

    it('should return ECACHEREAD if cache read fails', async () => {
      // Arrange
      const cache = {
        store: {
          isReady: () => true,
          get: () => Promise.reject(),
          set: () => Promise.resolve(),
          start: () => Promise.resolve()
        },
        ignoreErrors: false
      };
      const handler = caching(cache);

      const mockContext: MiddlewareContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} }
      };
      const nextFn = jest.fn();

      // Act & Assert
      return expect(handler(mockContext, nextFn)).rejects.toMatchObject({
        error: {
          name: 'ECACHEREAD',
          message: 'Failed to read response from cache'
        }
      });
    });

    it('should return ECACHESTORE if cache write fails', async () => {
      // Arrange
      const cache = {
        store: {
          isReady: () => true,
          get: () => Promise.resolve(),
          set: () => Promise.reject(),
          start: () => Promise.resolve()
        },
        ignoreErrors: false
      };
      const handler = caching(cache);

      const mockContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} },
        response: { config: { method: 'get' }, headers: { 'cache-control': 'max-age=100' } }
      } as unknown as MiddlewareContext;
      const nextFn = jest.fn();

      // Act & Assert
      return expect(handler(mockContext, nextFn)).rejects.toMatchObject({
        error: {
          name: 'ECACHESTORE',
          message: 'Failed to write response to cache'
        }
      });
    });
  });

  describe('isCacheable', () => {
    it('POST requests not cachable', async () => {
      // Arrange
      const response = {
        config: {
          method: 'post'
        }
      };

      // Act
      const result = isCacheable(response);

      // Assert
      expect(result).toBeFalsy();
    });

    it('DELETE requests not cachable', async () => {
      // Arrange
      const response = {
        config: {
          method: 'delete'
        }
      };

      // Act
      const result = isCacheable(response);

      // Assert
      expect(result).toBeFalsy();
    });

    it('no-cache is not cachable', async () => {
      // Arrange
      const response = {
        config: {
          method: 'get'
        },
        headers: {
          'cache-control': 'no-cache'
        }
      };

      // Act
      const result = isCacheable(response);

      // Assert
      expect(result).toBeFalsy();
    });

    it('max-age zero is not cachable', async () => {
      // Arrange
      const response = {
        config: {
          method: 'get'
        },
        headers: {
          'cache-control': 'max-age=0'
        }
      };

      // Act
      const result = isCacheable(response);

      // Assert
      expect(result).toBeFalsy();
    });

    it('unspecified control directive is not cachable', async () => {
      // Arrange
      const response = {
        config: {
          method: 'get'
        },
        headers: {
          'cache-control': ''
        }
      };

      // Act
      const result = isCacheable(response);

      // Assert
      expect(result).toBeFalsy();
    });

    it('max-age > 0 is cachable', async () => {
      // Arrange
      const response = {
        config: {
          method: 'get'
        },
        headers: {
          'cache-control': 'max-age=3600'
        }
      };

      // Act
      const result = isCacheable(response);

      // Assert
      expect(result).toBeTruthy();
    });
  });

  describe('getCacheControl', () => {
    let spyParseCacheControl;

    beforeEach(() => {
      spyParseCacheControl = jest.spyOn(wreck, 'parseCacheControl');
    });

    afterEach(() => {
      spyParseCacheControl.mockRestore();
    });

    it('no headers should return undefined', async () => {
      // Arrange
      const response = {};

      // Act
      const result = getCacheControl(response);

      // Assert
      expect(result).toBeUndefined();
    });

    it('cache-control headers should call parseCacheControl', async () => {
      // Arrange
      const response = { headers: { 'cache-control': 'private,no-cache' } };

      // Act
      getCacheControl(response);

      // Assert
      expect(spyParseCacheControl).toBeCalled();
    });
  });

  describe('getCacheTtl', () => {
    it('return lowest of max-age or config value', async () => {
      // Arrange
      const response = { headers: { 'cache-control': 'max-age=100' } };

      // Act
      const result = getCacheTtl(response, mockCacheConfig);

      // Assert
      expect(result).toEqual(100);
    });
  });

  describe('getFromCache', () => {
    it('should retrieve from cache', async () => {
      // Arrange
      const mockGet = jest.fn().mockResolvedValue({ item: '{ "foo": "bar" }' });

      const store = { ...mockCacheStore, get: mockGet };

      const cache = { store, doNotVary: [], cacheTtl: 200, ignoreErrors: true };
      const context: MiddlewareContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} }
      };

      // Act
      getFromCache(cache, context);

      // Assert
      expect(mockGet).toBeCalled();
    });
  });

  describe('storeInCache', () => {
    it('should set if cachable', async () => {
      // Arrange
      const mockSet = jest.fn();

      const store = { ...mockCacheStore, set: mockSet };

      const cache = { store, ...mockCacheConfig };
      const context: MiddlewareContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} },
        response: { config: { method: 'get' }, headers: { 'cache-control': 'max-age=100' } }
      } as unknown as MiddlewareContext;

      // Act
      storeInCache(cache, context);

      // Assert
      expect(mockSet).toBeCalled();
    });

    it('should not cache if not cachable', async () => {
      // Arrange
      const mockSet = jest.fn();

      const store = { ...mockCacheStore, set: mockSet };

      const cache = { store, ...mockCacheConfig };
      const context: MiddlewareContext = {
        client: { name: 'test', userAgent: 'melchett/test' },
        request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} },
        response: { config: { method: 'post' }, headers: { 'cache-control': 'max-age=100' } }
      } as unknown as MiddlewareContext;

      // Act
      storeInCache(cache, context);

      // Assert
      expect(mockSet).not.toBeCalled();
    });
  });
});
