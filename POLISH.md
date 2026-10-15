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

## 🌊 Wave 1 — Core Navigation & Auth ✅ DONE

- [x] `src/app/(auth)/login/page.jsx`
- [x] `src/app/(auth)/register/page.jsx`
- [x] `src/app/page.jsx` (public landing)
- [x] `src/components/workspace/WorkspaceListClient.jsx`
- [x] `src/app/(dashboard)/workspaces/page.jsx`

---

## 🌊 Wave 2 — Kanban Experience ✅ DONE

- [x] `src/components/task/TaskCard.jsx`
- [x] `src/components/task/KanbanColumn.jsx`
- [x] `src/components/task/KanbanBoard.jsx`
- [x] `src/components/task/TaskDetailModal.jsx`
- [x] `src/components/task/CreateTaskModal.jsx`
- [x] `src/components/task/TaskPageView.jsx`
- [x] `src/components/task/TaskViewMode.jsx`
- [x] `src/components/task/TaskEditMode.jsx`
- [x] `src/components/task/TaskFields.jsx`

---

## 🌊 Wave 3 — Collaboration ✅ DONE

- [x] `src/components/task/CommentList.jsx`
- [x] `src/components/task/CommentItem.jsx`
- [x] `src/components/task/CommentForm.jsx`
- [x] `src/components/workspace/InviteMemberModal.jsx`
- [x] `src/components/workspace/MembersListClient.jsx`
- [x] `src/components/workspace/PendingInvitationsList.jsx`
- [x] `src/components/workspace/AcceptInvitationButton.jsx`
- [x] `src/app/invite/[token]/page.jsx`

---

## 🌊 Wave 4 — Workspaces & Projects ✅ DONE

- [x] `src/app/(dashboard)/workspaces/[id]/page.jsx`
- [x] `src/app/(dashboard)/workspaces/[id]/settings/page.jsx`
- [x] `src/app/(dashboard)/workspaces/[id]/members/page.jsx`
- [x] `src/components/workspace/CreateWorkspaceModal.jsx`
- [x] `src/components/workspace/WorkspaceSettingsForm.jsx`
- [x] `src/components/workspace/DeleteWorkspaceButton.jsx`
- [x] `src/components/project/ProjectCard.jsx`
- [x] `src/components/project/ProjectsSection.jsx`
- [x] `src/components/project/CreateProjectModal.jsx`
- [x] `src/components/project/ProjectMembersModal.jsx`
- [x] `src/components/project/ProjectSettingsForm.jsx`
- [x] `src/components/project/DeleteProjectButton.jsx`
- [x] `src/components/project/ManageMembersButton.jsx`
- [x] `src/app/(dashboard)/workspaces/[id]/projects/[projectId]/page.jsx`
- [x] `src/app/(dashboard)/workspaces/[id]/projects/[projectId]/settings/page.jsx`
- [x] `src/components/task/TaskFilterBar.jsx`
- [x] `src/components/task/ProjectTasksSection.jsx`
- [x] `src/app/(dashboard)/workspaces/[id]/projects/[projectId]/tasks/[taskId]/page.jsx`

---

## 🌊 Wave 5 — Settings & Profile ✅ DONE

- [x] `src/app/(dashboard)/settings/layout.jsx`
- [x] `src/app/(dashboard)/settings/profile/page.jsx`
- [x] `src/components/settings/SettingsNav.jsx`
- [x] `src/components/settings/ProfileForm.jsx`
- [x] `src/components/settings/ConnectedAccounts.jsx`
- [x] `src/components/settings/DeleteAccountButton.jsx`

---

## 🌊 Wave 6 — Modals & Secondary ← CURRENT

- [ ] `src/components/layout/ModuleCard.jsx` — **← NEXT**
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
- **Page padding:** `p-6` mobile, `sm:p-8` desktop
- **Section gap:** `space-y-8` between major sections, `space-y-5` inside forms
- **Element gap:** `gap-2` small, `gap-3` medium, `gap-4` large
- **Card padding:** `p-5` or `p-5 sm:p-6`

