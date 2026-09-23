# Admin UI

The staff-facing side of the Flask app: server-rendered Jinja at `/admin`, plain browser JS (no bundler, no npm), and a layered CSS system. Session auth, POST-redirect-flash, with two AJAX endpoints for status toggles.

## Admin routes

| Method | URL | View | Notes |
|---|---|---|---|
| GET POST | `/admin/login` | `login` | public; redirects to `admin.products` if already authed |
| GET | `/admin/logout` | `logout` | **GET, so CSRF-unprotected** |
| GET | `/admin/products` | `products` | filters: `q`, `category_id`, `status`, `day`, `missing_image` |
| GET POST | `/admin/products/new` | `new_product` | `save_add_another` redirects back to the form |
| GET POST | `/admin/products/<id>/edit` | `edit_product` | `save_duplicate` also duplicates and opens the copy |
| POST | `/admin/products/<id>/set-status` | `set_product_status` | **JSON** → `{"ok": true, "status": …}` |
| POST | `/admin/products/<id>/duplicate` | `duplicate_product` | |
| POST | `/admin/products/<id>/delete` | `delete_product` | hard delete, no guard |
| POST | `/admin/products/bulk` | `bulk_products` | `bulk_day = "clear"` unsets the day |
| GET | `/admin/categories` | `categories` | |
| POST | `/admin/categories` | `manage_categories` | multiplexed on `action`: `create` / `update` / `reorder`. An unknown action silently redirects |
| POST | `/admin/categories/<id>/set-status` | `set_category_status` | **JSON** → `{"ok": true, "status": …, "active": bool}` |
| POST | `/admin/categories/<id>/delete` | `delete_category` | blocked while products remain (flashes `warning`, not `danger`) |
| GET POST | `/admin/slideshow` | `slideshow` / `upload_slideshow` | multi-file |
| POST | `/admin/slideshow/<id>/delete` | `delete_slide` | **no confirmation** |
| POST | `/admin/slideshow/reorder` | `reorder_slideshow` | |
| GET POST | `/admin/catering` | `catering` / `upload_catering` | same algorithm as slideshow |
| POST | `/admin/catering/<id>/delete` | `delete_catering_menu` | **no confirmation** |
| POST | `/admin/catering/reorder` | `reorder_catering_menus` | |
| GET | `/admin/subscriptions` | `subscriptions` | split into person/family in the route |
| GET POST | `/admin/subscriptions/new` | `new_` / `create_subscription_plan` | GET and POST are **separate views** here, unlike products |
| GET POST | `/admin/subscriptions/<id>/edit` | `edit_` / `update_subscription_plan` | |
| POST | `/admin/subscriptions/<id>/delete` | `delete_subscription_plan` | |

There is **no `/admin/` index** — `login` redirects to `admin.products`.

Flash categories in use: `success`, `danger`, `warning`, `info`.

> **Status validation is inconsistent between the two AJAX endpoints.** `set_category_status` validates `{"active","inactive"}` *in the route* and hand-builds a 400. `set_product_status` does no route check and lets `Product.set_status` raise into the blueprint handler. Two code paths for the same UX.

## Forms

[app/admin/forms.py](../backend/app/admin/forms.py). All inherit `FlaskForm`, so all carry CSRF.

| Form | Fields |
|---|---|
| `LoginForm` | `username` (max 80), `password` |
| `ProductForm` | `name`, `name_ar` (optional), `priceSingleCents` (`NumberRange(min=0)`), `priceFamilyCents` (optional), `category_id` (`SelectField(coerce=int)`, `NumberRange(min=1)` rejects the `0` placeholder), `ingredients`, `day`, `order_unit` (`each` / `dozen`), `status`, `image` (**no `FileAllowed`** — type checking happens entirely in `s3.upload_file`) |
| `SubscriptionPlanForm` | `audience`, `days_per_month` (min 1), `price_plat_du_jour`, `price_with_salad` |
| `SlideshowForm` / `CateringMenuForm` | `images` (`MultipleFileField`) |

`ProductForm.__init__` refreshes `category_id.choices` from `CategoryService.choices()` on every instantiation (imported inside `__init__` to dodge a circular import). Field names match DB columns exactly, so `ProductForm(obj=product)` binds without mapping.

`ProductForm.sanitize_filename()` exists but **is never called** — the raw `FileStorage` goes straight to `ImageService.upload`, and S3 keys are content-hashed, so the original filename never reaches storage.

Both multi-file forms call `form.validate()` (effectively a CSRF check) and then **ignore `form.images.data`**, reading `request.files.getlist("images")` directly.

## Template architecture

