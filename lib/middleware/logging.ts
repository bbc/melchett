const logging = (logger: Logger) => {
    return async (ctx: MiddlewareContext, next) => {
        await next();

        const requestLog = {
            url: ctx.request.url,
            client: ctx.client.name,
            type: 'upstream',
            requestId: ctx.request.id,
            duration: ctx.response
        };

        if (ctx.error) {
            logger.error({ ...requestLog, ...ctx.error });
        } else {
            const responseLog = {
                duration: ctx.response.headers['x-response-time'],
                statusCode: ctx.response.status,
                contentLength: ctx.response.headers['content-length']
            };

            logger.info({ ...requestLog, ...responseLog });
        }

        return ctx;
    }
}

export {
    logging
};