import { FormContext } from "./authorization";

import { Client } from "../clients/clients";
import Env from "../env";
import Page from "../frontend/Page";

import * as React from "react";
import { Card, Form, Icon } from "semantic-ui-react";

export interface Props {
  env: Env;
  formContext: FormContext;
  client: Client;
}

export default function AuthorizationForm({ env, formContext, client }: Props) {
  return (
    <Page title={`Login - ${env.NAME}`}>
      <Form
        method="POST"
        action="/oidc/authorize"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Card>
          <Card.Content>
            <Card.Header>{env.NAME}</Card.Header>
            <Card.Meta>Login to {client.name}</Card.Meta>
            <Card.Description>
              <Form.Input
                fluid
                label="Username"
                placeholder="Username"
                name="username"
              />
              <Form.Input
                fluid
                type="password"
                label="Password"
                placeholder="Password"
                name="password"
              />
              <input
                type="hidden"
                name="context"
                value={JSON.stringify(formContext)}
              />
            </Card.Description>
          </Card.Content>
          <button
            type="submit"
            className="ui icon primary button bottom attached"
          >
            <Icon name="sign-in" />
          </button>
        </Card>
      </Form>
    </Page>
  );
}
