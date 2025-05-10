// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types'; // Ensure this path is correct

export async function middleware(request: NextRequest) {
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

    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/signup', '/auth/callback']; // Add /signup

    // If the user is not authenticated and is trying to access a protected route
    if (!user && !publicPaths.some(path => pathname.startsWith(path))) {
      // Redirect to the login page
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If the user is authenticated and tries to access the login page, redirect them to the home page
    if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) { // Add /signup here too
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error: any) {
    console.error('Middleware error:', error);
    console.error('Middleware error message:', error.message);
    console.error('Middleware error stack:', error.stack);
    // Optionally, rethrow or return a generic error response
    // For now, let's just return the original response to see logs
    // or redirect to an error page if preferred.
    // throw error; // This would likely result in the same MIDDLEWARE_INVOCATION_FAILED
    return NextResponse.redirect(new URL('/error?message=middleware_failed', request.url)); // Or a more specific error page
  }

  return response;
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