<template>
  <div class="flex flex-col gap-2">
    <div v-for="(field, i) in fields" :key="i">
      <div class="flex w-full items-end gap-2">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <span
            v-if="i == 0"
            class="text-xs text-gray-500 dark:text-neutral-400"
          >
            {{ $t('client.portExternal') }}
          </span>
          <input
            :value="getPortDisplay(i, 'srcPort')"
            type="text"
            inputmode="numeric"
            :class="[
              ...inputClasses,
              ...(portRangeIsValid(field.srcPort) ? [] : inputErrorClasses),
            ]"
            :placeholder="$t('general.port')"
            @input="onPortInput($event, i, 'srcPort')"
            @blur="onPortBlur(i, 'srcPort')"
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <span
            v-if="i == 0"
            class="text-xs text-gray-500 dark:text-neutral-400"
          >
            {{ $t('client.portInternal') }}
          </span>
          <input
            :value="getPortDisplay(i, 'dstPort')"
            type="text"
            inputmode="numeric"
            :class="[
              ...inputClasses,
              ...(portRangeIsValid(field.dstPort) ? [] : [inputErrorClasses]),
            ]"
            :placeholder="$t('general.port')"
            @input="onPortInput($event, i, 'dstPort')"
            @blur="onPortBlur(i, 'dstPort')"
          />
        </div>
        <select
          :class="selectClasses"
          :value="field.type"
          @change="onTypeChange($event, i)"
        >
          <option value="both">TCP + UDP</option>
          <option value="tcp">TCP</option>
          <option value="udp">UDP</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  PortListFieldItem,
  PortRange,
} from '#shared/types/portForwarding';

type PortField = PortListFieldItem;

const editedPorts = defineModel<PortListFieldItem[]>('edited-ports', {
  default: () => [],
});
const isValid = defineModel<boolean>('is-valid', { default: () => true });

function emptyPortRange(): PortRange {
  return { end: NaN, start: NaN };
}

function createEmptyField(): PortField {
  return {
    dstPort: emptyPortRange(),
    srcPort: emptyPortRange(),
    type: 'both',
  };
}

const fields = ref<PortField[]>([createEmptyField()]);
const displayValues = ref<Record<string, string>>({});

function portInputKey(index: number, key: 'dstPort' | 'srcPort'): string {
  return `${index}-${key}`;
}

function getPortDisplay(index: number, key: 'dstPort' | 'srcPort'): string {
  const inputKey = portInputKey(index, key);
  const display = displayValues.value[inputKey];
  if (display !== undefined) {
    return display;
  }
  return formatPortRange(fields.value[index]![key]);
}

const fieldBaseClasses = [
  'rounded-lg',
  'border-2',
  'border-gray-100',
  'text-gray-500',
  'focus:border-red-800',
  'focus:outline-0',
  'focus:ring-0',
  'dark:border-neutral-800',
  'dark:bg-neutral-700',
  'dark:text-neutral-200',
];

const inputClasses = [
  ...fieldBaseClasses,
  'w-full',
  'dark:placeholder:text-neutral-400',
];

const selectClasses = [...fieldBaseClasses, 'shrink-0', 'px-2'];

const inputErrorClasses = [
  'text-red-600',
  'border-red-500',
  'ring-red-500',
  'focus:border-red-500',
  'focus:ring-red-500',
];

function sanitizePortInput(raw: string): string {
  const cleaned = raw.replace(/[^\d-]/g, '');
  const dashIndex = cleaned.indexOf('-');
  if (dashIndex === -1) {
    return cleaned;
  }
  return (
    cleaned.slice(0, dashIndex + 1) +
    cleaned.slice(dashIndex + 1).replace(/-/g, '')
  );
}

function parsePortInput(value: string): PortRange {
  const trimmed = value.trim();
  if (trimmed === '') {
    return emptyPortRange();
  }

  const dashIndex = trimmed.indexOf('-');
  if (dashIndex === -1) {
    const port = Number.parseInt(trimmed, 10);
    if (Number.isNaN(port)) {
      return emptyPortRange();
    }
    return { end: port, start: port };
  }

  const startStr = trimmed.slice(0, dashIndex);
  const endStr = trimmed.slice(dashIndex + 1);
  const start = startStr === '' ? NaN : Number.parseInt(startStr, 10);
  const end = endStr === '' ? NaN : Number.parseInt(endStr, 10);

  return {
    end: Number.isNaN(end) ? NaN : end,
    start: Number.isNaN(start) ? NaN : start,
  };
}

