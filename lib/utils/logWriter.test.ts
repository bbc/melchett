import { logWriter } from './logWriter';

const mockLogger = {
    debug: () => { },
    warn: () => { },
    error: () => { },
    log: () => { },
    info: () => { }
};

const mockContext: MiddlewareContext = {
    client: { name: 'test' },
    request: { url: 'https://www.bbc.co.uk', method: 'get', id: '12345' },
};

const requestLog = {
    url: 'https://www.bbc.co.uk',
    client: 'test',
    type: 'upstream',
    request_id: '12345'
};

describe('Log writer', () => {
    it('should log at error level for context with error', async () => {
        // Arrange
        const mockErrorFunc = jest.fn();
        const logger = { ...mockLogger, error: mockErrorFunc };
        const error = {
            error_name: 'ETEST',
            error_message: 'Error level log'
        };
        const context = {
            ...mockContext,
            error
        };

        // Act
        logWriter(logger, context);

        // Assert
        expect(mockErrorFunc).toBeCalledWith(expect.objectContaining({
            ...requestLog, ...error
        }));
    });

    it('should log at info level for context without error', async () => {
        // Arrange
        const mockInfoFunc = jest.fn();
        const logger = { ...mockLogger, info: mockInfoFunc };

        const context = {
            ...mockContext,
            response: {
                status: 200,
                headers: {
                    'content-length': '1000'
                }
            }
        };

        const responseLog = {
            status_code: 200,
            content_length: '1000',
            melchett_cache: 'MISS'
        };

        // Act
        logWriter(logger, context);

        // Assert
        expect(mockInfoFunc).toBeCalledWith(expect.objectContaining({
            ...requestLog, ...responseLog
        }));
    });

    it('should log cache hit if present', async () => {
        // Arrange
        const mockInfoFunc = jest.fn();
        const logger = { ...mockLogger, info: mockInfoFunc };

        const context = {
            ...mockContext,
            response: {
                status: 200,
                headers: {
                    'content-length': '1000',
                    'x-melchett-cache': 'HIT'
                }
            }
        };

        const responseLog = {
            status_code: 200,
            content_length: '1000',
            melchett_cache: 'HIT'
        };

        // Act
        logWriter(logger, context);

        // Assert
        expect(mockInfoFunc).toBeCalledWith(expect.objectContaining({
            ...requestLog, ...responseLog
        }));
    });

    it('should log upstream duration if present', async () => {
        // Arrange
        const mockInfoFunc = jest.fn();
        const logger = { ...mockLogger, info: mockInfoFunc };

        const context = {
            ...mockContext,
            response: {
                status: 200,
                headers: {
                    'content-length': '1000'
                }
            },
            time: {
                start: 10,
                end: 30,
                elapsed: 20
            }
        };

        const responseLog = {
            status_code: 200,
            content_length: '1000',
            melchett_cache: 'MISS',
            upstream_duration: 20
        };

        // Act
        logWriter(logger, context);

        // Assert
        expect(mockInfoFunc).toBeCalledWith(expect.objectContaining({
            ...requestLog, ...responseLog
        }));
    });
});
