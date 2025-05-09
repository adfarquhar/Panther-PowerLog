// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

export async function createServerComponentClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, cookieOpts: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...cookieOpts });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // In Server Components, this is usually fine if middleware handles refresh.
          }
        },
        remove(name: string, cookieOpts: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...cookieOpts });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // In Server Components, this is usually fine if middleware handles refresh.
          }
        },
      },
    }
  );
}

export async function createServerActionClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, cookieOpts: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...cookieOpts });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // Actions should be able to set cookies, but catch defensively.
          }
        },
        remove(name: string, cookieOpts: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...cookieOpts });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // Actions should be able to remove cookies, but catch defensively.
          }
        },
      },
    }
  );
}

// This function was originally from a different setup and might not be needed
// if the two above cover all server-side client creation needs.
// Keeping it for now in case it was intended for a different context.
// export function createServerClientWithCookieStore(
//   cookieStore: ReturnType<typeof cookies>,
//   options?: PublicSchemaSupabaseClientOptions, // This would also need adjustment if kept
// ) {
//   return createServerClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get(name: string) {
//           return cookieStore.get(name)?.value
//         },
//         set(name: string, value: string, cookieOpts: CookieOptions) {
//           cookieStore.set(name, value, cookieOpts)
//         },
//         remove(name: string, cookieOpts: CookieOptions) {
//           cookieStore.delete(name, cookieOpts)
//         },
//       },
//       ...options, // Spread the typed options
//     },
//   )
// } 