// Simple HTML escaper for template strings and innerHTML usage.
// Use escapeHTML(value) whenever inserting untrusted data into innerHTML or templates.
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

// Usage:
// import { escapeHTML } from './utils/escape-html.js';
// container.innerHTML = `<div>${escapeHTML(userInput)}</div>`;