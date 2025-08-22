````md
# `aws/` — Cloud primitives & ports (Hexagonal Guide)

SDK-agnostic AWS helpers and **ports** for S3, KMS, Secrets, SSM, SNS, SQS, plus utilities for ARN/Region parsing and resilient retries.  
Designed for **hexagonal microservices**: use **ports** in application code; implement them in **adapters** with AWS SDK v3.

Import via:
```ts
import { ... } from "@lawprotect365/shared/aws";
````

---

## Modules and Functions

### `arn.ts` — ARN parsing & formatting

* **`interface ArnParts`**
  `{ partition, service, region, accountId, resource }`.

* **`isArn(arn: string): boolean`**
  Syntactic check only.
  **Use for:** early validation before parsing.

* **`parseArn(arn: string): ArnParts`**
  Splits `arn:partition:service:region:account:resource…` keeping any embedded `:` in `resource`.
  **Throws** on invalid shape.
  **Use for:** extracting pieces (e.g., account or resource id).

* **`formatArn(parts: ArnParts): string`**
  Serializes `ArnParts` back to ARN.
  **Use for:** constructing ARNs for logs/config/requests.

* **`extractResourceId(resource: string): string`**
  Returns the tail after the first `/` or `:`; otherwise returns input.
  **Use for:** turning `function:my-fn` → `my-fn`, `table/mytbl/ver-1` → `mytbl/ver-1`.

---

### `ddb.ts` — Minimal DynamoDB client contract

* **`interface DdbClientLike`**

  * `get({ TableName, Key, ConsistentRead? }): Promise<{ Item? }>`
  * `put({ TableName, Item, ConditionExpression? }): Promise<unknown>`
  * `delete({ TableName, Key, ConditionExpression? }): Promise<unknown>`
  * `update?({ TableName, Key, UpdateExpression, ExpressionAttributeNames?, ExpressionAttributeValues?, ConditionExpression?, ReturnValues? }): Promise<{ Attributes? }>`
    **Use for:** repositories that should not couple to a specific SDK wrapper.

* **`type DdbClientWithUpdate = DdbClientLike & { update: NonNullable<DdbClientLike["update"]> }`**
  **Use for:** narrow type after asserting `update`.

* **`requireUpdate(ddb: DdbClientLike): asserts ddb is DdbClientWithUpdate`**
  **Throws** if `update` is missing.
  **Use for:** operations that require conditional/atomic updates (idempotency, state transitions).

---

### `errors.ts` — AWS error classification

* **`interface AwsErrorShape`**
  `{ name?, code?, message?, statusCode? }`.

* **`extractAwsError(err: unknown): AwsErrorShape`**
  Normalizes common fields from SDK errors.
  **Use for:** logging/metrics without leaking SDK specifics.

* **`isAwsThrottling(err: unknown): boolean`**
  Detects throttling/limit errors (name/code/status 429).
  **Use for:** retry policies.

* **`isAwsAccessDenied(err: unknown): boolean`**
  403 or `AccessDenied*`.
  **Use for:** fast-fail and audit.

* **`isAwsServiceUnavailable(err: unknown): boolean`**
  5xx or common service-unavailable codes.
  **Use for:** retry policies.

* **`isAwsRetryable(err: unknown): boolean`**
  Throttling **or** 5xx.
  **Use for:** generic retry guard.

---

### `partition.ts` — Partition helpers

* **`partitionForRegion(region: string): "aws" | "aws-cn" | "aws-us-gov"`**
  **Use for:** building correct ARNs/endpoints per region family.

---

### `region.ts` — Region utilities

* **`getDefaultRegion(): string | undefined`**
  From `AWS_REGION` or `AWS_DEFAULT_REGION`.
  **Use for:** bootstrapping adapters.

* **`requireRegion(region?: string): string`**
  Returns provided or env default; **throws** if none.
  **Use for:** adapter constructors that must have a region.

* **`detectPartition(region: string): "aws" | "aws-cn" | "aws-us-gov"`**
  Delegates to `partitionForRegion`.
  **Use for:** partition-aware logic.

* **`isValidRegion(region: string): boolean`**
  Shallow regex check `^[a-z]{2}-[a-z-]+-\d+$`.
  **Use for:** early validation of config inputs.

---

### `retry.ts` — Exponential backoff with secure jitter

* **`type Jitter = "none" | "full" | "decorrelated"`**

* **`interface BackoffOptions`**
  `{ baseMs?, capMs?, jitter? }` (defaults: `100`, `10000`, `"full"`).

* **`backoffDelay(attempt: number, opts?: BackoffOptions): number`**
  Computes delay for a 0-based retry attempt. Uses **secure RNG** only (no `Math.random`).
  **Use for:** scheduling retries.

* **`shouldRetry(attempt: number, maxAttempts: number, isRetryable: (err) => boolean, err: unknown, opts?: BackoffOptions): { retry: boolean; delayMs: number }`**
  Stateless policy helper.
  **Use for:** centralized retry loops across adapters.

---

### `ports.ts` — Storage/messaging/crypto ports

SDK-agnostic **interfaces** to implement in adapters:

* **S3**

  * `S3Port`: `putObject`, `getObject`, `headObject`, `deleteObject`
  * `S3PutObjectInput` (`bucket`, `key`, `body`, `contentType?`, `metadata?`, `kmsKeyId?`, `cacheControl?`, `acl?`)
  * `S3GetObjectOutput` (`body`, `contentType?`, `metadata?`, `etag?`, `lastModified?`)
    **Use for:** evidence files, PDFs, audit blobs.

* **KMS**

  * `KmsPort`: `encrypt`, `decrypt`, `sign`, `verify`
  * Inputs: `keyId`, payload `Uint8Array`, `context?`, `signingAlgorithm?`
    **Use for:** digest signing of PDFs, OTP secrets, at-rest encryption.

* **Secrets**

  * `SecretsPort`: `getSecretString(id)`
    **Use for:** pulling API keys/JWKS which are not in plain env.

* **SSM**

  * `SsmPort`: `getParameter(name, withDecryption?)`
    **Use for:** parameterized configs.

* **SNS**

  * `SnsPort`: `publish(topicArn, message, attributes?)`
    **Use for:** fan-out domain notifications.

* **SQS**

  * `SqsPort`: `sendMessage`, `deleteMessage`, `receiveMessages`
  * `SqsSendMessageInput` with optional delay and attributes
    **Use for:** background processing, reminders, invitations.

---

### `s3Presign.ts` — Presigned URL port

* **`interface S3Presigner`**

  * `getObjectUrl({ bucket, key, expiresInSeconds?, responseContentType?, responseContentDisposition? }): Promise<string>`
  * `putObjectUrl({ bucket, key, expiresInSeconds?, contentType?, acl?, cacheControl?, metadata?, kmsKeyId? }): Promise<string>`
    **Use for:** secure, time-boxed uploads/downloads without surfacing credentials.

---

## Hexagonal Architecture Placement

| Layer              | Responsibility                                                            | Modules / Contracts                                                            |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Use Cases**      | Depend on **ports** (`S3Port`, `KmsPort`, …). No AWS SDK imports.         | `ports.ts`                                                                     |
| **Adapters/Infra** | Implement ports with AWS SDK v3; use retry helpers and error classifiers. | `errors.ts`, `retry.ts`, `region.ts`, `partition.ts`, `s3Presign.ts`, `ddb.ts` |
| **Domain**         | No AWS coupling. Pure entities/VOs/rules.                                 | —                                                                              |
| **Controllers**    | Never call AWS directly; invoke use cases.                                | —                                                                              |

**Guidelines**

* Define adapter classes like `S3Adapter implements S3Port` in your service’s `adapters/aws/…`.
* Centralize retry policy using `shouldRetry` + `isAwsRetryable`; instrument delays with metrics.
* Validate config early: `requireRegion`, `isValidRegion`, fail fast on misconfiguration.
* Keep ARNs as `ArnParts` internally when you need to inspect/manipulate; serialize with `formatArn` close to the boundary.

---

## Usage Examples

### 1) S3 Adapter with retries

```ts
import { S3Port, isAwsRetryable, shouldRetry, BackoffOptions } from "@lawprotect365/shared/aws";
// import AWS SDK v3 S3Client ... in your service adapter

