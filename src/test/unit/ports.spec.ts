import { expect, test, describe } from 'vitest';
import {
  fieldStringToPortRange,
  portFieldItemToFieldString,
  portRangeIsValid,
  portRangesOverlap,
  sanitizePortInput,
  toPortForwardingItems,
  toPortListFieldItem,
} from '../../app/utils/ports';

describe('fieldStringToPortRange()', () => {
  test('It converts single numbers to a port range with same start and end', () => {
    expect(fieldStringToPortRange('100')).toStrictEqual({
      start: 100,
      end: 100,
    });
  });
  test('It returns a ranges separated by slashes', () => {
    expect(fieldStringToPortRange('100-130')).toStrictEqual({
      start: 100,
      end: 130,
    });
  });
  test('It can handle white space in port range', () => {
    expect(fieldStringToPortRange('100  -   130')).toStrictEqual({
      start: 100,
      end: 130,
    });
  });
  test('It returns undefined for empty string', () => {
    expect(fieldStringToPortRange('')).toBe(undefined);
  });
  test('It returns undefined for unrecognised input', () => {
    expect(fieldStringToPortRange('foobar')).toBe(undefined);
    expect(fieldStringToPortRange('foo-bar')).toBe(undefined);
  });
  test('It returns a range with the same start and end when containing a dash but no end value', () => {
    expect(fieldStringToPortRange('120-')).toStrictEqual({
      start: 120,
      end: 120,
    });
  });
  test('It returns a range with the same start and end when containing a dash but no start value', () => {
    expect(fieldStringToPortRange('-150')).toStrictEqual({
      start: 150,
      end: 150,
    });
  });
});

describe('portFieldItemToFieldString', () => {
  test('It returns an empty string when port field is undefined', () => {
    expect(portFieldItemToFieldString(undefined)).toBe('');
  });
  test('It returns a single value for a port range with same start and end', () => {
    expect(portFieldItemToFieldString({ start: 125, end: 125 })).toBe('125');
  });
  test('It returns a range separate by a dash for a port range with a different start and end', () => {
    expect(portFieldItemToFieldString({ start: 145, end: 155 })).toBe(
      '145-155'
    );
  });
});

