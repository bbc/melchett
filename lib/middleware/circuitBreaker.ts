import circuitBreaker from 'opossum';

const tripPredicate = (status: number) => status < 500 ? Promise.resolve() : Promise.reject()

const circuitBreakerHandler = (config: CircuitBreakerConfig) => {
    return async (ctx: MiddlewareContext, next) => {
        if (!ctx.client.circuit) {
            ctx.client.circuit = circuitBreaker(tripPredicate, config);
        }

        if (ctx.client.circuit.opened === true) {
            ctx.error = { name: `ECIRCUITBREAKER`, message: `Circuit breaker is open for ${ctx.client.name}` };
            return ctx;
        }
        
        await next();
        
        
        ctx.client.circuit.fire(ctx.response.status).catch(() => undefined);
    }
}

export {
    circuitBreakerHandler as circuitBreaker
}