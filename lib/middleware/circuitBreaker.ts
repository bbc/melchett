import CircuitBreaker from 'opossum';

const invalidStatusError = new Error('Status >= 500');

const circuitBreakerHandler = (config: CircuitBreakerConfig) => {
  return async (ctx: MiddlewareContext, next) => {
    if (!ctx.client.state?.circuit) {
      ctx.client.state.circuit = new CircuitBreaker((callback: () => Promise<unknown>) => callback(), config);
    }

    try {
      await ctx.client.state.circuit.fire(async () => {
        await next();
        if (ctx.response?.status >= 500) {
          throw invalidStatusError;
        }
      });
    } catch (e) {
      if (CircuitBreaker.isOurError(e)) {
        ctx.error = { name: 'ECIRCUITBREAKER', message: `Circuit breaker is open for ${ctx.client.name}` };
        return Promise.reject(ctx);
      } else if (e !== invalidStatusError) {
        throw e;
      }
    }
  };
};

export {
  circuitBreakerHandler as circuitBreaker
};
