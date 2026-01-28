import type { NextAuthConfig } from 'next-auth';

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
            const isOnApp = nextUrl.pathname.startsWith('/home');

            if (isOnApp && !isLoggedIn) return false;
            if (!isOnApp && isLoggedIn && nextUrl.pathname.startsWith('/login')) {
                return Response.redirect(new URL('/home', nextUrl));
            }

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;