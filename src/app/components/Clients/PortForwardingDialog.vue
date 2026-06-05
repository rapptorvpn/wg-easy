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
        <FormPortListFields
          v-model:port-forwarding="editedPorts"
          v-model:is-valid="isValid"
          :unavailable-ports="props.unavailablePorts"
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
function portRangesEqual(a: PortRange, b: PortRange): boolean {
  return a.start === b.start && a.end === b.end;
}

function editedPortsEqual(
  a: PortListFieldItem[],
  b: PortListFieldItem[]
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (item, i) =>
        item.srcPort &&
        item.dstPort &&
        b[i]?.srcPort &&
        b[i]?.dstPort &&
        portRangesEqual(item.srcPort, b[i].srcPort) &&
        portRangesEqual(item.dstPort, b[i].dstPort) &&
        item.type === b[i].type
    )
  );
}

const props = withDefaults(
  defineProps<{
    unavailablePorts?: PortDefinition[];
    onSubmit?: (ports: PortListFieldItem[]) => void | Promise<void>;
    ports?: PortListFieldItem[];
  }>(),
  {
    unavailablePorts: undefined,
    onSubmit: undefined,
    ports: () => [],
  }
);

const defaultPorts = ref<PortListFieldItem[]>(props.ports);
const editedPorts = ref<PortListFieldItem[]>(props.ports);
const isValid = ref<boolean>(true);
const isSubmitingPorts = ref<boolean>(false);

// watch(
//   () => props.ports,
//   (ports) => {
//     defaultPorts.value = ports;
//     editedPorts.value = ports;
//   },
//   { deep: true }
// );

const isDirty = computed(
  () => !editedPortsEqual(editedPorts.value, defaultPorts.value)
);

async function submit() {
  if (!isValid.value || isSubmitingPorts.value) {
    return;
  }

  isSubmitingPorts.value = true;

  try {
    await props.onSubmit?.(editedPorts.value);
    defaultPorts.value = [...editedPorts.value];
  } finally {
    isSubmitingPorts.value = false;
  }
}

function cancel() {
  editedPorts.value = [...defaultPorts.value];
}
</script>
