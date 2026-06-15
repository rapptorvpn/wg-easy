import { Agent, request } from 'undici';

export const rapptorPortForwardingFetch = async <T>(
  path: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: T
) => {
  const baseUrl = 'http://localhost';
  const socketPath = THIRD_PARTY_ENV.RAPPTOR_PORT_FORWARDING_SOCK;
  const dispatcher = new Agent({
    connect: {
      socketPath,
    },
  });

  if (!baseUrl) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Port forwarding service not configured',
    });
  }

  const url = `${baseUrl}${path}`;
  const bodyStr = body && JSON.stringify(body);

  try {
    const res = await request(url, {
      method,
      body: bodyStr,
      dispatcher,
      headers: bodyStr ? { 'Content-Type': 'application/json' } : undefined,
    });
    return res.body.json();
  } catch (e) {
    SERVER_DEBUG('Failed to make port forwarding request: ', e);
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to make port forwarding request: ' + e,
    });
  }
};
