// -------------------------------------------------------------
// AcceptInvitationButton - Client-side accept action
// -------------------------------------------------------------
//
// Called by the /invite/[token] page when the user is logged
// in with the correct email.
//
// FLOW:
//   1. Click "Accept invitation"
//   2. POST /api/invitations/[token]/accept
//   3. On success → redirect to /workspaces/[id]
//   4. On error   → show message inline
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AcceptInvitationButton = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation');
        setLoading(false);
        return;
      }

      // Success → jump to the workspace.
      router.push(`/workspaces/${data.workspace.id}`);
      router.refresh();
    } catch (err) {
      console.error('[ACCEPT_INVITE]', err);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium transition-colors"
      >
        {loading ? 'Joining...' : 'Accept invitation'}
      </button>
    </>
  );
};

export default AcceptInvitationButton;