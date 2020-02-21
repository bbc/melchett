const settleResponse = (ctx: MiddlewareContext) => {
    const request = {
        client: ctx.client && ctx.client.name,
        url: ctx.request && ctx.request.url,
        id: ctx.request && ctx.request.id,
        headers: ctx.request && ctx.request.headers,
        method: ctx.request && ctx.request.method,
        body: ctx.request && ctx.request.data
    };

    const response = ctx.response ? {
        body: ctx.response.data,
        headers: ctx.response.headers,
        status: ctx.response.status,
        duration: (ctx.time && ctx.time.elapsed !== undefined) ? ctx.time.elapsed : undefined,
        melchettCached: !!ctx.response.melchettCached
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
