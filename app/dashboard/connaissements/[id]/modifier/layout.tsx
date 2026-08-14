import React, { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <section className="p-4 bg-gray-50 min-h-screen">
      {children}
    </section>
  );
}

