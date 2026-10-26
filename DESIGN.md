---
name: Kandengue — Painel
description: The admin panel of Kandengue Atrevido, an operations tool.
colors:
  primary: "#e0212d"
  primary-hover: "#b31a24"
  primary-active: "#86141b"
  primary-tint: "#fadee0"
  surface-light: "#FFFFFF"
  surface-dark: "#24303F"
  ground-light: "#F1F5F9"
  ground-dark: "#1A222C"
  text-dark: "#111827"
  text-light: "#FFFFFF"
typography:
  page-title:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  section-title:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  control: "8px"
  surface: "6px"
  pill: "9999px"
spacing:
  gap: "24px"
  surface-padding: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.control}"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  surface:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.surface}"
    padding: "{spacing.surface-padding}"
---

# Design System: Kandengue — Painel

## Overview

An operations tool (impeccable mode: **Operate**). Familiar product patterns
first: a top bar, a horizontal menu, white surfaces on a cool grey ground, the
brand red only on primary actions, the current selection and state. Refinement
of the incumbent look, not a redesign.

## Colors

- **Primary red** (`primary.200`) marks the primary action of a screen, the
  active menu item and selection. Never decoration, never a whole surface.
- **Neutrals:** `baseBgLight`/`baseBgDark` for the ground, `light`/`dark` for
  surfaces. Text stays `text-dark`/`text-light` with `gray-500/600` for
  secondary lines.
- **State colours** live in `components/ui/badge.tsx` tones (info, success,
  warning, danger), and only where they carry meaning.

## Typography

One family, **Barlow**, self-hosted (`@fontsource/barlow`, latin, 400–700),
with a system-sans fallback. Fixed rem scale: page title 1.5rem/700, section
1.125rem/600, body 0.875rem, labels 0.75rem/500. Tables use tabular figures
(set globally on `td, th`). `font-mono` is for ids and codes only.

## Layout

Pages stack full-width surfaces with a 24px gap inside `.container`
(max 1200px). Every page opens with `PageHeader` (title, optional
description and breadcrumbs, actions on the right). Lists sit in a `Panel`.
The menu collapses to a modal under 1120px.

## Elevation & Depth

Flat surfaces on a tinted ground; the only shadow is `shadow-3xl` on floating
menus. Modals and drawers use `AppModal`.

## Shapes

Controls 8px (`rounded-lg`), surfaces 6px (`rounded-md`), badges as pills.

## Components

All new screens use `src/components/ui/`:

- `Button` — `primary | secondary | ghost | danger`, `sm | md`, `loading`.
- `TextField`, `TextAreaField`, `SelectField` — label, control and message wired with `aria-describedby`.
- `Badge` — state label by tone.
- `PageHeader`, `Panel`, `EmptyState`, `NoAccess`, `Avatar`.
- `AppModal` (`components/modal`) — centre dialog or right drawer.

Every interactive component has hover, focus-visible, disabled and loading.

## Do's and Don'ts

### Do:
- Say what an empty list means and what to do next (`EmptyState`).
- Name the action on the button ("Criar tarefa", not "OK").
- Keep Portuguese for everything an admin reads.

### Don't:
- No coloured `border-left` stripes on cards, no gradient text.
- No new hover-animation buttons (`BaseButton` styles are legacy; new code uses `Button`).
- No modal where an inline control or a drawer will do.
