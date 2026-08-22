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

  it('returns 500 for unknown errors', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    filter.catch(new Error('boom'), mockHost(json, status));
    expect(status).toHaveBeenCalledWith(500);
  });

  it('propagates request id header', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    filter.catch(new Error('boom'), mockHost(json, status, { 'x-request-id': 'rid-789' }));
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ requestId: 'rid-789' }));
  });

  it('maps validation arrays', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    filter.catch(
      new HttpException({ message: ['a', 'b'] }, HttpStatus.BAD_REQUEST),
      mockHost(json, status),
    );
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: ['a', 'b'] }));
  });
});
