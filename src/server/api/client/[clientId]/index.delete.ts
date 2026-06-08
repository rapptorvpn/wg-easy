import { ClientGetSchema } from '#db/repositories/client/types';

export default definePermissionEventHandler(
  'clients',
  'delete',
  async ({ event, checkPermissions }) => {
    const { clientId } = await getValidatedRouterParams(
      event,
      validateZod(ClientGetSchema, event)
    );

    const client = await Database.clients.get(clientId);
    checkPermissions(client);

    if (!client) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Client not found',
      });
    }

    await Database.clients.delete(clientId);
    await WireGuard.saveConfig();

    const baseUrl = THIRD_PARTY_ENV.PORT_FORWARDING_URL;

    if (!baseUrl) {
      return [];
    }

    const updatedEntry: PortForwardingDefinition = {
      ipv4: client.ipv4Address,
      ports: [],
    };

    try {
      await $fetch(`${baseUrl}/ports/`, {
        method: 'PUT',
        body: [updatedEntry],
      });
    } catch (e) {
      SERVER_DEBUG('Failed to update port forwarding data: ', e);
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to update port forwarding data',
      });
    }

    return { success: true };
  }
);
