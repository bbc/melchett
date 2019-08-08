import { settleResponse } from './settleResponse';

const mockContext: MiddlewareContext = {
    client: { name: 'test' },
    request: { url: 'https://www.bbc.co.uk', method: 'get', id: '12345' },
};

describe('Response settler', () => {
    describe('with logger provided', () => {
        it('should call logWriter', async () => {
            // Arrange
            const mockLogWriter = jest.fn();
            const mockLogger = undefined;
            const appliedSettleResponse = settleResponse(mockLogger);

            // Act
            await appliedSettleResponse(mockContext);

            // Assert
            expect(mockLogWriter).toBeCalled();
        });
    });

    describe('no logger provided', () => {
        let appliedSettleResponse;

        beforeEach(() => {
            appliedSettleResponse = settleResponse()
        });

        it('should not call logWriter', async () => {
            // Arrange
            const mockLogWriter = jest.fn();

            // Act
            await appliedSettleResponse(mockContext);

            // Assert
            expect(mockLogWriter).not.toBeCalled();
        });

        it('should resolve with response if no error and response has data', async () => {
            // Arrange
            const context = {
                ...mockContext,
                response: {
                    data: { foo: 'bar' }
                }
            };

            // Assert
            await expect(appliedSettleResponse(context)).resolves.toMatchObject({
                foo: 'bar'
            });
        });

        it('undefined response should set error and reject', async () => {
            // Arrange
            const expectedResponse = {
                error_name: `EUNKNOWN`,
                error_message: 'An unknown error occurred'
            };

            // Assert
            await expect(appliedSettleResponse(mockContext)).rejects.toMatchObject(expectedResponse);
        });

        it('undefined response should pass through error and reject', async () => {
            // Arrange
            const error = {
                error_name: `ETEST`,
                error_message: 'A known test error',
                error_details: 'Test'
            };

            const context = { ...mockContext, error };

            // Assert
            await expect(appliedSettleResponse(context)).rejects.toMatchObject(error);
        });
    });
});