describe('portRangeIsValid()', () => {
  const portForwarding: PortForwardingDefinition[] = [];
  // const portRange: PortRange | undefined = { start: 100, end: 100 };
  const type: PortListType = 'tcp';
  const unavailablePorts: PortDefinition[] = [];
  const ipv4: string = '1.2.3.4';

  //   validatePortRangesMatch,
  //   validatePortsAreAvailable,
  //   validatePortForwardingIsAvailable,
  //   validateStartPortIsLower,
  //   validatePortRangeWithinLimits

  test('Returns error if start is greater than end', () => {
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1.2.3.4',
            ports: [
              {
                dstPort: { start: 124, end: 123 },
                srcPort: { start: 124, end: 123 },
                type: 'tcp',
              },
            ],
          },
        ],
        { start: 124, end: 123 },
        { start: 124, end: 123 },
        type,
        unavailablePorts,
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: ['Start of port range must be lower than end'],
    });
  });
  test('Returns error if start or end are out of range', () => {
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1.2.3.4',
            ports: [
              {
                dstPort: { start: 124, end: 123 },
                srcPort: { start: 124, end: 123 },
                type: 'tcp',
              },
            ],
          },
        ],
        { start: 124, end: 66000 },
        { start: 124, end: 66000 },
        type,
        unavailablePorts,
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: ['Ports must be between 1 - 65535'],
    });
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1.2.3.4',
            ports: [
              {
                dstPort: { start: 66000, end: 67000 },
                srcPort: { start: 66000, end: 67000 },
                type: 'tcp',
              },
            ],
          },
        ],
        { start: 66000, end: 67000 },
        { start: 66000, end: 67000 },
        type,
        unavailablePorts,
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: ['Ports must be between 1 - 65535'],
    });
  });
  test('Returns error if start or end overlap with unavailable ports', () => {
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1.2.3.4',
            ports: [
              {
                dstPort: { start: 1234, end: 1234 },
                srcPort: { start: 1234, end: 1234 },
                type: 'tcp',
              },
            ],
          },
        ],
        { start: 1234, end: 1234 },
        { start: 1234, end: 1234 },
        type,
        [{ port: 1234, type: 'tcp' }],
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: ['Port 1234 (tcp) is not available'],
    });
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1.2.3.4',
            ports: [
              {
                dstPort: { start: 1230, end: 1240 },
                srcPort: { start: 1230, end: 1240 },
                type: 'tcp',
              },
            ],
          },
        ],
        { start: 1230, end: 1240 },
        { start: 1230, end: 1240 },
        type,
        [
          { port: 1232, type: 'tcp' },
          { port: 1234, type: 'tcp' },
          { port: 1236, type: 'tcp' },
        ],
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: ['Ports 1232 (tcp), 1234 (tcp) & 1236 (tcp) are not available'],
    });
  });
  test('Returns error if port forwarding overlaps with already used rules', () => {
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1,2,3,4',
            ports: [
              {
                srcPort: { start: 1234, end: 1234 },
                dstPort: { start: 1234, end: 1234 },
                type: 'udp',
              },
              {
                srcPort: { start: 1234, end: 1234 },
                dstPort: { start: 1234, end: 1234 },
                type: 'udp',
              },
            ],
          },
        ],
        { start: 1230, end: 1240 },
        { start: 1230, end: 1240 },
        'udp',
        [],
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: [
        'Ports 1234 (udp) & 1234 (udp) are used in other port forwarding rules',
      ],
    });
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1.2.3.4',
            ports: [
              {
                srcPort: { start: 1233, end: 1235 },
                dstPort: { start: 1233, end: 1235 },
                type: 'udp',
              },
              {
                srcPort: { start: 1233, end: 1235 },
                dstPort: { start: 1233, end: 1235 },
                type: 'tcp',
              },
              {
                srcPort: { start: 1230, end: 1240 },
                dstPort: { start: 1230, end: 1240 },
                type: 'tcp',
              },
            ],
          },
        ],
        { start: 1230, end: 1240 },
        { start: 1230, end: 1240 },
        'tcp',
        [],
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: [
        'Ports 1233-1235 (tcp/udp) & 1230-1240 (tcp) are used in other port forwarding rules',
      ],
    });
    expect(
      portRangeIsValid(
        [
          {
            ipv4: '1,2,3,4',
            ports: [
              {
                srcPort: { start: 1233, end: 1235 },
                dstPort: { start: 1236, end: 1236 },
                type: 'udp',
              },
              {
                srcPort: { start: 1234, end: 1234 },
                dstPort: { start: 1234, end: 1234 },
                type: 'udp',
              },
            ],
          },
        ],
        undefined,
        undefined,
        'udp',
        [],
        ipv4
      )
    ).toStrictEqual({
      valid: true,
      errors: [],
    });
  });
  test("Returns error if source and destination port ranges don't match", () => {
    expect(
      portRangeIsValid(
        portForwarding,
        { start: 1000, end: 1010 },
        { start: 2000, end: 2005 },
        type,
        [],
        ipv4
      )
    ).toStrictEqual({
      valid: false,
      errors: [
        'The number of ports in the external and internal ranges must match',
      ],
    });
  });
  test('Returns no error if start or end overlap with unavailable ports of different types', () => {
    expect(
      portRangeIsValid(
        portForwarding,
        { start: 1234, end: 1234 },
        { start: 1234, end: 1234 },
        'udp',
        [{ port: 1234, type: 'tcp' }],
        ipv4
      )
    ).toStrictEqual({ valid: true, errors: [] });
    expect(
      portRangeIsValid(
        portForwarding,
        { start: 1230, end: 1240 },
        { start: 1230, end: 1240 },
        'udp',
        [{ port: 1234, type: 'tcp' }],
        ipv4
      )
    ).toStrictEqual({ valid: true, errors: [] });
    expect(
      portRangeIsValid(
        portForwarding,
        undefined,
        undefined,
        'udp',
        [{ port: 1234, type: 'tcp' }],
        ipv4
      )
    ).toStrictEqual({ valid: true, errors: [] });
  });
});

