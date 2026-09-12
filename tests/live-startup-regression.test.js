'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const gpsReferenceAvailable = fs.existsSync(path.join(projectRoot, 'Web-App/app/modules/gps/index.js'));

test('user shell distinguishes pending discovery from an empty module catalog', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /discoveryState/);
  assert.match(source, /startup:modules-ready/);
  assert.match(source, /Discovery läuft|Discovery in progress|Loading available modules/i);
  assert.doesNotMatch(source, /modules\.length \? modules\.map[\s\S]{0,300}No modules are active yet/);
});

test('user shell rerenders settings and navigation after discovery completes', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /Core\.on\(['"]startup:modules-ready['"]/);
  assert.match(source, /renderApp\(\)/);
});

test('GPS module owns its title while the generic shell does not duplicate it', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  const userSource = read('Web-App/public/user-app.js');
  const gpsSource = read('Web-App/app/modules/gps/index.js');

  assert.match(gpsSource, /<h1>GPS<\/h1>/);
  assert.doesNotMatch(userSource, /user-app-eyebrow">Module<\/span>[\s\S]{0,160}<h1>\$\{escapeHtml\(getModuleDisplayName\(module\)\)\}<\/h1>/);
});

test('navigation shows Start instead of the app name', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /id:\s*['"]home['"],\s*label:\s*presentationLabel\('home', 'Start'\)/);
  assert.doesNotMatch(source, /id:\s*['"]home['"],\s*label:\s*getAppName\(\)/);
});

test('navigation derives active state from the current view', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /class="ui-button ui-button--navigation user-app-nav-item \$\{state\.activeView === item\.id \? 'active' : ''\}"/);
  assert.match(source, /state\.activeView = nextView/);
  assert.match(source, /state\.activeView = `module:\$\{moduleId\}`/);
  assert.doesNotMatch(source, /class="user-app-nav-item active"/);
});

test('module card open path sets the same view state as the nav button', () => {
  const source = read('Web-App/public/user-app.js');

  // The landing-page card path must run through renderModule, which sets
  // state.activeView = `module:<id>`; it must not render module content while
  // leaving state.activeView on 'home'.
  const cardBlock = source.match(/data-module-card[\s\S]{0,600}?renderModule\(button\.dataset\.moduleCard\)/);
  assert.ok(cardBlock, 'module card click must call renderModule');
  const renderModuleBody = source.match(/const renderModule = \(moduleId, \{ asHomepage = false \} = \{\}\) => \{[\s\S]*?\n  \};/);
  assert.ok(renderModuleBody);
  assert.match(renderModuleBody[0], /state\.activeView = `module:\$\{moduleId\}`/);
  assert.match(renderModuleBody[0], /state\.activeModuleId = moduleId/);
});

test('configured module remains embedded in Start context without focus outline or module-tab transition', () => {
  const source = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');
  const landing = source.match(/const renderLandingPage = \(\) => \{[\s\S]*?\n  \};/);

  assert.ok(landing);
  assert.match(landing[0], /renderModule\(module\.id, \{ asHomepage: true \}\)/);
  const configuredModuleBlock = landing[0].match(/if \(homepage\.mode === 'module'\) \{[\s\S]*?renderModule\(module\.id, \{ asHomepage: true \}\);[\s\S]*?\n    \}/);
  assert.ok(configuredModuleBlock);
  assert.doesNotMatch(configuredModuleBlock[0], /state\.activeView = `module:/);
  assert.match(source, /if \(!asHomepage\) \{\s*state\.activeView = `module:/s);
  assert.doesNotMatch(source, /content\.focus\(/);
  assert.match(css, /:focus-visible/);
});

test('cold start may render a theme-token loading state only after bootstrap resolves no local homepage', () => {
  const source = read('Web-App/public/user-app.js');
  const index = read('Web-App/public/index.html');
  const css = read('Web-App/public/style.css');

  assert.match(source, /homepageResolved/);
  assert.match(source, /if \(!homepageResolved\)[\s\S]*user-app-status[\s\S]*Loading…/);
  assert.match(source, /homepage\.mode === 'module'[\s\S]*state\.discoveryState === 'pending'/);
  assert.doesNotMatch(index, /Loading…|user-app-status|Welcome|Neutral Platform<\/h1>/);
  assert.match(css, /\.user-app-status\s*\{[^}]*background:\s*var\(--surface-tertiary\)[^}]*color:\s*var\(--text\)[^}]*border:[^;]*var\(--border\)/s);
});

