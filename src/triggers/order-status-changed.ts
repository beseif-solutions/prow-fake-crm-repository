import { ImmediateTrigger } from "@beseif-solutions/prow-core";
import appCredentials, { App } from "../credentials/app-credentials";
import loginCredentials, { Token } from "../credentials/login-credentials";
import oauthCredentials, { OAuth } from "../credentials/oauth-credentials";
import { getOrder, getOrders, getUser, Order, OrderStatus, requestConfig } from "../commons/functions";
import { createHmac } from "crypto";

const orderStatusChanged: ImmediateTrigger<{
  credentials: OAuth | App | Token,
  flags: { outputs: [`done`] },
  outputs: Order,
}> = {
  id: `order-status-changed`,
  model: `event`,
  type: `trigger`,
  category: `crm`,
  immediate: true,
  sandbox: false,
  credentials: [
    appCredentials.id,
    loginCredentials.id,
    oauthCredentials.id,
  ],
  outputs: [
    {
      key: `done`,
      default: true,
    },
  ],
  fields: [
    {
      key: `statuses`,
      type: `string`,
      as_array: true,
      format: `select`,
      choices: Object.values(OrderStatus)
        .map((status) => ({
          key: status,
          value: status,
        })),
    }
  ],
  functions: {
    handle: async (core, configuration) => {
      try {
        const signature = configuration.inputs.request.headers[`x-signature`];
        if (!signature) { throw new Error(`Invalid request: signature not received`); }

        const user = await getUser(core, {
          credentials: configuration.credentials,
          sandbox: configuration.sandbox,
        });

        const payload = configuration.inputs.request.body;

        const hmac = createHmac(`sha256`, user.sign);
        hmac.update(JSON.stringify(payload));
        if (signature !== hmac.digest(`hex`)) { throw new Error(`Invalid request: signature verification failed`); }

        const statuses = configuration.inputs.fields.statuses as OrderStatus[];

        const records: Order[] = [];
        if (!statuses || statuses.length === 0 || statuses.includes(payload.status)) {
          const order = await getOrder(core, {
            credentials: configuration.credentials,
            sandbox: configuration.sandbox,
            inputs: { id: payload.order },
          });
          records.push(order);
        }

        return { records: records, flags: { done: true } };
      } catch (e) { throw e; }
    },
    fire: async (core, configuration) => {
      try {
        const orders = await getOrders(core, {
          credentials: configuration.credentials,
          sandbox: configuration.sandbox,
        });
        if (orders.length === 0) { return { done: false }; }

        const { data: { sent } } = await core.axios.post(`/orders/${orders[0].id}/webhook`, {
          webhook: configuration.inputs.link,
        }, await requestConfig(core, configuration));

        return { done: sent };
      } catch (e) { throw e; }
    },
    poll: async (core, configuration) => {
      try {
        const orders = await getOrders(core, {
          credentials: configuration.credentials,
          sandbox: configuration.sandbox,
        });

        const statuses = configuration.inputs.fields.statuses as OrderStatus[];

        const records = orders
          .filter((o) => !configuration.inputs.last_schedule || core.moment(o.register_date).isAfter(configuration.inputs.last_schedule))
          .filter((o) => !statuses || statuses.length === 0 || statuses.includes(o.status))
          .slice(0, configuration.inputs.limit);

        return { records: records, flags: { done: true } };
      } catch (e) { throw e; }
    }
  },
  helpers: {},
  examples: [],
};

export default orderStatusChanged;