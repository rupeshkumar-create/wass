import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - World Staffing Awards',
  robots: 'noindex, nofollow'
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}