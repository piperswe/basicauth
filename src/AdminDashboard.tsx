import React from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { Variant } from "react-bootstrap/esm/types";
import { AdminDashboardActionType } from "./admin";
import { Client, getClients } from "./clients/clients";
import Env from "./env";
import ActionForm from "./frontend/ActionForm";
import Page from "./frontend/Page";
import { getKeyset, Keyset, keysetToJwks } from "./jwks/keys";
import { getUsers, User } from "./users.ts/users";

function ClientView({
  client,
  previewURL,
}: {
  client: Client;
  previewURL: string;
}) {
  return (
    <Card className="mb-3">
      <Card.Header>{client.name}</Card.Header>
      <Card.Body>
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
        <ActionForm
          action={AdminDashboardActionType.DeleteClient}
          params={{ id: client.id }}
        >
          <Button type="submit" variant="danger" className="mt-3">
            Delete
          </Button>
        </ActionForm>
      </Card.Body>
    </Card>
  );
}

function UserView({ user }: { user: User }) {
  return (
    <Card className="mb-3">
      <Card.Header>
        ID {user.id}: {user.username}
      </Card.Header>
      <Card.Body>
        <ActionForm
          action={AdminDashboardActionType.ChangeEmail}
          params={{ id: user.id }}
          className="mb-3"
        >
          <Form.Group className="mb-3 form-floating">
            <Form.Control
              type="email"
              name="email"
              value={user.email}
              placeholder="Enter a new email address"
            />
            <Form.Label>New email address</Form.Label>
          </Form.Group>
          <Button type="submit" variant="primary">
            Change email
          </Button>
        </ActionForm>
        <ActionForm
          action={AdminDashboardActionType.ChangePassword}
          params={{ id: user.id }}
          className="mb-3"
        >
          <Form.Group className="mb-3 form-floating">
            <Form.Control
              type="password"
              name="password"
              placeholder="Enter a new password"
            />
            <Form.Label>New password</Form.Label>
          </Form.Group>
          <Button type="submit" variant="primary">
            Change password
          </Button>
        </ActionForm>
        <ActionForm
          action={AdminDashboardActionType.DeleteUser}
          params={{ id: user.id }}
        >
          <Button type="submit" variant="danger">
            Delete
          </Button>
        </ActionForm>
      </Card.Body>
    </Card>
  );
}

export interface FlashProps {
  variant: Variant;
  message: string;
}

function Flash({ flash }: { flash: FlashProps }) {
  return (
    <Alert variant={flash.variant} dismissible={true}>
      {flash.message}
    </Alert>
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
      {data.clients.map((client) => (
        <ClientView
          client={client}
          previewURL={previewURL.toString()}
          key={client.id}
        />
      ))}
      <Card className="mb-3">
        <Card.Header>Create client</Card.Header>
        <Card.Body>
          <ActionForm action={AdminDashboardActionType.CreateClient}>
            <Form.Group className="mb-3 form-floating">
              <Form.Control
                type="text"
                name="name"
                placeholder="Enter a client name"
              />
              <Form.Label>Name</Form.Label>
            </Form.Group>
            <Button type="submit" variant="primary">
              Create client
            </Button>
          </ActionForm>
        </Card.Body>
      </Card>
      <h2>Users</h2>
      {data.users.map((user) => (
        <UserView user={user} key={user.id} />
      ))}
      <Card className="mb-3">
        <Card.Header>Create user</Card.Header>
        <Card.Body>
          <ActionForm action={AdminDashboardActionType.CreateUser}>
            <Form.Group className="mb-3 form-floating">
              <Form.Control
                type="text"
                name="username"
                placeholder="Enter a username"
              />
              <Form.Label>Username</Form.Label>
            </Form.Group>
            <Form.Group className="mb-3 form-floating">
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter an email address"
              />
              <Form.Label>Email address</Form.Label>
            </Form.Group>
            <Form.Group className="mb-3 form-floating">
              <Form.Control
                type="password"
                name="password"
                placeholder="Enter a password"
              />
              <Form.Label>Password</Form.Label>
            </Form.Group>
            <Button type="submit" variant="primary">
              Create user
            </Button>
          </ActionForm>
        </Card.Body>
      </Card>
      <h2>Keys</h2>
      <pre>
        <code>{JSON.stringify(keysetToJwks(data.keyset), null, 2)}</code>
      </pre>
      <ActionForm action={AdminDashboardActionType.RefreshKeys}>
        <Button type="submit" variant="warning">
          Refresh keys
        </Button>
      </ActionForm>
      <ActionForm action={AdminDashboardActionType.ClearKeys}>
        <Button type="submit" variant="danger">
          Clear keys
        </Button>
      </ActionForm>
    </Page>
  );
}
