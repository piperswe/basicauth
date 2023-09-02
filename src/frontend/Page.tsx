import * as React from "react";
import { Container } from "semantic-ui-react";

export interface Props {
  title: string;
  children: React.ReactNode;
}

export default function Page({ title, children }: Props) {
  return (
    <html>
      <head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/semantic-ui-css@2.5.0/semantic.min.css"
          integrity="sha256-cDGQ39yChhpN5vzgHbjIdGEtQ5kXE9tttCsI7VR9TuY="
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Container>{children}</Container>
        <script
          src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"
          integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
          crossOrigin="anonymous"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/semantic-ui-css@2.5.0/semantic.min.js"
          integrity="sha256-fN8vcX2ULyTDspVTHEteK8hd3rQAb5thNiwakjAW75Q="
          crossOrigin="anonymous"
        ></script>
      </body>
    </html>
  );
}
