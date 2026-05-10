(function () {
  // Simple HTML-escape helper to prevent injection when inserting strings into innerHTML / template HTML.
  // DEPRECATED: Use the global window.escapeHTML instead.
  function escapeHtml(str) {
    if (typeof window.escapeHTML === 'function') {
      return window.escapeHTML(str);
    }
    // Fallback if window.escapeHTML is not yet defined
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#x2F;');
  }

  // Safe open print window helper that checks for popup blockers and closes the document stream.
  // Returns the opened window or null if popup couldn't open.
  function safeOpenPrintWindow(title, htmlContent) {
    try {
      const w = window.open('', '_blank');
      if (!w) {
        // Popup blocked
        alert('Unable to open the print window. Please allow popups for this site to print.');
        return null;
      }

      // Give the window a title (for some browsers)
      try {
        w.document.title = title || 'Print';
      } catch (e) {
        // ignore cross-browser quirks
      }

      // Write and close document
      try { w.document.open(); } catch (e) {}
      w.document.write(htmlContent);
      try {
        w.document.close();
      } catch (e) {
        // Some browsers restrict close; ignore
      }
      return w;
    } catch (err) {
      console.error('safeOpenPrintWindow error:', err);
      alert('Printing is not available in this environment.');
      return null;
    }
  }

  // Expose on the window so existing code can call without changing import style
  if (typeof window !== 'undefined') {
    window.escapeHtml = window.escapeHtml || escapeHtml;
    window.safeOpenPrintWindow = window.safeOpenPrintWindow || safeOpenPrintWindow;
  }
})();