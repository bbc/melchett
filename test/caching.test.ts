import { Client as Catbox } from '@hapi/catbox';
import { Cache } from '../lib/caching';

jest.genMockFromModule('@hapi/catbox');
jest.mock('@hapi/catbox');

let cache = null;
let mockCatboxSetFunc = null;

beforeEach(() => {
    mockCatboxSetFunc = {
        set: jest.fn()
    }

    Catbox.mockImplementation(() => mockCatboxSetFunc);
    cache = new Cache({maxByteSize: 5000, cacheTtl: 200, doNotVary:[]});
});

describe('Caching client', () => {
    describe('should cache response if cacheable', () => {
        it('get request', async () => { 
            // Arrange
            const response = {
                config: {
                    method: 'get',
                    headers: {
                        "from": "metoyou"
                    }
                },
                headers: {
                    "cache-control": "max-age=3600"
                },
                body: {
                    header: "Header Value"
                }
            };
                
            // Act
            cache.maybeSetCache(response);
            // Assert
            expect(mockCatboxSetFunc.set).toBeCalledWith(expect.any(Object), expect.any(Object), expect.any(Number));        
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
    
            // Act
            cache.maybeSetCache(response);
            // Assert
            expect(mockCatboxSetFunc.set).toBeCalledWith(expect.any(Object), expect.any(Object), expect.any(Number));        
        });

        it('has multiple cache-control header values', async () => {
            const response = {
                config: {
                    method: 'get',
                    headers: {
                        "from": "metoyou"
                    }
                },
                headers: {
                    "cache-control": 'public, max-age=3600, min-fresh=7200'
                },
                body: {
                    foo: 'bar'
                }
            };

            cache.maybeSetCache(response);
            expect(mockCatboxSetFunc.set).toBeCalledWith(expect.any(Object), expect.any(Object), expect.any(Number));        
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
    
            // Act
            cache.maybeSetCache(postResponse);
            cache.maybeSetCache(putResponse);
            cache.maybeSetCache(deleteResponse);
            cache.maybeSetCache(patchResponse);
            // Assert
            expect(mockCatboxSetFunc.set).not.toBeCalled(); 
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

            // Act
            cache.maybeSetCache(response);
            // Assert
            expect(mockCatboxSetFunc.set).not.toBeCalled();
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

            // Act
            cache.maybeSetCache(response);
            // Assert
            expect(mockCatboxSetFunc.set).not.toBeCalled();
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

            // Act
            cache.maybeSetCache(response);
            // Assert
            expect(mockCatboxSetFunc.set).not.toBeCalled();
        });

        it('has no cache-control header values', async () => {
            // Arrange
            const response = {
                config: {
                    method: 'get',
                },
                headers: {
                    "random-header": "random value"
                },
                body: {
                    foo: 'bar'
                }
            };

            // Act
            cache.maybeSetCache(response);
            // Assert
            expect(mockCatboxSetFunc.set).not.toBeCalled();
        });

        it('has an empty cache-control header value', async () => {
            const response = {
                config: {
                    method: 'get',
                },
                headers: {
                    "cache-control": ''
                },
                body: {
                    foo: 'bar'
                }
            };
            
            cache.maybeSetCache(response);
            expect(mockCatboxSetFunc.set).not.toBeCalled();
        });

        it('cache-control header value has max-age 3600 and no cache ', async () => {
            // Arrange
            const response = {
                config: {
                    method: 'get',
                },
                headers: {
                    "cache-control": "max-age=3600, no-cache"
                },
                body: {
                    foo: 'bar'
                }
            };

            // Act
            cache.maybeSetCache(response);

            // Assert
            expect(mockCatboxSetFunc.set).not.toBeCalled();
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
 *  - Should set a cache item and retrive the same item from the cache
 */