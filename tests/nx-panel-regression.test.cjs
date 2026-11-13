'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');

test('launcher fallback remains visible when the integrated toolbar button is clipped',()=>{
 assert.match(src,/function nxButtonActuallyVisible\(button, host\)/);
 assert.match(src,/const integratedVisible = expanded && nxButtonActuallyVisible\(nxLibraryButton, fullscreenHost\(\)\)/);
 assert.match(src,/if \(!integratedVisible\) \{\s*nxLibraryButton\.style\.display = 'none';\s*if \(nxKeyboardMouseButton\) nxKeyboardMouseButton\.style\.display = 'none';\s*\}/);
 assert.match(src,/pillEl\.style\.display = openUI \|\| integratedVisible \? 'none' : 'inline-flex'/);
 assert.match(src,/wrap\.style\.right = '12px';\s*wrap\.style\.top = '12px';/);
 assert.match(src,/pillEl\.style\.display = integratedVisible \? 'none' : 'inline-flex'/);
});

test('F9 and requestPointerLock remain native',()=>{
 assert.doesNotMatch(src,/Element\.prototype\.requestPointerLock\s*=/);
 assert.doesNotMatch(src,/e\.code\s*===\s*['"]F9['"]|e\.key\s*===\s*['"]F9['"]/);
 assert.match(src,/document\.addEventListener\('pointerlockchange'/);
 assert.match(src,/document\.exitPointerLock\(\)/);
});

test('NX is an overlay and native xCloud menus take priority over touch HUD hit targets',()=>{
 assert.match(src,/wrap\.style\.pointerEvents='none';cardEl\.style\.pointerEvents='auto'/);
 assert.match(src,/document\.documentElement\.classList\.toggle\('nx-native-menu-expanded',!!parent\)/);
 assert.match(src,/\.nx-native-menu-expanded #nimbo-touch-root \.hud-button[\s\S]*?pointer-events:none!important/);
 assert.match(src,/window\.NimboTouch\?\.setMenuBlocked\?\.\(!!nativeOpen\|\|openUI\)/);
});

test('fullscreen and recovery shortcut are present',()=>{
 assert.match(src,/\['fullscreenchange', 'webkitfullscreenchange'\]/);
 assert.match(src,/e\.code === 'KeyN'/);
 assert.match(src,/if \(!cardEl\) buildUI\(\)/);
});


test('panel categories have distinct responsibilities and stable tab identities',()=>{
 const start=src.indexOf('  const TABS = [');
 const end=src.indexOf('  ];',start);
 assert.ok(start>=0&&end>start,'tab registry exists');
 const registry=src.slice(start,end);
 const ids=Array.from(registry.matchAll(/id: '([^']+)'/g),m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,'tab ids must not be duplicated');
 assert.deepEqual(ids,['overview','video','stream','statistics','inputs','audio','remote','personalize','advanced']);
});

test('video presentation and image settings share a page without JSON controls',()=>{
 const videoStart=src.indexOf('TAB_BUILDERS.video=function(root){');
 const imagesStart=src.indexOf('TAB_BUILDERS.images=function(root,existingMedia){',videoStart);
 const gamepadStart=src.indexOf('TAB_BUILDERS.gamepad=function(root){',imagesStart);
 assert.ok(videoStart>=0&&imagesStart>videoStart&&gamepadStart>imagesStart);
 const video=src.slice(videoStart,imagesStart);
 const images=src.slice(imagesStart,gamepadStart);
 assert.match(video,/nxMoveGroup\(root,controls,'Dispositivo'\)/);
 assert.match(video,/Apresentação do vídeo/);
 assert.match(video,/nxFindGroup\(media,'Imagem'\)/);
 assert.match(video,/TAB_BUILDERS\.images\(root,media\)/);
 assert.match(images,/Clarity Boost experimental/);
 assert.match(images,/Perfis de imagem/);
 assert.doesNotMatch(images,/Importar JSON|Exportar configuracao/);
});

test('gamepad owns gyro, vibration and controller shortcuts',()=>{
 const start=src.indexOf('TAB_BUILDERS.gamepad=function(root){');
 const end=src.indexOf('TAB_BUILDERS.controls=TAB_BUILDERS.gamepad;',start);
 assert.ok(start>=0&&end>start);
 const body=src.slice(start,end);
 assert.doesNotMatch(body,/Coordenação de entradas — diagnóstico|Última alteração de conexão|Falhas de leitura/);
 assert.match(body,/Giroscópio/);
 assert.match(body,/Vibração do Gamepad/);
 assert.match(body,/nxBindControls\(root,'gamepad'\)/);
 assert.match(body,/Controles conectados/);
});

test('keyboard and mouse tuning reuses HUD settings without another activation selector',()=>{
 const start=src.indexOf('TAB_BUILDERS.gyrotouch=function(root){');
 const end=src.indexOf('\n  };',start);
 assert.ok(start>=0&&end>start);
 const body=src.slice(start,end);
 assert.match(body,/Touchpad e botões/);
 assert.doesNotMatch(body,/const activation|toggle\(|Toque e mouse detectados/);
 assert.match(body,/nxBindControls\(root,'keyboard'\)/);
 assert.doesNotMatch(body,/Giroscópio|Vibração do Gamepad/);
});

test('voice page extracts microphone, not the third input-diagnostic group',()=>{
 const start=src.indexOf('TAB_BUILDERS.voice=function(root){');
 const end=src.indexOf('TAB_BUILDERS.video=function(root){',start);
 assert.ok(start>=0&&end>start);
 const body=src.slice(start,end);
 assert.match(body,/Microfone e entrada de voz/);
 assert.match(body,/\['Microfone'\]/);
 assert.doesNotMatch(body,/Vibração do Gamepad|Coordenação de entradas/);
 assert.doesNotMatch(src,/if \(temp\.children\[2\]\) root\.appendChild\(temp\.children\[2\]\)/);
});

test('statistics contains metrics while interface owns monitor appearance',()=>{
 const start=src.indexOf('TAB_BUILDERS.statistics=function(root){');
 const end=src.indexOf('TAB_BUILDERS.dashboard=TAB_BUILDERS.statistics;',start);
 assert.ok(start>=0&&end>start);
 const body=src.slice(start,end);
 assert.match(body,/nxOriginalStreamBuilder\(stream\)/);
 assert.doesNotMatch(body,/nxMonitorSettingsPage\(root\)/);
 assert.match(body,/setTab\('personalize'\)/);
 const ui=src.slice(src.indexOf('TAB_BUILDERS.personalize=function(root){'),start);
 assert.match(ui,/nxPanelSettingsPage\(root\)/);
 assert.match(ui,/nxMonitorSettingsPage\(root\)/);
 assert.match(src,/function nxMonitorSettingsGroup\(root\)/);
 assert.match(src,/TAB_BUILDERS\.overview=function\(root\)\{nxOverviewOriginal\(root\);\}/);
});

test('streaming page keeps server and quality settings while statistics owns telemetry',()=>{
 const start=src.indexOf('TAB_BUILDERS.stream=function(root){');
 const end=src.indexOf('TAB_BUILDERS.audio=function(root){',start);
 assert.ok(start>=0&&end>start);
 const body=src.slice(start,end);
 assert.match(body,/Data center|nxOriginalStreamBuilder/);
 assert.match(body,/system\[2\]/);
 assert.match(body,/nxQualityPresets\(root\)/);
 assert.match(body,/Monitor de transmissão/);
 assert.match(body,/nxGroupTitle\(node\)!=='Monitor de transmissão'/);
});

test('controller and keyboard shortcuts keep separate storage keys and pages',()=>{
 assert.match(src,/const NX_PAD_BIND_KEY='nx\.panel\.padBinding\.v1'/);
 assert.match(src,/const NX_KEY_BIND_KEY='nx\.panel\.keyBinding\.v1'/);
 assert.match(src,/function nxBindControls\(root, category\)/);
 assert.match(src,/category==='gamepad'/);
 assert.match(src,/category==='keyboard'/);
});

