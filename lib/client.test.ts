import { HttpClient, request } from './client';
import axios from 'axios';
import uuidv4 from 'uuid/v4';
import compose from 'koa-compose';

import * as caching from './middleware/caching';
import * as circuitBreaker from './middleware/circuitBreaker';
import * as validStatus from './middleware/validStatus';
import * as settleResponse from './utils/settleResponse';

jest.mock('fs');
jest.mock('axios');
jest.mock('uuid/v4');
jest.mock('koa-compose');
jest.mock('./middleware/caching');
jest.mock('./middleware/circuitBreaker');
jest.mock('./middleware/validStatus');
jest.mock('./middleware/validJson');
jest.mock('./utils/settleResponse');

const version = require('./../package.json').version;

const mockAxios = axios as undefined as jest.Mocked<typeof axios>;
const mockUuid = uuidv4 as jest.Mocked<typeof uuidv4>;
const mockCompose = compose as jest.Mocked<typeof compose>;
const mockCaching = caching as jest.Mocked<typeof caching>;
const mockCircuitBreaker = circuitBreaker as jest.Mocked<typeof circuitBreaker>;
const mockValidStatus = validStatus as jest.Mocked<typeof validStatus>;
const mockSettleResponse = settleResponse as jest.Mocked<typeof settleResponse>;

// @ts-ignore
mockAxios.CancelToken.source = jest.fn(() => ({
  token: jest.fn(),
  cancel: jest.fn()
}));

describe('client', () => {
  describe('constructor', () => {
    it('should add cache middleware if option set', async () => {
      // Arrange
      const config = {
        name: 'test',
        cache: {
          store: {
            isReady: () => true,
            get: () => undefined,
            set: () => undefined,
            start: () => undefined
          }
        }
      };

      // Act
      new HttpClient(config);

      // Assert
      expect(mockCaching.caching).toBeCalledTimes(1);
    });

    it('should add circuit breaker middleware to stack top if option set', async () => {
      // Arrange
      const config = {
        name: 'test',
        circuitBreaker: {
          errorThresholdPercentage: 0.5,
          resetTimeout: 30
        }
      };

      // Act
      new HttpClient(config);

      // Assert
      expect(mockCircuitBreaker.circuitBreaker).toBeCalledTimes(1);
    });

    it('should add common middleware', async () => {
      // Arrange
      const config = {
        name: 'test'
      };

      // Act
      new HttpClient(config);

      // Assert
      expect(mockValidStatus.validStatus).toBeCalledTimes(1);
    });

    it('should compose middleware', async () => {
      // Arrange
      const config = {
        name: 'test'
      };

      // Act
      new HttpClient(config);

      // Assert
      expect(mockCompose).toBeCalledTimes(1);
    });

    it('should setup axios with correct options', async () => {
      // Arrange
      const config = {
        name: 'test'
      };

      // Act
      new HttpClient(config);

      // Assert
      expect(mockAxios.create).toBeCalledTimes(1);
    });

    it('should setup axios with an https agent if specified', async () => {
      // Arrange
      const config = {
        agentOptions: {
          cert: 'my-cert',
          key: 'my-private-key',
          ca: 'my-ca-bundle'
        }
      };

      // Act
      new HttpClient(config);

      // Assert
      const expected = expect.objectContaining({
        httpsAgent: expect.objectContaining({
          options: expect.objectContaining({
            ca: 'my-ca-bundle',
            cert: 'my-cert',
            key: 'my-private-key'
          })
        })
      });
      expect(mockAxios.create).toHaveBeenCalledTimes(1);
      expect(mockAxios.create).toHaveBeenCalledWith(expected);
    });
  });

  describe('request', () => {
    beforeEach(() => {
      mockCompose.mockImplementation(() => async (context, finalFunc) => {
        try {
          context = {
            request: { url: 'https://www.bbc.co.uk/' }
          };
          await finalFunc(context);
        } catch (ex) {}
        return Promise.resolve();
      });
      mockUuid.mockImplementation(() => 'test-uuid');
    });

    it('should generate request ID', async () => {
      // Arrange
      const clientConfig: HttpClientConfig = {
        name: 'test'
      };

      const requestConfig: RequestConfig = {
        method: 'get',
        url: 'https://www.bbc.co.uk'
      };

      // Act
      request(new HttpClient(clientConfig), requestConfig);

      // Assert
      expect(mockUuid).toBeCalledTimes(1);
    });

    it('should call request on axios agent', async () => {
      // Arrange
      const clientConfig: HttpClientConfig = {
        name: 'test'
      };

      const requestConfig: RequestConfig = {
        method: 'get',
        url: 'https://www.bbc.co.uk'
      };

      const mockAgentRequest = jest.fn();

      const client = new HttpClient(clientConfig);
      client._agent = { request: mockAgentRequest } as any;

      // Act
      request(client, requestConfig);

      // Assert
      expect(mockAgentRequest).toBeCalledTimes(1);
    });

    it('should call composedMiddleware with expected context', async () => {
      // Arrange
      const clientConfig: HttpClientConfig = {
        name: 'test'
      };

      const requestConfig: RequestConfig = {
        method: 'get',
        url: 'https://www.bbc.co.uk'
      };

      const client = new HttpClient(clientConfig);
      client._composedMiddleware = jest.fn();
      client._composedMiddleware.mockReturnValue(Promise.resolve({}));

      const expectedContext = {
        client: { name: 'test', state: {}, userAgent: `melchett/v${version}` },
        request: {
          headers: {
            'X-Correlation-Id': 'test-uuid'
          },
          id: 'test-uuid',
          method: 'get',
          url: 'https://www.bbc.co.uk',
          cancel: expect.any(Function),
          cancelToken: expect.any(Function)
        }
      };

      // Act
      request(client, requestConfig);

      // Assert
      expect(client._composedMiddleware).toBeCalledWith(expectedContext, expect.any(Function));
    });

    it('settleResponse should handle composedMiddleware promise', async () => {
      // Arrange
      const clientConfig: HttpClientConfig = {
        name: 'test'
      };

      const requestConfig: RequestConfig = {
        method: 'get',
        url: 'https://www.bbc.co.uk'
      };

      const client = new HttpClient(clientConfig);

      client._composedMiddleware = jest.fn();
      client._composedMiddleware
        .mockReturnValueOnce(Promise.resolve({}))
        .mockReturnValueOnce(Promise.reject({}));

      // Act
      try {
        await request(client, requestConfig);
        await request(client, requestConfig);
      } catch (e) {}

      // Assert
      expect(mockSettleResponse.settleResponse).toBeCalledTimes(2);
    });
  });
});
