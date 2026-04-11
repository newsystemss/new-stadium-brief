# New Stadium Design System Migration

## Purpose
This document defines the design system used by the New Stadium brief submission form. Use it as a single-prompt reference to update the existing newsystems.ca Astro site (at `/Users/Tommy/Documents/Obsidian/New`) to match this aesthetic.

## One-prompt migration instruction

Update the newsystems.ca site's global CSS and layout to match the following design system. Replace the current Apfel Grotezk font with Satoshi Variable. Update all colors, spacing, typography, and interaction patterns to match. Preserve all existing page content and structure. Only change the visual layer.

---

## Font

**Primary:** Satoshi Variable from FontShare
```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap" rel="stylesheet" />
```

**Stack:** `'Satoshi Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Weights:**
- Body text: 450 (variable weight, slightly heavier than regular)
- Headings: 500
- No bold usage anywhere. The heaviest weight is 500.

**Sizes:**
- Base: 14px
- Small/muted: 13px
- H1: 1rem (same as body, differentiated by weight only)
- H2: inherits (no explicit size difference)

**Rendering:**
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

**Line height:** 1.5 for body, 1.4 for labels, 1.3 for headings

---

## Colors

```css
:root {
  --bg: #fafafa;          /* near-white background */
  --text: #343c3c;         /* dark charcoal for body text */
  --text-muted: #5e6666;   /* medium gray for secondary text, hints, optional labels */
  --accent: #abb495;       /* sage green for hover states and text selection */
  --error: #8b3a3a;        /* muted maroon for validation errors */
}
```

**Text selection:** accent background with bg-colored text
```css
::selection {
  background-color: var(--accent);
  color: var(--bg);
}
```

**No dark mode.** Single theme only.

---

## Layout

**Content positioning:** Pinned top-left. No centering. Content hugs the left edge with padding.

```css
main {
  max-width: 560px;
  margin: 0;
  padding: 3rem 1.5rem 4rem;
}
```

This is a departure from the current 15% left margin. The new approach feels more like a raw HTML document.

**Mobile (under 600px):**
```css
main {
  padding: 2rem 1rem 3rem;
  max-width: none;
}
```

---

## Links

- Color: `var(--text)` (same as body text)
- Underlined with `text-underline-offset: 2px`
- Hover: `var(--accent)` (sage green)
- Transition: 150ms ease
- No arrow icon (remove the `::after` content: '\2197' from the current site)

```css
a {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 150ms ease;
}

a:hover {
  color: var(--accent);
}
```

---

## Navigation

- Horizontal flex layout with 1.5rem gap
- Same font size as body (14px) or small (13px)
- Active page: `var(--text)` color
- Inactive pages: `var(--text-muted)` color
- Hover: `var(--accent)`
- No underlines on nav links (only on hover or active)
- No link arrows

---

## Spacing

The spacing is tighter and more document-like than the current site:

- Between sections/fields: 1.75rem
- Between label and input: 0.25rem
- Section heading margin-bottom: 1.5rem
- Page top padding: 3rem (2rem on mobile)

No CSS custom property spacing scale. Values are explicit rem values.

---

## Transitions

Single transition value used everywhere:
```css
--transition: 150ms ease;
```

Page/section transitions use a fadeIn animation:
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Applied with: animation: fadeIn 150ms ease forwards; */
```

---

## Form inputs (if applicable to other pages)

- Bottom-border only (no box borders)
- Border color: `var(--text-muted)`
- Focus border: `var(--text)`
- No border-radius
- Padding: `0.35rem 0`
- Placeholder text: `var(--text-muted)` at 60% opacity, fades to 0 on focus
- Proportional widths: short (160px), medium (260px), long (380px), full-width textareas
- All inputs go full-width on mobile

---

## Buttons / Interactive text

- Styled as underlined text links, not boxed buttons
- Same font as body (14px, weight 450)
- Color: `var(--text)`
- Hover: `var(--accent)`
- Disabled: opacity 0.4
- No background, no border, no padding

---

## Scrollbar

Keep the existing thin scrollbar style but update colors:
```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.05); }
::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }
```

---

## Footer

- Same horizontal flex layout as navigation
- Links in `var(--text-muted)`, hover `var(--accent)`
- No link arrows
- Remove the `a::after { content: '\2197'; }` rule globally

---

## What to change in the existing site

1. **Replace font:** Remove Apfel Grotezk, add Satoshi Variable via FontShare CDN
2. **Update CSS variables:** Replace all color/spacing variables with the values above
3. **Remove link arrows:** Delete the global `a::after` rule
4. **Update layout:** Change from 15% left margin to `margin: 0; padding: 3rem 1.5rem 4rem;`
5. **Update nav/footer:** Match the muted/accent hover pattern
6. **Update typography:** font-weight 450 for body, 500 for headings, 14px base size
7. **Add font smoothing:** antialiased rendering
8. **Update transitions:** Standardize to 150ms ease
9. **Update responsive breakpoints:** Simplify to a single 600px mobile breakpoint
10. **Remove dark mode** if not needed (the current site doesn't have it, so no change here)

## What NOT to change

- Page structure and content
- Astro components (Header, Footer, BaseLayout) can keep their structure, just update styles
- Markdown rendering pipeline
- RSS feed
- View transitions (just update the duration to 150ms if different)
