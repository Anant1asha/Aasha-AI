# Infrastructure

Provider adapters are intentionally configuration-driven. The canonical deployment can map:
- frontend -> Vercel/static hosting
- API/worker -> Railway/container/Node host
- relational truth -> Supabase/PostgreSQL
- object storage -> Supabase Storage or Cloudflare R2
- DNS/edge -> Vercel/Cloudflare as appropriate

No vendor SDK is imported by core learning packages.
