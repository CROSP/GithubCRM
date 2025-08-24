import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DomainEvent } from '@core/events/domain-event.base';
import { DomainEventService } from '@core/services/domain-event.service';

/**
 * Generic Domain Event Logger Service
 * Automatically logs ALL domain events without needing to know specific event types
 */
@Injectable()
export class DomainEventLoggerService implements OnModuleInit {
  private readonly contextName = 'DomainEventLogger';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly domainEventService: DomainEventService,
  ) {}

  onModuleInit() {
    this.registerUniversalEventLogger();
  }

  /**
   * Register a universal event logger that captures all domain events generically
   */
  private registerUniversalEventLogger(): void {
    // Get all existing event types and register for each
    const existingEvents = this.domainEventService.getRegisteredEventTypes();

    // Register logger for all existing events
    existingEvents.forEach(eventType => {
      this.domainEventService.registerHandler(eventType, this.logDomainEvent.bind(this));
    });

    this.logger.info('Universal domain event logger registered', {
      context: this.contextName,
      registeredEventTypes: existingEvents,
      tags: ['initialization', 'domain_events'],
    });
  }

  /**
   * Generic domain event logging - works for ANY domain event
   */
  async logDomainEvent(event: DomainEvent): Promise<void> {
    try {
      const eventName = event.getEventName();
      const eventData = this.extractEventData(event);

      // Log to domain_events collection
      this.logger.info('Domain Event', {
        context: this.contextName,
        eventType: 'domain_event',
        eventName,
        eventId: event.eventId,
        occurredOn: event.occurredOn,
        eventVersion: event.eventVersion,
        eventData,
      });

      this.logger.debug('Domain event processed successfully', {
        context: this.contextName,
        eventId: event.eventId,
        eventName,
        tags: ['domain_event', 'processed'],
      });
    } catch (error) {
      this.logger.error('Failed to log domain event', {
        context: this.contextName,
        eventId: event.eventId,
        eventName: event.getEventName(),
        error: error.message,
        stack: error.stack,
        tags: ['domain_event', 'error'],
      });
    }
  }

  /**
   * Generic extraction of event data from any domain event
   */
  private extractEventData(event: DomainEvent): Record<string, any> {
    const eventData: Record<string, unknown> = {};

    // Extract all enumerable properties except base properties
    const baseProperties = ['eventId', 'occurredOn', 'eventVersion'];

    Object.keys(event).forEach(key => {
      if (!baseProperties.includes(key)) {
        const value = (event as unknown)[key];

        // Handle value objects with getValue() method
        if (value && typeof value.getValue === 'function') {
          eventData[key] = value.getValue();
        } else {
          eventData[key] = value;
        }
      }
    });

    return eventData;
  }
}
