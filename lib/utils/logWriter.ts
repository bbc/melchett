const logWriter = (logger: Logger, ctx: MiddlewareContext) => {
    const requestLog = {
        url: ctx.request && ctx.request.url,
        client: ctx.client && ctx.client.name,
        type: 'upstream',
        request_id: ctx.request && ctx.request.id
    };

    if (ctx.error) {
        logger.error({ ...requestLog, ...ctx.error });
    } else {
        const responseLog = {
            status_code: ctx.response.status,
            content_length: ctx.response.headers['content-length'],
            melchett_cache: ctx.response.headers['x-melchett-cache'] || 'MISS'
        };

        if (ctx.time && ctx.time.elapsed) {
            responseLog['upstream_duration'] = ctx.time.elapsed;
        }

        logger.info({ ...requestLog, ...responseLog });
    }
}

export {
    logWriter
};
