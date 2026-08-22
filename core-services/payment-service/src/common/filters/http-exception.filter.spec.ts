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

    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), mockHost(json, status));

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Not found' }),
    );
  });

  it('maps validation arrays to message arrays', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const exception = new HttpException(
      { message: ['bad', 'input'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost(json, status));

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: ['bad', 'input'] }));
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

    filter.catch(new Error('boom'), mockHost(json, status, { 'x-request-id': 'rid-456' }));

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ requestId: 'rid-456' }));
  });

  it('generates a requestId when header is missing', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new Error('boom'), mockHost(json, status));

    const body = (json.mock.calls as unknown[][])[0][0] as Record<string, unknown>;
    expect(body.requestId).toBeDefined();
    expect(typeof body.requestId).toBe('string');
  });

  it('extracts error field from HttpException object response', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const exception = new HttpException(
      { message: 'Conflict', error: 'Conflict' },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, mockHost(json, status));

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, error: 'Conflict' }),
    );
  });
});
