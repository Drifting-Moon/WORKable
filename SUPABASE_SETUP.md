# Supabase Setup Guide for WorkAble

This guide walks you through connecting WorkAble to a free Supabase project to enable real authentication and a hosted PostgreSQL database.

---

## Step 1: Create a Free Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (or **Sign in** with GitHub).
2. Click **New Project**.
3. Choose an organization (or create one), then enter:
   - **Name:** `WorkAble` (or any name you prefer)
   - **Database Password:** Enter a strong password and save it somewhere secure.
   - **Region:** Pick a region geographically closest to you.
   - **Pricing Plan:** Free tier.
4. Click **Create new project**. Supabase will provision your database in about 1–2 minutes.

---

## Step 2: Get Your Project URL & Anon Key

1. Once the project dashboard opens, click the **Settings** (gear icon) in the bottom-left sidebar.
2. Select **API** (under Project Settings).
3. Look for the **Project API keys** and **Project URL** sections:
   - **Project URL:** Looks like `https://abcdefghijklm.supabase.co`
   - **Project API Keys (`anon` / `public`):** A long JWT token string starting with `eyJ...`
4. Copy these two values.

---

## Step 3: Add Credentials to `.env`

In your WorkAble project root, open the `.env` file (created for you) and paste your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Save the file.

---

## Step 4: Run the Database Schema & Triggers

To set up user profiles, roles, and Row Level Security:

1. In your Supabase dashboard, click **SQL Editor** in the left navigation.
2. Click **New query** (or the **+** button).
3. Open the file [`supabase/schema.sql`](./supabase/schema.sql) in this repository and copy its entire contents.
4. Paste the SQL into the Supabase SQL Editor.
5. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).
6. You should see a green success message: `Success. No rows returned`.

### What this SQL script creates:
- **`profiles` table:** Stores user roles (`seeker`, `employer`, `admin`), names, company details, and candidate profiles linked directly to Supabase `auth.users`.
- **`handle_new_user` trigger:** Automatically creates a profile record every time a user signs up.
- **`jobs` table:** Real-time job postings with salary ranges, accommodations, and skills.
- **`applications` table:** Candidate job submissions with application tracking states.
- **`saved_jobs` table:** Bookmarks for candidates.
- **`verifications` table:** Employer accommodation verification requests.
- **`tags` table:** Pre-populated accommodation categories (Remote, Wheelchair Accessible, Assistive Tech, Neurodivergent Friendly, etc.).
- **Row Level Security (RLS) policies:** Guards candidate privacy and ensures employers only manage their own listings.

---

## Step 5: (Optional) Disable Email Confirmation for Instant Testing

By default, Supabase sends an email confirmation link before allowing users to log in. For rapid testing and evaluation:

1. In Supabase Dashboard, go to **Authentication** (icon with person) -> **Providers** -> **Email**.
2. Toggle **Confirm email** to **OFF** (or uncheck "Enable email confirmations").
3. Click **Save**.
4. Now, any candidate or employer registering on `/register` will be logged in immediately without waiting for an email!

---

## Step 6: Test Real Authentication in the App

1. Start or restart your Vite development server:
   ```bash
   npm run dev
   ```
2. Navigate to [http://127.0.0.1:5173/login](http://127.0.0.1:5173/login).
3. You will notice the green badge: **"Supabase Auth Connected"**.
4. Click **Register as candidate or employer** (or go to [http://127.0.0.1:5173/register](http://127.0.0.1:5173/register)).
5. Fill in your real name, email, and password (at least 8 characters), choose your role, and submit.
6. Check your Supabase Dashboard under **Authentication -> Users** and **Table Editor -> profiles** — you will see your new real user registered and authenticated!
7. The preconfigured demo personas (`seeker@workable.demo`, `employer@workable.demo`, `admin@workable.demo`) remain available so you can always demonstrate the app even without manual logins.
