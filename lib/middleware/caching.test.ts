import wreck from '@hapi/wreck';
import { isCacheable, getCacheControl, getCacheTtl, getFromCache, storeInCache, caching } from './caching';

const mockCacheStore = {
    isReady: () => true,
    get: (key: { segment: string, id: string }) => Promise.resolve(),
    set: (key: { segment: string, id: string }, value: any, ttl: number) => Promise.resolve(),
    start: () => Promise.resolve()
};

const mockCacheConfig = {
    doNotVary: [],
    cacheTtl: 200,
    ignoreErrors: true
};

describe('Caching middleware', () => {
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
            spyParseCacheControl = jest.spyOn(wreck, 'parseCacheControl')
        });

        afterEach(() => {
            spyParseCacheControl.mockRestore()
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

            const store = { ...mockCacheStore, get: mockGet }

            const cache = { store, doNotVary: [], cacheTtl: 200, ignoreErrors: true };
            const context: MiddlewareContext = {
                client: { name: 'test' },
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

            const store = { ...mockCacheStore, set: mockSet }

            const cache = { store, ...mockCacheConfig };
            const context: MiddlewareContext = {
                client: { name: 'test' },
                request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} },
                response: { config: { method: 'get' }, headers: { 'cache-control': 'max-age=100' } }
            };

            // Act
            storeInCache(cache, context);

            // Assert
            expect(mockSet).toBeCalled();
        });

        it('should not cache if not cachable', async () => {
            // Arrange
            const mockSet = jest.fn();

            const store = { ...mockCacheStore, set: mockSet }

            const cache = { store, ...mockCacheConfig };
            const context: MiddlewareContext = {
                client: { name: 'test' },
                request: { url: 'https://www.bbc.co.uk', method: 'get', headers: {} },
                response: { config: { method: 'post' }, headers: { 'cache-control': 'max-age=100' } }
            };

            // Act
            storeInCache(cache, context);

            // Assert
            expect(mockSet).not.toBeCalled();
        });
    });
});