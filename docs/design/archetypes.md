# Admin Page Archetypes (D1)

> Authoritative page-archetype contract for `@living-portfolio/ui-admin`. Every admin route declares `data-archetype` on its page column container (`.lp-page-column`). The generic closed-world audit (`K23`) verifies slot order and relation gaps per archetype across 100% of the route manifest (`tests/e2e/wp17-manifest.ts`).

## Closed Set of Archetypes

| Archetype (`data-archetype`) | Required Slot Order | Allowed Relation Gaps (`D2`) |
| --- | --- | --- |
| `form` | `Header` (title [+ intro only if D2 allows]) -> `Section*` (Section heading, Fields/Subsections, [Action group]) -> optional page `ActionBar` | Page header -> first content `S4` (24px); Section -> Section `S5` (40px); Heading -> first content `S3` (16px); Field -> Field `S3` (16px); Label -> Control `S2` (8px); Control -> Helper/Error `S2` (8px); Sibling -> Action group `S4` (24px) except directly after heading (`S3` 16px); Consequence -> ActionBar `S2` (8px); ActionBar -> Feedback `S3` (16px). |
| `list` | `Header` -> `Toolbar` (tabs/filters, optional) -> `List` of Items (or `EmptyState`) -> `Pagination` (optional) | Page header -> first content `S4` (24px); Tabs/Toolbar -> List `S3` (16px); Item padding-block `S3` (16px) with hairline between items; Item rows `S1` (4px); Last text row -> Item ActionBar `S3` (16px). |
| `detail` | `BackLink` -> `Header` (title + `StatusLabel`) -> `Decision bar` (consequence + `ActionBar`, directly under header when actions exist) -> ONE `definition` `List` (at most 2 groups; a group heading only if it holds at least 3 rows) -> `History` (secondary lines) | Page header -> Decision bar `S4` (24px); Consequence -> ActionBar `S2` (8px); Decision bar -> Definition list `S5` (40px) or `S4` (24px); Definition rows `S3` (16px); Section -> History `S5` (40px). |
| `review` | `Header` -> `Tabs` -> `State panel` (`A2` order: headline, last-checked meta, action bar, error Notice, resolved StatusLine) -> `Review items` | Page header -> Tabs `S4` (24px); Tabs -> State panel `S3` (16px); State headline -> meta `S1` (4px); State meta -> ActionBar `S4` (24px); State panel -> Review items `S4` (24px); Item rows `S1` (4px); Last row -> Item ActionBar `S3` (16px). |
| `dashboard` | `Header` -> `Section*` of Items | Page header -> first section `S4` (24px); Section -> Section `S5` (40px); Heading -> first Item `S3` (16px); Item padding-block `S3` (16px). |

## Screen Brief Requirement

Every new admin route MUST declare its archetype (`form | list | detail | review | dashboard`) in its screen brief (`docs/design/screen-brief.md`) and emit `data-archetype` via `renderPageTemplate({ archetype, ... })`.

## Route-to-Archetype Registry

| Route | Archetype | Notes |
| --- | --- | --- |
| `/admin` | `dashboard` | Today workspace sections of navigable Items |
| `/admin/entries` | `list` | Entries list with status filter/list |
| `/admin/inbox` | `list` | Visitor questions list with tabs |
| `/admin/inbox/:id` | `detail` | Question detail & reply |
| `/admin/bookings` | `list` | Consultation requests list with row affordance + inline actions |
| `/admin/bookings/:id` | `detail` | BackLink -> Header+Status -> Decision bar -> single definition list -> History |
| `/admin/audit` | `review` | Tabs (Proposed/Confirmed/Revoked/Contradictions) -> State panel -> Review items |
| `/admin/calibration` | `form` | Calibration thresholds form |
| `/admin/structure` | `form` | Structure rules & coverage sections |
| `/admin/status` | `dashboard` | System health & operational items |
| `/admin/pages` | `list` | Public pages management |
| `/admin/ventures` | `list` | Ventures list & form |
| `/admin/import` | `form` | Multi-step import form |
| `/admin/settings` | `list` | Settings index of navigable module items |
| `/admin/settings/account` | `form` | Sign-in credentials, Security (Authenticator/Recovery/Sessions subsections), API tokens |
| `/admin/settings/answering` | `form` | Answering mode & fallback form |
| `/admin/settings/appearance` | `form` | Theme & accent pack form |
| `/admin/settings/backups` | `form` | Backup target & schedule form |
| `/admin/settings/visibility` | `form` | Site visibility & public routes form |
| `/admin/settings/providers/change` | `form` | Provider change stepper form |
| `/admin/entries/:id/history` | `list` | Revision history items |
| `/admin/_gallery` | `dashboard` | Design system & state-matrix gallery |
| `/admin/_fixture` | `form` | Pattern fixture |
