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
import { FetchError } from 'ofetch';
import { toPortForwardingItems } from '~/utils/ports';

const props = defineProps<{
  client: LocalClient;
  portForwarding: PortForwardingDefinition[];
}>();

const portForwardingStore = usePortForwardingStore();
const toast = useToast();

const ports = computed(
  () =>
    props.portForwarding.find(
      (portForwardingDef) => portForwardingDef.ipv4 === props.client.ipv4Address
    )?.ports ?? []
);

const occupiedPorts = ref<number[]>([10240, 10241, 10242, 10243, 10244, 10245]);

async function onChange(newPorts: PortListFieldItem[]) {
  try {
    await $fetch<PortForwardingDefinition[]>(
      `/api/client/${props.client.id}/portforwarding`,
      {
        method: 'post',
        body: { ports: newPorts },
      }
    );
    portForwardingStore.setPortForwarding([
      {
        ipv4: props.client.ipv4Address,
        ports: toPortForwardingItems(newPorts),
      },
    ]);
  } catch (e) {
    if (e instanceof FetchError) {
      toast.showToast({
        type: 'error',
        message: e.data?.message ?? e.statusMessage,
      });
    } else if (e instanceof Error) {
      toast.showToast({
        type: 'error',
        message: e.message,
      });
    } else {
      console.error(e);
    }
    throw e;
  }
}
</script>
