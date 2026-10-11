# TeamFlow — Polish Checklist (Phase 10)

> One file at a time. Responsive + polish + micro-interactions + motion + dark mode + accessibility.
> Cross it off. Move to the next.

---

## 🎯 The Workflow (per file)

For each file, do ALL of these in one pass:

1. **Read** the file — note what's rough
2. **Responsive** — mobile / tablet / desktop
3. **Spacing & typography** — consistent with the app
4. **Colors** — proper contrast in light + dark mode
5. **Hover / focus / active states** — every interactive element
6. **Micro-interactions** — subtle transitions (200-300ms)
7. **Motion** — modals, dropdowns, transitions (Framer Motion if helpful)
8. **Empty / loading / error states** — if applicable
9. **Accessibility** — ARIA labels, keyboard nav, alt text
10. **Test** — desktop, mobile, dark mode

**When done:** flip `[ ]` → `[x]` and move to the next file.

---

## 🌊 Wave 1 — Core Navigation & Auth

- [ ] `src/app/(auth)/login/page.jsx` — **← CURRENT**
- [ ] `src/app/(auth)/register/page.jsx`
- [ ] `src/app/page.jsx` (public landing)
- [ ] `src/components/workspace/WorkspaceListClient.jsx`
- [ ] `src/app/(dashboard)/workspaces/page.jsx`

---

## 🌊 Wave 2 — Kanban Experience

- [ ] `src/components/task/TaskCard.jsx`
- [ ] `src/components/task/KanbanColumn.jsx`
- [ ] `src/components/task/KanbanBoard.jsx`
- [ ] `src/components/task/TaskDetailModal.jsx`
- [ ] `src/components/task/CreateTaskModal.jsx`
- [ ] `src/components/task/TaskPageView.jsx`
- [ ] `src/components/task/TaskViewMode.jsx`
- [ ] `src/components/task/TaskEditMode.jsx`
- [ ] `src/components/task/TaskFields.jsx`

---

## 🌊 Wave 3 — Collaboration

- [ ] `src/components/task/CommentList.jsx`
- [ ] `src/components/task/CommentItem.jsx`
- [ ] `src/components/task/CommentForm.jsx`
- [ ] `src/components/workspace/InviteMemberModal.jsx`
- [ ] `src/components/workspace/MembersListClient.jsx`
- [ ] `src/app/invite/[token]/page.jsx`

---

## 🌊 Wave 4 — Workspaces & Projects

- [ ] `src/app/(dashboard)/workspaces/[id]/page.jsx`
- [ ] `src/app/(dashboard)/workspaces/[id]/settings/page.jsx`
- [ ] `src/app/(dashboard)/workspaces/[id]/members/page.jsx`
- [ ] `src/components/workspace/CreateWorkspaceModal.jsx`
- [ ] `src/components/workspace/PendingInvitationsList.jsx`
- [ ] `src/components/workspace/WorkspaceSettingsForm.jsx`
- [ ] `src/components/workspace/DeleteWorkspaceButton.jsx`
- [ ] `src/components/workspace/ManageMembersButton.jsx`
- [ ] `src/components/project/ProjectCard.jsx`
- [ ] `src/components/project/ProjectsSection.jsx`
- [ ] `src/components/project/CreateProjectModal.jsx`
- [ ] `src/components/project/ProjectMembersModal.jsx`
- [ ] `src/components/project/ProjectSettingsForm.jsx`
- [ ] `src/components/project/DeleteProjectButton.jsx`
- [ ] `src/app/(dashboard)/workspaces/[id]/projects/[projectId]/page.jsx`
- [ ] `src/app/(dashboard)/workspaces/[id]/projects/[projectId]/settings/page.jsx`
- [ ] `src/components/task/TaskFilterBar.jsx`
- [ ] `src/components/task/ProjectTasksSection.jsx`
- [ ] `src/app/(dashboard)/workspaces/[id]/projects/[projectId]/tasks/[taskId]/page.jsx`

---

## 🌊 Wave 5 — Settings & Profile

