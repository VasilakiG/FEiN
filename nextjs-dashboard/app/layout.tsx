import '@/app/ui/global.css';
import { firaCode } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | FEiN Dashboard',
    default: 'FEiN Dashboard',
  },
  description: 'Mobile-first web-application for personal finance tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${firaCode.className} antialiased`}>{children}</body>
    </html>
  );
}
