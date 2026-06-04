import type { PortListFieldItem } from '~/stores/portForwarding';

export const fieldStringToPortRange = (
  value: string
): PortRange | undefined => {
  const trimmed = value.trim();

  if (trimmed === '') {
    return undefined;
  }

  const dashIndex = trimmed.indexOf('-');

  if (dashIndex === -1) {
    const port = Number.parseInt(trimmed, 10);

    if (Number.isNaN(port)) {
      return undefined;
    }

    return { end: port, start: port };
  }

  const startStr = trimmed.slice(0, dashIndex);
  const endStr = trimmed.slice(dashIndex + 1);
  const start = Number.parseInt(startStr, 10);
  const end = Number.parseInt(endStr, 10);

  if (isNaN(start) && isNaN(end)) {
    return undefined;
  }

  if (isNaN(start)) {
    return {
      end,
      start: end,
    };
  }

  if (isNaN(end)) {
    return {
      end: start,
      start,
    };
  }

  return {
    end,
    start,
  };
};

const indexOfPortWithDifferentType = (
  ports: PortListFieldItem[],
  searchPort: PortListFieldItem
): number => {
  return ports.findIndex((port) => {
    return (
      port.srcPort &&
      port.dstPort &&
      searchPort.srcPort &&
      searchPort.dstPort &&
      port.dstPort.start === searchPort.dstPort.start &&
      port.dstPort.end === searchPort.dstPort.end &&
      port.srcPort.start === searchPort.srcPort.start &&
      port.srcPort.end === searchPort.srcPort.end &&
      port.type !== searchPort.type
    );
  });
};

export const portFieldItemToFieldString = (
  range: PortRange | undefined
): string => {
  if (!range) {
    return '';
  }
  if (range.start === range.end) {
    return String(range.start);
  } else {
    return `${range.start}-${range.end}`;
  }
};

const portInRange = (port: number): boolean => {
  return port >= 1 && port <= 65535;
};

export const portRangeIsValid = (
  range: PortRange | undefined,
  type: PortListType,
  unavailablePorts: PortDefinition[]
): boolean => {
  if (!range || range.start > range.end) {
    return false;
  }

  return (
    portInRange(range.start) &&
    portInRange(range.end) &&
    !unavailablePorts?.some((unavailablePort) => {
      return (
        portRangesOverlap(range, {
          start: unavailablePort.port,
          end: unavailablePort.port,
        }) &&
        (type === 'both' || type === unavailablePort.type)
      );
    })
  );
};

export const portRangesOverlap = (
  portRangeA: PortRange,
  portRangeB: PortRange
): boolean => {
  return (
    portRangeA.start <= portRangeB.end && portRangeB.start <= portRangeA.end
  );
};

export const sanitizePortInput = (raw: string): string => {
  const cleaned = raw.replace(/[^\d-]/g, '');
  const dashIndex = cleaned.indexOf('-');
  if (dashIndex === -1) {
    return cleaned;
  }
  return (
    cleaned.slice(0, dashIndex + 1) +
    cleaned.slice(dashIndex + 1).replace(/-/g, '')
  );
};

export function toPortForwardingItems(
  ports: PortListFieldItem[]
): PortForwardingItem[] {
  const result: PortForwardingItem[] = [];

  for (const port of ports) {
    let { dstPort, srcPort } = port;
    if (!srcPort) {
      srcPort = dstPort;
    }
    if (!dstPort) {
      dstPort = srcPort;
    }

    if (dstPort && srcPort) {
      if (port.type === 'both') {
        result.push({ dstPort, srcPort, type: 'tcp' });
        result.push({ dstPort, srcPort, type: 'udp' });
      } else {
        result.push({ dstPort, srcPort, type: port.type });
      }
    }
  }

  return result;
}

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
