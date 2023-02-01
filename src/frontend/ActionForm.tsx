import React from "react";
import { Form, FormProps } from "semantic-ui-react";

export interface Props<T> extends FormProps {
  action: string;
  params?: T;
}

export default function ActionForm<T>({
  action,
  params,
  children,
  ...props
}: Props<T>) {
  return (
    <Form method="POST" {...props}>
      <input type="hidden" name="action" value={action} />
      {params ? (
        <input type="hidden" name="params" value={JSON.stringify(params)} />
      ) : null}
      {children}
    </Form>
  );
}
