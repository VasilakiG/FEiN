'use server'

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import postgres from 'postgres';
import { signIn } from '@/auth';
import bcrypt from "bcryptjs";
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/app/lib/auth-utils';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const redirectTo =
            (formData.get('redirectTo') as string) || '/home';

        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid email or password.';
                default:
                    return 'Something went wrong. Please try again.';
            }
        }
        throw error;
    }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
) {
    const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        redirectTo: z.string().optional(),
    });

    const parsed = schema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        redirectTo: formData.get('redirectTo'),
    });

    if (!parsed.success) {
        return 'Invalid form data.';
    }

    const { name, email, password, redirectTo } = parsed.data;

    const existing =
        await sql`SELECT id FROM users WHERE email=${email}`;

    if (existing.length > 0) {
        return 'User already exists.';
    }

    const hashed = await bcrypt.hash(password, 10);

    await sql`
    INSERT INTO users (name, email, password)
    VALUES (${name}, ${email}, ${hashed})
  `;

    // auto-login
    await signIn('credentials', {
        email,
        password,
        redirectTo: redirectTo || '/home',
    });
}

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string().min(1, 'Please select a customer.'),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z
        .enum(['pending', 'paid'])
        .refine(Boolean, { message: 'Please select an invoice status.' }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
}

export async function createInvoice(prevState: State, formData: FormData) {
    const session = await requireAuth();
    const userId = session.user.id; // userId is now trusted & typed

    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Invoice.'
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}