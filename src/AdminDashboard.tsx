import { AdminDashboardActionType } from "./admin";
import { Client, getClients } from "./clients/clients";
import Env from "./env";
import ActionForm from "./frontend/ActionForm";
import Page from "./frontend/Page";
import { getKeyset, Keyset, keysetToJwks } from "./jwks/keys";
import { getUsers, User } from "./users.ts/users";

import { Button, Card, Form, Icon, Message, Segment } from "semantic-ui-react";
import * as React from "react";

function ClientView({
  client,
  previewURL,
}: {
  client: Client;
  previewURL: string;
}) {
  return (
    <Card>
      <Card.Content>
        <Card.Header>{client.name}</Card.Header>
        <Card.Description>
          <p>
            Client ID: <code>{client.id}</code>
          </p>
          <p>
            Client Secret: <code>{client.secret}</code>
          </p>
          <p>
            <a
              href={`/oidc/authorize?response_type=code&client_id=${encodeURIComponent(
                client.id
              )}&scope=openid&redirect_uri=${encodeURIComponent(previewURL)}`}
            >
              Preview login page
            </a>
          </p>
        </Card.Description>
      </Card.Content>
      <Card.Content extra>
        <ActionForm
          action={AdminDashboardActionType.DeleteClient}
          params={{ id: client.id }}
        >
          <Form.Button type="submit" negative icon labelPosition="left">
            <Icon name="remove" />
            Delete
          </Form.Button>
        </ActionForm>
      </Card.Content>
    </Card>
  );
}

function UserView({ user }: { user: User }) {
  return (
    <Card>
      <Card.Content>
        <Card.Header>{user.username}</Card.Header>
        <Card.Description>
          <p>ID: {user.id}</p>
          <p>
            Email: <a href={`mailto:${user.email}`}>{user.email}</a>
          </p>
        </Card.Description>
      </Card.Content>
      <Card.Content extra>
        <ActionForm
          action={AdminDashboardActionType.ChangeEmail}
          params={{ id: user.id }}
          className="mb-3"
        >
          <Form.Input
            fluid
            type="email"
            label="Email"
            placeholder="Email"
            value={user.email}
            name="email"
          />
          <Form.Button type="submit" primary icon labelPosition="left">
            <Icon name="edit" />
            Change email
          </Form.Button>
        </ActionForm>
      </Card.Content>
      <Card.Content extra>
        <ActionForm
          action={AdminDashboardActionType.ChangePassword}
          params={{ id: user.id }}
          className="mb-3"
        >
          <Form.Input
            fluid
            type="password"
            label="Password"
            placeholder="Password"
            name="password"
          />
          <Form.Button type="submit" primary icon labelPosition="left">
            <Icon name="edit" />
            Change password
          </Form.Button>
        </ActionForm>
      </Card.Content>
      <Card.Content extra>
        <ActionForm
          action={AdminDashboardActionType.DeleteUser}
          params={{ id: user.id }}
        >
          <Form.Button type="submit" negative icon labelPosition="left">
            <Icon name="remove user" />
            Delete
          </Form.Button>
        </ActionForm>
      </Card.Content>
    </Card>
  );
}

export interface FlashProps {
  variant: "success";
  message: string;
}

function Flash({ flash }: { flash: FlashProps }) {
  return (
    <Message success={flash.variant === "success"}>{flash.message}</Message>
  );
}

export interface Data {
  clients: Client[];
  users: User[];
  keyset: Keyset;
}

export async function fetchData(env: Env): Promise<Data> {
  const [clients, users, keyset] = await Promise.all([
    getClients(env),
    getUsers(env),
    getKeyset(env),
  ]);
  return { clients, users, keyset };
}

export interface Props {
  flash?: FlashProps | null | void;
  request: Request;
  env: Env;
  data: Data;
}

export default function AdminDashboard({ flash, request, env, data }: Props) {
  const previewURL = new URL(request.url);
  previewURL.pathname = "/admin/preview";
  return (
    <Page title="Admin">
      <h1>{env.NAME} Admin</h1>
      {flash ? <Flash flash={flash} /> : null}
      <h2>Clients</h2>
      <Card.Group>
        {data.clients.map((client) => (
          <ClientView
            client={client}
            previewURL={previewURL.toString()}
            key={client.id}
          />
        ))}
      </Card.Group>
      <Segment>
        <h3>Create client</h3>
        <ActionForm action={AdminDashboardActionType.CreateClient}>
          <Form.Input fluid label="Name" placeholder="Name" name="name" />
          <Form.Button type="submit" primary icon labelPosition="left">
            <Icon name="add" />
            Create client
          </Form.Button>
        </ActionForm>
      </Segment>
      <h2>Users</h2>
      <Card.Group>
        {data.users.map((user) => (
          <UserView user={user} key={user.id} />
        ))}
      </Card.Group>
      <Segment>
        <h3>Create user</h3>
        <ActionForm action={AdminDashboardActionType.CreateUser}>
          <Form.Input
            fluid
            label="Username"
            placeholder="Username"
            name="username"
          />
          <Form.Input
            fluid
            type="email"
            label="Email"
            placeholder="Email"
            name="email"
          />
          <Form.Input
            fluid
            type="password"
            label="Password"
            placeholder="Password"
            name="password"
          />
          <Form.Button type="submit" primary icon labelPosition="left">
            <Icon name="add user" />
            Create user
          </Form.Button>
        </ActionForm>
      </Segment>
      <h2>Keys</h2>
      <pre>
        <code>{JSON.stringify(keysetToJwks(data.keyset), null, 2)}</code>
      </pre>
      <p>
        Refreshing keys will add a new key and remove the oldest, keeping 2 keys
        valid at any given time. Clearing keys will delete all keys without
        replacing them. For a fresh start with one new key, clear then refresh.
      </p>
      <ActionForm
        action={AdminDashboardActionType.RefreshKeys}
        style={{ display: "inline-block" }}
      >
        <Button type="submit" secondary icon labelPosition="left">
          <Icon name="refresh" />
          Refresh keys
        </Button>
      </ActionForm>
      <ActionForm
        action={AdminDashboardActionType.ClearKeys}
        style={{ display: "inline-block" }}
      >
        <Button type="submit" negative icon labelPosition="left">
          <Icon name="remove" />
          Clear keys
        </Button>
      </ActionForm>
    </Page>
  );
}
