# TAMA Account Store

Vite + React + Supabase account marketplace with:
- public catalog
- `/admin` admin panel
- Supabase email/password login
- image upload to Supabase Storage
- Ready / Sold status
- create / edit / delete products
- dark / light mode
- responsive UI
- Vercel SPA rewrite

## 1. Supabase
1. Create a Supabase project.
2. Go to Authentication > Users and create the admin user with the email and password you selected for the store. For the supplied setup, use `fyesty8@gmail.com` and your chosen password.
3. Open SQL Editor and run `supabase.sql`.

## 2. Local / Vercel environment
Set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Get both from Supabase Dashboard > Project Settings > API.

For Vercel, add them under Settings > Environment Variables, then redeploy.

## 3. Deploy
Push the folder to GitHub, import it in Vercel, and deploy. No custom build command is required; Vercel detects Vite.

Important: never put a Supabase `service_role` key in frontend code or Vercel public environment variables. The included app only uses the publishable/anon key plus RLS.
