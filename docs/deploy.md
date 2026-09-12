# Deploy the site

Static HTML in `dist/`, served by Cloudflare Workers Static Assets. `aitofy.dev` is already a
Cloudflare zone, so the deploy creates the custom domain itself.

## Once, on a new machine

```sh
pnpm dlx wrangler login       # opens a browser; needs a real TTY
```

CI uses `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit + Workers Routes: Edit on the `aitofy.dev` zone) instead of `login`.

## Every release

```sh
node --run build:site               # regenerates dist/, the README table and FAQ, llms.txt, llms-full.txt
pnpm dlx wrangler deploy --dry-run   # optional: validates config without uploading
node --run ship                   # builds, then uploads dist/ to the Worker
```

The first `node --run ship` creates the Worker plus the DNS record and certificate for
`make-templates.aitofy.dev` — that is what the `routes` block does. Issuance takes a few minutes,
and the hostname returns a TLS error until it finishes.

Then check `https://make-templates.aitofy.dev/sitemap.xml` (published URLs only) and submit it in
Google Search Console.
