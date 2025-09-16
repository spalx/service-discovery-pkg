import { v4 as uuidv4 } from 'uuid';
import { CorrelatedMessage, TransportAwareService, transportService, TransportAdapterName } from 'transport-pkg';
import { IAppPkg, AppRunPriority } from 'app-life-cycle-pkg';

import { ServiceDTO } from '../types/service-discovery.dto';
import { ServiceDiscoveryAction, SERVICE_DISCOVERY_PORT, SERVICE_DISCOVERY_HOST } from '../common/constants';

class ServiceDiscoveryService extends TransportAwareService implements IAppPkg {
  async init(): Promise<void> {
    this.useTransport(TransportAdapterName.HTTP, { host: SERVICE_DISCOVERY_HOST, port: SERVICE_DISCOVERY_PORT });
  }

  getPriority(): number {
    return AppRunPriority.Highest;
  }

  async getService(name: string): Promise<ServiceDTO> {
    return (await this.sendActionViaTransport(ServiceDiscoveryAction.GetService, { service_name: name }) as ServiceDTO);
  }

  async registerService(service: ServiceDTO): Promise<void> {
    await this.sendActionViaTransport(ServiceDiscoveryAction.RegisterService, service);
  }

  async deregisterService(name: string): Promise<void> {
    await this.sendActionViaTransport(ServiceDiscoveryAction.DeregisterService, { service_name: name });
  }

  private async sendActionViaTransport(action: ServiceDiscoveryAction, data: object): Promise<object> {
    const message: CorrelatedMessage = CorrelatedMessage.create(
      uuidv4(),
      action,
      this.getActiveTransport(),
      data
    );

    const response: CorrelatedMessage = await transportService.send(message, this.getActiveTransportOptions());
    return response.data;
  }
}

export default new ServiceDiscoveryService();
