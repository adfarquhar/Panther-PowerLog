// middleware.ts
// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Temporarily commented out
import { NextResponse, type NextRequest } from 'next/server';
// import type { Database } from '@/lib/supabase/database.types'; // Temporarily commented out

export async function middleware(request: NextRequest) {
  console.log("Edge Middleware invoked. Supabase client code is currently commented out for debugging __dirname error.");

  // Original Supabase client initialization and logic commented out:
  /*
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    const { data: { user } } = await (supabase.auth as any).getUser();

    const { pathname } = request.nextUrl;

    const publicPaths = ['/login', '/signup', '/auth/callback'];

    if (!user && !publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error: any) {
    console.error('Middleware error (within try-catch):', error);
    console.error('Middleware error message (within try-catch):', error.message);
    console.error('Middleware error stack (within try-catch):', error.stack);
    return NextResponse.redirect(new URL('/error?message=middleware_failed', request.url));
  }

  return response;
  */

  // For now, just pass the request through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (Supabase auth routes, if you have them here)
     * Feel free to modify this pattern to fit your needs.
     */
    '/((?!api|_next/static|_next/image|assets/.*|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 