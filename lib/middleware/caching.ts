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

const getFromCache = (cache, ctx, config) => {
    const cacheKey = getRequestHash(ctx.request, config.doNotVary);

    return cache.get(cacheKey);
}

const storeInCache = (cache, ctx, config) => {
    if (isCacheable(ctx.response)) {
        const cacheKeyObject = {
            segment: 'melchett:v1.0',
            id: getRequestHash(ctx.request, config.doNotVary)
        }

        return cache.set(cacheKeyObject, ctx.response.body, getCacheTtl(ctx.response, config));
    }
}

const caching = (cache, config: CacheConfig) => {
    return async (ctx, next) => {
        const cachedResponse = await getFromCache(cache, ctx.request, config);

        await next();

        if (ctx.response) {
            await storeInCache(cache, ctx, config);
        }
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