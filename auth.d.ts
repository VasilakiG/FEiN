import NextAuth from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            user_id: string;
            user_name: string;
            email: string;
        };
    }

    interface User {
        user_id: string;
        user_name: string;
        email: string;
    }

    interface JWT {
        id: string;
    }
}
