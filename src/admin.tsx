import AdminDashboard, { fetchData, FlashProps } from "./AdminDashboard";
import { createClient, deleteClient, getClientById } from "./clients/clients";
import {
  createClientEndpoint,
  getClientEndpoint,
  getClientsEndpoint,
} from "./clients/endpoint";
import Env from "./env";
import { jwksRefreshEndpoint } from "./jwks/endpoint";
import { clearKeys, getKeyset, getSigningKey, saveNewKey } from "./jwks/keys";
import {
  changeUserEmail,
  changeUserPassword,
  createUser,
  deleteUser,
  getUserById,
} from "./users.ts/users";
import { getCodeData } from "./oidc/authorization";
import { generateToken } from "./oidc/token";
import { okReact } from "./frontend/render";

import { WorkerRouter } from "@worker-tools/router";
import { badRequest, found, ok } from "@worker-tools/response-creators";
import { basics, Context } from "@worker-tools/middleware";
import * as React from "react";

async function adminDashboard(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  const data = await fetchData(env);
  return okReact(<AdminDashboard request={req} env={env} data={data} />);
}

export enum AdminDashboardActionType {
  DeleteClient = "deleteClient",
  CreateClient = "createClient",
  RefreshKeys = "refreshKeys",
  ClearKeys = "clearKeys",
  ChangePassword = "changePassword",
  ChangeEmail = "changeEmail",
  DeleteUser = "deleteUser",
  CreateUser = "createUser",
}

const actionHandlers: Record<
  AdminDashboardActionType,
  (env: Env, formData: FormData) => Promise<FlashProps | void | null>
> = {
  [AdminDashboardActionType.DeleteClient]: async (env, formData) => {
    const paramsJSON = formData.get("params");
    if (paramsJSON == null) {
      throw new Error("Missing params");
    }
    const params = JSON.parse(paramsJSON);
    const id = params.id;
    if (id == null) {
      throw new Error("Missing ID");
    }
    await deleteClient(env, id);
    return {
      variant: "success",
      message: "Client deleted",
    };
  },
  [AdminDashboardActionType.CreateClient]: async (env, formData) => {
    const name = formData.get("name");
    if (name == null) {
      throw new Error("Missing client name");
    }
    const client = await createClient(env, name);
    return {
      variant: "success",
      message: `Client ${name} created with ID ${client.id}`,
    };
  },
  [AdminDashboardActionType.RefreshKeys]: async (env) => {
    await saveNewKey(env);
    return {
      variant: "success",
      message: "Keys refreshed",
    };
  },
  [AdminDashboardActionType.ClearKeys]: async (env) => {
    await clearKeys(env);
    return {
      variant: "success",
      message: "Keys cleared",
    };
  },
  [AdminDashboardActionType.ChangePassword]: async (env, formData) => {
    const paramsJSON = formData.get("params");
    if (paramsJSON == null) {
      throw new Error("Missing params");
    }
    const params = JSON.parse(paramsJSON);
    const id = params.id;
    if (id == null) {
      throw new Error("Missing ID");
    }
    const password = formData.get("password");
    if (password == null) {
      throw new Error("Missing password");
    }
    await changeUserPassword(env, id, password);
    return {
      variant: "success",
      message: "Password changed",
    };
  },
  [AdminDashboardActionType.ChangeEmail]: async (env, formData) => {
    const paramsJSON = formData.get("params");
    if (paramsJSON == null) {
      throw new Error("Missing params");
    }
    const params = JSON.parse(paramsJSON);
    const id = params.id;
    if (id == null) {
      throw new Error("Missing ID");
    }
    const email = formData.get("email");
    if (email == null) {
      throw new Error("Missing email");
    }
    await changeUserEmail(env, id, email);
    return {
      variant: "success",
      message: "Email changed",
    };
  },
  [AdminDashboardActionType.DeleteUser]: async (env, formData) => {
    const paramsJSON = formData.get("params");
    if (paramsJSON == null) {
      throw new Error("Missing params");
    }
    const params = JSON.parse(paramsJSON);
    const id = params.id;
    if (id == null) {
      throw new Error("Missing ID");
    }
    await deleteUser(env, id);
    return {
      variant: "success",
      message: "User deleted",
    };
  },
  [AdminDashboardActionType.CreateUser]: async (env, formData) => {
    const username = formData.get("username");
    if (username == null) {
      throw new Error("Missing username");
    }
    const email = formData.get("email");
    if (email == null) {
      throw new Error("Missing email");
    }
    const password = formData.get("password");
    if (password == null) {
      throw new Error("Missing password");
    }
    const user = await createUser(env, username, email, password);
    return {
      variant: "success",
      message: `User ${username} created with ID ${user.id}`,
    };
  },
};

async function adminDashboardAction(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  const formData = await req.formData();
  const action = formData.get("action");
  if (action == null) {
    return badRequest("Invalid action");
  }
  const handler = actionHandlers[action as AdminDashboardActionType];
  if (handler == null) {
    return badRequest("Invalid action");
  }
  const flash = await handler(env, formData);
  const data = await fetchData(env);
  return okReact(
    <AdminDashboard flash={flash} request={req} env={env} data={data} />
  );
}

async function preview(req: Request, ctx: Context) {
  const env = ctx.env as Env;
  const code = new URL(req.url).searchParams.get("code");
  if (code == null) {
    return found("/admin");
  }
  const codeData = await getCodeData(env, code);
  if (codeData == null) {
    return found("/admin");
  }
  const user = await getUserById(env, codeData.userId);
  if (user == null) {
    return found("/admin");
  }
  const client = await getClientById(env, codeData.clientId);
  if (client == null) {
    return found("/admin");
  }
  const key = getSigningKey(await getKeyset(env));
  const token = await generateToken(env, key, user, client);
  return ok(
    `Logged in to ${client.name} as ${user.username}, got token ${token}`,
    {
      headers: {
        Refresh: "5; url=/admin",
      },
    }
  );
}

export default new WorkerRouter()
  .get("/", adminDashboard)
  .post("/", adminDashboardAction)
  .get("/preview", preview)
  .put("/jwks-refresh", jwksRefreshEndpoint)
  .get("/clients", getClientsEndpoint)
  .get("/clients/:id", basics(), getClientEndpoint)
  .post("/clients", createClientEndpoint)
  .recover("*", (req, { error, response }) => {
    console.error("error: ", error);
    return response;
  });
