import { CoreFunction } from "@beseif-solutions/prow-core";
import { App } from "../credentials/app-credentials";
import { Token } from "../credentials/login-credentials";
import { OAuth } from "../credentials/oauth-credentials";

export type User = {
  id: number,
  username: string,
  sign: string,
  webhook: string,
};

export enum OrderStatus {
  Pending = `pending`,
  Fabricated = `fabricated`,
  Shipped = `shipped`,
  Delivered = `delivered`,
  Completed = `completed`,
}

export type Order = {
  id: number,
  client: number,
  sku: string,
  price: number,
  status: OrderStatus,
  user: number,
  register_date: string,
};

export const requestConfig: CoreFunction<{
  credentials: App | Token | OAuth,
  inputs: undefined,
}> = async (core, configuration) => ({
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
})

export const getUser: CoreFunction<{
  credentials: App | Token | OAuth,
  inputs: undefined,
  outputs: User,
}> = async (core, configuration) => {
  try {
    const { data } = await core.axios.get<User>(`/auth/user`,
      await requestConfig(core, configuration));

    return data;
  } catch (e) { throw e; }
}

export const getOrder: CoreFunction<{
  credentials: App | Token | OAuth,
  inputs: { id: number },
  outputs: Order,
}> = async (core, configuration) => {
  try {
    const { data } = await core.axios.get<{ data: Order }>(`/orders/${configuration.inputs.id}`,
      await requestConfig(core, configuration));

    return data.data;
  } catch (e) { throw e; }
}

export const getOrders: CoreFunction<{
  credentials: App | Token | OAuth,
  inputs: undefined,
  outputs: Order[],
}> = async (core, configuration) => {
  try {
    const { data } = await core.axios.get<{ count: number, data: Order[] }>(`/orders`,
      await requestConfig(core, configuration));

    return data.data;
  } catch (e) { throw e; }
}