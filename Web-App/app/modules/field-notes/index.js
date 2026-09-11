(() => {
  'use strict';

  const text = {
    en: { title: 'Field Notes', intro: 'Private notes for this account.', newNote: 'New note', edit: 'Edit', remove: 'Delete', save: 'Save', cancel: 'Cancel', noteTitle: 'Title', body: 'Note', empty: 'No notes yet.', loading: 'Loading notes…', failed: 'Field Notes could not be loaded.', confirm: 'Delete this note?' },
    de: { title: 'Field Notes', intro: 'Private Notizen für dieses Konto.', newNote: 'Neue Notiz', edit: 'Bearbeiten', remove: 'Löschen', save: 'Speichern', cancel: 'Abbrechen', noteTitle: 'Titel', body: 'Notiz', empty: 'Noch keine Notizen.', loading: 'Notizen werden geladen…', failed: 'Field Notes konnten nicht geladen werden.', confirm: 'Diese Notiz löschen?' }
  };
  const t = (key) => {
    const locale = window.I18nModule?.getLocale?.() || String(navigator.language || 'en').slice(0, 2);
    return (text[locale] || text.en)[key] || key;
  };
  window.I18nModule?.registerTranslations?.(Object.fromEntries(Object.entries(text).map(([locale, values]) => [locale, Object.fromEntries(Object.entries(values).map(([key, value]) => [`field-notes.${key}`, value]))])));
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const unwrap = (result, key) => result?.data?.data?.[key] ?? result?.data?.[key] ?? null;
  const api = () => new window.ApiClient();
  let status = 'available';

  const module = {
    id: 'field-notes', name: 'Field Notes', version: '1.0.0', status, active: false,
    install() { this.status = status = 'installed'; this.active = false; return true; },
    initialize() { return true; },
    enable() { this.status = status = 'enabled'; this.active = true; return true; },
    disable() { this.status = status = 'disabled'; this.active = false; return true; },
    uninstall() { this.status = status = 'available'; this.active = false; return true; },
    renderUserInterface(container) {
      if (!container) return null;
      container.innerHTML = `<style>
        .field-notes{color:var(--text,#172033)}.field-notes__header{display:flex;gap:1rem;align-items:start;justify-content:space-between;flex-wrap:wrap}.field-notes__list{display:grid;gap:.75rem;margin-top:1rem}.field-notes__item,.field-notes__form{padding:1rem;border:1px solid var(--border,#d7dee8);border-radius:var(--radius,14px);background:var(--surface,#fff)}.field-notes__item h2{font-size:1rem;margin:0 0 .4rem}.field-notes__item p{white-space:pre-wrap;margin:.4rem 0}.field-notes__actions{display:flex;gap:.5rem;flex-wrap:wrap}.field-notes__form{display:grid;gap:.75rem;margin-top:1rem}.field-notes__form input,.field-notes__form textarea{box-sizing:border-box;width:100%;min-height:44px;padding:.7rem;border:1px solid var(--border,#d7dee8);border-radius:.6rem;background:var(--surface,#fff);color:inherit}.field-notes__form textarea{min-height:10rem;resize:vertical}@media(max-width:560px){.field-notes__header>.ui-button{width:100%}}
      </style><section class="field-notes"><div class="field-notes__header"><div><h1>${escape(t('title'))}</h1><p>${escape(t('intro'))}</p></div><button type="button" class="ui-button ui-button--primary" data-new-note>${escape(t('newNote'))}</button></div><div role="status" aria-live="polite" data-notes-status>${escape(t('loading'))}</div><div class="field-notes__editor"></div><div class="field-notes__list"></div></section>`;
      const list = container.querySelector('.field-notes__list');
      const editor = container.querySelector('.field-notes__editor');
      const statusNode = container.querySelector('[data-notes-status]');
      let items = [];
      const showEditor = (item = null) => {
        editor.innerHTML = `<form class="field-notes__form"><label>${escape(t('noteTitle'))}<input name="title" maxlength="160" required value="${escape(item?.title || '')}"></label><label>${escape(t('body'))}<textarea name="body" maxlength="10000">${escape(item?.body || '')}</textarea></label><div class="field-notes__actions"><button class="ui-button ui-button--primary" type="submit">${escape(t('save'))}</button><button class="ui-button" type="button" data-cancel>${escape(t('cancel'))}</button></div></form>`;
        editor.querySelector('[data-cancel]').addEventListener('click', () => { editor.innerHTML = ''; });
        editor.querySelector('form').addEventListener('submit', async (event) => {
          event.preventDefault(); const form = new FormData(event.currentTarget); const payload = { title: form.get('title'), body: form.get('body') };
          const result = item ? await api().put('/api/modules/field-notes/items', { ...payload, id: item.id }) : await api().post('/api/modules/field-notes/items', payload);
          if (!result.ok) { statusNode.textContent = result.error || t('failed'); return; }
          editor.innerHTML = ''; await load();
        });
      };
      const render = () => {
        list.innerHTML = items.length ? items.map((item) => `<article class="field-notes__item" data-note-id="${item.id}"><h2>${escape(item.title)}</h2><p>${escape(item.body)}</p><small>${escape(item.updatedAt || '')}</small><div class="field-notes__actions"><button type="button" class="ui-button" data-edit>${escape(t('edit'))}</button><button type="button" class="ui-button" data-delete>${escape(t('remove'))}</button></div></article>`).join('') : `<p>${escape(t('empty'))}</p>`;
        list.querySelectorAll('[data-note-id]').forEach((node) => {
          const item = items.find((entry) => String(entry.id) === node.dataset.noteId);
          node.querySelector('[data-edit]').addEventListener('click', () => showEditor(item));
          node.querySelector('[data-delete]').addEventListener('click', async () => { if (!window.confirm(t('confirm'))) return; const result = await api().delete('/api/modules/field-notes/items', { body: { id: item.id } }); if (result.ok) await load(); else statusNode.textContent = result.error || t('failed'); });
        });
      };
      const load = async () => { statusNode.textContent = t('loading'); const result = await api().get('/api/modules/field-notes/items'); if (!result.ok) { statusNode.textContent = result.error || t('failed'); return; } items = unwrap(result, 'items') || []; statusNode.textContent = ''; render(); };
      container.querySelector('[data-new-note]').addEventListener('click', () => showEditor());
      load();
      return container;
    }
  };
  window.NeutralFieldNotesModule = module;
  if (typeof exports !== 'undefined') exports.NeutralFieldNotesModule = module;
})();
