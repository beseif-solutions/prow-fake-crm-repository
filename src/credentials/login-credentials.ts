import { SessionCredentials } from "@beseif-solutions/prow-core/dist/entities/credentials";
import { getUser } from "../commons/functions";

export type Token = {
  token: string,
};

const loginCredentials: SessionCredentials<{ credentials: Token }> = {
  id: `login-credentials`,
  model: `credentials`,
  type: `session`,
  sandbox: false,
  fields: [
    {
      key: `username`,
      type: `string`,
      required: true,
    },
    {
      key: `password`,
      type: `string`,
      required: true,
      as_password: true,
    }
  ],
  functions: {
    connect: async (core, configuration) => {
      try {
        const { data: auth } = await core.axios.post<Token>(`/auth/login`, {
          username: configuration.inputs.fields.username,
          password: configuration.inputs.fields.password,
        }, {
          baseURL: await core.env.read(`HOST`),
        });

        const user = await getUser(core, {
          credentials: auth,
          sandbox: configuration.sandbox,
        });

        return {
          username: user.username,
          credentials: auth,
        };
      } catch (e) { throw e; }
    },
    check: async (core, configuration) => {
      try {
        await getUser(core, configuration);
        return { valid: true, };
      } catch (e) { return { valid: false }; }
    },
  },
  helpers: {
    user: async (core, configuration) => getUser(core, configuration),
  },
};

export default loginCredentials;