declare global {
  var sseClients: Set<ReadableStreamDefaultController> | undefined;
}

if (!global.sseClients) {
  global.sseClients = new Set();
}

export const clients = global.sseClients;

export function broadcastLeadUpdate(payload: {
  userName: string;
  soundUrl: string | null;
}) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  clients.forEach((client) => {
    try {
      client.enqueue(encoded);
    } catch {
      clients.delete(client);
    }
  });
}
