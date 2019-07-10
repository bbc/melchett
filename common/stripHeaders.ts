/**
 * 
 * @param headers - The original header data
 * @param doNotVary - An array of values that should be removed from the headers
 */
export function stripHeaders(headers: {}, doNotVary: string[] ) {
    
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