import { circuitBreaker } from './circuitBreaker';

const defaultContext: MiddlewareContext = {
    client: { name: 'client-name', userAgent: 'melchett/test', state: {} },
    request: { method: 'get', url: 'foo' },
    response: { status: undefined }
}

const mockOpossum = { opened: false, fire: () => Promise.resolve() };
jest.mock('opossum', () => {
    return function() {
        return mockOpossum
    }
});

describe('Circuit breaker', () => {
    describe('when circuit is open', () => {
        let context;

        beforeEach(() => {
            context = { ...defaultContext };
            mockOpossum.opened = true;
        });

        it('should add an error to the context', async () => {
            const handler = circuitBreaker({ errorThresholdPercentage: Infinity, resetTimeout: 0 });
            const next = jest.fn();

            const expected = {
                error_message: "Circuit breaker is open for client-name",
                error_name: "ECIRCUITBREAKER"
            };

            await expect(handler(context, next)).rejects.toMatchObject({ error: expected });
            expect(next).not.toBeCalled();
        });
    });

    describe('when circuit is closed', () => {
        let context;

        beforeEach(() => {
            context = { ...defaultContext };
            mockOpossum.opened = false;
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
