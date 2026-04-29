export enum EppObjectType {
  DOMAIN = 'domain',
  CONTACT = 'contact',
  HOST = 'host',
}

export enum EppCommandType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CHECK = 'check',
  INFO = 'info',
  CREATE = 'create',
  DELETE = 'delete',
  UPDATE = 'update',
  RENEW = 'renew',
  TRANSFER = 'transfer',
}

export interface EppResponse {
  code: string;
  msg: string;
  data?: any;
  xml: string;
}

export interface EppRequest {
  id: string;
  timestamp: string;
  command: EppCommandType;
  objectType: EppObjectType;
  input: string;
  xml: string;
}

export enum RegistryConnector {
  NIXI = 'NIXI (.in)',
  VERISIGN = 'Verisign (.com/.net)',
  PIR = 'PIR (.org)',
  AFILIAS = 'Afilias (.info)',
  NOMINET = 'Nominet (.uk)',
  DENIC = 'DENIC (.de)',
  TUCOWS = 'Tucows',
  AUTODNS = 'AutoDNS (InterNetX)',
  CENTRALNIC = 'CentralNic',
  DIRECTI = 'Directi (LogicBoxes)',
  GO_DADDY = 'GoDaddy',
}

export interface RegistryState {
  domains: Map<string, DomainObject>;
  contacts: Map<string, ContactObject>;
  hosts: Map<string, HostObject>;
  activeConnector: RegistryConnector;
}

export interface DomainObject {
  name: string;
  status: string[];
  registrant: string;
  contacts: { type: string; id: string }[];
  ns: string[];
  crDate: string;
  exDate: string;
  secDNS?: {
    maxSigLife?: number;
    dsData?: {
      keyTag: number;
      alg: number;
      digestType: number;
      digest: string;
    }[];
  };
}

export interface ContactObject {
  id: string;
  name: string;
  org?: string;
  email: string;
  voice: string;
  status: string[];
}

export interface HostObject {
  name: string;
  addr: string[];
  status: string[];
}
