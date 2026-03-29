## Admin Structure

- `pages/`
  Admin route pages used by `App.jsx`
- `components/`
  Shared admin layout and reusable UI wrappers
  Current shared UI: pagination, confirm modal, meta card, form field, empty state, filter summary, moderation detail blocks
- `services/`
  Admin-side API access helpers

Current root admin files are still kept for compatibility while the admin area is being reorganized incrementally.
The largest pages still worth splitting further are `AdminShopsPage.jsx` and `AdminUsersPage.jsx`.