export class S3Adapter implements S3Port {
  constructor(private client: any) {}

  async putObject(input: S3PutObjectInput) {
    const opts: BackoffOptions = { baseMs: 100, capMs: 8000, jitter: "full" };
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // translate input → SDK command
        const res = await this.client.send(/* PutObjectCommand */);
        return { etag: res.ETag, versionId: res.VersionId };
      } catch (err) {
        const d = shouldRetry(attempt, 5, isAwsRetryable, err, opts);
        if (!d.retry) throw err;
        await new Promise((r) => setTimeout(r, d.delayMs));
        attempt++;
      }
    }
  }

  // implement getObject/headObject/deleteObject similarly…
}
```

### 2) Parsing ARNs

```ts
import { isArn, parseArn, extractResourceId } from "@lawprotect365/shared/aws";

function describeKmsKey(arn: string) {
  if (!isArn(arn)) throw new Error("Bad ARN");
  const parts = parseArn(arn);            // { service: "kms", resource: "key/abcd-123" }
  const keyId = extractResourceId(parts.resource); // "abcd-123"
  return { region: parts.region, accountId: parts.accountId, keyId };
}
```

### 3) Use case depending on a port

```ts
import type { S3Port } from "@lawprotect365/shared/aws";

export async function createEvidence(s3: S3Port, bucket: string, key: string, data: Uint8Array) {
  await s3.putObject({ bucket, key, body: data, contentType: "application/pdf", acl: "private" });
  return { bucket, key };
}
```

### 4) Presigned URL generation via port

```ts
import type { S3Presigner } from "@lawprotect365/shared/aws";

export async function getUploadUrl(presigner: S3Presigner, bucket: string, key: string) {
  return presigner.putObjectUrl({ bucket, key, contentType: "application/pdf", expiresInSeconds: 600 });
}
```

### 5) Region & partition

```ts
import { requireRegion, detectPartition } from "@lawprotect365/shared/aws";

const region = requireRegion();         // throws if not configured
const partition = detectPartition(region); // "aws" | "aws-cn" | "aws-us-gov"
```

---

## Testing Tips

* Mock **ports**, not SDK clients, in use-case tests.
* Unit-test adapters with the real SDK against **localstack** or using **nock**.
* Verify backoff behavior deterministically by stubbing the RNG if needed (provide a wrapper in adapters; shared uses secure RNG internally).

---

## Notes

* Retry jitter uses **secure RNG** only; it **throws** if `globalThis.crypto.getRandomValues` is unavailable. Provide a polyfill in environments without WebCrypto.
* `ddb.ts` remains SDK-agnostic; prefer marshalling in adapters so repositories remain pure.

---

```
```
