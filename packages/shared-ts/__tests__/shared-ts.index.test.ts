/**
 * @file shared.index.test.ts
 * @summary Verifies that the root package index re-exports public APIs from submodules.
 *
 * This test checks:
 *  - Specific, well-known symbols are re-exported (spot checks).
 *  - For each submodule, its (non-default) exports appear on the root index with the same references.
 *  - No default export is present.
 */

import * as root from "../src/index.js";

// Submodules listed in the same order as the root barrel.
import * as contracts from "../src/contracts";
import * as httpErrors from "../src/errors/index.js";
import * as aws from "../src/aws/index.js";
import * as utils from "../src/utils/index.js";
import * as types from "../src/types/index.js";
import * as cachePorts from "../src/cache/ports.js";
import * as auth from "../src/auth/index.js";
import * as config from "../src/config/index.js";
import * as messagingPorts from "../src/messaging/ports.js";
import * as storagePorts from "../src/storage/ports.js";
import * as validation from "../src/validation/index.js";
import * as http from "../src/http/index.js";

describe("root index re-exports", () => {
  it("spot-checks a few known symbols from major submodules", () => {
    // contracts
    expect(typeof (root as any).composeController).toBe("function");

    // aws
    expect(typeof (root as any).requireUpdate).toBe("function");

    // validation
    expect(typeof (root as any).NonEmptyStringSchema?.parse).toBe("function");

    // http
    expect(typeof (root as any).withControllerLogging).toBe("function");
    expect(typeof (root as any).withObservability).toBe("function");
    expect(typeof (root as any).withRequestContext).toBe("function");
    expect(typeof (root as any).mapAwsError).toBe("function");

    // errors
    expect((root as any).ErrorCodes).toBeDefined();
  });

  it("re-exports all unique (non-default) symbols from each submodule by reference", () => {
    const seen = new Set<string>();
    const checkModule = (mod: Record<string, unknown>) => {
      for (const k of Object.keys(mod)) {
        if (k === "default" || seen.has(k)) continue; // skip default and duplicates
        expect((root as any)[k]).toBe((mod as any)[k]);
        seen.add(k);
      }
    };

    checkModule(contracts);
    checkModule(httpErrors);
    checkModule(aws);
    checkModule(utils);
    checkModule(types);
    checkModule(cachePorts);
    checkModule(auth);
    checkModule(config);
    checkModule(messagingPorts);
    checkModule(storagePorts);
    checkModule(validation);
    checkModule(http);
  });

  it("does not define a default export on the root index", () => {
    expect((root as any).default).toBeUndefined();
  });
});
