<template>
  <BaseDialog>
    <template #trigger>
      <slot />
    </template>
    <template #title>
      {{ $t('client.portList') }}
    </template>
    <template #description>
      <div class="bg-white dark:bg-neutral-700">
        <FormPortListField
          v-model:edited-ports="editedPorts"
          v-model:is-valid="isValid"
          :occupied-ports="props.occupiedPorts"
        />
      </div>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BaseSecondaryButton @click="cancel">{{
          $t('dialog.cancel')
        }}</BaseSecondaryButton>
      </DialogClose>
      <BasePrimaryButton v-if="isDirty" @click="submit">
        <IconsLoading
          v-if="isSubmitingPorts"
          class="mx-auto w-5 animate-spin"
        />
        <span v-else>{{ $t('form.save') }}</span>
      </BasePrimaryButton>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import type { PortListFieldItem } from '#shared/types/portForwarding';
import { toPortListFieldItem } from '~/utils/ports';

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

const props = withDefaults(
  defineProps<{
    occupiedPorts?: number[];
    onChange?: (ports: PortListFieldItem[]) => void | Promise<void>;
    ports?: PortForwardingItem[];
  }>(),
  {
    occupiedPorts: undefined,
    onChange: undefined,
    ports: () => [],
  }
);

const defaultPorts = ref<PortListFieldItem[]>(toPortListFieldItem(props.ports));
const editedPorts = ref<PortListFieldItem[]>(toPortListFieldItem(props.ports));
const isValid = ref<boolean>(true);
const isSubmitingPorts = ref<boolean>(false);

watch(
  () => props.ports,
  (ports) => {
    defaultPorts.value = toPortListFieldItem(ports);
    editedPorts.value = toPortListFieldItem(ports);
  },
  { deep: true }
);

const isDirty = computed(
  () => !editedPortsEqual(editedPorts.value, defaultPorts.value)
);

async function submit() {
  if (!isValid.value || isSubmitingPorts.value) {
    return;
  }

  isSubmitingPorts.value = true;

  try {
    await props.onChange?.(editedPorts.value);
    defaultPorts.value = [...editedPorts.value];
  } finally {
    isSubmitingPorts.value = false;
  }
}

function cancel() {
  editedPorts.value = [...defaultPorts.value];
}
</script>
