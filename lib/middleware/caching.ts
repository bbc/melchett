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

const getCacheKeyObject = (context, config) => {
    return {
        segment: 'melchett:v1.0',
        id: getRequestHash(context.request, config.doNotVary)
    }
}

const getCacheTtl = (response, config: CacheConfig) => {
    const cacheControl = getCacheControl(response);

    if (cacheControl) {
        return Math.min(cacheControl['max-age'], config.cacheTtl)
    }
}

const getFromCache = (cache: CacheStore, context, config: CacheConfig) => {
    const cacheKeyObject = getCacheKeyObject(context, config);

    return cache.get(cacheKeyObject);
}

const storeInCache = (cache: CacheStore, context, config: CacheConfig) => {
    if (isCacheable(context.response)) {
        const cacheKeyObject = getCacheKeyObject(context, config);

        return cache.set(cacheKeyObject, context.response.body, getCacheTtl(context.response, config));
    }
}

const caching = (cache: CacheStore, config: CacheConfig) => {
    const defaults = {
        cacheTtl: 7200,
        doNotVary: [],
        ignoreErrors: true
    };

    config = { ...defaults, ...config };

    return async (context: MiddlewareContext, next) => {
        if (!cache.isReady()) {
            try {
                await cache.start();
            } catch (err) {
                if (!config.ignoreErrors) {
                    throw err;
                } else {
                    return next();
                }
            }
        }

        const cachedResponse = await getFromCache(cache, context.request, config);
        if (cachedResponse) {
            context.response = cachedResponse;
            return context;
        }

        await next();

        if (context.response) {
            await storeInCache(cache, context, config);
        }

        return context;
    }
}

export {
    isCacheable,
    getCacheControl,
    getCacheTtl,
    getFromCache,
    storeInCache,
    caching
};