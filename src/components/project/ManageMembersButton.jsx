// -------------------------------------------------------------
// ManageMembersButton - Trigger + modal for managing members
// -------------------------------------------------------------
//
// WHEN USED:
//   Rendered in the Members section header on the project
//   detail page (owner/manager only).
//
// STRUCTURE:
//   Trigger button
//     - Opens <ProjectMembersModal>
//
// POLISH:
//   - Trigger button matches Wave-3 secondary button pattern
//   - active:scale + focus ring
//   - aria-haspopup="dialog" for SR
//
// PRESERVED:
//   - Same props (workspaceId, projectId, projectMembers,
//     allMembers, currentUserId)
//   - Same state (isOpen)
//   - Modal usage unchanged
// -------------------------------------------------------------

'use client';

import { useState } from 'react';
import ProjectMembersModal from './ProjectMembersModal';

const ManageMembersButton = ({
  workspaceId,
  projectId,
  projectMembers,
  allMembers,
  currentUserId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="
          inline-flex items-center gap-1.5 flex-shrink-0
          px-3 py-2 rounded-lg
          border border-gray-300 dark:border-white/[0.08]
          text-gray-700 dark:text-gray-300
          text-[12.5px] font-medium
          hover:bg-gray-50 dark:hover:bg-white/[0.04]
          active:scale-[0.98]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
          transition-all duration-150
        "
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
            strokeLinecap="round"
          />
          <circle cx="9" cy="7" r="4" />
          <path
            d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            strokeLinecap="round"
          />
        </svg>
        Manage members
      </button>

      <ProjectMembersModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        workspaceId={workspaceId}
        projectId={projectId}
        projectMembers={projectMembers}
        allMembers={allMembers}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default ManageMembersButton;