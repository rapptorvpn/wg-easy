<template>
  <ClientsPortForwardingDialog
    :occupied-ports="occupiedPorts"
    :on-change="onChange"
    :ports="ports"
  >
    <div
      class="rounded bg-gray-100 p-2 align-middle transition hover:bg-red-800 hover:text-white dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white"
      :title="$t('client.portList')"
    >
      <IconsPortForward class="w-5" />
    </div>
  </ClientsPortForwardingDialog>
</template>

<script setup lang="ts">
import type { PortListFieldItem } from '#shared/types/portForwarding';

const props = defineProps<{
  client: LocalClient;
  portForwarding: PortDefinition[];
}>();

const ports = computed(
  () =>
    props.portForwarding.find(
      (portForwardingDef) => portForwardingDef.ipv4 === props.client.ipv4Address
    )?.ports ?? []
);

const occupiedPorts = ref<number[]>([10240, 10241, 10242, 10243, 10244, 10245]);

function onChange(newPorts: PortListFieldItem[]) {
  console.log('submit ports', newPorts, props.client.ipv4Address);
}
</script>
