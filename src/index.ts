import { Provider } from "@beseif-solutions/zapdos-core";
import newOrder from "./triggers/new-order";
import orderStatusChanged from "./triggers/order-status-changed";
import oauthCredentials from "./credentials/oauth-credentials";
import loginCredentials from "./credentials/login-credentials";
import appCredentials from "./credentials/app-credentials";

const provider: Provider = {
  id: `fake-crm`,
  model: `provider`,
  categories: [`crm`],
  credentials: {
    [appCredentials.id]: appCredentials,
    [loginCredentials.id]: loginCredentials,
    [oauthCredentials.id]: oauthCredentials,
  },
  triggers: {
    [orderStatusChanged.id]: orderStatusChanged,
    [newOrder.id]: newOrder,
  },
  actions: {},
};

export default provider;