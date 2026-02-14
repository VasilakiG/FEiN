declare module 'next-auth' {
    interface Session {
        user: {
            id: string; // stringified integer
            name: string;
            email: string;
        };
    }

    interface JWT {
        id: string;
    }
}
