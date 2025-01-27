import { ScheduledTrigger } from "@beseif-solutions/prow-core";
import { getOrders, Order, OrderStatus } from "../commons/functions";
import appCredentials, { App } from "../credentials/app-credentials";
import loginCredentials, { Token } from "../credentials/login-credentials";
import oauthCredentials, { OAuth } from "../credentials/oauth-credentials";

const newOrder: ScheduledTrigger<{
  credentials: OAuth | App | Token,
  flags: { outputs: [`done`] },
  outputs: Order,
}> = {
  id: `new-order`,
  model: `event`,
  type: `trigger`,
  categories: [`crm`],
  immediate: false,
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
  fields: [],
  functions: {
    poll: async (core, configuration) => {
      try {
        const orders = await getOrders(core, {
          credentials: configuration.credentials,
          sandbox: configuration.sandbox,
        });

        const records = orders
          .filter((o) => !configuration.inputs.last_schedule || core.moment(o.register_date).isAfter(configuration.inputs.last_schedule))
          .filter((o) => o.status === OrderStatus.Pending)
          .slice(0, configuration.inputs.limit);

        return { records: records, flags: { done: true } };
      } catch (e) { throw e; }
    },
  },
  helpers: {},
  examples: [],
};

export default newOrder;