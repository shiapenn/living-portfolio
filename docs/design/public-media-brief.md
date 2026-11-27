# Public Media & Consent-Gated Embed Briefs (`WP-18.4`)

Public entry rendering operates in expressive mode on `@living-portfolio/ui-public` using strictly `--pub-*` and `--lp-core-*` tokens (`L7 = 0` hardcoded literals).

## 1. `.pub-media` (Public Figure for Images & Uploaded Video)

- **Purpose:** Present author-hosted images (`/api/media/:id`) and uploaded videos (`:::video{src="/api/media/:id" ...}`) within the reading column without layout shift or third-party tracking.
- **Privacy invariant:** Markdown images whose URL is not `/api/media/:id` never emit `<img>`; they degrade to plain `<a>` link text so external servers never receive visitor IP/Referer beacons on page load.
- **Markup & Accessibility:**
  - `<figure class="pub-media" data-pub-media="image|video">`
  - Images carry explicit `width` and `height` attributes from stored `media_assets` dimensions (`aspect-ratio` preserved via `height: auto`), `loading="lazy"`, and `alt` (`alt=""` when decorative).
  - Uploaded videos carry `controls`, `preload="metadata"`, and `aria-label` from the required `Description` field.
  - Optional `<figcaption class="pub-media-caption">` sits `var(--pub-space-stack-sm)` beneath the media frame in `--pub-font-family-ui` / `--pub-font-size-caption` / `--pub-color-text-secondary`.
- **Tokens used:** `--pub-space-stack-lg`, `--pub-space-stack-sm`, `--pub-radius-card`, `--pub-border-hairline`, `--pub-color-border-rule`, `--pub-color-surface-paper`, `--pub-font-family-ui`, `--pub-font-size-caption`, `--pub-font-line-ui`, `--pub-color-text-secondary`.

## 2. `.pub-embed-gate` (Consent-Gated External Video Placeholder)

- **Purpose:** Gate third-party video embeds (`:::video{embed="https://..." ...}` for hosts in `MEDIA_EMBED_ALLOWED_HOSTS`, default `youtube-nocookie.com` and `player.vimeo.com`) behind explicit visitor click consent.
- **Zero-Request Invariant:** Before click (`data-embed-state="unloaded"`), SSR HTML contains **zero** `<iframe>`, **zero** remote thumbnail `<img>`, and **zero** provider `<script>`. No network request leaves the browser to any third-party host until `.pub-embed-load-btn` is activated.
- **Activation Behaviour:** Clicking `Load video` (`Enter`/`Space`/pointer) replaces the placeholder contents with `<iframe class="pub-embed-frame" src="..." title="..." loading="lazy" referrerpolicy="no-referrer" allow="fullscreen" allowfullscreen>` and sets `data-embed-state="loaded"`. CSP `frame-src` is derived strictly from `MEDIA_EMBED_ALLOWED_HOSTS`.
- **Tokens used:** `--pub-color-surface-paper`, `--pub-border-hairline`, `--pub-color-border-rule`, `--pub-radius-card`, `--pub-space-card-pad`, `--pub-space-stack-sm`, `--pub-space-stack-md`, `--pub-font-family-display`, `--pub-font-family-ui`, `--pub-font-size-heading-sm`, `--pub-font-size-caption`, `--pub-color-text-primary`, `--pub-color-text-secondary`.
