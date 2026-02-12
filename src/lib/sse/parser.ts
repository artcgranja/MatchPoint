export interface SseEvent {
  event: string;
  data: string;
}

/** Create a stateful SSE parser that handles cross-chunk boundaries and both named and unnamed events. */
export function createSseParser() {
  let currentEvent = "";
  let currentData = "";
  let lineBuffer = "";

  return {
    /** Feed raw text and get back fully-parsed events. */
    feed(chunk: string): SseEvent[] {
      const events: SseEvent[] = [];
      // Prepend any leftover partial line from the previous chunk
      const text = lineBuffer + chunk;
      lineBuffer = "";

      const lines = text.split("\n");

      // If the chunk doesn't end with \n, the last "line" is incomplete — buffer it
      if (!text.endsWith("\n")) {
        lineBuffer = lines.pop() ?? "";
      }

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData = line.slice(6);
        } else if (line === "") {
          // Blank line = event boundary (per SSE spec)
          if (currentEvent || currentData) {
            events.push({ event: currentEvent || "message", data: currentData });
            currentEvent = "";
            currentData = "";
          }
        }
      }

      return events;
    },
  };
}
