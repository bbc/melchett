const crypto = require('crypto');
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