import { CoreFunction } from "@beseif-solutions/zapdos-core";
import { App } from "../credentials/app-credentials";
import { Token } from "../credentials/login-credentials";
import { OAuth } from "../credentials/oauth-credentials";

export type User = {
  id: number,
  username: string,
  webhook: string,
};

export const getUser: CoreFunction<{
  credentials: App | Token | OAuth,
  inputs: undefined,
  outputs: User,
}> = async (core, configuration) => {
  try {
    const { data } = await core.axios.get<User>(`/auth/user`, {
      baseURL: await core.env.read(`HOST`),
      headers: {
        ...(`id` in configuration.credentials) ? {
          // app
          "x-app-id": `${configuration.credentials.id}`,
          "x-app-token": `${configuration.credentials.token}`,
        } :
          (`access_token` in configuration.credentials) ? {
            // oauth
            "Authorization": `Bearer ${configuration.credentials.access_token}`,
          } : {
            // login
            "Authorization": `Bearer ${configuration.credentials.token}`,
          },
      },
    });

    return data;
  } catch (e) { throw e; }
}