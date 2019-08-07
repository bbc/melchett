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

const getCacheKeyObject = (context, config: CacheConfig) => {
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

const getFromCache = (cache: CacheCombined, context) => {
    const cacheKeyObject = getCacheKeyObject(context, cache);

    return cache.store.get(cacheKeyObject);
}

const storeInCache = (cache: CacheCombined, context) => {
    if (isCacheable(context.response)) {
        const cacheKeyObject = getCacheKeyObject(context, cache);

        return cache.store.set(cacheKeyObject, context.response.body, getCacheTtl(context.response, cache));
    }
}

const caching = (cache: CacheCombined) => {
    const defaults = {
        cacheTtl: 7200,
        doNotVary: [],
        ignoreErrors: true
    };

    cache = { ...defaults, ...cache };

    return async (context: MiddlewareContext, next) => {
        if (!cache.store.isReady()) {
            try {
                await cache.store.start();
            } catch (err) {
                if (!cache.ignoreErrors) {
                    throw err;
                } else {
                    return next();
                }
            }
        }

        const cachedResponse = await getFromCache(cache, context.request);
        if (cachedResponse) {
            context.response = cachedResponse;
            return context;
        }

        await next();

        if (context.response) {
            await storeInCache(cache, context);
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