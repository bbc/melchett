const settleResponse = (ctx: MiddlewareContext) => {
    const request = {
        url: ctx.request && ctx.request.url,
        client: ctx.client && ctx.client.name,
        method: ctx.request && ctx.request.method,
        id: ctx.request && ctx.request.id
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
