import type { NextAuthConfig } from 'next-auth';

const AUTH_ROUTES = ['/login', '/register'];
const PUBLIC_ROUTES = ['/'];

export const authConfig = {

    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },

        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const { pathname } = nextUrl;

            const isAuthRoute = AUTH_ROUTES.some((route) =>
                pathname.startsWith(route)
            );
            const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

            // Not logged in & trying to access protected route
            if (!isLoggedIn && !isAuthRoute && !isPublicRoute) {
                return false; // NextAuth will redirect to /login
            }

            // Logged in & trying to access auth or landing pages
            if (isLoggedIn && (isAuthRoute || isPublicRoute)) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;