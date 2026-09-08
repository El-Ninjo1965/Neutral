'use strict';

(function exposeHomepageCache(root) {
  const STORAGE_KEY = 'neutral.public.homepage.v1';
  const SCHEMA_VERSION = 1;

  const normalizeHomepage = (value) => {
    if (!value || typeof value !== 'object' || !['html', 'module'].includes(value.mode)) return null;
    if (typeof value.title !== 'string' || typeof value.content !== 'string' || typeof value.moduleId !== 'string') return null;
    const homepage = {
      mode: value.mode,
      title: value.title.trim(),
      content: value.content,
      moduleId: value.moduleId.trim()
    };
    if (homepage.mode === 'html' && homepage.content === '') return null;
    if (homepage.mode === 'module' && homepage.moduleId === '') return null;
    return homepage;
  };

  const create = (storage) => ({
    read() {
      try {
        const value = JSON.parse(storage.getItem(STORAGE_KEY));
        if (!value || value.schemaVersion !== SCHEMA_VERSION || value.scope !== 'public-homepage') return null;
        return normalizeHomepage(value.homepage);
      } catch (_error) {
        return null;
      }
    },
    write(homepage) {
      const normalized = normalizeHomepage(homepage);
      if (!normalized) return false;
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify({
          schemaVersion: SCHEMA_VERSION,
          scope: 'public-homepage',
          homepage: normalized
        }));
        return true;
      } catch (_error) {
        return false;
      }
    }
  });

  let storage = null;
  try {
    storage = root && root.localStorage;
  } catch (_error) {
    storage = null;
  }
  const cache = storage ? create(storage) : { read: () => null, write: () => false };
  root.NeutralHomepageCache = cache;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STORAGE_KEY, SCHEMA_VERSION, normalizeHomepage, create };
  }
}(typeof globalThis === 'undefined' ? window : globalThis));
