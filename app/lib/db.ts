import postgres from 'postgres';

declare global {
    var __fein_sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
    global.__fein_sql ??
    postgres(process.env.POSTGRES_URL!, {
        prepare: false,
        ssl: 'require',
    });

if (process.env.NODE_ENV !== 'production') {
    global.__fein_sql = sql;
}