function formatPortRange(range: PortRange): string {
  if (Number.isNaN(range.start) && Number.isNaN(range.end)) {
    return '';
  }
  if (Number.isNaN(range.end)) {
    return `${range.start}-`;
  }
  if (range.start === range.end) {
    return String(range.start);
  }
  return `${range.start}-${range.end}`;
}

function portInRange(port: number): boolean {
  return port >= 1 && port <= 65535;
}

function portRangeIsValid(range: PortRange): boolean {
  if (Number.isNaN(range.start) && Number.isNaN(range.end)) {
    return true;
  }
  if (Number.isNaN(range.start) || Number.isNaN(range.end)) {
    return false;
  }
  if (range.start > range.end) {
    return false;
  }
  return portInRange(range.start) && portInRange(range.end);
}

function fieldIsEmpty(field: PortField): boolean {
  return Number.isNaN(field.srcPort.start) && Number.isNaN(field.dstPort.start);
}

function fieldIsValid(field: PortField): boolean {
  if (fieldIsEmpty(field)) {
    return true;
  }
  return portRangeIsValid(field.srcPort) && portRangeIsValid(field.dstPort);
}

function fieldsToEditedPorts(fieldValues: PortField[]): PortListFieldItem[] {
  return fieldValues
    .filter((field) => !fieldIsEmpty(field))
    .map(({ dstPort, srcPort, type }) => ({
      dstPort: { ...dstPort },
      srcPort: { ...srcPort },
      type,
    }));
}

function portsToFields(ports: PortListFieldItem[]): PortField[] {
  if (ports.length === 0) {
    return [createEmptyField()];
  }
  return [
    ...ports.map(({ dstPort, srcPort, type }) => ({
      dstPort: { ...dstPort },
      srcPort: { ...srcPort },
      type,
    })),
    createEmptyField(),
  ];
}

function portRangesEqual(a: PortRange, b: PortRange): boolean {
  return a.start === b.start && a.end === b.end;
}

function editedPortsEqual(
  a: PortListFieldItem[],
  b: PortListFieldItem[]
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every(
    (item, i) =>
      portRangesEqual(item.srcPort, b[i]!.srcPort) &&
      portRangesEqual(item.dstPort, b[i]!.dstPort) &&
      item.type === b[i]!.type
  );
}

function syncEditedPorts() {
  const ports = fieldsToEditedPorts(fields.value);
  isValid.value = fields.value.every(fieldIsValid);
  editedPorts.value = ports;
}

function onPortInput(event: Event, index: number, key: 'dstPort' | 'srcPort') {
  const raw = sanitizePortInput((event.target as HTMLInputElement).value);
  displayValues.value[portInputKey(index, key)] = raw;

  if (!fields.value[index]) {
    return;
  }

  fields.value[index][key] = parsePortInput(raw);

  if (!fieldIsEmpty(fields.value[index]) && index === fields.value.length - 1) {
    fields.value.push(createEmptyField());
  }

  syncEditedPorts();
}

function onPortBlur(index: number, key: 'dstPort' | 'srcPort') {
  const inputKey = portInputKey(index, key);
  if (displayValues.value[inputKey] === undefined) {
    return;
  }
  const { [inputKey]: _removed, ...rest } = displayValues.value;
  displayValues.value = rest;
}

function onTypeChange(event: Event, index: number) {
  fields.value[index]!.type = (event.target as HTMLSelectElement)
    .value as PortField['type'];
  syncEditedPorts();
}

watch(
  editedPorts,
  (ports) => {
    const next = portsToFields(ports ?? []);
    if (!editedPortsEqual(fieldsToEditedPorts(next), ports ?? [])) {
      fields.value = next;
      displayValues.value = {};
    }
  },
  { immediate: true, deep: true }
);
</script>
