import React from "react";
import { Button, Form } from "react-bootstrap";
import { Client } from "../clients/clients";
import Env from "../env";
import Page from "../frontend/Page";
import { FormContext } from "./authorization";

export interface Props {
  env: Env;
  formContext: FormContext;
  client: Client;
}

export default function AuthorizationForm({ env, formContext, client }: Props) {
  return (
    <Page title={`Login - ${env.NAME}`}>
      <Form method="POST" action="/oidc/authorize">
        <h1>{env.NAME}</h1>
        <h2>Login to {client.name}</h2>
        <Form.Group className="mb-3 form-floating" controlId="username">
          <Form.Control
            type="text"
            placeholder="Enter your username"
            name="username"
          />
          <Form.Label>Username</Form.Label>
        </Form.Group>
        <Form.Group className="mb-3 form-floating" controlId="password">
          <Form.Control
            type="password"
            placeholder="Enter your password"
            name="password"
          />
          <Form.Label>Password</Form.Label>
        </Form.Group>
        <input
          type="hidden"
          name="context"
          value={JSON.stringify(formContext)}
        />
        <Button variant="primary" type="submit">
          Login to {client.name}
        </Button>
      </Form>
    </Page>
  );
}
