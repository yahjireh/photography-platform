/**
 * Auth Layout
 * Layout wrapper for authentication pages (login, etc.)
 * No sidebar or header - clean auth experience
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
