import React, { ReactNode } from "react";
import { Container } from "semantic-ui-react";

export interface Props {
  title: string;
  children: ReactNode;
}

export default function Page({ title, children }: Props) {
  return (
    <html>
      <head>
        <title>{title}</title>
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
          src="https://cdn.jsdelivr.net/npm/jquery@3.6.3/dist/jquery.min.js"
          integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU="
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
