# Trademark and Unofficial Fork Policy (`TRADEMARKS.md`)

This document states the trademark policy for **The Living Portfolio** pursuant to Section 6 of the Apache License, Version 2.0 and [`docs/plans/osr-001-open-source-release.md`](docs/plans/osr-001-open-source-release.md) (§1.2, `OSR-06`, `OSR-09`).

## 1. Reservation of Trademarks

1. The project name (**"The Living Portfolio"**) and official logos are reserved exclusively for the official hosted service and official project releases. They are **NOT** licensed under the Apache-2.0 license.
2. Apache-2.0 Section 6 explicitly excludes trade names, trademarks, service marks, and product names from the copyright and patent license grants.
3. Official brand assets are segregated under [`brand/`](brand/) with their own proprietary license ([`brand/LICENSE`](brand/LICENSE)) and are excluded from the Apache-2.0 grant. The open-source codebase ships with neutral placeholder branding (`PUBLIC_SITE_NAME=Portfolio Sandbox`, `PUBLIC_OWNER_NAME=Portfolio Owner`).

## 2. Configuration-Driven Branding

Site name, owner name, logo URL, footer text, and unofficial-fork disclosures are controlled strictly via configuration (`@living-portfolio/config` environment variables `PUBLIC_SITE_NAME`, `PUBLIC_OWNER_NAME`, `PUBLIC_SITE_LOGO_URL`, `PUBLIC_SITE_FOOTER_TEXT`, `PUBLIC_UNOFFICIAL_FORK_NOTICE`), never via literals in source code.

## 3. Requirements for Forks and Third-Party Deployments

1. **Self-hosting for personal use:** You may freely run, modify, and self-host the software for your own personal portfolio under Apache-2.0 using your own name, domain, and branding.
2. **Forks and services offered to others:** Any fork or deployment offering a service to others, or publishing modified distributions, **MUST**:
   - Remove all official branding (`brand/` assets and official project names), AND
   - Display the following mandatory notice in a visible place such as the site footer and the About page (enabled by default via `PUBLIC_UNOFFICIAL_FORK_NOTICE`):
     > *"This is an unofficial fork and is not affiliated with the official project."*
