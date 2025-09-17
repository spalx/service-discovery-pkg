export enum ServiceDiscoveryAction {
  GetService = 'servicediscovery.getService',
  RegisterService = 'servicediscovery.registerService',
  DeregisterService = 'servicediscovery.deregisterService',
  ServiceHeartbeat = 'servicediscovery.serviceHeartbeat'
}

export const SERVICE_DISCOVERY_PORT = 3099;
export const SERVICE_DISCOVERY_HOST = 'service-discovery';
export const SERVICE_HEARTBEAT_INTERVAL = 10000; // ms
