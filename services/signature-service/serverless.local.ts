/**
 * Local runner to invoke handlers without API Gateway.
 * Usage: tsx serverless.local.ts controllers/envelopes/getEnvelopes.ts
 */
import { initDeps } from "./src/app/bootstrap";

async function main() {
  // TODO: create fake deps or local AWS clients
  initDeps({} as any);

  const modPath = process.argv[2];
  if (!modPath) {
    console.error("Usage: tsx serverless.local.ts <relative-module-path>");
    process.exit(1);
  }
  const mod = await import("./" + modPath);
  const handler = mod.handler;
  if (!handler) throw new Error("Module has no export 'handler'");

  const fakeEvent: any = {
    version: "2.0",
    requestContext: { http: { method: "GET", path: "/local" } },
    rawPath: "/local",
    rawQueryString: "",
    headers: {},
    body: undefined,
    isBase64Encoded: false
  };

  const res = await handler(fakeEvent, {} as any, () => {});
  console.log("Response:", res);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
