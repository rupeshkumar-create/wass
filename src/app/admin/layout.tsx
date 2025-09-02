import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - World Staffing Awards',
  robots: 'noindex, nofollow'
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}