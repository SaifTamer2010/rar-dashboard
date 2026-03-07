declare global {
  var sseClients: Set<ReadableStreamDefaultController> | undefined;
}

if (!global.sseClients) {
  global.sseClients = new Set();
}

export const clients = global.sseClients;

export function broadcastLeadUpdate() {
  const message = `data: lead_added\n\n`;
  const encoded = new TextEncoder().encode(message);
  clients.forEach((client) => {
    try {
      client.enqueue(encoded);
    } catch {
      clients.delete(client);
    }
  });
}
