import { parseCacheControl } from '@hapi/wreck';
import { getRequestHash } from '../utils/requestHash';

const defaults = {
    maxSizeInMB : 500,
    cacheTtl: 7200,
    doNotVary: []
}

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

const getCacheTtl = (response, config) => {
    const cacheControl = getCacheControl(response);
    
    if (cacheControl) {
        return Math.min(cacheControl['max-age'], config.cacheTtl)
    }
}

const getFromCache = (cache, context, config) => {
    const cacheKey = getRequestHash(context.request, config.doNotVary);

    return cache.get(cacheKey);
}

const storeInCache = (cache, context, config) => {
    if (isCacheable(context.response)) {
        const cacheKeyObject = {
            segment: 'melchett:v1.0',
            id: getRequestHash(context.request, config.doNotVary)
        }

        return cache.set(cacheKeyObject, context.response.body, getCacheTtl(context.response, config));
    }
}

const caching = (cache, config: CacheConfig) => {
    return async (context: MiddlewareContext, next) => {
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