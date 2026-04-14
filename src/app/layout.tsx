import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'pMaster',
  description: 'Repair shop CRM for Uzbekistan market',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
