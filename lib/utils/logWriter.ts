const logWriter = (logger: Logger, ctx: MiddlewareContext) => {
    const requestLog = {
        url: ctx.request.url,
        client: ctx.client.name,
        type: 'upstream',
        request_id: ctx.request.id
    };

    if (ctx.error) {
        logger.error({ ...requestLog, ...ctx.error });
    } else {
        const responseLog = {
            status_code: ctx.response.status,
            content_length: ctx.response.headers['content-length'],
            melchett_cache: ctx.response.headers['x-melchett-cache'] || 'MISS'
        };

        const upstreamDuration = parseFloat(ctx.response.headers['x-response-time']);

        if (!Number.isNaN(upstreamDuration)) {
            responseLog['upstream_duration'] = upstreamDuration;
        }

        logger.info({ ...requestLog, ...responseLog });
    }
}

export {
    logWriter
};