```
admin/base.html                         ← the only file with <!doctype html>
├── admin/layouts/dashboard.html        → catalog/*, media/*, subscriptions/subscriptions
├── admin/layouts/form.html             → catalog/product_form, subscriptions/subscription_form
├── admin/pages/auth/login.html         (extends base directly — no nav)
└── errors/404.html, errors/500.html    (extend base directly)
```

| Layer | Blocks it defines |
|---|---|
| `base.html` | `title` (suffixed `\| Nisrine's Catering`), `head`, `content` |
| `layouts/dashboard.html` | `page_title`, `page_actions`, `page_content` — hard-includes `admin_nav.html` |
| `layouts/form.html` | `form_eyebrow`, `form_title`, `form_description`, `form_header_aside`, `form_content` — **deliberately omits the nav** |

`base.html` fixes: `<meta name="csrf-token">` (read by `categories.js` and `products.js`), the Playfair Display font link, `css/main.css`, a topbar with a conditional Logout, the flash include, `<main id="main-content" class="panel">`, the confirm modal include, and three unconditional scripts (`toast.js`, `confirm.js`, `sortable.js`).

> The error templates extend the *admin* base, so an HTML 404 renders admin chrome including a "Back to products" link that is itself login-protected.

### Includes

- **`admin_nav.html`** — declares `admin_nav_items` (Products, Categories, Subscriptions, Catering, Slideshow) with `active_endpoints` lists; the current pill gets `is-active` + `aria-current="page"`.
- **`flash_messages.html`** — renders `get_flashed_messages(with_categories=true)` into `#toast-stack`.
- **`confirm_modal.html`** — one global modal per page, with `role="dialog" aria-modal="true"`.

### Macros

**`macros/forms.html`** — one macro, `render_form_field(field, wrapper_data_field=none, label_note="", show_inline_error=false, **kwargs)`. Emits the label, an optional note, the widget, an optional empty `[data-inline-error-for]` div for client-side messages, an optional `{% call %}` body, and a server-side `.field-errors` block. Composes `aria-describedby` from whichever parts exist and sets `aria-invalid` on server errors.

**`macros/ui.html`**

| Macro | Purpose |
|---|---|
| `edit_button(href, title)` | pencil icon link |
| `delete_button(form_id, message, title)` | carries `data-confirm-form` / `data-confirm-message` → goes through the confirm modal |
| `delete_submit_button(action, title)` | `formaction` submit — **bypasses the modal entirely**, deletes immediately |
| `save_button(form_id, title, extra_class, disabled, aria_hidden)` | optional `form=` attribute lets it submit a form it isn't nested in |
| `hidden_delete_form(form_id, action)` | the CSRF-only stub `delete_button` targets |
| `status_switch(entity, entity_id, current_status, label)` | the AJAX toggle; `entity` is what makes the attribute `data-product-id` vs `data-category-id` |
| `empty_state(title, message)` | |
| `trash_icon()` / `save_icon()` | inline SVGs |

> **Delete confirmation is asymmetric.** Products, categories, and subscription plans go through the confirm modal. Slideshow and catering images use `delete_submit_button` and **delete immediately with no confirmation.** That's real, not a misreading.

## Admin JavaScript

Plain ES2020+, no modules, no bundler, no dependencies. Two globals are the only cross-file coupling: `window.showToast` (from `toast.js`) and `window.imageCompressor` (from `image_compress.js`). Global scripts load at the end of `<body>`; page scripts load `defer` from each page's `head` block.

| File | Loaded by | Does |
|---|---|---|
| `toast.js` | all | Auto-dismisses server flashes at 4500ms (removal 220ms after the 200ms `toast-out`). Exposes `showToast(msg, type)` which lazily creates the stack. **Builds toasts with `innerHTML`** — every current caller passes a literal, but don't pass user input |
| `confirm.js` | all | Modal for `[data-confirm-form]`. Focus trap on Tab, Escape and backdrop-click to dismiss, restores previous focus. Submits via `form.submit()` (not `requestSubmit()`), so **no `submit` event fires** — which is why the sortable order-injection never runs for deletes |
| `sortable.js` | all (active on categories, catering, slideshow) | Drag-and-drop reorder — see below |
| `categories.js` | categories | Inline rename + category status toggle |
| `products.js` | products | Product status toggle + `#bulk-all` select-all + live stat counters |
| `product_form.js` | product form | Per-field client validation + hooks image compression |
| `catering.js` / `slideshow.js` | those pages | Identical apart from the form id: compress on file pick, show "N image(s) ready to upload." |
| `image_compress.js` | forms with uploads | Canvas resize/re-encode — see below |

### Drag-and-drop reorder (`sortable.js`)

Runs for every `tbody[data-sortable]` — present on **categories, catering, slideshow only**. Products cannot be reordered.

