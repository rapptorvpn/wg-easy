import { defineStore } from 'pinia';

export type {
  PortForwardingDefinition,
  PortForwardingItem,
  PortListFieldItem,
  PortRange,
} from '#shared/types/portForwarding';

export const usePortForwardingStore = defineStore('PortForwarding', () => {
  const portForwarding = ref<PortForwardingDefinition[] | null>(null);

  const { data: _portForwarding, refresh: _refresh } = useFetch<
    PortForwardingDefinition[]
  >('/api/client/portforwarding', {
    method: 'get',
  });

  async function refresh() {
    await _refresh();
    portForwarding.value = _portForwarding.value ?? null;
  }

  function setPortForwarding(
    updatedPortForwarding: PortForwardingDefinition[]
  ) {
    if (!portForwarding.value) {
      portForwarding.value = updatedPortForwarding;
      return;
    }

    const next = [...portForwarding.value];
    for (const portForwardingDef of updatedPortForwarding) {
      const ipIndex = next.findIndex(
        ({ ipv4 }) => ipv4 === portForwardingDef.ipv4
      );
      if (ipIndex !== -1) {
        next[ipIndex] = portForwardingDef;
      } else {
        next.push(portForwardingDef);
      }
    }
    portForwarding.value = next;
  }

  return { portForwarding, refresh, setPortForwarding, _portForwarding };
});
