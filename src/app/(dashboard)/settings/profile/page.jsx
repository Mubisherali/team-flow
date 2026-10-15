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
//
// POLISH:
//   - Card surface matches TaskDetailModal (dark #0f1115)
//   - Glass danger zone
//   - Tighter type scale (Wave-3)
//   - A11y: section landmarks, aria-hidden on decorative SVGs
//
// PRESERVED:
//   - Same server logic (auth, user + accounts + workspace count)
//   - passwordHash read but never sent to client (only boolean)
//   - Distinct providers via Set
//   - All three client component usages
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
      {/* ══════════ GENERAL ══════════ */}
      <section aria-labelledby="general-heading">
        <div className="mb-4">
          <h2
            id="general-heading"
            className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            General
          </h2>
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mt-1">
            Update your name and profile picture.
          </p>
        </div>

        <div
          className="
            rounded-2xl p-5 sm:p-6
            border border-gray-200 dark:border-white/[0.08]
            bg-white dark:bg-[#0f1115]
          "
        >
          <ProfileForm
            initialName={user.name || ''}
            initialAvatarUrl={user.avatarUrl || ''}
            email={user.email}
          />
        </div>
      </section>

      {/* ══════════ CONNECTED ACCOUNTS ══════════ */}
      <section aria-labelledby="accounts-heading">
        <div className="mb-4">
          <h2
            id="accounts-heading"
            className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            Connected accounts
          </h2>
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mt-1">
            Sign-in methods linked to your account.
          </p>
        </div>

        <div
          className="
            rounded-2xl p-5 sm:p-6
            border border-gray-200 dark:border-white/[0.08]
            bg-white dark:bg-[#0f1115]
          "
        >
          <ConnectedAccounts providers={providers} email={user.email} />
        </div>
      </section>

      {/* ══════════ DANGER ZONE ══════════ */}
      <section aria-labelledby="danger-heading">
        <div className="mb-4">
          <h2
            id="danger-heading"
            className="text-[15px] font-semibold tracking-tight text-red-600 dark:text-red-400"
          >
            Danger zone
          </h2>
          <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mt-1">
            Irreversible actions on your account.
          </p>
        </div>

        <div
          className="
            rounded-2xl p-5 sm:p-6
            border border-red-500/20
            bg-red-500/[0.04] dark:bg-red-500/[0.06]
          "
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">
                Delete account
              </h3>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-400 mt-1 max-w-md leading-relaxed">
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