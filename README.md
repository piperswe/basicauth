# basicauth

## how to deploy

```bash
yarn
yarn wrangler kv:namespace create basicauth_authcodes
# replace the id for the AUTHCODES kv namespace in wrangler.toml with the output from that command
yarn wrangler kv:namespace create basicauth_csrf_tokens
# replace the id for the CSRF_TOKENS kv namespace in wrangler.toml with the output from that command
yarn wrangler d1 create basicauth
# replace the id for the DB d1 database in wrangler.toml with the output from that command
# update the route in wrangler.toml
# update the vars in wrangler.toml
yarn wrangler deploy
```