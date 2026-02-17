import postgres from 'postgres';

declare global {
    // eslint-disable-next-line no-var
    var __fein_sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
    global.__fein_sql ??
    postgres(process.env.POSTGRES_URL!, {
        ssl: 'require',
    });

if (process.env.NODE_ENV !== 'production') {
    global.__fein_sql = sql;
}
