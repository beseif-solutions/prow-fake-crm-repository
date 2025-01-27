import { StaticCredentials } from "@beseif-solutions/zapdos-core";
import { getUser } from "../commons/functions";

export type App = {
  id: number,
  token: string,
};

const appCredentials: StaticCredentials<{ credentials: App }> = {
  id: `app-credentials`,
  model: `credentials`,
  type: `static`,
  sandbox: false,
  fields: [
    {
      key: `id`,
      type: `number`,
      float: false,
      required: true,
    },
    {
      key: `token`,
      type: `string`,
      required: true,
    }
  ],
  functions: {
    check: async (core, configuration) => {
      try {
        // call the API's authentication user endpoint
        await getUser(core, configuration);
        // if no error is raised the authentication data is valid
        return { valid: true };
      } catch (e) { return { valid: false }; }
    },
  },
  helpers: {
    user: async (core, configuration) => getUser(core, configuration),
  },
};

export default appCredentials;