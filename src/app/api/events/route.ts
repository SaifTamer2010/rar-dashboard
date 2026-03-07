import { NextResponse } from "next/server";
import { clients } from "@/lib/sse";

export function GET() {
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
      clients.add(controller);
      controller.enqueue(new TextEncoder().encode(`data: connected\n\n`));
    },
    cancel() {
      clients.delete(controller);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
