import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(response: Partial<Response>, request: Partial<Request>): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let res: { status: jest.Mock; json: jest.Mock };
  let req: { method: string; url: string; headers: Record<string, string> };

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    req = { method: 'GET', url: '/auth/login', headers: {} };
  });

  it('returns a standardized body for a known HttpException', () => {
    const host = createHost(res, req);
    filter.catch(new UnauthorizedException('Credenciales inválidas'), host);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Credenciales inválidas',
        error: 'Unauthorized',
        requestId: expect.any(String),
      }),
    );
  });

  it('maps validation error arrays into message arrays', () => {
    const host = createHost(res, req);
    filter.catch(
      new HttpException({ message: ['email must be an email'], error: 'Bad Request' }, 400),
      host,
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request',
      }),
    );
  });

  it('hides internal details for unexpected errors (500 generic)', () => {
    const host = createHost(res, req);
    filter.catch(new Error('fatal: SQL connection refused with secret'), host);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('Internal Server Error');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('propagates the x-request-id header when present', () => {
    req.headers = { 'x-request-id': 'req-123' };
    const host = createHost(res, req);
    filter.catch(new HttpException('Nope', HttpStatus.NOT_FOUND), host);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ requestId: 'req-123' }));
  });
});
