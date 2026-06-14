import {
  ClientGetSchema,
  ClientPortForwardingSchema,
} from '#db/repositories/client/types';
import type { PortForwardingDefinition } from '#shared/types/portForwarding';
import { toPortForwardingItems } from '~/utils/ports';
import { rapptorPortForwardingFetch } from '~~/server/utils/rapptorPortForwardingFetch';

export default definePermissionEventHandler(
  'clients',
  'update',
  async ({ event, checkPermissions }) => {
    const { clientId } = await getValidatedRouterParams(
      event,
      validateZod(ClientGetSchema, event)
    );

    const data = await readValidatedBody(
      event,
      validateZod(ClientPortForwardingSchema, event)
    );

    const client = await Database.clients.get(clientId);
    checkPermissions(client);

    if (!client) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Client not found',
      });
    }

    const updatedEntry: PortForwardingDefinition = {
      ipv4: client.ipv4Address,
      ports: toPortForwardingItems(data.ports),
    };

    try {
      return rapptorPortForwardingFetch(`/ports/`, 'PUT', [updatedEntry]);
    } catch (e) {
      SERVER_DEBUG('Failed to update port forwarding data: ', e);
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to update port forwarding data',
      });
    }
  }
);
