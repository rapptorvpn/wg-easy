import type {
  PortForwardingItem,
  PortForwardingDefinition,
  PortListFieldItem,
} from '~/stores/portForwarding';

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

type Validator = (data: ValidationArg) => ValidationResult;

export const portRangeIsValid = (
  portForwarding: PortForwardingDefinition[],
  portRange: PortRange | undefined,
  otherPortRange: PortRange | undefined,
  type: PortListType,
  unavailablePorts: PortDefinition[],
  ipv4: string
): { valid: boolean; errors: string[] } => {
  const [valid, errors] = validators.reduce(
    ([valid, errors], validator) => {
      const result = validator({
        portForwarding,
        portRange,
        otherPortRange,
        type,
        unavailablePorts,
        ipv4,
      });

      return [valid && result.valid, [...errors, ...result.errors]];
    },
    [true, []] as [boolean, string[]]
  );

  return { valid, errors };
};

export interface ValidationResult {
  errors: string[];
  valid: boolean;
}

interface ValidationArg {
  portForwarding: PortForwardingDefinition[];
  portRange: PortRange | undefined;
  otherPortRange: PortRange | undefined;
  type: PortListType;
  unavailablePorts: PortDefinition[];
  ipv4: string;
}

const validatePortRangesMatch: Validator = (data) => {
  const valid: boolean =
    !data.portRange ||
    (!!data.otherPortRange &&
      data.portRange.end - data.portRange.start ===
        data.otherPortRange.end - data.otherPortRange.start);
  const errors = valid
    ? []
    : ['The number of ports in the external and internal ranges must match'];

  return { errors, valid };
};

const getPortRangeStr = (port: PortRange | undefined, type: PortListType) => {
  const numericRange =
    port?.end !== port?.start
      ? `${port?.start}-${port?.end}`
      : port?.start.toString();
  return `${numericRange} (${type === 'both' ? 'tcp/udp' : type})`;
};

const formatUnavailablePortsStr = (
  unavailablePorts: { port: PortRange | undefined; type: PortListType }[]
): string => {
  const allPortsButLast: string[] = unavailablePorts.reduce<string[]>(
    (acc, unavailablePort, i) => {
      if (i !== unavailablePorts.length - 1 && unavailablePort.port) {
        acc.push(getPortRangeStr(unavailablePort.port, unavailablePort.type));
      }
      return acc;
    },
    []
  );
  const lastPort = unavailablePorts[unavailablePorts.length - 1];
  const allPortsButLastStr = allPortsButLast.join(', ');
  return lastPort
    ? `${allPortsButLastStr ? allPortsButLastStr + ' ' : ''}${allPortsButLast.length >= 1 ? '& ' : ''}${getPortRangeStr(lastPort.port, lastPort.type)}`
    : '';
};

const validatePortsAreAvailable: Validator = (data) => {
  const conflictingUnavailablePorts = data.unavailablePorts.filter(
    (unavailablePort) => {
      return (
        data.portRange &&
        portRangesOverlap(data.portRange, {
          start: unavailablePort.port,
          end: unavailablePort.port,
        }) &&
        (data.type === 'both' || data.type === unavailablePort.type)
      );
    }
  );
  const valid = conflictingUnavailablePorts.length === 0;
  const unavailablePortsString = formatUnavailablePortsStr(
    conflictingUnavailablePorts.map((port) => ({
      port: { start: port.port, end: port.port },
      type: port.type,
    }))
  );
  const errors = valid
    ? []
    : [
        `Port${conflictingUnavailablePorts.length === 1 ? '' : 's'} ${unavailablePortsString} ${conflictingUnavailablePorts.length === 1 ? 'is' : 'are'} not available`,
      ];

  return { errors, valid };
};

const validatePortForwardingIsAvailable: Validator = (data) => {
  const conflictingPortRanges = data.portForwarding.reduce<PortListFieldItem[]>(
    (acc, portForwardingDef) => {
      toPortListFieldItem(portForwardingDef.ports).forEach((portRange) => {
        if (
          data.portRange &&
          portRange.srcPort &&
          portRangesOverlap(portRange.srcPort, data.portRange) &&
          (portRange.type === data.type ||
            data.type === 'both' ||
            portRange.type === 'both')
        ) {
          acc.push(portRange);
        }
      });
      return acc;
    },
    []
  );

  const valid = conflictingPortRanges.length < 2;

  const unavailablePortsString = formatUnavailablePortsStr(
    conflictingPortRanges.map((port) => ({
      port: port.srcPort,
      type: port.type,
    }))
  );

  const errors = valid
    ? []
    : [
        `Port${
          conflictingPortRanges.length === 1 ? '' : 's'
        } ${unavailablePortsString} ${
          conflictingPortRanges.length === 1 ? 'is' : 'are'
        } used in other port forwarding rules`,
      ];

  return { errors, valid };
};

const validateStartPortIsLower: Validator = (data) => {
  const valid =
    data.portRange === undefined || data.portRange.start <= data.portRange.end;
  const errors = valid ? [] : ['Start of port range must be lower than end'];

  return { errors, valid };
};

const validatePortRangeWithinLimits: Validator = (data) => {
  const valid =
    !data.portRange ||
    (data.portRange.start >= 1 &&
      data.portRange.end <= 65535 &&
      !!data.otherPortRange &&
      data.otherPortRange.start >= 1 &&
      data.otherPortRange.end <= 65535);
  const errors = valid ? [] : ['Ports must be between 1 - 65535'];

  return { errors, valid };
};

const validators: Validator[] = [
  validatePortRangesMatch,
  validatePortsAreAvailable,
  validatePortForwardingIsAvailable,
  validateStartPortIsLower,
  validatePortRangeWithinLimits,
];

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
