<template>
  <div
    ref="rootRef"
    class="flex w-full items-end gap-2"
    @focusout="onFocusOut"
    @focusin="onFocusIn"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span
        v-if="props.showLabels"
        class="text-xs text-gray-500 dark:text-neutral-400"
      >
        {{ $t('client.portExternal') }}
      </span>
      <input
        :value="inputSrcValue"
        type="text"
        inputmode="numeric"
        :class="[
          ...inputClasses,
          ...(props.validation?.valid === false ? inputErrorClasses : []),
        ]"
        :placeholder="$t('general.port')"
        @blur="onPortBlur('srcPort')"
        @focusin="onFocusIn"
        @input="onPortInput($event, 'srcPort')"
      />
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span
        v-if="props.showLabels"
        class="text-xs text-gray-500 dark:text-neutral-400"
      >
        {{ $t('client.portInternal') }}
      </span>
      <input
        :value="inputDstValue"
        type="text"
        inputmode="numeric"
        :class="[
          ...inputClasses,
          ...(props.validation?.valid === false ? inputErrorClasses : []),
        ]"
        :placeholder="$t('general.port')"
        @blur="onPortBlur('dstPort')"
        @input="onPortInput($event, 'dstPort')"
      />
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <span
        v-if="props.showLabels"
        class="text-xs text-gray-500 dark:text-neutral-400"
      >
        {{ $t('client.portProtocol') }}
      </span>
      <select
        :class="selectClasses"
        :value="props.port?.type ?? 'both'"
        @change="onTypeChange($event)"
      >
        <option value="both">TCP + UDP</option>
        <option value="tcp">TCP</option>
        <option value="udp">UDP</option>
      </select>
    </div>
  </div>
  <template v-for="errorStr in props.validation?.errors" :key="errorStr">
    <div class="flex min-w-0 flex-1 flex-col">
      <span
        :class="[
          'text-xs',
          'text-gray-500',
          'dark:text-neutral-400',
          ...inputErrorClasses,
        ]"
      >
        {{ errorStr }}
      </span>
    </div>
  </template>
</template>

<script lang="ts" setup>
import type { ValidationResult } from '~/utils/ports';

const props = defineProps<{
  validation: ValidationResult | undefined;
  port: PortListFieldItem | undefined;
  showLabels: boolean;
}>();

const inputSrcValue = ref<string>(
  portFieldItemToFieldString(props.port?.srcPort)
);
const inputDstValue = ref<string>(
  portFieldItemToFieldString(props.port?.dstPort)
);

const rootRef = ref<HTMLDivElement | null>(null);

const emit = defineEmits<{
  blur: [];
  change: [portDef: PortListFieldItem | undefined];
  focus: [];
}>();

const onPortInput = (event: Event, key: 'dstPort' | 'srcPort') => {
  const raw = sanitizePortInput((event.target as HTMLInputElement).value);
  const portRange = fieldStringToPortRange(raw);

  const inputValue = key === 'srcPort' ? inputSrcValue : inputDstValue;

  inputValue.value = raw;

  const srcPort = key === 'srcPort' ? portRange : props.port?.srcPort;
  const dstPort = key === 'dstPort' ? portRange : props.port?.dstPort;

  const value: PortListFieldItem = {
    srcPort,
    dstPort,
    type: props.port?.type ?? 'both',
  };

  emit('change', value);
};

function onFocusIn(e: FocusEvent) {
  if (
    e.relatedTarget &&
    e.relatedTarget instanceof Node &&
    !rootRef.value?.contains(e.relatedTarget)
  ) {
    emit('focus');
  }
}

function onFocusOut(e: FocusEvent) {
  if (
    e.relatedTarget &&
    e.relatedTarget instanceof Node &&
    !rootRef.value?.contains(e.relatedTarget)
  ) {
    emit('blur');
  }
}

function onPortBlur(key: 'dstPort' | 'srcPort') {
  const inputValue = key === 'srcPort' ? inputSrcValue : inputDstValue;
  const portRange =
    key === 'srcPort' ? props.port?.srcPort : props.port?.dstPort;
  inputValue.value = portFieldItemToFieldString(portRange);
}

function onTypeChange(event: Event) {
  const type = (event.target as HTMLSelectElement).value as PortListType;
  emit('change', props.port && { ...props.port, type });
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
</script>