### Typography Hierarchy
- **Page title (h1):** `text-[17px] font-semibold tracking-tight`
- **Section title (h2):** `text-[15px] font-semibold tracking-tight`
- **Sub-section title (h3):** `text-[13px] font-semibold`
- **Body:** `text-[13px]`
- **Small body:** `text-[12.5px]`
- **Meta:** `text-[11.5px]`
- **Micro (badges):** `text-[11px]` or `text-[10px]`
- **Uppercase label:** `text-[11px] font-semibold uppercase tracking-wide`
- **Muted text:** `text-gray-500 dark:text-gray-400`
- **Numeric counters:** add `tabular-nums`

### Colors
- **Primary:** `indigo-600` (hover `indigo-700`, disabled `indigo-400` / `dark:indigo-800`)
- **Success / positive:** `emerald-600`
- **Warning:** `amber-600`
- **Danger:** `red-600` (dark hover `red-400`)
- **Page background (light):** `gray-50`
- **Page background (dark):** `#0b0d12`
- **Card surface (light):** `white`
- **Card / modal surface (dark):** `#0f1115`
- **Inner bubble (dark):** `white/[0.03]`
- **Border (light):** `gray-200`
- **Border (dark, cards):** `white/[0.08]`
- **Divider (dark):** `white/[0.06]`
- **Glass error:** `bg-red-500/[0.07] dark:bg-red-500/10 border-red-500/20`
- **Glass warning:** `bg-amber-500/[0.07] dark:bg-amber-500/10 border-amber-500/20`
- **Glass success:** `bg-emerald-500/[0.07] dark:bg-emerald-500/10 border-emerald-500/20`
- **Glass info:** `bg-indigo-500/[0.07] dark:bg-indigo-500/10 border-indigo-500/20`
- **Glass icon tile (indigo):** `bg-indigo-500/10 dark:bg-indigo-500/15`
- **Glass icon tile (red):** `bg-red-500/10 dark:bg-red-500/15`

### Motion
- **Backdrop fade:** `duration: 0.18, ease: 'easeOut'`
- **Modal card:** `duration: 0.2, ease: 'easeOut'`, `initial={{ opacity: 0, scale: 0.96, y: 8 }}`
- **Inner crossfade (state swap):** `duration: 0.22, ease: 'easeOut'`, `mode="wait"`
- **Small element fade:** `duration: 0.15-0.18`
- **Hover transitions:** `duration-150` or `duration-200`
- **Easing:** `ease-out` for enters, `ease-in` for exits

### Micro-interactions
- **Primary / secondary buttons:** `active:scale-[0.98]` + `transition-all duration-150`
- **Icon buttons:** `p-2 rounded-lg active:scale-[0.96]` + `transition-all duration-150`
- **Card hover:** border tint + soft shadow + optional `-translate-y-0.5`
- **Focus (buttons/links):** `focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40`
- **Focus (inputs):** `focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500/60`
- **Focus (danger inputs):** `focus:ring-red-500/20 focus:border-red-500 dark:focus:border-red-500/60`
- **Disabled:** `disabled:opacity-50 disabled:cursor-not-allowed`
- **Danger icon button:** `hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10`
- **Border radius:** `rounded-xl` for inputs/buttons, `rounded-2xl` for cards/modals

### Responsive Breakpoints
- **Mobile:** `< 640px`
- **Tablet:** `640px – 1023px`
- **Desktop:** `≥ 1024px`
- **Wide:** `≥ 1280px`

---

## ✅ Notes / Decisions Log

- **[2026-10-11]** Sidebar redesign completed. Off-canvas drawer on mobile,
  top bar with hamburger/brand/bell/avatar. Bell hidden in drawer on mobile
  (uses top bar).

