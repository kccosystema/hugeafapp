# HugeAF — Supabase + Google sign-in setup

Do these once. When you finish Parts A–C, send me the **Project URL** + **anon key**
and I'll wire it into the app + Vercel and deploy. Part D (Google) can be done in parallel.

---

## Part A · Create the Supabase project
1. Go to **https://supabase.com** → sign in → **New project**.
2. Name it `hugeaf`, set a database password (save it somewhere), pick the region closest to you, Free plan.
3. Wait ~2 minutes for it to finish provisioning.

## Part B · Create the database tables
4. Left sidebar → **SQL Editor** → **New query**.
5. Open `supabase/schema.sql` from this project, copy all of it, paste into the editor.
6. Click **Run**. You should see “Success. No rows returned.”

## Part C · Grab the two keys I need
7. Left sidebar → **Project Settings** (gear) → **API**.
8. Copy these two and send them to me:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long string under “Project API keys”)

> The anon key is safe to ship in a web app — row-level security protects the data.

---

## Part D · Google sign-in

### D1 — Get your Supabase callback URL
9. Supabase → **Authentication** → **Providers** → **Google**.
10. Copy the **Callback URL (for OAuth)** shown there
    (looks like `https://abcd1234.supabase.co/auth/v1/callback`). Keep it handy.

### D2 — Create Google credentials
11. Go to **https://console.cloud.google.com** → create or pick a project (top bar).
12. **APIs & Services → OAuth consent screen**:
    - User type **External** → Create.
    - App name `HugeAF`, your email for support + developer contact → Save and continue through the steps.
    - Under **Test users**, add your own Google email (so you can log in before publishing).
13. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
    - Application type **Web application**, name `HugeAF Web`.
    - **Authorized JavaScript origins** — add both:
      - `https://hugeaf.vercel.app`
      - `http://localhost:3080`
    - **Authorized redirect URIs** — add the Supabase callback URL from step 10.
    - **Create** → copy the **Client ID** and **Client secret**.

### D3 — Turn on Google in Supabase
14. Supabase → **Authentication → Providers → Google** → toggle **Enabled**.
15. Paste the **Client ID** and **Client secret** → **Save**.

### D4 — Set the site / redirect URLs in Supabase
16. Supabase → **Authentication → URL Configuration**:
    - **Site URL**: `https://hugeaf.vercel.app`
    - **Redirect URLs** — add: `https://hugeaf.vercel.app` and `http://localhost:3080`

---

## Then I take over
With the Project URL + anon key you send me, I will:
- add them to `.env.local` (local) and Vercel env vars (production),
- redeploy,
- test the full Google sign-in → log a workout → confirm it saved to your account.

If the Google part gets painful, tell me — switching to simple **email + password**
sign-in is a 5-minute change on my side and skips the entire Google Cloud console.
