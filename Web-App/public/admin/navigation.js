'use strict';

const groups = [
  { id: 'overview', label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard' }] },
  { id: 'platform', label: 'Platform', items: [
    { id: 'modules', label: 'Apps & Modules' },
    { id: 'settings', label: 'Settings' },
    { id: 'theme', label: 'Appearance' }
  ] },
  { id: 'access', label: 'Access', items: [
    { id: 'users', label: 'Users' },
    { id: 'roles', label: 'Roles & Permissions' },
    { id: 'permissions', label: 'Permission Catalog' },
    { id: 'sessions', label: 'Sessions' }
  ] },
  { id: 'infrastructure', label: 'Infrastructure', items: [
    { id: 'connections', label: 'Connections & Providers' },
    { id: 'server', label: 'Server' },
    { id: 'database', label: 'Database' },
    { id: 'backups', label: 'Backups & Restore' },
    { id: 'updates', label: 'Maintenance & Updates' }
  ] },
  { id: 'monitoring', label: 'Monitoring', items: [
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'audit', label: 'Audit Log' }
  ] }
].map((group) => Object.freeze({
  ...group,
  items: Object.freeze(group.items.map(Object.freeze))
}));

const AdminNavigation = Object.freeze({
  groups: Object.freeze(groups),
  flatten: () => Object.freeze(groups.flatMap((group) =>
    group.items.map((item) => Object.freeze({ ...item, groupId: group.id }))))
});

if (typeof window !== 'undefined') window.AdminNavigation = AdminNavigation;
if (typeof module !== 'undefined' && module.exports) module.exports = AdminNavigation;
