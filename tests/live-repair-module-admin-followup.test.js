'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const root=path.resolve(__dirname,'..');const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

test('Profile migration is retry-safe and Media server entry resolves as declared',()=>{
 const profile=read('Server/php/modules/profile/module.php');const runner=read('Server/php/src/ModuleMigrationRunner.php');const media=read('Server/php/modules/media/module.php');
 assert.match(profile,/ADD COLUMN gender/);assert.match(profile,/ADD COLUMN avatar_data/);assert.match(runner,/driverCode !== 1060/);assert.match(runner,/executeAdditiveStatement/);
 assert.match(media,/'moduleId'\s*=>\s*'media'/);assert.match(media,/'module\.media\.capability'/);
});

test('Profile lifecycle migration satisfies the generic reversible migration contract',()=>{
 const php=String.raw`require '${root}/Server/php/bootstrap.php';$manifest=json_decode(file_get_contents('${root}/Web-App/app/modules/profile/module.json'),true,512,JSON_THROW_ON_ERROR);$registry=new Neutral\Core\ModuleServerRegistry('${root}',new Neutral\Core\ModuleContract());$resolved=$registry->resolveForLifecycle(['id'=>'profile','manifest'=>$manifest,'registered'=>true,'active'=>false]);echo json_encode(['up'=>count($resolved['migrations'][0]['up']),'down'=>count($resolved['migrations'][0]['down'])]);`;
 const result=require('node:child_process').spawnSync('php',['-r',php],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
 assert.deepEqual(JSON.parse(result.stdout),{up:2,down:2});
});

test('module install API preserves a safe client error and logs the internal cause with correlation',()=>{
 const api=read('Server/public/api/index.php');
 assert.match(api,/MODULE_INSTALL_FAILED/);
 assert.match(api,/\$exception->getPrevious\(\)/);
 assert.match(api,/\$runtime->logger\(\)->error\('Module installation failed\.'/);
 assert.match(api,/\$config->isDebug\(\)/);
});

test('unlimited package JSON is distinguished from numeric zero in both projections',()=>{
 const auth=read('Server/php/src/Phase4AuthRbac.php');
 assert.ok((auth.match(/JSON_TYPE\(JSON_EXTRACT\([^)]*limits_json,'\$\.allowedDevices'\)\)='NULL'/g)||[]).length>=3);
 assert.match(auth,/return \$value === false \? max\(1, \$fallback\) : \(\$value === null \? null/);
});

test('module category and role navigation visibility stay separate from permissions',()=>{
 const contract=read('Server/php/src/ModuleContract.php');const runtime=read('Server/php/src/Phase7ModuleRuntime.php');const api=read('Server/public/api/index.php');const ui=read('Web-App/public/admin/modules-view.js');
 assert.match(contract,/\['user', 'system'\]/);assert.match(runtime,/core\.module\.visibility/);assert.match(api,/modules\/\(\[a-z0-9\\-\]\+\)\/visibility/);
 assert.match(ui,/App Modules/);assert.match(ui,/System Modules/);assert.match(ui,/Visibility \/ Navigation/);assert.match(ui,/never grants permissions/);
 for(const id of ['gps','profile','postbox']){const file=`Web-App/app/modules/${id}/module.json`;if(fs.existsSync(path.join(root,file)))assert.equal(JSON.parse(read(file)).category,'user');}
 for(const id of ['media','moderation','notifications','sharing']){const file=`Web-App/app/modules/${id}/module.json`;if(fs.existsSync(path.join(root,file)))assert.equal(JSON.parse(read(file)).category,'system');}
});

test('User management renders list and create/edit as exclusive states',()=>{
 const source=read('Web-App/public/admin/users-view.js');
 assert.match(source,/this\.viewState = 'list'/);assert.match(source,/data-user-view=/);assert.match(source,/users-table-container'\)\?\.setAttribute\('hidden'/);assert.match(source,/cancelForm\(\)[\s\S]*removeAttribute\('hidden'/);
});

test('password helper creates and self-heals a functional real DOM toggle',()=>{
 class El{constructor(tag){this.tagName=tag;this.children=[];this.parentNode=null;this.dataset={};this.attrs={};this.listeners={};this.type='';this.className='';this.isConnected=true;}appendChild(x){x.parentNode=this;this.children.push(x);return x;}insertBefore(x,b){x.parentNode=this;this.children.splice(this.children.indexOf(b),0,x);return x;}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}addEventListener(k,v){this.listeners[k]=v;}focus(){}closest(sel){let n=this;while(n){if(sel==='.password-input-wrap'&&n.className==='password-input-wrap')return n;n=n.parentNode;}return null;}querySelector(sel){if(sel==='.password-visibility-toggle')return this.walk().find(x=>x.className==='password-visibility-toggle')||null;return null;}querySelectorAll(){return [];}walk(){return this.children.flatMap(x=>[x,...x.walk()]);}set innerHTML(v){this._html=v;}get innerHTML(){return this._html||'';}click(){this.listeners.click?.({});}}
 const label=new El('label'),input=new El('input');input.type='password';label.appendChild(input);const doc={readyState:'loading',createElement:(x)=>new El(x),addEventListener(){},querySelectorAll(){return[];},body:new El('body')};
 const sandbox={document:doc,module:{exports:{}},window:{},MutationObserver:class{observe(){}}};vm.runInNewContext(read('Web-App/public/ui-feedback.js'),sandbox);
 const button=sandbox.module.exports.enhancePasswordFields({querySelectorAll:()=>[input]})||input.closest('.password-input-wrap').querySelector('.password-visibility-toggle');
 const toggle=input.closest('.password-input-wrap').querySelector('.password-visibility-toggle');assert.ok(toggle);assert.equal(toggle.attrs['aria-label'],'Show password');toggle.click();assert.equal(input.type,'text');assert.equal(toggle.attrs['aria-pressed'],'true');toggle.remove=()=>{};input.closest('.password-input-wrap').children=input.closest('.password-input-wrap').children.filter(x=>x!==toggle);sandbox.module.exports.enhancePasswordFields({querySelectorAll:()=>[input]});assert.ok(input.closest('.password-input-wrap').querySelector('.password-visibility-toggle'));
 const css=read('Web-App/public/style.css');assert.match(css,/\.password-visibility-toggle \{[^}]*display:flex !important;[^}]*visibility:visible !important;[^}]*opacity:1 !important;/);
});
