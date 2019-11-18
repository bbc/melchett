import { settleResponse } from './settleResponse';
import * as logWriter from './logWriter';

jest.mock('./logWriter');

const mockContext: MiddlewareContext = {
    client: { name: 'test' },
    request: { url: 'https://www.bbc.co.uk', method: 'get', id: '12345' },
};

describe('Response settler', () => {
    describe('with logger provided', () => {
        let mockLogWriter;
        
        beforeAll(() => {
            mockLogWriter = logWriter as jest.Mocked<typeof logWriter>;
        });

        it('should call logWriter', async () => {
            // Arrange
            const mockLogger = () => undefined;
            const appliedSettleResponse = settleResponse(mockLogger as unknown as Logger);

            // Act
            try {
                await appliedSettleResponse({ ...mockContext });
            } catch (ex) {}

            // Assert
            expect(mockLogWriter.logWriter).toBeCalledTimes(1);
        });

        afterAll(() => {
            mockLogWriter.mockClear();
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
            try {
                await appliedSettleResponse({ ...mockContext });
            } catch (ex) {}

            // Assert
            expect(mockLogWriter).not.toBeCalled();
        });

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
            await expect(appliedSettleResponse(context)).resolves.toMatchObject({
                body: { foo: 'bar' },
                headers: { 'x-test': 'baz' },
                status: 200
            });
        });

        it('undefined response should set error and reject', async () => {
            // Arrange
            const expectedResponse = {
                error_name: `EUNKNOWN`,
                error_message: 'An unknown error occurred'
            };

            // Assert
            await expect(appliedSettleResponse({ ...mockContext })).rejects.toMatchObject(expectedResponse);
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
