import { defineStore } from 'pinia';
import type { PortForwardingDefinition } from '#shared/types/portForwarding';

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

  return { portForwarding, refresh, _portForwarding };
});
