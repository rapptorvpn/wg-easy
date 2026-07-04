<template>
  <div
    ref="rootRef"
    class="grid w-full grid-cols-[1fr_1fr_1fr_2.8rem] items-end gap-2"
    @focusout="onFocusOut"
    @focusin="onFocusIn"
  >
    <div class="grid-1 grid-col grid min-w-0 gap-1">
      <span
        v-if="props.showLabels"
        class="text-xs text-gray-500 dark:text-neutral-400"
      >
        {{ $t('client.portExternal') }}
      </span>
      <input
        ref="inputSrcEl"
        :value="inputSrcValue"
        type="text"
        inputmode="numeric"
        :class="[
          ...inputClasses,
          ...(props.validation?.valid === false ? inputErrorClasses : []),
        ]"
        :placeholder="$t('general.port')"
        @blur="onPortBlur('srcPort')"
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
        ref="inputDstEl"
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
    <a
      v-if="props.showDelete"
      class="flex justify-center rounded bg-gray-100 p-3 align-middle transition hover:bg-red-800 hover:text-white dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white"
      href="#"
      @click="handleDeleteClick"
    >
      <IconsDelete class="w-5" />
    </a>
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
const props = defineProps<{
  validation: ValidationResult | undefined;
  port: PortListFieldItem | undefined;
  showDelete: boolean;
  showLabels: boolean;
}>();

const inputSrcValue = ref<string>(
  portFieldItemToFieldString(props.port?.srcPort)
);
const inputDstValue = ref<string>(
  portFieldItemToFieldString(props.port?.dstPort)
);

const rootRef = ref<HTMLDivElement | null>(null);
const inputMode = ref<'copyValues' | 'normal'>('normal');
const inputDstEl = ref<HTMLInputElement | null>(null);

const handleDeleteClick = (e: PointerEvent) => {
  e.preventDefault();
  emit('delete');
};

const emit = defineEmits<{
  blur: [];
  change: [portDef: PortListFieldItem | undefined];
  delete: [];
  focus: [];
}>();

const onPortInput = (event: Event, key: 'dstPort' | 'srcPort') => {
  const raw = sanitizePortInput((event.target as HTMLInputElement).value);
  const portRange = fieldStringToPortRange(raw);

  const srcPort = key === 'srcPort' ? portRange : props.port?.srcPort;
  let dstPort = key === 'dstPort' ? portRange : props.port?.dstPort;
  const inputValue = key === 'srcPort' ? inputSrcValue : inputDstValue;

  inputValue.value = raw;

  const srcPortRange: number = (srcPort?.end ?? 0) - (srcPort?.start ?? 0);
  const dstPortRange: number = (dstPort?.end ?? 0) - (dstPort?.start ?? 0);

  if (srcPortRange !== dstPortRange) {
    if (key === 'srcPort') {
      if (dstPort) {
        const end = dstPort.start + srcPortRange;
        dstPort.end = end < 1 ? 1 : end;
        inputDstValue.value = portFieldItemToFieldString(dstPort);
      }
    } else {
      if (dstPort) {
        let selectionStart = inputDstEl.value?.selectionStart;
        let selectionEnd = inputDstEl.value?.selectionEnd;
        const startRangeChanged = dstPort.start !== props.port?.dstPort?.start;

        if (startRangeChanged) {
          dstPort.end = dstPort?.start + srcPortRange;
        } else {
          if (dstPort?.end - srcPortRange > 1) {
            dstPort.start = dstPort?.end - srcPortRange;
          } else {
            dstPort.start = 1;
          }
        }

        const inputValue = portFieldItemToFieldString(dstPort);

        if (!startRangeChanged && selectionStart && selectionEnd) {
          selectionStart +=
            inputValue.length - (inputDstEl.value?.value.length ?? 0);
          selectionEnd +=
            inputValue.length - (inputDstEl.value?.value.length ?? 0);
        }

        inputDstValue.value = inputValue;
        if (selectionStart && selectionEnd) {
          setTimeout(() => {
            inputDstEl.value?.setSelectionRange(selectionStart, selectionEnd);
          }, 0);
        }
      }
    }
  }

  if (inputMode.value === 'copyValues') {
    if (key === 'srcPort') {
      dstPort = srcPort;
      inputDstValue.value = portFieldItemToFieldString(dstPort);
    }
  }

  const value: PortListFieldItem = {
    srcPort,
    dstPort,
    type: props.port?.type ?? 'both',
  };

  emit('change', value);
};

function onFocusIn(e: FocusEvent) {
  if (!props.port?.srcPort && !props.port?.dstPort) {
    inputMode.value = 'copyValues';
  }

  if (
    e.relatedTarget &&
    e.relatedTarget instanceof Node &&
    !rootRef.value?.contains(e.relatedTarget)
  ) {
    emit('focus');
  }
}

function onFocusOut(e: FocusEvent) {
  inputMode.value = 'normal';

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
