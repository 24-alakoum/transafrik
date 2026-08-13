export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Ensure the route is treated as a dynamic route in Next.js App Router
export const dynamic = 'force-dynamic';
export const revalidate = 0;
