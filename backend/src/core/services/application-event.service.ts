import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DomainEventService } from './domain-event.service';
import {
  UserActivatedEvent,
  UserRegisteredEvent,
  UserRoleAssignedEvent,
  UserTwoFactorEnabledEvent,
} from '@core/events/user.events';
import { User } from '@core/entities/user.entity';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

/**
 * Application Event Service that registers domain event handlers
 * This demonstrates how to use the DomainEventService in practice
 */
@Injectable()
export class ApplicationEventService implements OnModuleInit {
  constructor(
    private readonly domainEventService: DomainEventService,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {}

  onModuleInit() {
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    this.domainEventService.registerHandler(
      'UserRegisteredEvent',
      async (event: UserRegisteredEvent) => {
        this.logger.log({
          message: 'User registered',
          userId: event.userId.getValue(),
          email: event.email,
          eventId: event.eventId,
        });
      },
    );

    this.domainEventService.registerHandler(
      'UserActivatedEvent',
      async (event: UserActivatedEvent) => {
        this.logger.log({
          message: 'User activated',
          userId: event.userId.getValue(),
          eventId: event.eventId,
        });

      },
    );

    // Register handler for role assignment
    this.domainEventService.registerHandler(
      'UserRoleAssignedEvent',
      async (event: UserRoleAssignedEvent) => {
        this.logger.log({
          message: 'Role assigned to user',
          userId: event.userId.getValue(),
          roleId: event.roleId.getValue(),
          roleName: event.roleName,
          eventId: event.eventId,
        });

      },
    );

    this.domainEventService.registerHandler(
      'UserTwoFactorEnabledEvent',
      async (event: UserTwoFactorEnabledEvent) => {
        this.logger.log({
          message: 'Two-factor authentication enabled',
          userId: event.userId.getValue(),
          eventId: event.eventId,
        });

      },
    );
  }

  /**
   * Dispatch events from a user entity (example usage)
   */
  async dispatchUserEvents(user: User): Promise<void> {
    await this.domainEventService.dispatchEventsFromAggregate(user);
  }
}
