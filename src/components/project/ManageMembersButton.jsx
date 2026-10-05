// -------------------------------------------------------------
// ManageMembersButton - Trigger button + modal for managing
// project members. Client wrapper because the modal has state.
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
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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