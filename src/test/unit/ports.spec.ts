import { expect, test, describe } from 'vitest';
import {
  portRangesOverlap,
  toPortForwardingItems,
  toPortListFieldItem,
} from '../../app/utils/ports';

describe('toPortListFieldItem', () => {
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

describe('toPortForwardingItems', () => {
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
});

describe('portRangesOverlap()', () => {
  test('Overlapping port range returns true', () => {
    expect(
      portRangesOverlap({ start: 123, end: 123 }, { start: 123, end: 123 })
    ).toBe(true);
  });
});
