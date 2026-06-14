import { rapptorPortForwardingFetch } from '~~/server/utils/rapptorPortForwardingFetch';

export default definePermissionEventHandler('clients', 'custom', async () => {
  try {
    return await rapptorPortForwardingFetch('/ports/unavailable/', 'GET');
  } catch (e) {
    SERVER_DEBUG('Failed to fetch unavilable ports data: ', e);
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch unavilable ports data',
    });
  }
});
