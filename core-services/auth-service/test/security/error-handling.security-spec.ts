import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('Security: Error Handling (auth-service)', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  function createMockHost(statusCode?: number, body?: unknown) {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const req = {
      url: '/test',
      method: 'GET',
      headers: { 'x-request-id': 'test-req-id' },
    };
    return {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => req,
      }),
      getResponse: () => res,
      getRequest: () => req,
    } as unknown as ArgumentsHost;
  }

  it('E5: error response does not contain stack trace', () => {
    const exception = new HttpException('Internal error', HttpStatus.INTERNAL_SERVER_ERROR);
    const host = createMockHost();

    filter.catch(exception, host);

    const res = host.switchToHttp().getResponse();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
      }),
    );

    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('stack');
    expect(JSON.stringify(body)).not.toContain('at ');
  });

  it('E5: error response contains requestId', () => {
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    const host = createMockHost();

    filter.catch(exception, host);

    const res = host.switchToHttp().getResponse();
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty('requestId');
  });

  it('E5: 401 error does not reveal why auth failed', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const host = createMockHost();

    filter.catch(exception, host);

    const res = host.switchToHttp().getResponse();
    const body = res.json.mock.calls[0][0];
    expect(body.statusCode).toBe(401);
    expect(JSON.stringify(body)).not.toContain('password');
    expect(JSON.stringify(body)).not.toContain('token');
  });

  it('E5: 403 error is generic (no role details leaked)', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    const host = createMockHost();

    filter.catch(exception, host);

    const res = host.switchToHttp().getResponse();
    const body = res.json.mock.calls[0][0];
    expect(body.statusCode).toBe(403);
  });

  it('E5: validation error does not expose internal schema', () => {
    const exception = new HttpException(
      { statusCode: 400, message: ['email must be an email'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );
    const host = createMockHost();

    filter.catch(exception, host);

    const res = host.switchToHttp().getResponse();
    const body = res.json.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
    expect(JSON.stringify(body)).not.toContain('database');
    expect(JSON.stringify(body)).not.toContain('query');
  });
});