1. Requires an ancestor `<form>`; bails otherwise. That form is the submit target.
2. Prepends a `.drag-handle` cell (`draggable="true" tabindex="0"`) to each `tr[data-id]`, with `aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"` and a label derived from the row's name input or title.
3. Appends a fixed `.sort-save-bar` to `document.body` ("You have unsaved changes" + a Save order button calling `form.requestSubmit()`), off-screen until `.is-visible`.
4. **Pointer drag:** `dragover` reorders live by comparing `e.clientY` against each row's vertical midpoint and calling `insertBefore`. There is no `drop` handler — the DOM is already final.
5. **Keyboard:** Alt+ArrowUp/Down swaps with the sibling and re-focuses the handle.
6. **Persistence:** on `submit`, it first checks `if (e.submitter?.hasAttribute("formaction")) return;` — this is what stops a `delete_submit_button` from carrying an order payload. Otherwise it appends one hidden `item_ids` input per row in current DOM order.

Endpoints read `request.form.getlist("item_ids")`. Categories cast with `int()` and flash `Invalid category order.` on failure. Services assign `sort_order` by list position and **skip unknown ids without renumbering**, so gaps are left behind by design.

### Status toggles

Both follow the same shape:

```
POST /admin/{products|categories}/{id}/set-status
Headers: Content-Type: application/json, X-CSRFToken: <meta csrf-token>, Accept: application/json
Body:    {"status": "active" | "inactive"}
```

On success the input is re-synced from the server's response; on any failure `checked` reverts and `showToast(…, "danger")` fires. `products.js` also adjusts the `#stat-active` / `#stat-inactive` counters (correctly leaving `#stat-total` alone).

> `categories.js` guards against a missing `data-category-id`; `products.js` does not — a row without one would POST to `/admin/products/undefined/set-status`.

### Client-side validation (`product_form.js`)

A `rules` map keyed by field name, with inline errors written into the `[data-inline-error-for]` elements that `render_form_field(..., show_inline_error=true)` emits. Validates on `input`, `blur`, and `submit`; focuses the first `.field.invalid` on failure.

> **Known client/server divergence:** the client rule is `priceSingleCents: { min: 1 }`, but the server's `ProductForm` uses `NumberRange(min=0)` and a test asserts 0 is valid. **A free item can be created by POST but not through the form UI.**

### Image compression

[static/js/image_compress.js](../backend/app/static/js/image_compress.js) — pure client-side, no network. Exposes `window.imageCompressor`.

**Files ≤ 0.7 MB are passed through untouched.** Above that, a size-banded ladder picks the plan — larger inputs are compressed *harder*:

| Original size | Longest edge | Quality |
|---|---|---|
| > 4 MB | 1400px | 0.82 |
| > 2.5 MB | 1500px | 0.86 |
| > 1.2 MB | 1700px | 0.90 |
| > 0.7 MB | 1900px | 0.92 |

- Scale is `min(1, maxDim / longestEdge)` — **downscale only, never upscale.**
- **Format:** PNG in → PNG out; **everything else becomes JPEG** (so decodable HEIC/WebP/GIF get re-encoded). `canvas.toBlob` ignores quality for PNG, so PNGs are only resized, never quality-reduced. The extension is rewritten to match — which matters, since `s3.allowed_file` checks both extension and MIME.
- **Safety valve:** if the result isn't actually smaller than the original, the original is kept.
- Never rejects — every error path resolves with the original file.
- `compressInputFiles` iterates **sequentially** (`await` in a `for…of`, not `Promise.all`) and swaps the input's `FileList` via a `DataTransfer`.

Compression is an optimization, not enforcement — the server re-validates size (15 MB/file, 50 MB/request) and type.

> Because compression is awaited inside an async `change` handler and nothing disables the submit button, a user who clicks Upload immediately after picking files could in principle submit before the swap completes.

## CSS system

`main.css` is a **pure manifest** — 34 lines, no rules. Line 1 fixes the cascade:

```css
@layer tokens, reset, base, layout, components, utilities, pages;
```

Every `@import` is assigned to a layer explicitly, so layer precedence is fixed regardless of import order. That's why the single-purpose `pages/` overrides work without `!important` — the codebase contains exactly one, on `[hidden]{display:none!important}`.

### Tokens (`base/tokens.css`, all on `:root`)

`color-scheme: light` — **no dark mode anywhere.** A warm terracotta/brown palette, distinct from the customer site's:

