import { rapptorPortForwardingFetch } from '~~/server/utils/rapptorPortForwardingFetch';

export default definePermissionEventHandler('clients', 'custom', async () => {
  try {
    return await rapptorPortForwardingFetch('/ports/', 'GET');
  } catch (e) {
    SERVER_DEBUG('Failed to fetch port forwarding data: ', e);
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch port forwarding data',
    });
  }
});
