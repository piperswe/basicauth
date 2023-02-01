export default interface Env {
  LOGIN_ANALYTICS: AnalyticsEngineDataset;
  DOMAIN: string;
  NAME: string;
  AUTHCODES: KVNamespace;
  CSRF_TOKENS: KVNamespace;
  DB: D1Database;
}
