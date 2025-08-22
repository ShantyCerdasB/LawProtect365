/**
 * @file http.index.test.ts
 * @summary Ensures the HTTP barrel re-exports the public API (100% line coverage).
 */

import * as HTTP from '../../src/http/index.js';
import * as HttpTypesMod from '../../src/http/httpTypes.js';
import * as ResponsesMod from '../../src/http/responses.js';
import * as CorsMod from '../../src/http/cors.js';
import * as ApiHandlerMod from '../../src/http/apiHandler.js';
import * as RequestMod from '../../src/http/request.js';
import * as MiddlewareMod from '../../src/http/middleware.js';


describe('http index (barrel) re-exports', () => {
  it('re-exports selected runtime symbols with identity preserved', () => {
    // httpTypes
    expect(HTTP.HttpStatus).toBe(HttpTypesMod.HttpStatus);

    // responses
    expect(HTTP.json).toBe(ResponsesMod.json);
    expect(HTTP.ok).toBe(ResponsesMod.ok);
    expect(HTTP.created).toBe(ResponsesMod.created);
    expect(HTTP.noContent).toBe(ResponsesMod.noContent);
    expect(HTTP.badRequest).toBe(ResponsesMod.badRequest);
    expect(HTTP.unauthorized).toBe(ResponsesMod.unauthorized);
    expect(HTTP.forbidden).toBe(ResponsesMod.forbidden);
    expect(HTTP.notFound).toBe(ResponsesMod.notFound);
    expect(HTTP.conflict).toBe(ResponsesMod.conflict);
    expect(HTTP.unsupportedMedia).toBe(ResponsesMod.unsupportedMedia);
    expect(HTTP.unprocessable).toBe(ResponsesMod.unprocessable);
    expect(HTTP.tooManyRequests).toBe(ResponsesMod.tooManyRequests);
    expect(HTTP.internalError).toBe(ResponsesMod.internalError);
    expect(HTTP.notImplemented).toBe(ResponsesMod.notImplemented);

    // cors
    expect(HTTP.buildCorsHeaders).toBe(CorsMod.buildCorsHeaders);
    expect(HTTP.isPreflight).toBe(CorsMod.isPreflight);
    expect(HTTP.preflightResponse).toBe(CorsMod.preflightResponse);

    // api handler & helpers
    expect(HTTP.apiHandler).toBe(ApiHandlerMod.apiHandler);
    expect(HTTP.getHeader).toBe(RequestMod.getHeader);
    expect(HTTP.getPathParam).toBe(RequestMod.getPathParam);
    expect(HTTP.getQueryParam).toBe(RequestMod.getQueryParam);
    expect(HTTP.getJsonBody).toBe(RequestMod.getJsonBody);

    // middleware & controller factory
    expect(HTTP.compose).toBe(MiddlewareMod.compose);

  });

  it('exposes all runtime named exports from each submodule', () => {
    const assertAllExportsPresent = (mod: Record<string, unknown>) => {
      for (const key of Object.keys(mod)) {
        if (key === 'default' || key === '__esModule') continue;
        expect(Object.prototype.hasOwnProperty.call(HTTP, key)).toBe(true);
      }
    };

    assertAllExportsPresent(HttpTypesMod);
    assertAllExportsPresent(ResponsesMod);
    assertAllExportsPresent(CorsMod);
    assertAllExportsPresent(ApiHandlerMod);
    assertAllExportsPresent(RequestMod);
    assertAllExportsPresent(MiddlewareMod);
  });

  it('smoke-tests a couple of helpers via the barrel', () => {
    const ok = HTTP.ok({ ping: true });
    // Narrow union just in case downstream types consider string responses
    const structured = typeof ok === 'string' ? ({ statusCode: 200, body: ok } as any) : ok;
    expect(structured.statusCode).toBe(200);
    expect(JSON.parse(String(structured.body))).toEqual({ ping: true });

    const cors = HTTP.buildCorsHeaders({ allowOrigins: '*', allowMethods: ['GET'] } as any);
    expect(cors['Access-Control-Allow-Origin']).toBe('*');
  });
});
