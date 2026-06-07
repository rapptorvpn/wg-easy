<template>
  <ClientsPortForwardingDialog
    :unavailable-ports="unavailablePorts"
    :on-submit="onSubmit"
    :ports="ports"
    :port-forwarding-items="props.portForwarding"
    :ipv4="props.client.ipv4Address"
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

const props = defineProps<{
  client: LocalClient;
  portForwarding: PortForwardingDefinition[];
}>();

const portForwardingStore = usePortForwardingStore();
const unavailablePortsStore = useUnavailablePortsStore();
const toast = useToast();

const ports = computed(() => {
  const portForwardingItems =
    props.portForwarding.find(
      (portForwardingDef) => portForwardingDef.ipv4 === props.client.ipv4Address
    )?.ports ?? [];

  return toPortListFieldItem(portForwardingItems);
});

const unavailablePorts = ref<PortDefinition[]>(
  unavailablePortsStore.unavailablePorts ?? []
);

async function onSubmit(newPorts: PortListFieldItem[]) {
  newPorts = newPorts.filter(
    (portListField) => portListField.srcPort && portListField.dstPort
  );
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