- [ ] `src/app/(dashboard)/settings/profile/page.jsx`
- [ ] `src/app/(dashboard)/settings/layout.jsx`
- [ ] `src/components/settings/ProfileForm.jsx`
- [ ] `src/components/settings/ConnectedAccounts.jsx`
- [ ] `src/components/settings/DeleteAccountButton.jsx`
- [ ] `src/components/settings/SettingsNav.jsx`
- [ ] `src/components/workspace/AcceptInvitationButton.jsx`

---

## 🌊 Wave 6 — Modals & Secondary

- [ ] `src/components/layout/ModuleCard.jsx`
- [ ] `src/components/layout/WorkspaceSwitcher.jsx`
- [ ] `src/components/layout/MobileTopbar.jsx`
- [ ] `src/components/layout/SidebarDrawer.jsx`
- [ ] `src/app/(auth)/layout.jsx`

---

## 🌊 Wave 7 — Notification Polish

- [ ] `src/components/layout/NotificationBell.jsx`
- [ ] `src/components/layout/NotificationDropdown.jsx`
- [ ] `src/components/layout/NotificationItem.jsx`
- [ ] `src/components/layout/NotificationToaster.jsx`
- [ ] `src/components/layout/NotificationToggle.jsx`
- [ ] `src/components/layout/NotificationSound.jsx`

---

## 🌊 Wave 8 — Final QA

- [ ] Full desktop pass — every page, every state
- [ ] Full mobile pass — every page, every state
- [ ] Full tablet pass — check the 768-1024 range
- [ ] Dark mode pass — every page
- [ ] Empty states everywhere
- [ ] Loading states everywhere
- [ ] Error states everywhere
- [ ] Keyboard nav — tab through every interactive element
- [ ] Screen reader pass — verify ARIA labels
- [ ] Cross-browser — Chrome, Firefox, Safari, Edge
- [ ] Motion timings — consistent across the app

---

## 📏 Standards — What "Polished" Means

Use these as your reference.

### Spacing Scale
- **Page padding:** `p-6` mobile, `p-8` desktop
- **Section gap:** `space-y-6` or `gap-6`
- **Element gap:** `gap-2` small, `gap-3` medium, `gap-4` large
- **Card padding:** `p-5` or `p-6`

### Typography Hierarchy
- **Page title:** `text-2xl font-bold`
- **Section title:** `text-lg font-semibold`
- **Card title:** `text-sm font-semibold`
- **Body:** `text-sm`
- **Muted text:** `text-xs text-gray-500 dark:text-gray-400`
- **Label:** `text-xs font-semibold uppercase tracking-wide`

### Colors
- **Primary:** indigo-600
- **Success:** emerald-600
- **Warning:** amber-600
- **Danger:** red-600
- **Surface:** white / gray-50 (light) · gray-900 / #0b0d12 (dark)
- **Border:** gray-200 (light) / white/[0.06] (dark)

### Motion
- **Hover transitions:** `duration-150` or `duration-200`
- **Modal enter/exit:** 200-250ms, ease-out
- **Dropdown open/close:** 150-200ms
- **Page transitions:** 200ms fade
- **Easing:** `ease-out` for enters, `ease-in` for exits

### Micro-interactions
- **Buttons:** hover state + active scale (`active:scale-[0.98]`)
- **Cards:** hover shadow + border color change
- **Links:** hover color change
- **Focus:** visible ring (`focus:ring-2 focus:ring-indigo-500`)

### Responsive Breakpoints
- **Mobile:** `< 640px`
- **Tablet:** `640px – 1023px`
- **Desktop:** `≥ 1024px`
- **Wide:** `≥ 1280px`

---

## ✅ Notes / Decisions Log

Use this section to track decisions made during polish.

- **[2026-10-11]** Sidebar redesign completed. Off-canvas drawer on mobile, top bar with hamburger/brand/bell/avatar. Bell hidden in drawer on mobile (uses top bar).

- *(add more as we go)*

---

## 🎯 Progress

**Files polished:** 1 / 54

**Next up:** `src/app/(auth)/login/page.jsx`

**Current session goal:** Finish Wave 1 (5 files)