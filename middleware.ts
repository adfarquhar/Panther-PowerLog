// middleware.ts
// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Temporarily commented out
import { NextResponse, type NextRequest } from 'next/server';
// import type { Database } from '@/lib/supabase/database.types'; // Temporarily commented out

export async function middleware(request: NextRequest) {
  console.log('Minimal Edge Middleware invoked.');
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