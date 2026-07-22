# FE UI/UX Modernization Plan

Living notes for Frezo ERP UI upgrades against `FE_UI_UX_STANDARD.md` + pastel/creative board references (Pinterest / soft Kanban).  
**Today:** 2026-07-21.

## Pilot: Ticket / Todolist Kanban (`/task/tickets`)

| Before | After (pilot) |
|--------|----------------|
| White compact cards, left priority bar, SLA ribbon | Soft pastel card surfaces via `--kanban-*-*` CSS variables (info / warning / success / danger / primary / neutral) |
| Code + priority icon + description | Tag chips (code / category / priority), title, optional note |
| No progress / checklist / menu | Progress **dot bar** (status heuristic until BE `progressPercent`), checklist preview when BE sends items, ⋯ menu (edit / comment / delete) |
| Comment count only if field present | Footer: assignee avatar + comment count (opens CommentDrawer); attachment count only if BE provides |
| Spinner / ad-hoc empty | Board skeleton, `EmptyState`, `ErrorState` + retry; `ConfirmDialog` for delete |
| `rounded-2xl` + glass header | Radius ≤12px (`rounded-xl`), shadow ≤ `shadow-card-md`, no glass |

### Constraints respected

- Inter + Lucide only; semantic / controlled tokens (no raw purple spam).
- Cards allowed (Kanban = interaction containers — STANDARD §14.4).
- DnD status change unchanged.
- Permission hide: no new permission invent; existing hide rules untouched.
- **Mobile approve (Phase B leftover): out of scope** this task.

### BA / BE gaps (do not fake APIs)

1. **Checklist** on Ticket — field `checklist` / `checklistItems` missing → UI ready, hidden until BE.
2. **Real progress %** — FE maps status → heuristic %; need `progressPercent` (or checklist completion) from BE.
3. **`commentCount` / `attachmentCount`** on list DTO — comment opens drawer with `0` until count exists; attach icon omitted when null.
4. Optional: CLOSED column on board (STANDARD lists CLOSED; board currently OPEN / IN_PROGRESS / RESOLVED).

### Research refs (2026-07-21)

- Attached pastel Kanban: soft tinted cards, tag chips, progress dots, checklist, avatars, comment/attach, ⋯ — toned down to Frezo radius/shadow.
- Pinterest pin `200058408443663923` — fetch timed out; related creative dashboard patterns: calm light-neutral board, pastel category coding, modular cards ([Cansaas Kanban](https://contra.com/p/QPMQmcYQ-task-management-dashboard-kanban-view), soft ERP dashboard case studies). Frezo keeps Linear/Stripe density + semantic tokens over kawaii gradients.

## Next pilots (suggested)

- CRM Deals board — align card footer meta to Ticket pattern.
- LeaveRequest Kanban — reuse tone tokens for status columns.
- Tasks table (`TasksPage`) → optional board toggle (STANDARD §20 Task).
