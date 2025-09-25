/**
 * Utilities for working with S3 URIs and object keys (pure, SDK-agnostic).
 * Provides parsing/formatting of s3:// URIs, key joining/inspection,
 * validity checks, and HTTP URL construction (virtual-hosted or path-style).
 * @remarks
 * - Replaced regex-based edge-slash trimming in `joinKey` (and related helpers) with loop-based functions to avoid potential super-linear backtracking.
 */

export interface S3Uri {
  /** S3 bucket name. */
  bucket: string;
  /** S3 object key. */
  key: string;
}

// Internal helpers for slash trimming (no regex, linear time).
const stripLeadingSlashes = (s: string): string => {
  let i = 0;
  while (i < s.length && s.charCodeAt(i) === 47 /* '/' */) i++;
  return s.slice(i);
};
const stripTrailingSlashes = (s: string): string => {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 47 /* '/' */) end--;
  return s.slice(0, end);
};
const stripEdgeSlashes = (s: string): string => stripTrailingSlashes(stripLeadingSlashes(s));

/**
 * Parses an s3:// URI into bucket and key.
 * @param uri S3 URI (e.g., "s3://bucket/path/to/file.pdf").
 * @throws Error when the URI is not a valid S3 URI.
 */
export const parseS3Uri = (uri: string): S3Uri => {
  if (!uri?.startsWith("s3://")) {
    throw new Error(`Invalid S3 URI: ${uri}`);
  }
  const rest = uri.slice("s3://".length);
  const slash = rest.indexOf("/");
  if (slash < 0) {
    return { bucket: rest, key: "" };
  }
  const bucket = rest.slice(0, slash);
  const key = rest.slice(slash + 1);
  return { bucket, key };
};

/**
 * Formats bucket and key into an s3:// URI.
 * @param bucket S3 bucket name.
 * @param key S3 object key.
 */
export const formatS3Uri = (bucket: string, key: string): string =>
  `s3://${bucket}/${stripLeadingSlashes(String(key ?? ""))}`;

/**
 * Returns true if the string looks like an S3 URI.
 * @param uri Candidate URI.
 */
export const isS3Uri = (uri: string): boolean => /^s3:\/\//i.test(uri);

/**
 * Joins segments into an S3 key using POSIX-style separators.
 * @param parts Key segments (can contain slashes).
 */
export const joinKey = (...parts: Array<string | undefined | null>): string =>
  parts
    .filter((p): p is string => Boolean(p))
    .map((p) => stripEdgeSlashes(p))
    .filter(Boolean)
    .join("/");

/**
 * Returns the directory portion of a key (without trailing slash), or "".
 * @param key Object key.
 */
export const dirname = (key: string): string => {
  const idx = key.lastIndexOf("/");
  return idx <= 0 ? "" : key.slice(0, idx);
};

/**
 * Returns the base name of a key (after the last slash).
 * @param key Object key.
 */
export const basename = (key: string): string => {
  const idx = key.lastIndexOf("/");
  return idx < 0 ? key : key.slice(idx + 1);
};

/**
 * Ensures a key starts with a given prefix.
 * @param key Object key.
 * @param prefix Prefix folder (e.g., "public/").
 */
export const ensurePrefix = (key: string, prefix: string): string => {
  const cleanPrefix = stripEdgeSlashes(prefix);
  const cleanKey = stripLeadingSlashes(key);
  return cleanKey.startsWith(`${cleanPrefix}/`) ? cleanKey : `${cleanPrefix}/${cleanKey}`;
};

/**
 * Validates an S3 bucket name against common AWS constraints.
 * @param name Bucket name.
 */
export const isValidBucketName = (name: string): boolean => {
  if (!name || name.length < 3 || name.length > 63) return false;
  if (!/^[a-z0-9.-]+$/.test(name)) return false;
  if (!/^[a-z0-9]/.test(name) || !/[a-z0-9]$/.test(name)) return false;
  if (/\.\./.test(name) || /\.–/.test(name) || /–\./.test(name) || /--/.test(name)) {
    // double dot or double hyphen patterns
    // note: en dash guard above is defensive in case of unicode copy errors
  }
  // Disallow IP-like buckets
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(name)) return false;
  return true;
};

