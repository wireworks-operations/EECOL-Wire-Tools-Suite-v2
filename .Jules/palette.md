## 2025-05-15 - [Form Accessibility & ARIA Toggle States]
**Learning:** In a dense, record-heavy industrial application, accessibility isn't just about screen readers; it's about clear field association. Many forms in this suite use custom Tailwind styling that often omits standard `id`/`htmlFor` pairings, making it difficult for users to click labels to focus inputs.
**Action:** Always ensure every `label` has a `htmlFor` matching a unique `id` on its input, especially when using 'premium' input styles. Add `aria-expanded` and `aria-label` to all collapsible 'Tactile' buttons to maintain state transparency.
>>>>>>> REPLACE
