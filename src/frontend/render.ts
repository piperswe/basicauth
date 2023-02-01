import { ok } from "@worker-tools/response-creators";
import { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";

export async function okReact(node: ReactNode): Promise<Response> {
  return ok(await renderToReadableStream(node), {
    headers: { "content-type": "text/html" },
  });
}
