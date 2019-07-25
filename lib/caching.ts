const crypto = require('crypto');
import { parseCacheControl } from '@hapi/wreck';
import { Client as Catbox } from '@hapi/catbox';
import Memory from '@hapi/catbox-memory';



interface CacheConfig {
    maxByteSize: number
}

export class Cache {
    memoryCache: any;
    
    constructor(config: CacheConfig) {
        this.memoryCache = new Catbox(new Memory({ maxByteSize: config.maxByteSize }));
    }

    getCacheIfExists() {
    
    }
    
    setCache(response) {
        if(isCachable(response)) {
            Catbox.set({segment: 'whatever', id: ''}, {}, 5);
        }
        
        // Key = { segment: 'melchett:v1.0', id: 'asjdhfjlasdhklsdg' } id = hash(url, varyingHeaders)
        // Value = response.body
        // TTL = Math.min(cache-control header, config.maxCacheAge)
    }
}

/**
 * 
 * @param headers - The original header data
 * @param doNotVary - An array of values that should not be considered during cache Vary operations
 */
function getVaryingHeaders(headers: {}, doNotVary: string[] ) {
    doNotVary.forEach(function(doNotVaryHeader){
        if (headers) {
            Object.keys(headers).forEach(function(headerItem) {
                if(headerItem.toLowerCase() === doNotVaryHeader.toLowerCase()) {
                    delete headers[headerItem];
                }
            })
        }
    })
    return headers;
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