- **[2026-10-13]** Wave 3 (Collaboration) completed. Key decisions:
  - **Dark mode:** system-preference only (no manual toggle).
  - **Comment rows:** no hover on rows. Only the action buttons inside get hover.
  - **Comment animations:** only newly-posted comments animate in — initial
    load is instant (calm, no stagger on large threads).
  - **Delete confirmations:** inline two-button swap inside `CommentItem`,
    NOT native `confirm()`. Other modals match `DeleteConfirmOverlay`.
  - **`formatRelative`:** kept custom helper in `CommentItem.jsx` (not
    `date-fns`), per project convention.
  - **Row hover:** members & pending-invite rows DO get subtle hover
    (`hover:bg-gray-50/60 dark:hover:bg-white/[0.02]`) — they contain
    actionable controls.
  - **Workspace avatar on `/invite/[token]`:** indigo→purple gradient kept
    + inner ring (only gradient in the app; acceptable as a "welcome"
    moment). Same treatment reused on workspace detail page.

- **[2026-10-14]** Wave 4 (Workspaces & Projects) completed. Key decisions:
  - **Project cards:** soft indigo hover with shadow + `-translate-y-0.5`
    lift. Avatar scales subtly (`group-hover:scale-105`).
  - **Color picker** (create + settings): semantic `role="radiogroup"` +
    `role="radio" aria-checked` per swatch.
  - **Delete flows:** all mirror `DeleteWorkspaceButton` — type-to-confirm
    email/name, glass red surfaces, spinner on submit.
  - **Empty states:** unified pattern across projects/tasks/members — icon
    in glass circle + h3 + helper text + optional CTA.
  - **Project detail stats:** kept hardcoded "Progress 0%" — Phase 9
    Analytics will replace it.

- **[2026-10-15]** Wave 5 (Settings & Profile) completed. Key decisions:
  - **`SettingsNav` disabled items:** use `aria-disabled="true"` +
    `cursor-not-allowed` (not `<a>` with no href).
  - **ProfileForm avatar remove:** native `confirm()` removed — it only
    clears local state until Save, so accidental remove is reversible.
  - **ProfileForm success flow:** still calls `session.update()` to refresh
    the JWT (sidebar/user menu) then `router.refresh()`.
  - **All destructive modals:** wrapped in `AnimatePresence`, use
    `role="dialog"`, `aria-modal`, `aria-labelledby`, and body scroll lock.

---

## 🎯 Progress

**Files polished:** 46 / 56

**Waves complete:** 1, 2, 3, 4, 5

**Next up:** `src/components/layout/ModuleCard.jsx`

**Current session goal:** Start Wave 6 — Modals & Secondary (5 files)

---

## 🧭 Known Future Refactors (not now — post-launch)

- **Confirm modal duplication.** Five nearly identical confirm modals exist
  now: `DeleteConfirmOverlay` (in `TaskDetailModal`), `RemoveConfirmModal`
  (in `MembersListClient`), `ConfirmRevokeModal` (in
  `PendingInvitationsList`), `DeleteProjectButton`, `DeleteAccountButton`.
  Extract into a shared `<ConfirmModal />` after polish is complete.

- **`canEdit` duplication.** Logic exists inline in
  `ProjectTasksSection.jsx` (`canEditTask`) and
  `tasks/[taskId]/page.jsx` (`canEdit`). Both should call
  `canMutateTask` from `lib/permissions.js`.

- **`shapeTask` object duplication.** Inline in
  `projects/[projectId]/page.jsx`, `tasks/[taskId]/page.jsx`, and mirrored
  in `TaskDetailModal` consumers. Extract a `shapeTask()` helper in `lib/`.

- **Orphaned Cloudinary uploads.** `ProfileForm` uploads immediately on
  file select but only saves URL on submit. Cancel = orphaned file.
  Consider a cleanup cron or a "pending uploads" tracking mechanism.

- **`src/proxy.js` dead code.** Top ~70 lines are commented-out older
  version. Remove before launch.

- **`layout.js` metadata.** `description` still says "Generated by create
  next app". Replace with real copy before launch.

- **No `src/app/api/auth/[...nextauth]/route.js`** visible in tree.
  Verify NextAuth mount point before launch.

- **`ProjectTasksSection` `useEffect` for stale detailTask.** Current logic
  works (setDetailTaskId(null) if task no longer found) but could be
  cleaner as derived state.