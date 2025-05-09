# Panther PowerLog

Workout tracking application built with Next.js, Tailwind CSS v4, Supabase, and Shadcn UI.

## Project Setup

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

2.  **Set up Supabase:**
    *   Log in to Supabase: `pnpm supabase login`
    *   Link your project: `pnpm supabase link --project-ref smpqevernrcufavbjsbg` (Replace `YOUR_PROJECT_ID` with your actual Supabase project ID - `smpqevernrcufavbjsbg` as per rules).
    *   (Optional) If you have local schema changes and want to push them (after creating migrations): `pnpm supabase db push`
    *   (Optional) To reset your local database if needed: `pnpm supabase db reset`

3.  **Environment Variables:**
    Create a `.env.local` file in the root of the project and add your Supabase URL and anon key:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```
    You can find these in your Supabase project settings.

4.  **Generate Supabase Types (after setting up tables in Supabase):**
    ```bash
    pnpm supabase:generate-types
    ```

## Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Technologies

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS v4+](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
*   **Database & Auth:** [Supabase](https://supabase.io/) (Project ID: `smpqevernrcufavbjsbg`)
*   **Icons:** [Heroicons](https://heroicons.com/)
*   **Notifications:** [Sonner](https://sonner.emilkowal.ski/)
*   **Validation:** [Zod](https://zod.dev/)
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Project Structure

*   `app/`: Next.js App Router (pages, layouts, API routes)
*   `actions/`: Server Actions
*   `components/`: Shared UI components (non-Shadcn or composed Shadcn components)
    *   `components/ui/`: Shadcn UI components (installed via CLI)
*   `lib/`: Utility functions and helpers
    *   `lib/supabase/`: Supabase client setup and type definitions
*   `supabase/migrations/`: Database schema migrations (managed by Supabase CLI)
*   `public/`: Static assets

## Linting and Formatting

*   Check types: `pnpm type-check`
*   Lint files: `pnpm lint` (Next.js ESLint)
*   Run all checks: `pnpm check`

(This project aims to adhere to Biome/Prettier/ESLint standards as per project rules - specific formatter setup might be needed if not covered by Next.js defaults) 