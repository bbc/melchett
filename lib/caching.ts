const crypto = require('crypto');
import { parseCacheControl } from '@hapi/wreck';
import { Client as Catbox } from '@hapi/catbox';
import Memory from '@hapi/catbox-memory';



interface CacheConfig {
    maxByteSize: number
    cacheTtl: number
    doNotVary: string[]
}

export class Cache {
    memoryCache: any;
    config: CacheConfig;


    constructor(config: CacheConfig) {
        this.memoryCache = new Catbox(new Memory({ maxByteSize: config.maxByteSize }));
        this.config = config;
    }

    getCacheIfExists(request) {
        const cacheKey = this.getCacheKey(request);
        return this.memoryCache.get(cacheKey);
    }
    
    maybeSetCache(response) {
        console.log('MaybeSetCache', response);
        
        if(isCachable(response)) {
            console.log('True');
            console.log(this.memoryCache.set);
            
            this.memoryCache.set({segment: 'melchett:v1.0', id: this.getCacheKey(response.config)}, response.body, this.getCacheTtl(response));
        }
    }

    getCacheKey(request) {
        const shasum = crypto.createHash('sha1');
        const cacheKey = request.url + JSON.stringify(getVaryingHeaders(request.headers, this.config.doNotVary))
        shasum.update(cacheKey);
        return shasum.digest('hex');
    }
    
    getCacheTtl(response) {
        const cacheControl = getCacheControl(response);
    
        if (cacheControl) {
            return Math.min(cacheControl['max-age'], this.config.cacheTtl)
        }
    }
}

function getVaryingHeaders(headers: {}, doNotVary: string[] ) {
    const varyingHeaders = {};
    Object.keys(headers).forEach(function(headerItem) {
        if(!(headerItem in doNotVary)) {
            varyingHeaders[headerItem] = headers[headerItem];
        }
    })
    return varyingHeaders;
}

function isCachable(response) {
    const cacheControl = getCacheControl(response);
    if (cacheControl) {
        const isGetRequest = response.config.method === 'get';
        const hasNoCache = cacheControl['no-cache'];
        const hasMaxAge = cacheControl['max-age'] > 0;

        return isGetRequest && !hasNoCache && hasMaxAge;
    }
    return false;
}

function getCacheControl(response) {
    const headerValues = response.headers && response.headers['cache-control'];
    if (!headerValues) {
        return;
    }
    return parseCacheControl(headerValues);
}