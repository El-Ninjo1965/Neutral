(function (root, factory) {
  'use strict';

  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeutralHomepageDocument = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const palettes = Object.freeze({
    light: Object.freeze({ background: '#ffffff', text: '#1c2432' }),
    dark: Object.freeze({ background: '#111b2d', text: '#edf3ff' })
  });

  const defaults = (theme) => {
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
    const palette = palettes[resolvedTheme];
    return `<meta name="color-scheme" content="${resolvedTheme}"><style data-neutral-homepage-defaults>:root{color-scheme:${resolvedTheme};background-color:${palette.background};color:${palette.text}}html{min-height:100%;background-color:${palette.background};color:${palette.text}}body{min-height:100vh;background-color:${palette.background};color:${palette.text}}</style>`;
  };

  const build = (content, theme) => {
    const source = typeof content === 'string' ? content : '';
    const adapter = defaults(theme);
    const head = /<head(?:\s[^>]*)?>/i.exec(source);
    if (head) {
      const insertionPoint = head.index + head[0].length;
      return source.slice(0, insertionPoint) + adapter + source.slice(insertionPoint);
    }

    const html = /<html(?:\s[^>]*)?>/i.exec(source);
    if (html) {
      const insertionPoint = html.index + html[0].length;
      return source.slice(0, insertionPoint) + `<head>${adapter}</head>` + source.slice(insertionPoint);
    }

    const doctype = /<!doctype\s+html[^>]*>/i.exec(source);
    if (doctype) {
      const insertionPoint = doctype.index + doctype[0].length;
      return source.slice(0, insertionPoint) + adapter + source.slice(insertionPoint);
    }

    return `<!doctype html><html><head>${adapter}</head><body>${source}</body></html>`;
  };

  const apply = (frame, content, theme) => {
    if (!frame || typeof frame !== 'object') throw new TypeError('A homepage iframe is required.');
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
    frame.style.colorScheme = resolvedTheme;
    frame.srcdoc = build(content, resolvedTheme);
    return frame.srcdoc;
  };

  return Object.freeze({ apply, build });
}));
