/**
 * @file cors.test.ts
 * @summary Tests for buildDefaultCors (100% line & branch coverage).
 */

import { buildDefaultCors } from '../../src/config/cors.js';

describe('buildDefaultCors', () => {
  const METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
  const HEADERS = ["content-type", "authorization", "x-request-id", "x-csrf-token", "x-amz-date"];
  const EXPOSE = ["x-request-id", "x-next-cursor"];

  it('usa valores por defecto: origins="*" y allowCredentials=false', () => {
    const cfg = buildDefaultCors();

    expect(cfg).toEqual({
      allowOrigins: "*",
      allowMethods: METHODS,
      allowHeaders: HEADERS,
      exposeHeaders: EXPOSE,
      allowCredentials: false,
      maxAgeSeconds: 600,
    });
  });

  it('acepta un array de origins y allowCredentials=true', () => {
    const origins = ["https://a.com", "https://b.com"];

    const cfg = buildDefaultCors(origins, true);

    expect(cfg.allowOrigins).toEqual(origins); // rama Array.isArray === true
    expect(cfg.allowCredentials).toBe(true);
    expect(cfg.allowMethods).toEqual(METHODS);
    expect(cfg.allowHeaders).toEqual(HEADERS);
    expect(cfg.exposeHeaders).toEqual(EXPOSE);
    expect(cfg.maxAgeSeconds).toBe(600);
  });

  it('acepta "*" explícito y allowCredentials=false', () => {
    const cfg = buildDefaultCors("*", false);

    expect(cfg.allowOrigins).toBe("*"); // rama Array.isArray === false
    expect(cfg.allowCredentials).toBe(false);
    expect(cfg.allowMethods).toEqual(METHODS);
    expect(cfg.allowHeaders).toEqual(HEADERS);
    expect(cfg.exposeHeaders).toEqual(EXPOSE);
    expect(cfg.maxAgeSeconds).toBe(600);
  });
});