- Surfaces: `--color-bg #fdf8f5`, `--color-surface #ffffff`, `--color-surface-warm #fff3ec`
- Text: `--color-text #3e160a`, `--color-muted #8a4b3a`, `--color-heading #2b0f07`
- Brand: `--color-brand #521c0d`, `--color-primary #a34f13`, `--color-primary-hover #8f3f0a`
- Borders: `--color-border #f0dfd6`, `--color-border-strong #dfc7b9`
- Semantic triplets (fg/bg/border) for success, warning, danger; `info` has bg + border only
- Radii `--radius-xs…xl` + `--radius-pill 999px`; 5 shadows; spacing `--space-1…7` (4→36px)
- Type: `--font-body` (system stack), `--font-heading` (Playfair Display); sizes xs→2xl

### Naming

Loose BEM with state and utility prefixes:

- Blocks: `.card`, `.btn`, `.panel`, `.toast`, `.switch`, `.badge`, `.thumb`, `.field`, `.nav-pill`
- Elements use `__`: `.page-header__title`, `.filter-bar__search`, `.sort-save-bar__label`
- Modifiers are sometimes `--` (`.thumb--table`) but more often a second flat class (`.btn-ghost`, `.badge-success`)
- States use `is-`: `.is-active`, `.is-visible`, `.is-dragging` — with pre-convention exceptions `.invalid`, `.show`, `.toast-hide`
- Utilities use `u-` — except `.mb-3` in the same file, the one clear inconsistency
- Tables use `col-*` for `<th>` widths and `cell-*` for `<td>` behavior
- **JS hooks are data attributes, not classes**: `data-sortable`, `data-id`, `data-confirm-form`, `data-inline-error-for`, `data-category-update-name`, `data-product-row`

Responsive is **desktop-first** `max-width` queries at 900 / 860 / 768 / 720px (the last transforms tables into cards). `base/global.css` clamps all animation to 1ms under `prefers-reduced-motion`.

### File roles

| File | Role |
|---|---|
| `main.css` | layer declaration + import manifest, no rules |
| `base/tokens.css` | every custom property |
| `base/reset.css` | border-box, margin zeroing, `font: inherit`, `[hidden]` |
| `base/global.css` | body defaults, `:focus-visible`, `.sr-only`, reduced-motion |
| `base/typography.css` | `clamp()` heading scale, `.muted`, `.eyebrow`, `.row-title`, `.value` |
| `layouts/shell.css` | `.page` gradient, `.shell` container, `.panel` |
| `layouts/topbar.css` | `.topbar`, `.brand*`, `.top-actions` |
| `layouts/page-header.css` | the 3-column header grid |
| `layouts/form.css` | `.two-col`, `.form-grid`, `.form-wrapper` |
| `components/actions.css` | `.actions` flex row (9 lines) |
| `components/buttons.css` | `.btn` + every variant |
| `components/form-controls.css` | inputs, file inputs, `.inline-error`, `.invalid` |
| `components/switch.css` | the `status_switch` toggle |
| `components/cards.css` | `.card`, `.form-card`, `.empty-state` |
| `components/badges.css` | `.badge`/`.pill` variants, `.status-dot` |
| `components/tables.css` | `.table`, `.sticky-header`, the 720px card-stacking transform |
| `components/navigation.css` | `.nav-group`, `.nav-pill` |
| `components/feedback.css` | `.toast*`, `.alert*`, toast keyframes |
| `components/modal.css` | `.modal-backdrop`, `.modal` |
| `components/media.css` | `.thumb`, `.thumb-placeholder` (`content: attr(data-initial)`) |
| `components/sortable.css` | `.drag-handle`, `.is-dragging`, `.sort-save-bar` |
| `utilities/spacing.css` | four margin helpers |
| `pages/errors.css` | `.error-page`, `.error-code` |
| `pages/admin/auth.css` | login screen |
| `pages/admin/media.css` | two rules for slideshow/catering |
| `pages/admin/catalog/products.css` | `.stat-grid`, `.filter-bar`, `.products-table`, `.bulk-*` |
| `pages/admin/catalog/categories.css` | `.name-input`, `.category-save-btn`, `.inline-create` |
| `pages/admin/subscriptions/subscriptions.css` | one `.field-header` rule |

## Known inaccuracies in the UI

- `subscription_form.html` tells the user on create: *"If a plan with the same type and days already exists, it will be updated."* **This is wrong** — `SubscriptionService.create` raises `ConflictError` and the route flashes an "already exists" error. A test confirms the conflict behavior.
- The products page exposes **no control for the `missing_image` filter**, even though the view reads `missing_image=1`.
- `admin_nav.html` lists the subscription *form* endpoints in `active_endpoints`, but `layouts/form.html` never includes the nav — so those entries are unreachable.
- `.auth-meta` in `auth.css` has no corresponding markup. Dead rule.
- There is an `#main-content` id but **no skip link**.
