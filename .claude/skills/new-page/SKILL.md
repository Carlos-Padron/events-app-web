---
name: new-page
description: Scaffold a new lazy-loaded Angular 21 feature page with component, HTML template, and route registration. Use when asked to create a new page or screen.
---

The user wants to create a new page. $ARGUMENTS describes the page name and feature it belongs to (e.g. "event-settings under events feature").

Follow these steps exactly:

## 1. Determine paths

- Component directory: `src/app/features/<feature>/pages/<page-name>/`
- TypeScript file: `<page-name>.ts`
- HTML file: `<page-name>.html`
- Routes file: `src/app/features/<feature>/pages/<feature>.routes.ts`

## 2. Create the TypeScript component

Use this exact structure — no deviations:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-<page-name>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex-1 flex flex-col' },
  imports: [],
  templateUrl: './<page-name>.html',
})
export class <PageName> {
}
```

Rules:
- `standalone: true` must NOT be set (default in Angular v20+)
- Use `host: { class: 'flex-1 flex flex-col' }` so the page fills the shell
- Use `ChangeDetectionStrategy.OnPush` always
- Add state with `signal()`, derived state with `computed()`
- Use `inject()` for dependencies, not constructor injection

## 3. Create the HTML template

Start with the standard scrollable page wrapper:

```html
<div class="flex-1 overflow-y-auto flex flex-col bg-ink px-6 py-10">

  <!-- content here -->

</div>
```

Use native control flow: `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`.

## 4. Register the route

Add a lazy-loaded entry to the feature's routes file:

```typescript
{
  path: '<url-segment>',
  loadComponent: () => import('./<page-name>/<page-name>').then((c) => c.<PageName>),
},
```

Place it in the correct order — specific literal paths before parameterized paths (`:id`).

## 5. Verify

Run `ng build --configuration development` and confirm zero TypeScript errors before reporting done.
