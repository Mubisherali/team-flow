'use client';

import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>TeamFlow — Session Test</h1>
      <p>Status: <strong>{status}</strong></p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}