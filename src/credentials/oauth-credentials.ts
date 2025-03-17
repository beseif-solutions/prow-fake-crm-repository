import { OAuthCredentials } from "@beseif-solutions/prow-core";
import { getUser } from "../commons/functions";

export type OAuth = {
  id_token: string,
  access_token: string,
  expires_in: number,
  scope: string,
  token_type: string,
  refresh_token: string,
};

const oauthCredentials: OAuthCredentials<{ credentials: OAuth }> = {
  id: `oauth-credentials`,
  model: `credentials`,
  type: `oauth`,
  sandbox: false,
  functions: {
    oauth: async (core, configuration) => {
      try {
        return {
          method: `GET`,
          action: `${await core.env.read(`HOST`)}/auth/account`,
          body: {
            client_id: await core.env.read(`CLIENT_ID`),
            redirect_uri: configuration.inputs.redirect,
            response_type: `code`,
            access_type: `offline`,
            scope: `*`,
          },
        };
      } catch (e) { throw e; }
    },
    connect: async (core, configuration) => {
      try {
        // obtain the credentials
        const oauth2 = (await core.axios.post(`/auth/token`, {
          client_id: await core.env.read(`CLIENT_ID`),
          client_secret: await core.env.read(`CLIENT_SECRET`),
          grant_type: `authorization_code`,
          scope: `*`,
          redirect_uri: configuration.inputs.redirect,
          code: configuration.inputs.code,
        }, {
          baseURL: await core.env.read(`HOST`),
        })).data as OAuth;
        if (!oauth2.access_token || !oauth2.refresh_token) { throw new Error(`No valid credentials: missing access_token or refresh_token`); }

        // get user
        const user = await getUser(core, {
          sandbox: false,
          credentials: oauth2,
        });

        return {
          username: user.username,
          credentials: oauth2,
        };
      } catch (e) { throw e; }
    },
    refresh: async (core, configuration) => {
      try {
        const oauth2 = (await core.axios.post(`/auth/token`, {
          client_id: await core.env.read(`CLIENT_ID`),
          client_secret: await core.env.read(`CLIENT_SECRET`),
          grant_type: `refresh_token`,
          // old credentials refresh_token
          refresh_token: configuration.credentials.refresh_token,
        }, {
          baseURL: await core.env.read(`HOST`),
        })).data as OAuth;
        if (!oauth2.access_token) { throw new Error(`No valid credentials: missing access_token`); }

        // get user
        const user = await getUser(core, {
          sandbox: false,
          credentials: oauth2,
        });

        return {
          username: user.username,
          credentials: { ...oauth2, refresh_token: configuration.credentials.refresh_token },
        };
      } catch (e) { throw e; }
    },
    disconnect: async (core, configuration) => {
      try {
        await core.axios.post(`/auth/revoke`, {
          id: configuration.credentials.id_token,
        }, {
          baseURL: await core.env.read(`HOST`),
        });
        return { done: true };
      } catch (e) { throw e; }
    },
    check: async (core, configuration) => {
      try {
        const user = await getUser(core, configuration);
        return { valid: true, username: user.username };
      } catch (e) { return { valid: false }; }
    },
  },
  helpers: {
    user: async (core, configuration) => getUser(core, configuration),
  },
};

export default oauthCredentials;