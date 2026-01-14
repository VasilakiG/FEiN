import '@/app/ui/global.css';
import { firaCode } from '@/app/ui/fonts';

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
