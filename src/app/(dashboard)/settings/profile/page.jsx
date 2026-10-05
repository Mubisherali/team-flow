// -------------------------------------------------------------
// Profile Settings Page
// -------------------------------------------------------------
//
// URL: /settings/profile
//
// SERVER COMPONENT:
//   - Reads session
//   - Fetches user profile + linked providers + owned workspace count
//   - Passes data to client components for editing
//
// WHY OWNED WORKSPACE COUNT:
//   The "Delete account" flow is blocked if the user owns any
//   workspaces. We fetch the count here so the client can show
//   the warning BEFORE the user tries to delete.
// -------------------------------------------------------------

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileForm from '@/components/settings/ProfileForm';
import ConnectedAccounts from '@/components/settings/ConnectedAccounts';
import DeleteAccountButton from '@/components/settings/DeleteAccountButton';

export default async function ProfileSettingsPage() {
  // ─── Auth ───
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // ─── Fetch user + accounts + owned workspace count ───
  // Parallel fetch — 2 independent queries.
  //
  // NOTE ON passwordHash:
  //   We select it so we can tell whether the user has a
  //   password (credentials user) or is OAuth-only.
  //   The hash NEVER leaves the server — we only pass a boolean
  //   (hasPassword) to the client.
  const [user, ownedWorkspaceCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        passwordHash: true, // needed to know if the user has a password
        accounts: {
          select: { provider: true },
        },
      },
    }),
    prisma.workspace.count({
      where: { ownerId: session.user.id },
    }),
  ]);

  if (!user) {
    redirect('/login');
  }

  // ─── Distinct providers ───
  const providers = [...new Set(user.accounts.map((a) => a.provider))];

  // ─── Render ───
  return (
    <div className="space-y-8">
      {/* General */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            General
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Update your name and profile picture.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <ProfileForm
            initialName={user.name || ''}
            initialAvatarUrl={user.avatarUrl || ''}
            email={user.email}
          />
        </div>
      </section>

      {/* Connected accounts */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Connected accounts
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Sign-in methods linked to your account.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <ConnectedAccounts providers={providers} email={user.email} />
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
            Danger zone
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Irreversible actions on your account.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Delete account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md">
                {ownedWorkspaceCount > 0
                  ? `You own ${ownedWorkspaceCount} workspace${
                      ownedWorkspaceCount === 1 ? '' : 's'
                    }. Delete or transfer ${
                      ownedWorkspaceCount === 1 ? 'it' : 'them'
                    } before deleting your account.`
                  : 'Permanently delete your account and all associated data.'}
              </p>
            </div>
            <DeleteAccountButton
              ownedWorkspaceCount={ownedWorkspaceCount}
              hasPassword={!!user.passwordHash}
            />
          </div>
        </div>
      </section>
    </div>
  );
}