test('persisted theme selects semantic root tokens before stylesheet and first body paint', () => {
  const index = read('Web-App/public/index.html');
  const css = read('Web-App/public/style.css');
  const bootstrap = index.indexOf("localStorage.getItem('neutral.user.theme.v1')");
  const stylesheet = index.indexOf('href="style.css"');
  assert.ok(bootstrap > -1 && bootstrap < stylesheet);
  assert.match(index, /document\.documentElement\.dataset\.userTheme = theme === 'dark' \? 'dark' : 'light'/);
  assert.match(css, /:root\[data-user-theme="dark"\][\s\S]*--surface:\s*#111b2d/s);
  assert.match(css, /:root\[data-user-theme="light"\][\s\S]*color-scheme:\s*light/s);
});

test('cached User UI design is applied before stylesheet paint and refreshed independently', () => {
  const index = fs.readFileSync(path.join(projectRoot, 'Web-App/public/index.html'), 'utf8');
  const source = fs.readFileSync(path.join(projectRoot, 'Web-App/public/user-app.js'), 'utf8');
  assert.ok(index.indexOf('user-ui-design.js') < index.indexOf('style.css'));
  assert.ok(index.indexOf('NeutralUserUiDesign.read()') < index.indexOf('style.css'));
  assert.match(index, /neutralUserCustomCss/);
  assert.match(source, /designContract\.apply\(document\.documentElement/);
  assert.match(source, /customStyle\.textContent = userUiDesign\.customCss/);
  assert.match(source, /loadUserUiDesign\(\)/);
});

test('valid public homepage cache renders before a delayed server refresh', () => {
  const source = read('Web-App/public/user-app.js');
  const index = read('Web-App/public/index.html');
  const cacheScript = index.indexOf('homepage-cache.js');
  const userScript = index.indexOf('user-app.js');

  assert.ok(cacheScript > -1 && cacheScript < userScript);
  assert.doesNotMatch(index, /Loading…|user-app-status/);
  assert.match(source, /homepageCache\.read\(\)/);
  assert.match(source, /homepageResolved = homepageConfig !== null/);
  assert.match(source, /homepageCache\.write\(homepageConfig\)/);
  assert.match(source, /mark\('homepage-local-ready'\)/);
  assert.match(source, /mark\('homepage-refresh-ready'\)/);
  assert.match(source, /finally \{\s*homepageResolved = true;\s*renderApp\(\);/s);
});

test('homepage document adapter loads before the User-App renderer', () => {
  const index = read('Web-App/public/index.html');
  assert.ok(index.indexOf('homepage-document.js') > -1);
  assert.ok(index.indexOf('homepage-document.js') < index.indexOf('user-app.js'));
});

test('central navigation has touch-sized button affordance in both themes', () => {
  const source = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');
  assert.match(source, /class="ui-button ui-button--navigation user-app-nav-item/);
  assert.match(css, /--button-height:\s*44px/);
  assert.match(css, /\.ui-button\s*\{[^}]*min-height:\s*var\(--button-height\)[^}]*border:\s*var\(--button-border-width\)/s);
  assert.match(css, /\.ui-button--navigation\s*\{/);
  assert.match(css, /\.user-app-nav-item\.active \{[^}]*background:[^}]*color:/s);
  assert.match(css, /--button-secondary-background:/);
  assert.match(css, /--button-active-background:/);
  assert.match(css, /\.ui-button:focus-visible/);
});

test('Start navigation uses a local accessible home icon without changing its route', () => {
  const source = read('Web-App/public/user-app.js');
  const homeIcon = source.match(/const HOME_ICON = `([\s\S]*?)`;/);
  assert.ok(homeIcon, 'local home icon constant must exist');
  assert.match(homeIcon[1], /<svg/);
  assert.doesNotMatch(homeIcon[1], /https?:|<img|emoji/i);
  assert.match(source, /id: 'home', label: presentationLabel\('home', 'Start'\), icon: HOME_ICON/);
  assert.match(source, /aria-label="\$\{escapeHtml\(item\.label\)\}"/);
  assert.match(source, /title="\$\{escapeHtml\(item\.label\)\}"/);
  assert.match(source, /data-user-nav="\$\{escapeHtml\(item\.id\)\}"/);
});

test('header theme toggle shares the persistent Settings theme state', () => {
  const source = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');
  assert.match(source, /id="userThemeToggle"/);
  assert.match(source, /applyUserTheme\(readUserTheme\(\) === 'dark' \? 'light' : 'dark'\)/);
  assert.match(source, /localStorage\.setItem\(USER_THEME_KEY/);
  assert.doesNotMatch(source, /id="userThemeSelect"|<h2>Appearance<\/h2>|Choose the theme used by this app/);
  assert.match(css, /\.user-theme-toggle[^}]*min-width:\s*44px/);
});

test('navigation presentation is local-first, accessible and supports generic labels', () => {
  const source = fs.readFileSync(path.join(projectRoot, 'Web-App/public/user-app.js'), 'utf8');
  assert.match(source, /navigation:\s*\{ display: 'icon-text', labels: \{\} \}/);
  assert.match(source, /\['icon-text', 'icons', 'text'\]\.includes/);
  assert.match(source, /NAV_LABEL_MAX = 32/);
  assert.match(source, /presentationLabel\(`module:\$\{module\.id\}`/);
  assert.match(source, /aria-label="\$\{escapeHtml\(item\.label\)\}"/);
  assert.match(source, /title="\$\{escapeHtml\(item\.label\)\}"/);
  assert.match(source, /data-navigation-label-reset/);
  assert.match(source, /resetAllNavigationLabels/);
  assert.doesNotMatch(source, />⚙\s*\$\{settingsLabel\}/);
});

test('user and GPS surfaces inherit central theme tokens', () => {
  const source = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');
  assert.match(css, /\.gps-location-card,[\s\S]*background:\s*var\(--surface\)/);
  assert.match(css, /\.user-app-link,[\s\S]*background:\s*var\(--surface\)/);
  assert.match(css, /\.user-settings-toggle small,[\s\S]*color:\s*var\(--text-muted\)/);
  assert.match(css, /\.user-app-homepage-frame[^}]*background:\s*transparent/);
  assert.match(source, /homepageDocument\.apply\(frame, homepage\.content, readUserTheme\(\)\)/);
});

test('HTML homepage excludes Safari about:blank paint before themed srcdoc load', () => {
  const source = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');
  const htmlBranch = source.match(/if \(homepage\.mode === 'html' && homepage\.content\) \{[\s\S]*?\n    \}/);
  assert.ok(htmlBranch);
  assert.ok(htmlBranch[0].indexOf('homepageDocument.apply') < htmlBranch[0].indexOf('host.appendChild(frame)'));
  assert.doesNotMatch(htmlBranch[0], /Loading|setTimeout|requestAnimationFrame/);
  assert.match(css, /\.user-app-homepage-content\s*\{[^}]*min-height:\s*60vh[^}]*background:\s*var\(--surface\)/s);
  assert.match(css, /\.user-app-homepage-frame\s*\{[^}]*visibility:\s*hidden/s);
  assert.match(css, /\.user-app-homepage-frame\.homepage-frame-ready\s*\{[^}]*visibility:\s*visible/s);
  assert.doesNotMatch(css, /homepage-frame-ready[^}]*transition|homepage-frame-ready[^}]*animation/s);
});

