const logWriter = (logger: Logger, ctx: MiddlewareContext) => {
    const requestLog = {
        url: ctx.request.url,
        client: ctx.client.name,
        type: 'upstream',
        requestId: ctx.request.id
    };

    if (ctx.error) {
        logger.error({ ...requestLog, ...ctx.error });
    } else {
        const responseLog = {
            statusCode: ctx.response.status,
            contentLength: ctx.response.headers['content-length'],
            melchettCache: ctx.response.headers['x-melchett-cache'] || 'MISS'
        };

        const upstreamDuration = parseFloat(ctx.response.headers['x-response-time']);

        if (!Number.isNaN(upstreamDuration)) {
            responseLog['upstreamDuration'] = upstreamDuration;
        }

        logger.info({ ...requestLog, ...responseLog });
    }
}

export {
    logWriter
};