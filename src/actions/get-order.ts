import { Action } from "@beseif-solutions/prow-core";
import appCredentials, { App } from "../credentials/app-credentials";
import loginCredentials, { Token } from "../credentials/login-credentials";
import oauthCredentials, { OAuth } from "../credentials/oauth-credentials";
import { Order, getOrder as get } from "../commons/functions";

const getOrder: Action<{
  credentials: OAuth | App | Token,
  flags: { inputs: [`do`], outputs: [`done`, `error`] },
  outputs: Order | { message: string },
}> = {
  id: `get-order`,
  model: `event`,
  type: `action`,
  categories: [`crm`],
  sandbox: false,
  credentials: [
    appCredentials.id,
    loginCredentials.id,
    oauthCredentials.id,
  ],
  inputs: [
    {
      key: `do`,
      default: true,
    },
  ],
  outputs: [
    {
      key: `done`,
      default: true,
    },
    {
      key: `error`,
      error: true,
    }
  ],
  fields: [
    {
      key: `id`,
      type: `number`,
      float: false,
    }
  ],
  functions: {
    execute: async (core, configuration) => {
      try {
        const order = await get(core, {
          credentials: configuration.credentials,
          sandbox: configuration.sandbox,
          inputs: {
            id: configuration.inputs.fields.id,
          }
        });
        if (!order) { throw new Error(`Order with id ${configuration.inputs.fields.id} not found`); }

        return {
          output: order,
          flags: { done: true },
        };
      } catch (e) {
        return {
          output: { message: e.message || `Unknown error` },
          flags: { error: true },
        };
      }
    },
  },
  helpers: {},
  examples: [],
};

export default getOrder;