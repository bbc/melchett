const validStatus = (successPredicate: (status: number) => boolean) => {
    return async (ctx: MiddlewareContext, next) => {
        await next();

        if (ctx.response && ctx.response.status && !successPredicate(ctx.response.status)) {
            ctx.error = {
                error_name: `ESTATUS${ctx.response.status}`,
                error_message: `Status code ${ctx.response.status} received for ${ctx.request.url}`,
                error_details: ctx.response.message || ''
            }
            return Promise.reject(ctx);
        }    

        return ctx;
    }
}

export {
    validStatus
}
