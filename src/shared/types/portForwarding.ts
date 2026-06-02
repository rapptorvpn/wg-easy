export type PortRange = {
  end: number;
  start: number;
};

export type PortForwardingItem = {
  dstPort: PortRange;
  srcPort: PortRange;
  type: PortType;
};

export type PortListFieldItem = {
  dstPort: PortRange;
  srcPort: PortRange;
  type: PortListType;
};

export type PortForwardingDefinition = {
  ipv4: string;
  ports: PortForwardingItem[];
};

export type PortDefinition = {
  port: number;
  type: PortType;
};

export type PortType = 'tcp' | 'udp';
export type PortListType = PortType | 'both';
