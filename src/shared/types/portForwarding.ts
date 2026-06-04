export type PortDefinition = {
  port: number;
  type: PortType;
};

export type PortForwardingDefinition = {
  ipv4: string;
  ports: PortForwardingItem[];
};

export type PortForwardingItem = {
  dstPort: PortRange;
  srcPort: PortRange;
  type: PortType;
};

export type PortListFieldItem = {
  dstPort: PortRange | undefined;
  srcPort: PortRange | undefined;
  type: PortListType;
};

export type PortListType = PortType | 'both';

export type PortRange = {
  end: number;
  start: number;
};

export type PortType = 'tcp' | 'udp';
