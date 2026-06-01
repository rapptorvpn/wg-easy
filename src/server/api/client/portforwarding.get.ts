import type { PortForwardingDefinition } from '#shared/types/portForwarding';

export default definePermissionEventHandler('clients', 'custom', async () => {
  const baseUrl = THIRD_PARTY_ENV.PORT_FORWARDING_URL;

  if (!baseUrl) {
    return [];
  }

  try {
    const url = `${baseUrl}/ports/`;
    return await $fetch<PortForwardingDefinition[]>(url, { method: 'GET' });
  } catch (e) {
    SERVER_DEBUG('Failed to fetch port forwarding data: ', e);
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch port forwarding data',
    });
  }
});
