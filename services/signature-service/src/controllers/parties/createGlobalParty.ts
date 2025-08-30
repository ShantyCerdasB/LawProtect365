/**
 * @file createGlobalParty.ts
 * @summary Controller for creating a new global party (contact)
 * @description Handles POST /parties requests for creating global parties in the address book
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { created, validateRequest } from "@lawprotect/shared-ts";
import { wrapController, corsFromEnv } from "../../middleware/http";
import { tenantFromCtx, actorFromCtx } from "../../middleware/auth";
import { CreatePartyBody } from "../../schemas/parties/CreateParty.schema";
import { createGlobalPartyApp } from "../../app/services/Parties/CreateGlobalPartyApp.service";
import { getContainer } from "../../infra/Container";
import { toTenantId } from "../../app/ports/shared";
import { makeGlobalPartiesCommandsPort } from "../../app/adapters/parties/MakeGlobalPartiesCommandsPort";
import { makeGlobalPartiesQueriesPort } from "../../app/adapters/parties/MakeGlobalPartiesQueriesPort";
import { CreateGlobalPartyUseCase } from "../../use-cases/parties/CreateGlobalPartyUseCase";
import { UpdateGlobalPartyUseCase } from "../../use-cases/parties/UpdateGlobalPartyUseCase";
import { DeleteGlobalPartyUseCase } from "../../use-cases/parties/DeleteGlobalPartyUseCase";
import { DelegateGlobalPartyUseCase } from "../../use-cases/parties/DelegateGlobalPartyUseCase";
import { UpdateDelegationUseCase } from "../../use-cases/parties/UpdateDelegationUseCase";
import { DeleteDelegationUseCase } from "../../use-cases/parties/DeleteDelegationUseCase";
import { GetGlobalPartyUseCase } from "../../use-cases/parties/GetGlobalPartyUseCase";
import { ListGlobalPartiesUseCase } from "../../use-cases/parties/ListGlobalPartiesUseCase";
import { FindByEmailUseCase } from "../../use-cases/parties/FindByEmailUseCase";
import { GetDelegationsUseCase } from "../../use-cases/parties/GetDelegationsUseCase";
import { GlobalPartyRepositoryDdb } from "../../adapters/dynamodb/GlobalPartyRepositoryDdb";

const base: HandlerFn = async (evt) => {
  const { body } = validateRequest(evt, { body: CreatePartyBody });

  const tenantId = toTenantId(tenantFromCtx(evt));
  const actor = actorFromCtx(evt);

  const c = getContainer();
  
  // Create repository and adapters
  const globalPartyRepository = new GlobalPartyRepositoryDdb(c.aws.ddb, "GlobalPartiesTable");
  
  // Create use cases with proper dependencies
  const createGlobalPartyUseCase = new CreateGlobalPartyUseCase({
    globalPartiesCommands: makeGlobalPartiesCommandsPort({
      createGlobalPartyUseCase: new CreateGlobalPartyUseCase({
        globalPartiesCommands: makeGlobalPartiesCommandsPort({
          createGlobalPartyUseCase: new CreateGlobalPartyUseCase({
            globalPartiesCommands: globalPartyRepository,
            globalPartiesQueries: globalPartyRepository,
          }),
          updateGlobalPartyUseCase: new UpdateGlobalPartyUseCase({
            globalPartiesCommands: globalPartyRepository,
            globalPartiesQueries: globalPartyRepository,
          }),
          deleteGlobalPartyUseCase: new DeleteGlobalPartyUseCase({
            globalPartiesCommands: globalPartyRepository,
            globalPartiesQueries: globalPartyRepository,
          }),
          delegateGlobalPartyUseCase: new DelegateGlobalPartyUseCase({
            globalPartiesCommands: globalPartyRepository,
            globalPartiesQueries: globalPartyRepository,
          }),
          updateDelegationUseCase: new UpdateDelegationUseCase({
            globalPartiesCommands: globalPartyRepository,
            globalPartiesQueries: globalPartyRepository,
          }),
          deleteDelegationUseCase: new DeleteDelegationUseCase({
            globalPartiesCommands: globalPartyRepository,
            globalPartiesQueries: globalPartyRepository,
          }),
        }),
        globalPartiesQueries: globalPartyRepository,
      }),
      updateGlobalPartyUseCase: new UpdateGlobalPartyUseCase({
        globalPartiesCommands: globalPartyRepository,
        globalPartiesQueries: globalPartyRepository,
      }),
      deleteGlobalPartyUseCase: new DeleteGlobalPartyUseCase({
        globalPartiesCommands: globalPartyRepository,
        globalPartiesQueries: globalPartyRepository,
      }),
      delegateGlobalPartyUseCase: new DelegateGlobalPartyUseCase({
        globalPartiesCommands: globalPartyRepository,
        globalPartiesQueries: globalPartyRepository,
      }),
      updateDelegationUseCase: new UpdateDelegationUseCase({
        globalPartiesCommands: globalPartyRepository,
        globalPartiesQueries: globalPartyRepository,
      }),
      deleteDelegationUseCase: new DeleteDelegationUseCase({
        globalPartiesCommands: globalPartyRepository,
        globalPartiesQueries: globalPartyRepository,
      }),
    }),
    globalPartiesQueries: globalPartyRepository,
  });

  const result = await createGlobalPartyApp(
    {
      tenantId,
      email: body.email.toString(),
      name: body.name.toString(),
      phone: body.phone?.toString(),
      role: body.role,
      source: body.source,
      metadata: body.metadata,
      notificationPreferences: body.notificationPreferences,
    },
    {
      createGlobalPartyUseCase,
    }
  );

  return created({ data: result });
};

export const handler = wrapController(base, {
  auth: true,
  observability: { logger: () => console, metrics: () => ({} as any), tracer: () => ({} as any) },
  cors: corsFromEnv(),
});
