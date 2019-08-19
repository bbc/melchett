import circuitBreaker, { CircuitBreaker } from 'opossum';

const tripPredicate = (status: number) => status < 500 ? Promise.resolve() : Promise.reject()

let circuit: CircuitBreaker

const circuitBreakerHandler = (config: CircuitBreakerConfig) => {
    return async (context: MiddlewareContext, next) => {
        if (typeof circuit !== 'function') {
            circuit = circuitBreaker(tripPredicate, config);
        }

        if (circuit.opened === true) {
            context.error = { name: `ECIRCUITBREAKER`, message: `Circuit breaker is open for ${context.client.name}` };
            return context;
        }
        
        await next();
        
        
        circuit.fire(context.response.status).catch(() => undefined);
    }
}

export {
    circuitBreakerHandler as circuitBreaker
}