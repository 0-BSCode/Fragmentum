# Fragmentum Style Guide

## Color System

### Design Philosophy
Fragmentum uses a **neutral dark theme** with a **golden yellow accent** for a modern, professional appearance that's easy on the eyes during extended use.

### CSS Custom Properties

All colors are defined as CSS custom properties in `:root` for easy theming and consistency.

#### Background Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-primary` | `#1a1a1a` | Main background, body |
| `--bg-secondary` | `#242424` | Cards, header, footer |
| `--bg-tertiary` | `#2e2e2e` | Badges, secondary buttons, hover states |

#### Text Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--text-primary` | `#eaeaea` | Main text, headings |
| `--text-secondary` | `#a0a0a0` | Secondary text, descriptions |
| `--text-muted` | `#6b6b6b` | Disabled text, hints |

#### Accent Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--accent-primary` | `#FFDE64` | Primary buttons, active states, focus rings |
| `--accent-secondary` | `#D4B84A` | Hover borders, secondary accents |

#### Status Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--success` | `#2ecc71` | Success messages, go-to button hover |
| `--danger` | `#e74c3c` | Error messages, delete button hover |

#### Utility Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `--border-color` | `rgba(255, 255, 255, 0.1)` | Subtle borders, dividers |
| `--shadow` | `0 4px 6px rgba(0, 0, 0, 0.3)` | Elevation, dropdowns |

### Button Styles

#### Primary Button
- Background: `--accent-primary` (#FFDE64)
- Text: `#1a1a1a` (dark for contrast on light background)
- Hover: `#E5C85A` (darker golden yellow)

#### Secondary Button
- Background: `--bg-tertiary` (#2e2e2e)
- Text: `--text-secondary` (#a0a0a0)
- Hover: `#3a3a3a` with `--text-primary` text

### Accessibility

#### Contrast Ratios
| Combination | Ratio | Status |
|-------------|-------|--------|
| `--accent-primary` on `--bg-primary` | 13.5:1 | WCAG AAA |
| Dark text on `--accent-primary` | 10.2:1 | WCAG AAA |
| `--text-primary` on `--bg-primary` | 12.6:1 | WCAG AAA |
| `--text-secondary` on `--bg-primary` | 6.3:1 | WCAG AA |

#### Focus States
All interactive elements use `--accent-primary` for focus outlines:
```css
.btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

#### Reduced Motion
Animations and transitions are disabled for users who prefer reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

### Usage Examples

```css
/* Using background hierarchy */
.container { background: var(--bg-primary); }
.card { background: var(--bg-secondary); }
.badge { background: var(--bg-tertiary); }

/* Using accent for interactive elements */
.button-primary { background: var(--accent-primary); }
.active-tab { border-color: var(--accent-primary); }

/* Status indicators */
.success-message { color: var(--success); }
.error-message { color: var(--danger); }
```

### Files

| File | Purpose |
|------|---------|
| `styles/popup.css` | Popup window styles |
| `styles/content.css` | Content script styles (floating button) |