describe('sanitizePortInput()', () => {
  test('It allows entry of numbers', () => {
    expect(sanitizePortInput('123')).toBe('123');
  });
  test('It allows entry of dashes', () => {
    expect(sanitizePortInput('123-')).toBe('123-');
  });
  test('It ignores entry of characters that are not number or dashes', () => {
    expect(sanitizePortInput('123x')).toBe('123');
  });
});

describe('toPortListFieldItem()', () => {
  test("It combines 2 port forwarding defs using tcp and udp into a single def with type 'both'", () => {
    expect(
      toPortListFieldItem([
        {
          dstPort: { start: 123, end: 1234 },
          srcPort: { start: 123, end: 1234 },
          type: 'tcp',
        },
        {
          dstPort: { start: 123, end: 1234 },
          srcPort: { start: 123, end: 1234 },
          type: 'udp',
        },
      ])
    ).toStrictEqual([
      {
        dstPort: { start: 123, end: 1234 },
        srcPort: { start: 123, end: 1234 },
        type: 'both',
      },
    ]);
  });
  test('It does not combine ports with differing ports', () => {
    expect(
      toPortListFieldItem([
        {
          dstPort: { start: 123, end: 1235 },
          srcPort: { start: 123, end: 1235 },
          type: 'tcp',
        },
        {
          dstPort: { start: 123, end: 1234 },
          srcPort: { start: 123, end: 1234 },
          type: 'udp',
        },
      ])
    ).toStrictEqual([
      {
        dstPort: { start: 123, end: 1235 },
        srcPort: { start: 123, end: 1235 },
        type: 'tcp',
      },
      {
        dstPort: { start: 123, end: 1234 },
        srcPort: { start: 123, end: 1234 },
        type: 'udp',
      },
    ]);
  });
});

describe('toPortForwardingItems()', () => {
  test("It expands port forwarding with type 'both' into 2 separate ports with types tcp and udp", () => {
    expect(
      toPortForwardingItems([
        {
          dstPort: { start: 123, end: 1234 },
          srcPort: { start: 123, end: 1234 },
          type: 'both',
        },
      ])
    ).toStrictEqual([
      {
        dstPort: { start: 123, end: 1234 },
        srcPort: { start: 123, end: 1234 },
        type: 'tcp',
      },
      {
        dstPort: { start: 123, end: 1234 },
        srcPort: { start: 123, end: 1234 },
        type: 'udp',
      },
    ]);
  });
  test("It outputs port forwarding with type not 'both'", () => {
    expect(
      toPortForwardingItems([
        {
          dstPort: { start: 123, end: 1234 },
          srcPort: { start: 123, end: 1234 },
          type: 'tcp',
        },
      ])
    ).toStrictEqual([
      {
        dstPort: { start: 123, end: 1234 },
        srcPort: { start: 123, end: 1234 },
        type: 'tcp',
      },
    ]);
  });
  test('It ignores items without a srcPort and a dstPort', () => {
    expect(
      toPortForwardingItems([
        { srcPort: undefined, dstPort: undefined, type: 'tcp' },
      ])
    ).toStrictEqual([]);
  });
  test('It populates dstPort when items have only a srcPort', () => {
    expect(
      toPortForwardingItems([
        {
          srcPort: { start: 4321, end: 4321 },
          dstPort: undefined,
          type: 'tcp',
        },
      ])
    ).toStrictEqual([
      {
        srcPort: { start: 4321, end: 4321 },
        dstPort: { start: 4321, end: 4321 },
        type: 'tcp',
      },
    ]);
  });
  test('It populates srcPort when items have only a dstPort', () => {
    expect(
      toPortForwardingItems([
        {
          srcPort: undefined,
          dstPort: { start: 4321, end: 4321 },
          type: 'tcp',
        },
      ])
    ).toStrictEqual([
      {
        srcPort: { start: 4321, end: 4321 },
        dstPort: { start: 4321, end: 4321 },
        type: 'tcp',
      },
    ]);
  });
});

describe('portRangesOverlap()', () => {
  test('Overlapping port range returns true', () => {
    expect(
      portRangesOverlap({ start: 123, end: 123 }, { start: 123, end: 123 })
    ).toBe(true);
  });
});
