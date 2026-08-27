Resolve the sh: 1: next: not found deployment crash on Azure App Service by converting the Next.js project build output to standalone mode and updating package dependencies.

Instructions:

1. Dependencies Audit (package.json):

Open package.json and verify that next, react, and react-dom are listed under dependencies and NOT devDependencies.

Ensure all runtime dependencies required for production are positioned in the main dependencies block.

Status: done — next, react, and react-dom are all in `dependencies`.

2. Enable Standalone Output (next.config.mjs / next.config.js):

Update next.config.mjs (or next.config.js) to include output: 'standalone'.

Status: done — `next.config.ts` sets `output: 'standalone'`.

3. Package and deploy the standalone build (GitHub Actions workflow):

`next build` with `output: 'standalone'` produces a pruned, self-contained app at
`.next/standalone` (its own minimal `node_modules`, a generated `server.js`, and a copy
of `package.json`). It does NOT include the `public/` folder or `.next/static/` — those
must be copied in manually. The workflow (`.github/workflows/main_smartstock.yml`) now:

- Runs `cp -r public .next/standalone/public` and
  `cp -r .next/static .next/standalone/.next/static` after `npm run build`.
- Uploads `.next/standalone` (not the whole repo) as the deployment artifact.

This avoids shipping the full top-level `node_modules` (which is what caused
`next: not found` — the `.bin/next` symlink/binary was not surviving the
upload-artifact → download-artifact → Azure zip-deploy round trip reliably), and
makes the deployed package much smaller and faster to ship.

4. Run the standalone server directly instead of `next start`:

Since we no longer rely on the `next` CLI at runtime, `npm start` (`next start --webpack`)
should not be used in production. The deploy step now passes
`startup-command: 'node server.js'` to `azure/webapps-deploy@v3`, so Azure launches
the generated `server.js` directly. This also works around the fact that
`startup-command` is only honored by `azure/webapps-deploy` for Linux apps when using
an SPN (`azure/login`) — which this workflow already does.

No changes needed on the Azure Portal side as long as the GitHub Actions workflow's
`startup-command` is applied on deploy; if it's ever overridden, set the App Service
**Configuration > General settings > Startup Command** to `node server.js` manually.
