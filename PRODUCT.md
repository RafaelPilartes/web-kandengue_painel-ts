# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Kandengue's own staff, at a desk, signed in to the admin panel. Each admin
belongs to one company department (operations, finance, technology, human
capital, business, the board) and works at one access level: **Direcção**
(sees everything), **Gestor** (runs a department) or **Colaborador** (does their
own tasks). Since 2026-10-26 the level and the department decide what each
admin sees and may do.

## Product Purpose

Run Kandengue, an Angolan ride-hailing and delivery platform: approve drivers
and vehicles, follow rides, move money (top-ups, withdrawals, mission bonuses),
set prices and promotions, send notifications — and, from 1.8.0, organise the
company's own work (departments, tasks, projects, deadlines) so the board can
follow what every team is doing.

## Operating Context

- Used daily, for long sessions, on laptop and desktop screens; occasionally
  on a phone to check something (inferred from the existing responsive rules).
- Portuguese (Angola) is the only interface language; money is AOA (Kz).
- Light and dark themes, switched by the admin.
- Money and access changes go through the API, audited in the same
  transaction; the panel reads Firestore directly for most other screens.

## Capabilities and Constraints

- Permissions come from `@rafaelpilartes/kandengue-shared` (`resolveAdminAccess`);
  the panel hides what an admin cannot use, and the API refuses it (403).
- The work module (tasks, board, projects, calendar, reports, bell) reads and
  writes only through `/api/v1/admin/work/*`.
- Deployed by manual upload to cPanel; no SSR.

## Brand Commitments

- Name: **Kandengue Atrevido**. Red is the brand colour (`primary.200`, `#e0212d`).
- Body typeface: **Barlow**, shared with the public website.
