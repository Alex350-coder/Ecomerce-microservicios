import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from '../../common/request-context.service';
import { fetchWithTimeout } from '../../common/fetch-with-timeout';

export interface NewUserPayload {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

@Injectable()
export class UserSyncService {
  private readonly logger = new Logger(UserSyncService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly requestContext: RequestContextService,
  ) {}

  async notifyUserCreated(user: NewUserPayload): Promise<void> {
    const url = this.configService.get<string>('USER_SERVICE_URL');
    if (!url) {
      this.logger.warn('USER_SERVICE_URL no configurado, se omite la sincronización del perfil');
      return;
    }

    try {
      const requestId = this.requestContext.getRequestId();
      const response = await fetchWithTimeout(`${url}/internal/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        this.logger.warn(`user-service respondió ${response.status} al crear perfil`);
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo sincronizar el perfil en user-service: ${(error as Error).message}`,
      );
    }
  }
}
