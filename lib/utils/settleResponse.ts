const settleResponse = (ctx: MiddlewareContext) => {
    const request = {
        url: ctx.request && ctx.request.url,
        client: ctx.client && ctx.client.name,
        type: 'upstream',
        method: ctx.request && ctx.request.method,
        id: ctx.request && ctx.request.id
    };

    const response = ctx.response ? {
        body: ctx.response.data,
        headers: ctx.response.headers,
        status: ctx.response.status,
        content_length: ctx.response.headers['content-length'],
        upstream_duration: (ctx.time && ctx.time.elapsed) ? ctx.time.elapsed : undefined,
        melchett_cache: ctx.response.headers['x-melchett-cache'] || 'MISS'
    } : {}
    
    if (!ctx.error && ctx.response) {
        return Promise.resolve({ request, response });
    }

    if (!ctx.error) {
        ctx.error = {
            name: `EUNKNOWN`,
            message: 'An unknown error occurred'
        }
    }

    return Promise.reject({ request, response, error: ctx.error });
}

export {
    settleResponse
}
