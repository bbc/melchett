import { parseCacheControl } from '@hapi/wreck';
import { getRequestHash } from '../utils/requestHash';

const isCacheable = (response) => {
    const cacheControl = getCacheControl(response);
    if (cacheControl) {
        const isGetRequest = response.config.method === 'get';
        const hasNoCache = cacheControl['no-cache'];
        const hasMaxAge = cacheControl['max-age'] > 0;

        return isGetRequest && !hasNoCache && hasMaxAge;
    }
    return false;
}

const getCacheControl = (response) => {
    const headerValues = response.headers && response.headers['cache-control'];
    if (!headerValues) {
        return;
    }
    return parseCacheControl(headerValues);
}

const getCacheKeyObject = (ctx: MiddlewareContext, config: CacheConfig) => {
    return {
        segment: `${ctx.client.userAgent}:${ctx.client.name}`,
        id: getRequestHash(ctx.request, config.doNotVary)
    }
}

const getCacheTtl = (response, config: CacheConfig) => {
    const cacheControl = getCacheControl(response);

    if (cacheControl) {
        return Math.min(cacheControl['max-age'], config.cacheTtl)
    }

    return config.cacheTtl;
}

const getFromCache = (cache: CacheCombined, ctx: MiddlewareContext) => {
    const cacheKeyObject = getCacheKeyObject(ctx, cache);

    return cache.store.get(cacheKeyObject)
        .then((cacheObject) => {
            if (cacheObject && cacheObject.item) {
                return JSON.parse(cacheObject.item)
            }
        });
}

const storeInCache = async (cache: CacheCombined, ctx: MiddlewareContext) => {
    if (isCacheable(ctx.response)) {
        const cacheKeyObject = getCacheKeyObject(ctx, cache);

        const prunedResponse = {
            status: ctx.response.status,
            statusText: ctx.response.statusText,
            headers: ctx.response.headers,
            melchettCached: true,
            data: ctx.response.data
        };

        await cache.store.set(cacheKeyObject, JSON.stringify(prunedResponse), getCacheTtl(ctx.response, cache) * 1000);
    }
}

const caching = (cache: CacheCombined) => {
    const defaults = {
        cacheTtl: 7200,
        doNotVary: [],
        ignoreErrors: true
    };

    cache = { ...defaults, ...cache };

    if (!~cache.doNotVary.indexOf('x-correlation-id')) {
        cache.doNotVary.push('x-correlation-id');
    }

    return async (ctx: MiddlewareContext, next) => {
        if (!cache.store.isReady()) {
            try {
                await cache.store.start();
            } catch (err) {
                if (!cache.ignoreErrors) {
                    ctx.error = {
                        name: 'ECACHEINIT',
                        message: 'Cache engine failed to start'
                    };

                    return Promise.reject(ctx);
                } else {
                    return next();
                }
            }
        }

        const cachedResponse = await getFromCache(cache, ctx);
        if (cachedResponse) {
            ctx.response = cachedResponse;
            return ctx;
        }

        await next();

        if (ctx.response) {
            try {
                await storeInCache(cache, ctx);
            } catch (err) {
                if (!cache.ignoreErrors) {
                    ctx.error = {
                        name: 'ECACHESTORE',
                        message: 'Failed to write response to cache'
                    };

                    return Promise.reject(ctx);
                }
            }
        }

        return ctx;
    }
}

export {
    isCacheable,
    getCacheControl,
    getCacheKeyObject,
    getCacheTtl,
    getFromCache,
    storeInCache,
    caching
};
