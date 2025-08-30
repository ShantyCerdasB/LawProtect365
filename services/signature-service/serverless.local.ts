/**
 * Local runner to invoke handlers without API Gateway.
 * Usage examples:
 *   tsx serverless.local.ts src/controllers/envelopes/createEnvelope.ts POST /envelopes \
 *     '{"ownerId":"user-1","name":"My envelope"}'
 *   tsx serverless.local.ts src/controllers/envelopes/getEnvelopes.ts GET /envelopes
 */

import "dotenv/config";
import "tsconfig-paths/register"; // enable TS path aliases at runtime

// --- minimal env bootstrap so loadConfig() doesn't explode ---
process.env.AWS_REGION ??= "us-east-1";
process.env.PROJECT_NAME ??= "lawprotect365";
process.env.SERVICE_NAME ??= "signature-service";

process.env.ENVELOPES_TABLE ??= "local-envelopes";
process.env.DOCUMENTS_TABLE ??= "local-documents";
process.env.INPUTS_TABLE ??= "local-inputs";
process.env.PARTIES_TABLE ??= "local-parties";
process.env.IDEMPOTENCY_TABLE ??= "local-idempotency";

// buckets & events
process.env.EVIDENCE_BUCKET ??= "local-evidence";
process.env.SIGNED_BUCKET ??= "local-signed";
process.env.EVENTS_BUS_NAME ??= "local-bus";
process.env.EVENTS_SOURCE ??= `${process.env.PROJECT_NAME}.${process.env.SERVICE_NAME}.local`;

// KMS (solo para que el container se inicialice; no se usa en este runner)
process.env.KMS_SIGNER_KEY_ID ??= "local-kms-key";
process.env.KMS_SIGNING_ALGORITHM ??= "RSASSA_PSS_SHA_256";

// Si usas LocalStack, descomenta:
// process.env.AWS_ENDPOINT_URL ??= "http://localhost:4566";

import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { initApp } from "./src/bootstrap/bootstrap";

// --- CLI args: module path, method, path, body ---
const modPath = process.argv[2];
const method = (process.argv[3] || "GET").toUpperCase();
const requestPath = process.argv[4] || "/local";
const rawBodyArg = process.argv[5];

if (!modPath) {
  console.error("Usage: tsx serverless.local.ts <module-path> [METHOD] [PATH] [JSON_BODY]");
  process.exit(1);
}

async function main() {
  // Inicializa Container + servicios una sola vez (cold start).
  initApp();

  // Importa el handler ESM/TS que exporta { handler }
  const mod = await import(modPath.startsWith(".") || modPath.startsWith("/")
    ? modPath
    : "./" + modPath);

  const handler = (mod as any).handler as (
    evt: APIGatewayProxyEventV2,
    ctx: Context,
    cb: () => void
  ) => Promise<any>;

  if (typeof handler !== "function") {
    throw new Error(`Module '${modPath}' does not export a 'handler' function`);
  }

  // Construye un evento API Gateway v2 mínimo
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": "127.0.0.1",
    "user-agent": "serverless.local.ts",
  };

  let body: string | undefined;
  if (rawBodyArg) {
    // si pasaste un JSON en CLI
    body = rawBodyArg;
  }

  const fakeEvent: APIGatewayProxyEventV2 = {
    version: "2.0",
    routeKey: `${method} ${requestPath}`,
    rawPath: requestPath,
    rawQueryString: "",
    headers,
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: "localhost",
      domainPrefix: "local",
      http: { method, path: requestPath, protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: headers["user-agent"] },
      requestId: `req_${Date.now()}`,
      routeKey: `${method} ${requestPath}`,
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    } as any,
    isBase64Encoded: false,
    body,
    // 👇 muchos controladores nuestros leen evt.ctx.auth
    // inyectamos un auth fake para desarrollo local
    // @ts-expect-error: campo extendido por nuestro middleware
    ctx: {
      auth: {
        tenantId: "tenant-local",
        userId: "user-local",
        email: "local@example.com",
        roles: ["admin"],
      },
    },
  };

  const res = await handler(fakeEvent, {} as any, () => {});
  // Imprime limpio
  console.log("\n— Response —");
  console.log("Status:", res?.statusCode);
  if (res?.headers) console.log("Headers:", res.headers);
  if (res?.body) {
    try {
      console.log("Body:", JSON.stringify(JSON.parse(res.body), null, 2));
    } catch {
      console.log("Body:", res.body);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
