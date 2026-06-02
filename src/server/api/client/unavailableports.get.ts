import type { PortDefinition } from '~~/shared/types/portForwarding';

export default definePermissionEventHandler('clients', 'custom', async () => {
  const baseUrl = THIRD_PARTY_ENV.PORT_FORWARDING_URL;

  if (!baseUrl) {
    return [];
  }

  try {
    const url = `${baseUrl}/ports/unavailable/`;
    return await $fetch<PortDefinition[]>(url, { method: 'GET' });
  } catch (e) {
    SERVER_DEBUG('Failed to fetch unavilable ports data: ', e);
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch unavilable ports data',
    });
  }
});
