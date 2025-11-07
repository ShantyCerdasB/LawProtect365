import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";

/**
 * Fetches the raw SecretString for a given Secrets Manager ARN.
 */
export const getSecretString = async (secretArn: string): Promise<string> => {
  const client = new SecretsManagerClient({});
  const out = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (out.SecretString != null) return out.SecretString;
  if (out.SecretBinary != null) return Buffer.from(out.SecretBinary as any).toString("utf8");
  return "";
};

/**
 * Returns parsed JSON of a Secrets Manager secret.
 */
export const getSecretJson = async <T = Record<string, unknown>>(secretArn: string): Promise<T> => {
  const s = await getSecretString(secretArn);
  try {
    return JSON.parse(s || "{}") as T;
  } catch {
    throw new Error("Secret string is not valid JSON");
  }
};

/**
 * Extracts a field from a JSON secret (e.g., DATABASE_URL).
 */
export const getSecretField = async (secretArn: string, field: string): Promise<string> => {
  const obj = await getSecretJson<Record<string, unknown>>(secretArn);
  const v = (obj as any)[field] as string | undefined;
  if (!v) throw new Error(`Field ${field} missing in secret`);
  return v;
};

/**
 * Convenience helper for common case.
 */
export const resolveDatabaseUrlFromSecret = async (secretArn: string): Promise<string> => {
  const obj = await getSecretJson<Record<string, unknown>>(secretArn);
  const url = (obj as any).DATABASE_URL || (obj as any).database_url || (obj as any).url;
  if (!url) throw new Error("DATABASE_URL missing in secret");
  return String(url);
};

/**
 * Decrypts a base64-encoded ciphertext using AWS KMS.
 * Use only for data encrypted directly with KMS, not Secrets Manager.
 */
export const kmsDecryptBase64 = async (ciphertextBase64: string, keyId?: string): Promise<string> => {
  const client = new KMSClient({});
  const out = await client.send(new DecryptCommand({
    CiphertextBlob: Buffer.from(ciphertextBase64, "base64"),
    KeyId: keyId,
  }));
  return Buffer.from(out.Plaintext as Uint8Array).toString("utf8");
};
