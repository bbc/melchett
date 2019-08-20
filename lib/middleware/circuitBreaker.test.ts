import opossum from 'opossum';
import { circuitBreaker } from './circuitBreaker';

const defaultContext: MiddlewareContext = {
    client: {
        name: 'client-name'
    },
    request: { method: 'get', url: 'foo' }
}

jest.mock('opossum');

describe('Circuit breaker', () => {
    describe('when circuit is open', () => {
        let context;

        beforeEach(() => {
            jest.mock('opossum', () => () => ({ opened: true, fire: () => Promise.resolve() }));
            context = { ...defaultContext };
        });

        it('should add an error to the context', async () => {
            const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: 0 });
            const next = jest.fn();
            
            const expected = {
                message: "Circuit breaker is open for client-name",
                name: "ECIRCUITBREAKER"
            };

            await handler(context, next);
            
            expect(next).not.toBeCalled();
            expect(context.error).toEqual(expected);
        });
    });

    describe('when circuit is closed', () => {
        let context;

        beforeEach(() => {
            jest.mock('opossum', () => () => ({ opened: false, fire: () => Promise.resolve() }));
            context = { ...defaultContext };
        });

        it('should call the next function and context NOT have errors', async () => {
            const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: Infinity });
            const next = jest.fn();

            await handler({ ...context, response: { status: 200 } }, next);

            expect(next).toBeCalled();
            expect(context.error).toBeUndefined();
        });
    });
});