/**
 * Validates an S3 key for basic constraints (length and control chars).
 * @remarks
 * - Replaced the control-character regex with a deterministic loop to satisfy linters and avoid any backtracking risks.
 * - Removed the duplicate `isValidKey` definition.
 * @param key Object key.
 * @returns `true` when `key` is a string of length 1..1024 and contains no ASCII control characters.
 */
export const isValidKey = (key: string): boolean => {
  if (typeof key !== "string") return false;
  if (key.length === 0 || key.length > 1024) return false;

  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return false; // ASCII control chars U+0000–U+001F and U+007F
  }
  return true;
};

/**
 * Builds an HTTPS URL for an S3 object (no signing).
 * @param bucket Bucket name.
 * @param key Object key.
 * @param region AWS region (e.g., "us-east-1").
 * @param opts URL style options.
 */
export const toHttpUrl = (
  bucket: string,
  key: string,
  region: string,
  opts: { virtualHosted?: boolean; dualstack?: boolean; accelerate?: boolean } = {}
): string => {
  const encodedKey = encodeURI(stripLeadingSlashes(String(key ?? "")));
  const isUsEast1 = region === "us-east-1";
  const dual = opts.dualstack ? ".dualstack" : "";
  if (opts.accelerate) {
    // Accelerate endpoints do not include region in hostname
    const host = `${bucket}.s3-accelerate${dual}.amazonaws.com`;
    return `https://${host}/${encodedKey}`;
  }
  if (opts.virtualHosted !== false) {
    const host = isUsEast1
      ? `${bucket}.s3${dual}.amazonaws.com`
      : `${bucket}.s3${dual}.${region}.amazonaws.com`;
    return `https://${host}/${encodedKey}`;
  }
  // Path-style (legacy in many regions)
  const host = isUsEast1 ? `s3${dual}.amazonaws.com` : `s3${dual}.${region}.amazonaws.com`;
  return `https://${host}/${bucket}/${encodedKey}`;
};

/**
 * Minimal content-type guesser by file extension.
 * @param filename File name.
 */
export const guessContentType = (filename: string): string | undefined => {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    txt: "text/plain; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    json: "application/json; charset=utf-8",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    zip: "application/zip",
    xml: "application/xml",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
  return map[ext];
};

/**
 * Converts a ReadableStream to Buffer
 * @param stream - ReadableStream to convert
 * @returns Promise resolving to Buffer
 */
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const resultBuffer = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    resultBuffer.set(chunk, offset);
    offset += chunk.length;
  }
  
  return Buffer.from(resultBuffer);
}

/**
 * Converts various body types to Buffer
 * @param body - Document body (Buffer, Uint8Array, or ReadableStream)
 * @returns Promise resolving to Buffer
 */
async function convertBodyToBuffer(body: unknown): Promise<Buffer> {
  if (body instanceof Buffer) {
    return body;
  }
  
  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }
  
  if (body instanceof ReadableStream) {
    return await streamToBuffer(body);
  }
  
  throw new Error('Unsupported body type');
}

/**
 * Handles S3 download errors with appropriate error messages
 * @param error - Caught error
 * @param s3Key - S3 object key for context
 * @throws Error with appropriate message
 */
function handleS3DownloadError(error: unknown, s3Key: string): never {
  if (error instanceof Error && error.message.includes('NoSuchKey')) {
    throw new Error(`Document not found: ${s3Key}`);
  }
  throw new Error(`Failed to download document from S3: ${error instanceof Error ? error.message : error}`);
}

/**
 * Downloads document content from S3
 * @param s3Storage - S3EvidenceStorage instance
 * @param bucketName - S3 bucket name
 * @param s3Key - S3 object key
 * @returns Promise resolving to document content as Buffer
 * @throws NotFoundError when document is not found
 * @throws Error when download fails
 * @example
 * const content = await getDocumentContent(s3Storage, 'my-bucket', 'documents/file.pdf');
 */
export async function getDocumentContent(
  s3Storage: any, // S3EvidenceStorage type
  bucketName: string,
  s3Key: string
): Promise<Buffer> {
  try {
    const result = await s3Storage.getObject(bucketName, s3Key);
    
    if (!result.body) {
      throw new Error('Document content is empty');
    }

    return await convertBodyToBuffer(result.body);
  } catch (error) {
    handleS3DownloadError(error, s3Key);
  }
}