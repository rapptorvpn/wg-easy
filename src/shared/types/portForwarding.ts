export type PortRange = {
  end: number;
  start: number;
};

export type PortForwardingItem = {
  dstPort: PortRange;
  srcPort: PortRange;
  type: 'tcp' | 'udp';
};

export type PortListFieldItem = {
  dstPort: PortRange;
  srcPort: PortRange;
  type: 'both' | 'tcp' | 'udp';
};

export type PortForwardingDefinition = {
  ipv4: string;
  ports: PortForwardingItem[];
};
