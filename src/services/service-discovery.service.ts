import { v4 as uuidv4 } from 'uuid';
import { CorrelatedMessage, TransportAwareService, transportService, TransportAdapterName, CircuitBreaker } from 'transport-pkg';
import { IAppPkg, AppRunPriority } from 'app-life-cycle-pkg';
import { logger } from 'common-loggers-pkg';

import { ServiceDTO } from '../types/service-discovery.dto';
import {
  ServiceDiscoveryAction,
  SERVICE_DISCOVERY_PORT,
  SERVICE_DISCOVERY_HOST,
  SERVICE_HEARTBEAT_INTERVAL
} from '../common/constants';

class ServiceDiscoveryService extends TransportAwareService implements IAppPkg {
  private registeredServices: Map<string, ServiceDTO> = new Map<string, ServiceDTO>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private sendBreaker: CircuitBreaker<[CorrelatedMessage, Record<string, unknown>], CorrelatedMessage>;

  constructor() {
    super();

    this.sendBreaker = new CircuitBreaker<[CorrelatedMessage, Record<string, unknown>], CorrelatedMessage>(
      (req, options) => transportService.send(req, options),
      {
        timeout: 2000,
        errorThresholdPercentage: 50,
        retryTimeout: 5000,
      }
    );
  }

  async init(): Promise<void> {
    this.useTransport(TransportAdapterName.HTTP, { host: SERVICE_DISCOVERY_HOST, port: SERVICE_DISCOVERY_PORT });

    this.startHeartbeatLoop();
  }

  async shutdown(): Promise<void> {
    this.stopHeartbeatLoop();
  }

  getPriority(): number {
    return AppRunPriority.Highest;
  }

  getName(): string {
    return 'service-discovery';
  }

  getDependencies(): IAppPkg[] {
    return [transportService];
  }

  async getService(name: string): Promise<ServiceDTO> {
    return (await this.sendActionViaTransport(ServiceDiscoveryAction.GetService, { service_name: name }) as ServiceDTO);
  }

  async registerService(service: ServiceDTO): Promise<void> {
    await this.sendActionViaTransport(ServiceDiscoveryAction.RegisterService, service);

    this.registeredServices.set(service.service_name, service);
  }

  async deregisterService(name: string): Promise<void> {
    await this.sendActionViaTransport(ServiceDiscoveryAction.DeregisterService, { service_name: name });

    this.registeredServices.delete(name);
  }

  async serviceHeartbeat(service: ServiceDTO): Promise<void> {
    await this.sendActionViaTransport(ServiceDiscoveryAction.ServiceHeartbeat, service);
  }

  startHeartbeatLoop(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      this.runHeartbeats().catch((err) => {
        logger.error('Service discovery heartbeat loop error:', err);
      });
    }, SERVICE_HEARTBEAT_INTERVAL);

    logger.info(`Service discovery heartbeat loop started (interval ${SERVICE_HEARTBEAT_INTERVAL}ms)`);
  }

  stopHeartbeatLoop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      logger.info('Service discovery heartbeat loop stopped');
    }
  }

  private async runHeartbeats(): Promise<void> {
    for (const service of this.registeredServices.values()) {
      await this.serviceHeartbeat(service);
    }
  }

  private async sendActionViaTransport(action: ServiceDiscoveryAction, data: object): Promise<object> {
    const message: CorrelatedMessage = CorrelatedMessage.create(
      uuidv4(),
      action,
      this.getActiveTransport(),
      data
    );

    const response: CorrelatedMessage = await this.sendBreaker.exec(message, this.getActiveTransportOptions());
    return response.data;
  }
}

export default new ServiceDiscoveryService();
