'use client';

import { poppins } from '@/app/ui/fonts';
import {
  AtSymbolIcon,
  KeyIcon,
  UserIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from './button';
import { useActionState } from 'react';
import { register } from '@/app/(auth)/actions';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/home';
  const [errorMessage, formAction, isPending] = useActionState(
    register,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="
        w-full
        max-w-sm
        bg-transparent
        backdrop-blur-md
        rounded-2xl
        px-6
        py-8
      "
    >
      <div className="space-y-4">
        {/* Name */}
        <div className="relative">
          <input
            className={`${poppins.className}
              peer
              w-full
              h-12
              rounded-lg
              bg-white/30
              pl-11
              text-white
              placeholder:text-white/60
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
            `}
            type="text"
            name="user_name"
            placeholder="Name"
            required
          />
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
        </div>

        {/* Email */}
        <div className="relative">
          <input
            className={`${poppins.className}
              peer
              w-full
              h-12
              rounded-lg
              bg-white/30
              pl-11
              text-white
              placeholder:text-white/60
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
            `}
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
        </div>

        {/* Password */}
        <div className="relative">
          <input
            className={`${poppins.className}
              peer
              w-full
              h-12
              rounded-lg
              bg-white/30
              pl-11
              text-white
              placeholder:text-white/60
              focus:outline-none
              focus:ring-2
              focus:ring-white/50
            `}
            type="password"
            name="password"
            placeholder="Password"
            minLength={6}
            required
          />
          <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
        </div>
      </div>

      <input type="hidden" name="redirectTo" value={callbackUrl} />

      <Button
        className={`${poppins.className}
          mt-6
          w-full
          h-12
          rounded-lg
          bg-[#1d7f6a]
          hover:bg-[#166655]
          text-white
          text-lg
          font-medium
          flex
          items-center
          justify-center
        `}
        aria-disabled={isPending}
      >
        Register
      </Button>

      <p
        className={`${poppins.className}
          mt-4
          text-sm
          text-center
          text-white/80
          antialiased
        `}
      >
        Already have an account?
        <Link href="/login" className="ml-1 font-medium underline">
          Log in
        </Link>
      </p>

      {errorMessage && (
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-500">{errorMessage}</span>
        </div>
      )}
    </form>
  );
}