test('normal User Settings begin with app areas and privacy without a redundant theme block', () => {
  const source = read('Web-App/public/user-app.js');
  const settings = source.match(/const renderUserSettings = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(settings);
  assert.doesNotMatch(settings[0], /Appearance|userThemeSelect|Choose the theme used by this app/);
  assert.match(settings[0], />App areas<\/h2>/);
  assert.match(settings[0], />Privacy and sharing<\/h2>/);
  assert.match(settings[0], /theme: readUserTheme\(\)/);
  assert.doesNotMatch(settings[0], /applyUserTheme\(/);
});

test('static shell placeholder nav carries no fake active state', () => {
  const source = read('Web-App/public/index.html');

  assert.doesNotMatch(source, /class="user-app-nav-item active" aria-current="page"/);
});

test('startup diagnostics are kept internal and removed from the default user UI', () => {
  const source = read('Web-App/public/user-app.js');
  const startupSource = read('Web-App/core/core-startup.js');

  assert.doesNotMatch(source, /Startup-Diagnose \(temporär\)/);
  assert.doesNotMatch(source, /renderStartupDiagnostics/);
  assert.match(startupSource, /mark\('module-discovery-complete'\)/);
  assert.doesNotMatch(source, /window\.NeutralPublicPath\.admin\(\).*Admin/);
});

test('GPS view does not render the redundant module description text', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  const gpsSource = read('Web-App/app/modules/gps/index.js');

  assert.doesNotMatch(gpsSource, /Neutral GPS tracking module\./);
});

test('GPS consent has modal presentation and focus management', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  const gpsSource = read('Web-App/app/modules/gps/index.js');
  const css = read('Web-App/public/style.css');

  assert.match(gpsSource, /role="dialog"/);
  assert.match(gpsSource, /focus\(\)/);
  assert.match(css, /\.gps-confirmation-modal\s*\{[\s\S]*position:\s*fixed/);
  assert.match(css, /\.gps-confirmation-modal\s*\{[\s\S]*z-index/);
});

test('homepage config defaults to neutral html mode and stores central metadata', () => {
  const configSource = read('Web-App/core/config-manager.js');
  const settingsSource = read('Server/node/services/settings-service.js');

  assert.match(configSource, /this\.set\('homepage', \{\s*mode:\s*'html',\s*title:\s*'',\s*content:\s*'',\s*moduleId:\s*''\s*\}\);/s);
  assert.match(settingsSource, /const defaultHomepage = Object\.freeze\(\{\s*mode:\s*'html',\s*title:\s*'',\s*content:\s*'',\s*moduleId:\s*''\s*\}\);/s);
  assert.match(settingsSource, /moduleId\s*:\s*''|moduleId\s*=\s*typeof candidate\.moduleId/);
});

test('user home view falls back to neutral content when configured module is invalid', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /if \(homepage\.mode === 'module'\) \{[\s\S]*const moduleId = homepage\.moduleId;/s);
  assert.match(source, /NeutralUserModuleAccess\.findVisibleModule\(getModules\(\), moduleId/);
  assert.match(source, /const heading = homepage\.title \? homepage\.title : appName;/);
  assert.match(source, /const message = '<p class="user-app-intro">Welcome to the workspace\.<\/p>'/);
});

test('configured HTML homepage has no fixed Welcome or product-title block', () => {
  const source = read('Web-App/public/user-app.js');
  const landing = source.match(/const renderLandingPage = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(landing);
  assert.match(landing[0], /if \(homepage\.mode === 'html' && homepage\.content\)/);
  assert.doesNotMatch(landing[0], /Welcome[\s\S]*frame\.srcdoc/);
});

test('admin Appearance UI exposes the Startseite contract while Settings does not', () => {
  const source = read('Web-App/public/admin/appearance-view.js');
  const settings = read('Web-App/public/admin/settings-view.js');

  assert.match(source, /<h3 id="appearance-homepage-title">Global Start Page<\/h3>/);
  assert.match(source, /id="homepageMode"/);
  assert.match(source, /id="homepageContent"/);
  assert.match(source, /id="homepageModuleId"/);
  assert.doesNotMatch(settings, /homepageMode|homepageModuleId|homepageContent/);
});


test('user startup loads central homepage config and renders trusted HTML without sanitization', () => {
  const source = read('Web-App/public/user-app.js');
  const apiClient = read('Web-App/public/api-client.js');
  const phpApi = read('Server/public/api/index.php');

  assert.match(apiClient, /getHomepage\(\)/);
  assert.match(phpApi, /\$route === 'settings\/homepage'/);
  assert.match(source, /loadHomepageConfig\(\)/);
  assert.match(source, /homepage\.mode === 'html'/);
  assert.match(source, /homepageDocument\.apply\(frame, homepage\.content, readUserTheme\(\)\)/);
  assert.match(source, /frame\.setAttribute\('sandbox', 'allow-scripts allow-forms allow-popups'\)/);
  assert.doesNotMatch(source, /getSafeHomepageContent/);
  assert.match(source, /await restoreServerSession\(\);\s*const initializationResults = await Promise\.allSettled\(\[\s*startCore\(\),\s*loadHomepageConfig\(\),\s*loadUserUiDesign\(\)/s);
  assert.doesNotMatch(source, /await window\.CoreStartup\.startBackground\(\);\s*}\s*await loadHomepageConfig\(\)/s);
});

test('user shell is product-facing and keeps branding replaceable', () => {
  const source = read('Web-App/public/user-app.js');
  const index = read('Web-App/public/index.html');
  const appsRoot = path.join(projectRoot, 'Web-App/apps');
  const appInfoPath = fs.readdirSync(appsRoot)
    .map((name) => path.join(appsRoot, name, 'app-info.json'))
    .find((candidate) => fs.existsSync(candidate));
  assert.ok(appInfoPath, 'an application branding manifest is required');
  const appInfo = JSON.parse(fs.readFileSync(appInfoPath, 'utf8'));

  assert.doesNotMatch(`${source}\n${index}`, /Active application|Local workspace|Signed in as|userSettingsBackButton|user-app-count/);
  assert.match(source, /presentationLabel\('home', 'Start'\)/);
  assert.match(source, /branding\.iconText/);
  assert.match(source, /branding\?\.logoUrl/);
  assert.equal(appInfo.branding.iconText, Array.from(appInfo.name)[0].toUpperCase());
  assert.equal(appInfo.branding.logoUrl, '');
});

test('anonymous login stays product-facing while preserving labels, action and real error status', () => {
  const source = read('Web-App/public/user-app.js');
  const login = source.match(/const showLoginForm = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(login);
  assert.match(login[0], /<h1>Login<\/h1>/);
  assert.match(login[0], /<label for="userLoginUsername">Username<\/label>/);
  assert.match(login[0], /<label for="userLoginPassword">Password<\/label>/);
  assert.match(login[0], /type="submit"[^>]*>Login<\/button>/);
  assert.doesNotMatch(login[0], /Account access|local workspace account|configured account/i);
  assert.match(login[0], /status\.textContent = serverError/);
  assert.match(login[0], /Authentication failed\. Check your connection and try again\./);
});

test('local settings save uses the shared success dialog and retains inline errors', () => {
  const source = read('Web-App/public/user-app.js');
  const css = read('Web-App/public/style.css');

  assert.match(source, /persisted = false;/);
  assert.match(source, /return \{ \.\.\.nextPreferences, persisted \};/);
  assert.match(source, /if \(nextPreferences\.persisted\) \{[\s\S]*status\.textContent = ''[\s\S]*status\.className = 'user-settings-status'[\s\S]*renderApp\(\)[\s\S]*showSuccess\(\s*['"]Successfully saved\./is);
  assert.match(css, /\.user-settings-status\.error\s*\{/);
  assert.doesNotMatch(source, /Profile and settings saved successfully/);
});

test('local feature visibility persists without a show-all control or permission mutation', () => {
  const source = read('Web-App/public/user-app.js');

  assert.match(source, /const USER_SETTINGS_KEY = 'neutral\.user\.preferences\.v1';/);
  assert.match(source, /localStorage\.setItem\(USER_SETTINGS_KEY, JSON\.stringify\(nextPreferences\)\);/);
  assert.match(source, /localStorage\.getItem\(USER_SETTINGS_KEY\)/);
  assert.doesNotMatch(source, /Show all functions|userSettingsResetButton|All functions are visible again/);
  assert.match(source, /data-i18n-key="settings\.areas"/);
  assert.doesNotMatch(source, /data-user-setting-module[\s\S]{0,500}(permissions\s*=|setPermissions|updateRole)/);
});

test('GPS presents rounded accuracy and localized time while retaining raw values', { skip: gpsReferenceAvailable ? false : 'GPS reference is not included' }, () => {
  const gpsSource = read('Web-App/app/modules/gps/index.js');
  assert.match(gpsSource, /formatAccuracy/);
  assert.match(gpsSource, /Math\.round/);
  assert.match(gpsSource, /Intl\.DateTimeFormat/);
  assert.match(gpsSource, /accuracy:\s*coords\.accuracy/);
  assert.match(gpsSource, /toISOString\(\)/);
});
