import { defineStore } from 'pinia';

export const useUnavailablePortsStore = defineStore('UnavailablePorts', () => {
  const unavailablePorts = ref<PortDefinition[] | null>(null);

  const { data: _unavailablePorts, refresh: _refresh } = useFetch<
    PortDefinition[]
  >('/api/client/unavailableports/', {
    method: 'get',
  });

  async function refresh() {
    await _refresh();
    unavailablePorts.value = _unavailablePorts.value ?? null;
  }

  return { unavailablePorts, refresh, _unavailablePorts };
});
