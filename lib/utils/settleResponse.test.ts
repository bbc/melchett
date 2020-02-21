import { settleResponse } from './settleResponse';

const mockContext: MiddlewareContext = {
    client: { name: 'test', userAgent: 'melchett/test' },
    request: { url: 'https://www.bbc.co.uk', method: 'get', id: '12345' }
};

describe('Response settler', () => {
    it('should resolve with response if no error and response has data', async () => {
        // Arrange
        const context = {
            ...mockContext,
            response: {
                data: { foo: 'bar' },
                headers: { 'x-test': 'baz' },
                status: 200
            }
        };

        // Assert
        await expect(settleResponse(context)).resolves.toMatchObject({
            request: mockContext.request,
            response: {
                body: {
                    foo: 'bar'
                },
                headers: {
                    'x-test': 'baz'
                },
                melchettCached: false,
                status: 200,
                duration: undefined
            }
        });
    });

    it('undefined response should set error and reject', async () => {
        // Arrange
        const expectedResponse = {
            request: mockContext.request,
            response: {},
            error: {
                name: 'EUNKNOWN',
                message: 'An unknown error occurred'
            }
        };

        // Assert
        await expect(settleResponse({ ...mockContext })).rejects.toMatchObject(expectedResponse);
    });

    it('undefined response should pass through error and reject', async () => {
        // Arrange
        const error = {
            name: 'ETEST',
            message: 'A known test error',
            details: 'Test'
        };

        const context = { ...mockContext, error };

        const expectedRequest = {
            ...mockContext.request,
            method: 'get'
        };

        // Assert
        await expect(settleResponse(context)).rejects.toMatchObject({ request: expectedRequest, response: {}, error: error });
    });
});
