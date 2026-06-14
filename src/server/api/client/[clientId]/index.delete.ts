import { getValidatedRouterParams } from 'h3';

import Database from '#server/utils/Database';
import WireGuard from '#server/utils/WireGuard';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { ClientGetSchema } from '#db/repositories/client/types';
import { rapptorPortForwardingFetch } from '~~/server/utils/rapptorPortForwardingFetch';

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

    const updatedEntry: PortForwardingDefinition = {
      ipv4: client.ipv4Address,
      ports: [],
    };

    try {
      await rapptorPortForwardingFetch('/ports/', 'PUT', [updatedEntry]);
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
