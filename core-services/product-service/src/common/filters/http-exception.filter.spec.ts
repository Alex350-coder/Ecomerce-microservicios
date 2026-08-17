import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const mockHost = (json: jest.Mock, status: jest.Mock, headers: Record<string, unknown> = {}) =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ json, status }),
        getRequest: () => ({ headers, method: 'GET', url: '/test' }),
      }),
    }) as unknown as ArgumentsHost;

  it('returns the exception status and message', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new HttpException('No encontrado', HttpStatus.NOT_FOUND), mockHost(json, status));

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'No encontrado' }),
    );
  });

  it('maps validation arrays to message arrays', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const exception = new HttpException(
      { message: ['a', 'b'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost(json, status));

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: ['a', 'b'] }));
  });

  it('returns 500 with a generic message for unknown errors', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new Error('boom'), mockHost(json, status));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });

  it('propagates the request id header', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new Error('boom'), mockHost(json, status, { 'x-request-id': 'rid-123' }));

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ requestId: 'rid-123' }));
  });

  it('generates a request id when the header is missing', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new HttpException('nope', HttpStatus.NOT_FOUND), mockHost(json, status));

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ requestId: expect.any(String) }));
  });
});
