import { Client as Catbox } from '@hapi/catbox';
import { Cache } from '../lib/caching';

jest.mock('@hapi/catbox');

// const catboxMock = Catbox as jest.Mock<any>; <= might need this later

const cache = new Cache({ maxByteSize: 30 * 1024 * 1024 });

describe('Caching client', () => {
    describe('should cache response if cacheable', () => {
        it('get request', async () => { 
            // Arrange
            const response = {
                config: {
                    method: 'get'
                },
                headers: {
                    "cache-control": "max-age=3600"
                },
                body: {
                    header: "Header Value"
                }
            };
    
            const catboxSetFunc = jest.fn(() => { return Promise.resolve(); });
            Catbox.set = catboxSetFunc;
    
            // Act
            cache.setCache(response);
    
            // Assert
            expect(catboxSetFunc).toBeCalledWith(expect.any(Object), expect.any(Object), expect.any(Number));        
        });


        it('has appropriate cache-control header values', async () => { 
            // Arrange
            const response = {
                config: {
                    method: 'get'
                },
                headers: {
                    "cache-control": "max-age=3600"
                },
                body: {
                    header: "Header Value"
                }
            };
    
            const catboxSetFunc = jest.fn(() => { return Promise.resolve(); });
            Catbox.set = catboxSetFunc;
    
            // Act
            cache.setCache(response);
    
            // Assert
            expect(catboxSetFunc).toBeCalledWith(expect.any(Object), expect.any(Object), expect.any(Number));        
        });

    });

    describe('should not cache a response if not appropriate', () => {
        it('post request', async () => {
            // Arrange
            const postResponse = {
                config: {
                    method: 'post'
                },
                headers: {
                    "cache-control": "max-age=3600"
                },
                body: {
                    header: "Header Value"
                }
            };
            
            const putResponse = {
                config: {
                    method: 'put'
                },
                headers: {
                    "cache-control": "max-age=3600"
                },
                body: {
                    header: "Header Value"
                }
            };

            const patchResponse = {
                config: {
                    method: 'patch'
                },
                headers: {
                    "cache-control": "max-age=3600"
                },
                body: {
                    header: "Header Value"
                }
            };

            const deleteResponse = {
                config: {
                    method: 'delete'
                },
                headers: {
                    "cache-control": "max-age=3600"
                },
                body: {
                    header: "Header Value"
                }
            };
    
            const catboxSetFunc = jest.fn(() => { return Promise.resolve(); });
            Catbox.set = catboxSetFunc;
    
            // Act
            cache.setCache(postResponse);
            cache.setCache(putResponse);
            cache.setCache(deleteResponse);
            cache.setCache(patchResponse);

            // Assert
            expect(catboxSetFunc).not.toBeCalled(); 
        });

        it('cache-control header value contains no-cache', async () => {
            // Arrange
            const response = {
                config: {
                    method: 'get',
                },
                headers: {
                    "cache-control": "no-cache"
                },
                body: {
                    foo: 'bar'
                }
            };

            const catboxSetFunc = jest.fn(() => { return Promise.resolve(); });
            Catbox.set = catboxSetFunc;

            // Act
            cache.setCache(response);

            // Assert
            expect(catboxSetFunc).not.toBeCalled();
        });

        it('cache-control header value has max-age=0', async () => {
            // Arrange
            const response = {
                config: {
                    method: 'get',
                },
                headers: {
                    "cache-control": "max-age=0"
                },
                body: {
                    foo: 'bar'
                }
            };

            const catboxSetFunc = jest.fn(() => { return Promise.resolve(); });
            Catbox.set = catboxSetFunc;

            // Act
            cache.setCache(response);

            // Assert
            expect(catboxSetFunc).not.toBeCalled();
        });

        it('has no header values', async () => {
            // Arrange
            const response = {
                config: {
                    method: 'get',
                },
                body: {
                    foo: 'bar'
                }
            };

            const catboxSetFunc = jest.fn(() => { return Promise.resolve(); });
            Catbox.set = catboxSetFunc;

            // Act
            cache.setCache(response);

            // Assert
            expect(catboxSetFunc).not.toBeCalled();
        });
    });
});

/**
 * Test suites:
 *  - Should cache cachable requests (GET, acceptable Cache-Control headers)
 *  - Should NOT cache non-GET requests, or requests with `no-cache`, a `max-age` of 0
 *  - Should use URL and varying headers hash as cache key
 *  - Non-varying header should not affect cache key
 *  - TTL should respect `max-age` and/or `stale-if-error` values of response or config (whichever is lower)
 */