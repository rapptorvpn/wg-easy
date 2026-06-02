import type { PortListFieldItem } from '~/stores/portForwarding';

export function toPortForwardingItems(
  ports: PortListFieldItem[]
): PortForwardingItem[] {
  const result: PortForwardingItem[] = [];

  for (const port of ports) {
    const { dstPort, srcPort, type } = port;
    if (type === 'both') {
      result.push({ dstPort, srcPort, type: 'tcp' });
      result.push({ dstPort, srcPort, type: 'udp' });
    } else {
      result.push({ dstPort, srcPort, type });
    }
  }

  return result;
}

const indexOfPortWithDifferentType = (
  ports: PortListFieldItem[],
  searchPort: PortListFieldItem
): number => {
  return ports.findIndex((port) => {
    return (
      port.dstPort.start === searchPort.dstPort.start &&
      port.dstPort.end === searchPort.dstPort.end &&
      port.srcPort.start === searchPort.srcPort.start &&
      port.srcPort.end === searchPort.srcPort.end &&
      port.type !== searchPort.type
    );
  });
};

export const portRangesOverlap = (
  portRangeA: PortRange,
  portRangeB: PortRange
): boolean => {
  return (
    portRangeA.start <= portRangeB.end && portRangeB.start <= portRangeA.end
  );
};

export function toPortListFieldItem(
  ports: PortForwardingItem[]
): PortListFieldItem[] {
  return ports.reduce<PortListFieldItem[]>((acc, port) => {
    const index = indexOfPortWithDifferentType(acc, port);

    if (acc[index]) {
      acc[index].type = 'both';
    } else {
      acc.push(port);
    }

    return acc;
  }, []);
}
