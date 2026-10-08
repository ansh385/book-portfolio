# Ansh Gajjar Portfolio

Plain HTML, CSS and JS with Bootstrap 5. Projects are stored in a Supabase database through a Vercel serverless function (`api/projects.js`).

## Deploy to Vercel

1. **Database:** create a free project at supabase.com. Open SQL Editor, paste `supabase.sql` and run it.
2. **Keys:** in Supabase go to Project Settings > API. Copy the Project URL and the `service_role` key.
3. **GitHub:** push this folder to a GitHub repo.
4. **Vercel:** import the repo at vercel.com/new (Framework preset: Other, no build command).
5. **Environment variables** (Vercel > Settings > Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `ADMIN_PASSWORD` (choose a long password)
6. Redeploy. Done.

## Add or remove projects

Open `https://your-site.vercel.app/#admin`. The "Add project" button and the trash icons appear. You are asked for `ADMIN_PASSWORD` the first time. Visitors without `#admin` only see the projects.

## Notes

- Never put the service key in the HTML or JS files. It lives only in Vercel environment variables.
- If the database is not reachable (for example when you open `index.html` straight from your computer), the page runs in demo mode and saves projects in the browser only.
- Replace the GitHub links of the starter projects with the real repo links, and add live links in the `#admin` view or directly in Supabase (Table Editor > projects).

## How the book works

Every portfolio section is one page of the book. Flip with the arrows, the keyboard (left and right keys), a swipe on a phone, or the Contents page. Wide screens show two pages at a time, narrow screens show one. Page files: `index.html` (the pages), `style.css`, `book.js` (page turning), `script.js` (projects).
