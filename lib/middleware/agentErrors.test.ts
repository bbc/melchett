import { agentErrors } from './agentErrors';

const mockContext: MiddlewareContext = {
    client: { name: 'test' },
    request: { url: 'https://www.bbc.co.uk', method: 'get' },
};

describe('JSON validator middleware', () => {
    it('should call next function once', async () => {
        const next = jest.fn();

        await agentErrors({ ...mockContext }, next)

        expect(next).toBeCalledTimes(1);
    });

    describe('when context doesn\'t contains errors', () => {
        it('should return the same context', async () => {
            const next = jest.fn();

            const result = await agentErrors({ ...mockContext }, next)

            expect(result).toEqual(mockContext);
        });
    })

    describe('when context contains errors', () => {
        it('should call next function once', async () => {
            const next = jest.fn();

            await agentErrors({ ...mockContext }, next)

            expect(next).toBeCalledTimes(1);
        });

        it('should reject the response', async () => {
            const next = jest.fn();
            let error

            try {
                await agentErrors({ ...mockContext, error: { code: 'EGENERIC', message: 'foo' } }, next)
            } catch (e) {
                error = e
            }

            expect(error).toEqual({ error: { error_name: 'EGENERIC', error_message: 'foo' } });
        });
    })

});