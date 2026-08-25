# EduFit Nepal — UI Theme & Design System Specification

## 1. Design Direction & Vibe

- **Core Aesthetic Formula**: `intelOS Structure` + `Epieos Warm Red Branding`
- **Product Vibe**: Professional, clean, modern, information-dense SaaS decision dashboard.
- **Design Philosophy**: Restrained elegance. Uses borders, subtle off-white backgrounds, and typography hierarchy over heavy shadows or flashy glowing panels.

---

## 2. Color Tokens

### Primary Brand (Red Variant)
```css
--primary: #D8322A;            /* Warm, muted institutional red */
--primary-hover: #C82D27;      /* Hover state */
--primary-soft: rgba(216, 50, 42, 0.08); /* Active navigation / soft badge background */
```

### Typography & Text Colors
```css
--text-primary: #0F172A;   /* Near-black / dark slate for H1-H3 headings */
--text-secondary: #64748B; /* Cool gray for body text */
--text-muted: #94A3B8;     /* Light gray for metadata and captions */
```

### Surfaces & Backgrounds
```css
--background: #F7F9FC;     /* Off-white page background */
--surface: #FFFFFF;        /* Pure white for cards, panels, and modals */
--surface-muted: #F1F5F9;  /* Muted background for secondary blocks */
```

### Borders
```css
--border: #E2E8F0;         /* Default border for cards and dividers */
--border-strong: #CBD5E1;  /* Focus states and secondary button outlines */
```

### Semantic Status Colors
```css
--success: #16A34A; /* Verified / High Compatibility / Confirmed */
--warning: #F59E0B; /* Conditional / Approaching Deadline / Medium Risk */
--danger:  #DC2626; /* Not Recommended / Critical Problem / High Risk */
--info:    #2563EB; /* Informational / Guidance Badges */
```

---

## 3. Typography & Spacing System

- **Font Family**: `'Inter', sans-serif`

| Element | Size | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **H1 / Page Title** | `28px` | `700` | `-0.02em` | Main dashboard header, hero title |
| **H2 / Section Title**| `18px` | `600` | `-0.01em` | Section headings, card group titles |
| **H3 / Card Title** | `15px` | `600` | `0` | Individual card titles, feature labels |
| **Body Text** | `14px` | `400` | `0` | Standard paragraph and descriptive text |
| **Metadata Text** | `13px` | `400–500`| `0` | Dates, secondary info, timestamps |

---

## 4. Components & Layout Specs

### Border Radius
```css
--radius-sm: 6px;  /* Tooltips, small badges */
--radius-md: 10px; /* Standard cards, inputs */
--radius-lg: 14px; /* Modals, hero panels */
```

### Card Elevation & Shadow
```css
box-shadow:
  0 1px 2px rgba(15, 23, 42, 0.03),
  0 4px 12px rgba(15, 23, 42, 0.025);
```

### Primary Buttons
- Background: `var(--primary)`
- Text: `#FFFFFF`
- Radius: `8px`
- Shadow: `0 3px 8px rgba(216, 50, 42, 0.18)`

### Status Badges / Pills
- Radius: `20px` (Full pill shape)
- Padding: `3px 8px`
- Font Size: `12px`
- Background: Soft 10% opacity tint of semantic color.

---

## 5. Theme Architecture

The CSS variables are organized under `:root` with data-theme support for future color variants:

```css
[data-theme="red"] {
  --primary: #D8322A;
  --primary-hover: #C82D27;
  --primary-soft: rgba(216, 50, 42, 0.08);
}
```
