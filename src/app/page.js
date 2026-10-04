// -------------------------------------------------------------
// Home Page - Session Test + Logout
// -------------------------------------------------------------
//
// TEMPORARY PAGE for Phase 2 testing.
// Will be replaced in Phase 3 with the workspace dashboard.
//
// Shows:
//   - Current auth status (loading / authenticated / unauthenticated)
//   - Full session object (for debugging)
//   - Logout button when logged in
//   - "Go to login" button when logged out
// -------------------------------------------------------------

'use client';

import CreateWorkspaceModal from '@/components/workspace/CreateWorkspaceModal';
import { useSession, signOut} from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(true);

  const router = useRouter();

  // -----------------------------------------------------------
  // LOGOUT HANDLER
  // -----------------------------------------------------------
  // signOut() clears the session cookie. With redirect: false,
  // we handle navigation ourselves so we can refresh server
  // components (otherwise the page might still think we're in).
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>TeamFlow — Session Test</h1>

      <p>
        Status: <strong>{status}</strong>
      </p>

      {/* Logged in → show user info + logout */}
      {status === 'authenticated' && (
        <div style={{ marginTop: 20 }}>
          <p>
            Logged in as <strong>{session.user?.email}</strong>
          </p>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              padding: '10px 18px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Log out
          </button>
        </div>
      )}

      {/* Logged out → show login link */}
      {status === 'unauthenticated' && (
        <div style={{ marginTop: 20 }}>
          <Link
            href="/login"
            style={{
              padding: '10px 18px',
              background: '#4f46e5',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            Go to login
          </Link>
        </div>
      )}

      {/* Full session object for debugging */}
      <h3 style={{ marginTop: 30 }}>Raw session:</h3>
      <pre style={{ background: '#f3f4f6', padding: 16, borderRadius: 6 }}>
        {JSON.stringify(session, null, 2)}
      </pre>



// TEMPORARY test — remove later
import { useState } from 'react';
import CreateWorkspaceModal from '@/components/workspace/CreateWorkspaceModal';

// Inside the component:
const [isOpen, setIsOpen] = useState(true);
// and render:
<CreateWorkspaceModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onCreated={(ws) => {
    console.log('Created:', ws);
    setIsOpen(false);
  }}
/>

    </div>
  );
}