import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const ui = {
  root: $('game-root'), menu: $('menu-screen'), hud: $('hud'), pause: $('pause-screen'), settings: $('settings-screen'), gameover: $('gameover-screen'),
  start: $('start-btn'), menuSettings: $('menu-settings'), pauseSettings: $('pause-settings'), settingsClose: $('settings-close'), settingsDone: $('settings-done'),
  resume: $('resume-btn'), pauseBtn: $('pause-btn'), quit: $('quit-btn'), retry: $('retry-btn'), home: $('home-btn'),
  wave: $('wave-value'), zombies: $('zombie-count'), coins: $('coin-value'), health: $('health-number'), healthBar: $('health-bar'), ammo: $('ammo-value'),
  finalWave: $('final-wave'), finalKills: $('final-kills'), finalCoins: $('final-coins'), toast: $('toast'), hint: $('start-hint'),
  volume: $('volume-setting'), volumeLabel: $('volume-label'), sensitivity: $('sensitivity-setting'), sensitivityLabel: $('sensitivity-label'), shake: $('shake-setting'),
  damage: $('damage-flash'), hit: $('hit-marker'), objective: $('objective-text'),
  joystick: $('joystick'), stick: $('joystick-stick'), look: $('look-area'), shoot: $('shoot-btn'), reload: $('reload-btn'), cameraBtn: $('camera-btn')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb49a78);
scene.fog = new THREE.FogExp2(0xb49a78, 0.027);
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 180);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.1));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
ui.root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf3dfbd, 0x6b5138, 2.0));
const sun = new THREE.DirectionalLight(0xffdfb0, 1.65);
sun.position.set(-18, 28, 12); sun.castShadow = false;
scene.add(sun);
const moon = new THREE.DirectionalLight(0x91a6c4, 0.7); moon.position.set(20, 12, -20); scene.add(moon);

const mat = (color, roughness = 0.85, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const groundMat = new THREE.MeshStandardMaterial({
  color:0xb49a78, roughness:1, metalness:0,
  emissive:0x59432b, emissiveIntensity:0.24
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const grid = new THREE.GridHelper(100, 25, 0x9a8060, 0x8b7457); grid.position.y = 0.015; grid.material.transparent = true; grid.material.opacity = 0.17; scene.add(grid);

// Ruined outpost arena: barricades, wreckage, lamps and silhouettes give the field depth.
const worldProps = [];
const animatedObjects = [];
const flickerLights = [];
function box(x, y, z, sx, sy, sz, color, rotation = 0, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(color));
  mesh.position.set(x, y, z); mesh.rotation.y = rotation; mesh.castShadow = cast; mesh.receiveShadow = true; scene.add(mesh); worldProps.push(mesh); return mesh;
}
function cylinder(x, y, z, rt, rb, h, color, rotation = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 8), mat(color)); mesh.position.set(x, y, z); mesh.rotation.z = rotation; mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); worldProps.push(mesh); return mesh;
}
// Perimeter barriers, intentionally broken into chunks so the playable area stays open.
for (let i = -28; i <= 28; i += 8) { box(i, 0.65, -30, 7.1, 1.3, 0.7, 0x4b4a3d); box(i, 0.65, 30, 7.1, 1.3, 0.7, 0x4b4a3d); }
for (let i = -22; i <= 22; i += 9) { box(-31, 0.65, i, 0.7, 1.3, 8, 0x4b4a3d); box(31, 0.65, i, 0.7, 1.3, 8, 0x4b4a3d); }
// Cover blocks around—but not inside—the main combat lanes.
box(-12, .65, -8, 5, 1.3, 2.2, 0x555345, -.12); box(13, .65, -10, 4, 1.3, 2, 0x565647, .2);
box(-16, .65, 9, 5, 1.3, 2, 0x535344, .15); box(15, .65, 12, 5, 1.3, 2.2, 0x565345, -.3);
box(0, .55, -22, 11, 1.1, 1.5, 0x4a4b40, .06); box(-23, .5, -1, 2, 1, 6, 0x4e4c3e, .2); box(23, .55, -2, 2, 1.1, 5, 0x4a4b40, -.2);
// Barrels, crates and fallen timber.
for (const [x,z,c] of [[-7,-14,0x59604f],[8,7,0x5b5140],[-22,15,0x65543d],[21,-17,0x62523d],[3,19,0x535746]]) {
  cylinder(x, .7, z, .52, .52, 1.4, c); cylinder(x, 1.42, z, .53, .53, .08, 0x343a31);
}
for (const [x,z,r] of [[-19,-18,.3],[18,2,-.5],[-5,14,.2],[7,-5,-.3]]) box(x,.48,z,2.8,.22,.35,0x67573e,r);
// Dead trees around the edges.
for (const [x,z,s] of [[-25,-24,1.2],[25,-23,.85],[-27,18,.9],[27,21,1.2],[-18,26,.7],[19,27,.8]]) {
  cylinder(x, 2*s, z, .32*s, .48*s, 4*s, 0x393b30, .08);
  const branch = cylinder(x + .65*s, 3.2*s, z, .16*s, .24*s, 2.5*s, 0x393b30, .58); branch.rotation.x = .25;
  const branch2 = cylinder(x - .65*s, 2.8*s, z + .3*s, .15*s, .22*s, 2.1*s, 0x393b30, -.63); branch2.rotation.x = -.3;
}
// Broken street lamps with a warm, localized glow.
for (const [x,z] of [[-20,-4],[19,5],[4,-26]]) {
  cylinder(x,3.3,z,.12,.16,6.6,0x282d28);
  box(x+.72,6.45,z,.95,.16,.25,0x35392c);
  const bulb = new THREE.PointLight(0xffb15d, 8, 14, 2); bulb.position.set(x+.98,6.15,z); scene.add(bulb);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.16,8,8), new THREE.MeshBasicMaterial({color:0xffca75})); glow.position.copy(bulb.position); scene.add(glow);
  flickerLights.push({light:bulb, glow, phase:Math.random()*8, base:8});
}

// Extra visual dressing: ruined city silhouettes, cracked asphalt, road paint and scattered debris.
const detailMat = (color, roughness=1) => new THREE.MeshStandardMaterial({color, roughness});
const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(10, 66), detailMat(0x343a32));
asphalt.rotation.x=-Math.PI/2; asphalt.position.set(0,.025,0); scene.add(asphalt);
for (let z=-27; z<=27; z+=7) {
  const dash=new THREE.Mesh(new THREE.PlaneGeometry(.13,3.1), new THREE.MeshBasicMaterial({color:0x9a9875, transparent:true, opacity:.38}));
  dash.rotation.x=-Math.PI/2; dash.position.set(0,.04,z); scene.add(dash);
}
// Concrete sidewalk slabs and broken pavement at the perimeter.
for (const side of [-1,1]) {
  for(let z=-25;z<=25;z+=5){
    const slab=new THREE.Mesh(new THREE.BoxGeometry(2.1,.12,4.7),detailMat(0x626253));
    slab.position.set(side*29.1,.06,z); slab.receiveShadow=true; scene.add(slab);
  }
}
// Distant ruined buildings frame the arena without blocking the play area.
for (const [x,z,w,h,d,c] of [
  [-39,-22,9,15,12,0x343b34],[39,-25,12,19,10,0x30372f],
  [-42,4,13,12,11,0x3b4035],[42,8,11,16,13,0x343a32],
  [-34,36,14,20,12,0x30362f],[35,38,16,17,13,0x3a3e34]
]) {
  const building=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),detailMat(c));
  building.position.set(x,h/2-0.2,z); building.castShadow=true; building.receiveShadow=true; scene.add(building);
  for(let floor=1;floor<h/3;floor++){
    for(let col=-1;col<=1;col++){
      const win=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.35),new THREE.MeshBasicMaterial({color:Math.random()<.35?0x88784c:0x171e1a}));
      win.position.set(x+col*w*.22, floor*2.7, z-d/2-.012); scene.add(win);
    }
  }
}
// Rubble piles, weeds and small metal scraps add texture to otherwise empty ground.
for(let i=0;i<28;i++){
  const x=(Math.random()-.5)*55, z=(Math.random()-.5)*55;
  if(Math.abs(x)<4 && Math.abs(z)<10) continue;
  const size=.12+Math.random()*.38;
  const rubble=new THREE.Mesh(new THREE.DodecahedronGeometry(size,0),detailMat([0x55564a,0x41483d,0x6b6654,0x393e36][i%4]));
  rubble.position.set(x,size*.45,z); rubble.rotation.set(Math.random(),Math.random()*3,Math.random()); rubble.castShadow=true; scene.add(rubble);
}
for(let i=0;i<14;i++){
  const x=(Math.random()-.5)*54, z=(Math.random()-.5)*54;
  const weed=new THREE.Mesh(new THREE.ConeGeometry(.10+Math.random()*.08,.35+Math.random()*.45,4),detailMat(0x48563a));
  weed.position.set(x,.18,z); weed.rotation.z=(Math.random()-.5)*.4; scene.add(weed);
  animatedObjects.push({object:weed, type:'sway', phase:Math.random()*6.28, amount:.07+Math.random()*.07});
}

// Static collision volumes are derived from the arena's solid props.
// Decorations added directly to the scene are intentionally non-solid.
const obstacleBoxes = worldProps.map(mesh => {
  mesh.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(mesh);
});
const PLAYER_RADIUS = .43;
const ZOMBIE_RADIUS = .34;
function pushOutOfObstacles(x,z,radius){
  let px=x, pz=z;
  for(let pass=0;pass<2;pass++){
    for(const b of obstacleBoxes){
      const minX=b.min.x-radius, maxX=b.max.x+radius;
      const minZ=b.min.z-radius, maxZ=b.max.z+radius;
      if(px>minX && px<maxX && pz>minZ && pz<maxZ){
        const left=Math.abs(px-minX), right=Math.abs(maxX-px);
        const back=Math.abs(pz-minZ), front=Math.abs(maxZ-pz);
        const m=Math.min(left,right,back,front);
        if(m===left) px=minX; else if(m===right) px=maxX;
        else if(m===back) pz=minZ; else pz=maxZ;
      }
    }
  }
  return {x:px,z:pz};
}
function moveWithCollisions(entity,dx,dz,radius){
  const nx=THREE.MathUtils.clamp(entity.position.x+dx,-29.1,29.1);
  const nz=THREE.MathUtils.clamp(entity.position.z+dz,-29.1,29.1);
  // Resolve axes separately so the player can slide along walls and cover.
  const xTry=pushOutOfObstacles(nx,entity.position.z,radius);
  entity.position.x=xTry.x;
  const zTry=pushOutOfObstacles(entity.position.x,nz,radius);
  entity.position.z=zTry.z;
}

const player = new THREE.Group(); scene.add(player);
const playerRig = new THREE.Group(); player.add(playerRig);
const skinMat = mat(0xb8835d), jacketMat = mat(0x39483b), pantsMat = mat(0x282e2a), bootMat = mat(0x191c1a), packMat = mat(0x5c5943), gunMat = mat(0x262a25,.45,.35), metalMat = mat(0x666c61,.38,.55);
function limb(parent, material, radius, length, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius*.8, radius, length, 8), material); m.position.set(x,y,z); m.castShadow=true; parent.add(m); return m;
}
const torso = new THREE.Mesh(new THREE.BoxGeometry(.78,1.05,.42), jacketMat); torso.position.y=1.55; torso.castShadow=true; playerRig.add(torso);
const chest = new THREE.Mesh(new THREE.BoxGeometry(.46,.45,.08), mat(0x59664a)); chest.position.set(0,1.58,-.235); chest.castShadow=true; playerRig.add(chest);
const head = new THREE.Mesh(new THREE.SphereGeometry(.31,14,12),skinMat); head.position.set(0,2.34,0); head.scale.set(.88,1.12,.9); head.castShadow=true; playerRig.add(head);
const hair = new THREE.Mesh(new THREE.BoxGeometry(.48,.16,.43),mat(0x28251e)); hair.position.set(0,2.59,0); playerRig.add(hair);
const backpack = new THREE.Mesh(new THREE.BoxGeometry(.58,.78,.24),packMat); backpack.position.set(0,1.61,.31); backpack.castShadow=true; playerRig.add(backpack);
const legPivots=[];
for(const side of [-1,1]){
  const pivot=new THREE.Group();pivot.position.set(side*.23,1.12,0);playerRig.add(pivot);legPivots.push(pivot);
  limb(pivot,pantsMat,.19,.68,0,-.34,0);
  const boot=new THREE.Mesh(new THREE.BoxGeometry(.34,.2,.48),bootMat);boot.position.set(0,-.69,-.09);boot.castShadow=true;pivot.add(boot);
}
const armPivots=[];
for(const side of [-1,1]){
  const pivot=new THREE.Group();pivot.position.set(side*.48,1.88,-.02);playerRig.add(pivot);armPivots.push(pivot);
  limb(pivot,jacketMat,.145,.63,0,-.31,0);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(.13,8,7),skinMat);hand.position.set(0,-.65,-.02);pivot.add(hand);
}
// Rifle sits in the character's hands and points down the aiming direction (-Z).
const rifle=new THREE.Group();rifle.position.set(.28,1.48,-.47);playerRig.add(rifle);
const receiver=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.74),gunMat);receiver.castShadow=true;rifle.add(receiver);
const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.62,8),metalMat);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.015,-.57);rifle.add(barrel);
const stock=new THREE.Mesh(new THREE.BoxGeometry(.15,.16,.34),packMat);stock.position.set(0,-.015,.5);rifle.add(stock);
const muzzleFlash=new THREE.PointLight(0xffbe63,0,5);muzzleFlash.position.set(0,.04,-.9);rifle.add(muzzleFlash);
const flashMesh=new THREE.Mesh(new THREE.ConeGeometry(.13,.38,8),new THREE.MeshBasicMaterial({color:0xffdf87}));flashMesh.rotation.x=-Math.PI/2;flashMesh.position.set(0,.04,-1.08);flashMesh.visible=false;rifle.add(flashMesh);
// Arma ligera unida a la cámara para que también se vea en primera persona.
const viewWeapon=new THREE.Group();camera.add(viewWeapon);viewWeapon.position.set(.34,-.29,-.68);
const viewBody=new THREE.Mesh(new THREE.BoxGeometry(.16,.14,.55),gunMat);viewWeapon.add(viewBody);
const viewBarrel=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.48,6),metalMat);viewBarrel.rotation.x=Math.PI/2;viewBarrel.position.set(0,.015,-.48);viewWeapon.add(viewBarrel);
const viewGrip=new THREE.Mesh(new THREE.BoxGeometry(.11,.22,.13),packMat);viewGrip.position.set(0,-.16,.08);viewWeapon.add(viewGrip);

const zombies=[]; const pickups=[]; const keys=new Set();
const state={mode:'menu',wave:1,coins:0,kills:0,health:100,ammo:12,yaw:0,pitch:-.08,walkTime:0,lastShot:0,shakeTime:0,volume:.35,sensitivity:.008,shake:true,elapsed:0,cameraMode:0,cinematic:null};
const touchMove={x:0,y:0};
const isTouchDevice=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const raycaster=new THREE.Raycaster(); raycaster.far=65;

function buildZombie(x,z,crawling=false){
  const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
  const warningRing=new THREE.Mesh(
    new THREE.TorusGeometry(.58,.055,6,20),
    new THREE.MeshBasicMaterial({color:0xff3028,transparent:true,opacity:.82})
  );
  warningRing.rotation.x=-Math.PI/2;warningRing.position.y=.045;group.add(warningRing);
  const warningGlow=new THREE.Mesh(
    new THREE.CircleGeometry(.62,20),
    new THREE.MeshBasicMaterial({color:0xd51d18,transparent:true,opacity:.12,depthWrite:false})
  );
  warningGlow.rotation.x=-Math.PI/2;warningGlow.position.y=.025;group.add(warningGlow);
  const skin=new THREE.MeshStandardMaterial({color:[0x77866a,0x687b62,0x8b8067,0x637768][Math.floor(Math.random()*4)],roughness:1});
  const rag=new THREE.MeshStandardMaterial({color:[0x443e35,0x51453b,0x353d36,0x595344][Math.floor(Math.random()*4)],roughness:1});
  const eyeMat=new THREE.MeshBasicMaterial({color:0xe5b76b});
  const torsoZ=new THREE.Mesh(new THREE.BoxGeometry(.68,.93,.38),rag);torsoZ.position.y=1.28;torsoZ.rotation.z=(Math.random()-.5)*.16;torsoZ.castShadow=true;group.add(torsoZ);
  const headZ=new THREE.Mesh(new THREE.SphereGeometry(.28,10,9),skin);headZ.position.set((Math.random()-.5)*.1,1.98,-.02);headZ.scale.set(.88,1.08,.9);headZ.castShadow=true;group.add(headZ);
  for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,6,5),eyeMat);eye.position.set(side*.105,2.01,-.263);group.add(eye);}
  const limbs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.2,.86,0);group.add(leg);limb(leg,rag,.16,.62,0,-.31,0);limbs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.39,1.62,-.02);group.add(arm);limb(arm,skin,.12,.7,0,-.33,-.08);limbs.push(arm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.12,7,6),skin);hand.position.set(0,-.69,-.12);arm.add(hand);
  }
  // Wounds and torn cloth make each silhouette read as undead, while all hits remain raycastable.
  const stain=new THREE.Mesh(new THREE.SphereGeometry(.12,7,6),mat(0x512e2a));stain.position.set(.14,1.38,-.205);group.add(stain);
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.userData.zombie=group;}});
  if(crawling){
    group.scale.set(1,.52,1);
    torsoZ.position.y=.78;
    headZ.position.y=1.25;
    limbs[0].position.y=.55;limbs[1].position.y=.55;
    limbs[2].position.y=1.0;limbs[3].position.y=1.0;
  }
  const zombie={group,limbs,head:headZ,torso:torsoZ,crawling,hp:2+Math.floor((state.wave-1)/3),speed:(crawling ? .78 : 1.02)+Math.min(.5,state.wave*.035),attack:0,phase:Math.random()*6.28,alive:true};
  group.userData.entity=zombie;zombies.push(zombie);return zombie;
}

let cinematicCar=null;
let mapDecorations=[];
function setMapVariant(){
  for(const item of mapDecorations)scene.remove(item);
  mapDecorations=[];
  const variant=Math.floor(Math.random()*3);
  const palettes=[
    {bg:0xb49a78,fog:0xb49a78,ground:0xb49a78}, // desierto
    {bg:0x777d76,fog:0x777d76,ground:0x74756b}, // zona industrial
    {bg:0xc29b70,fog:0xc29b70,ground:0xb58b5d}  // cañón seco
  ];
  const p=palettes[variant];
  scene.background.setHex(p.bg);scene.fog.color.setHex(p.fog);groundMat.color.setHex(p.ground);
  scene.fog.density=variant===1?.022:.027;
  const deco=new THREE.Group();scene.add(deco);mapDecorations.push(deco);
  if(variant===0){
    // Ruinas y cactus dispersos.
    for(const [x,z] of [[-24,-12],[24,15],[-19,23],[20,-24]]){
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,2.2,7),mat(0x526044));trunk.position.set(x,1.1,z);deco.add(trunk);
      for(const side of [-1,1]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.9,6),mat(0x526044));arm.position.set(x+side*.35,1.25,z);arm.rotation.z=side*.65;deco.add(arm);}
    }
  }else if(variant===1){
    // Contenedores metálicos y tuberías.
    for(const [x,z] of [[-23,-14],[23,17],[-21,19],[22,-20]]){
      const cont=new THREE.Mesh(new THREE.BoxGeometry(5,2.4,2.8),mat(0x555e59,.65,.25));cont.position.set(x,1.2,z);deco.add(cont);
      const stripe=new THREE.Mesh(new THREE.BoxGeometry(5.05,.12,2.85),mat(0xb17b3d));stripe.position.set(x,1.35,z);deco.add(stripe);
    }
  }else{
    // Formaciones rocosas del cañón.
    for(const [x,z,h] of [[-25,-18,5],[25,-12,7],[-24,19,6],[25,22,4]]){
      const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(2.4,0),mat(0x806044));rock.position.set(x,h/2,z);rock.scale.set(1,h/3,1.2);deco.add(rock);
    }
  }
  state.mapVariant=variant;
}
function createFirstWaveCinematic(){
  if(cinematicCar)scene.remove(cinematicCar.group);
  const group=new THREE.Group();
  const style=Math.floor(Math.random()*3);
  const bodyColor=[0x4b4034,0x39464a,0x62513e][style];
  const body=new THREE.Mesh(new THREE.BoxGeometry(style===1?3.9:3.5,1.05,style===2?7.1:6.2),mat(bodyColor,.7,.25));
  body.position.y=1.05;group.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(2.65,1.05,2.7),mat(0x292f30,.45,.25));
  cabin.position.set(0,2.02,-.35);group.add(cabin);
  const windshield=new THREE.Mesh(new THREE.BoxGeometry(2.35,.72,.07),new THREE.MeshStandardMaterial({color:0x8a9a96,metalness:.3,roughness:.2,transparent:true,opacity:.58}));
  windshield.position.set(0,2.05,-1.72);windshield.rotation.x=-.12;group.add(windshield);
  const wheels=[];
  for(const x of [-1.72,1.72])for(const z of [-1.95,1.95]){
    const w=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.3,10),mat(0x171817));
    w.rotation.z=Math.PI/2;w.position.set(x,.62,z);group.add(w);wheels.push(w);
  }
  const headMat=new THREE.MeshBasicMaterial({color:0xffd18a});
  for(const x of [-1.05,1.05]){
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.55,.25,.12),headMat);lamp.position.set(x,1.18,-3.12);group.add(lamp);
  }
  group.position.set(-28,0,-17);group.rotation.y=-Math.PI/2;scene.add(group);
  if(style===1){const rack=new THREE.Mesh(new THREE.BoxGeometry(2.8,.18,2.4),mat(0x252b2a,.7,.2));rack.position.set(0,2.65,.1);group.add(rack);}
  if(style===2){const roof=new THREE.Mesh(new THREE.BoxGeometry(2.7,.25,2.5),mat(0x282b29));roof.position.set(0,2.65,-.2);group.add(roof);}
  const fire=new THREE.Group();group.add(fire);
  const fireMat=new THREE.MeshBasicMaterial({color:0xff8b32,transparent:true,opacity:.85});
  for(let i=0;i<8;i++){
    const flame=new THREE.Mesh(new THREE.SphereGeometry(.22+Math.random()*.18,7,6),fireMat.clone());
    flame.position.set((Math.random()-.5)*2.2,1.8+Math.random()*1.1,(Math.random()-.5)*3.5);
    fire.add(flame);
  }
  const light=new THREE.PointLight(0xff7b2d,5,13);light.position.set(0,2,0);group.add(light);
  cinematicCar={group,wheels,fire,light,t:0,phase:'approach',particles:[]};
  state.cinematic=cinematicCar;
  ui.objective.textContent='ALERTA · UN VEHÍCULO SE ACERCA';
  showToast('RUIDO DE MOTOR A LO LEJOS...');
}
function updateFirstWaveCinematic(dt){
  const c=state.cinematic;if(!c)return;
  c.t+=dt;
  if(c.phase==='approach'){
    c.group.position.x=Math.min(-1.5,-28+c.t*7.2);
    c.wheels.forEach(w=>w.rotation.x+=dt*8);
    if(c.t>3.7){c.phase='impact';c.t=0;showToast('¡EL VEHÍCULO SE DETUVO!');}
  }else if(c.phase==='impact'){
    c.light.intensity=5+Math.sin(c.t*28)*2;
    c.fire.children.forEach((f,i)=>{f.position.y=1.8+Math.random()*.7;f.scale.setScalar(.7+Math.random()*.8);});
    if(c.t>1.5){
      // Flash and expanding stylized dust ring; no realistic blast simulation.
      const flash=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshBasicMaterial({color:0xffc078,transparent:true,opacity:.9}));
      flash.position.copy(c.group.position);flash.position.y=1.7;scene.add(flash);
      const smoke=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshBasicMaterial({color:0x75604b,transparent:true,opacity:.65}));
      smoke.position.copy(c.group.position);smoke.position.y=2;smoke.scale.set(1,1,1);scene.add(smoke);
      c.flash=flash;c.smoke=smoke;c.phase='blast';c.t=0;
    }
  }else if(c.phase==='blast'){
    c.flash.scale.setScalar(1+c.t*8);c.flash.material.opacity=Math.max(0,.9-c.t*1.4);
    c.smoke.scale.set(1+c.t*2,1+c.t*1.3,1+c.t*2);c.smoke.material.opacity=Math.max(0,.65-c.t*.18);
    if(c.t>2.8){
      scene.remove(c.flash);scene.remove(c.smoke);scene.remove(c.group);state.cinematic=null;cinematicCar=null;
      const count=Math.min(4+state.wave,12);
      for(let i=0;i<count;i++){
        const angle=i/count*Math.PI*2+(Math.random()-.5)*.4;
        const radius=7+Math.random()*5;
        const x=-1.5+Math.cos(angle)*radius,z=-17+Math.sin(angle)*radius;
        buildZombie(x,z, i<Math.max(2,Math.floor(count*.28)));
      }
      ui.wave.textContent='01';updateZombieCount();
      ui.objective.textContent=`ELIMINA A LA HORDA · ${count} HOSTILES`;
      showToast('¡LA HORDA SALIÓ DEL VEHÍCULO!');
    }
  }
}

function spawnWave(){
  const count=Math.min(4+state.wave,12);
  for(let i=0;i<count;i++){
    let x=0,z=0,placed=false;
    for(let attempt=0;attempt<35 && !placed;attempt++){
      const angle=Math.random()*Math.PI*2;
      const radius=22+Math.random()*6;
      const candidateX=Math.cos(angle)*radius;
      const candidateZ=Math.sin(angle)*radius;
      const resolved=pushOutOfObstacles(candidateX,candidateZ,ZOMBIE_RADIUS);
      if(Math.hypot(resolved.x-candidateX,resolved.z-candidateZ)<.08 && Math.hypot(candidateX-player.position.x,candidateZ-player.position.z)>12){
        x=candidateX;z=candidateZ;placed=true;
      }
    }
    if(!placed){const angle=i/count*Math.PI*2;x=Math.cos(angle)*26;z=Math.sin(angle)*26;}
    buildZombie(x,z,Math.random()<.18);
  }
  ui.wave.textContent=String(state.wave).padStart(2,'0');updateZombieCount();
  ui.objective.textContent=`ELIMINA A LA HORDA · ${count} HOSTILES`;
  if(state.wave>1)showToast(`OLEADA ${String(state.wave).padStart(2,'0')} — LA HORDA SE ACERCA`);
}
function updateZombieCount(){ui.zombies.textContent=`${zombies.filter(z=>z.alive).length} ENEMIGOS`;}
function dropCoin(position){
  const group=new THREE.Group();group.position.copy(position);group.position.y=.55;scene.add(group);
  const coin=new THREE.Mesh(new THREE.TorusGeometry(.22,.07,8,16),new THREE.MeshStandardMaterial({color:0xf0c744,metalness:.8,roughness:.25,emissive:0x634b0e,emissiveIntensity:.35}));coin.rotation.x=Math.PI/2;coin.castShadow=true;group.add(coin);
  const core=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.045,12),new THREE.MeshStandardMaterial({color:0xd9ac34,metalness:.7,roughness:.25}));core.rotation.x=Math.PI/2;group.add(core);
  pickups.push({group,phase:Math.random()*6.28,value:5+Math.floor(Math.random()*6)});
}
function removeZombie(zombie){
  zombie.alive=false;scene.remove(zombie.group);state.kills++;updateZombieCount();
  if(Math.random()<.72)dropCoin(zombie.group.position.clone());
  if(zombies.every(z=>!z.alive)){state.wave++;setTimeout(()=>{if(state.mode==='playing')spawnWave();},1800);ui.objective.textContent='PREPÁRATE PARA LA SIGUIENTE OLEADA';showToast('SECTOR LIMPIO · RECOGE EL BOTÍN');}
}

function updateCamera(dt){
  if(state.cinematic){
    const c=state.cinematic;
    const focus=c.group.position;
    const cinematicPos=new THREE.Vector3(focus.x-9,6.2,focus.z+12);
    camera.position.lerp(cinematicPos,1-Math.exp(-dt*2.8));
    camera.lookAt(focus.x,1.3,focus.z);
    playerRig.visible=false;viewWeapon.visible=false;
    return;
  }
  const forwardX=Math.sin(state.yaw),forwardZ=-Math.cos(state.yaw);
  const smoothing=1-Math.exp(-dt*10);
  if(state.cameraMode===1){
    const firstPos=new THREE.Vector3(player.position.x,1.72,player.position.z);
    camera.position.lerp(firstPos,smoothing);
    camera.lookAt(player.position.x+forwardX*12,1.72+Math.tan(state.pitch)*12,player.position.z+forwardZ*12);
    playerRig.visible=false;viewWeapon.visible=true;
  }else{
    const desired=new THREE.Vector3(player.position.x-forwardX*5.2,player.position.y+3.8,player.position.z-forwardZ*5.2);
    camera.position.lerp(desired,smoothing);
    camera.lookAt(player.position.x+forwardX*9,1.55+Math.tan(state.pitch)*9,player.position.z+forwardZ*9);
    playerRig.visible=true;viewWeapon.visible=false;
  }
  // La orientación del personaje sigue siempre el giro de la cámara.
  player.rotation.y=-state.yaw;
  if(state.shake&&state.shakeTime>0){const amount=state.shakeTime*0.06;camera.position.x+=(Math.random()-.5)*amount;camera.position.y+=(Math.random()-.5)*amount;state.shakeTime=Math.max(0,state.shakeTime-dt);}
}
function updatePlayer(dt){
  let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+touchMove.y;
  let side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+touchMove.x;
  const moving=forward!==0||side!==0;const length=Math.hypot(forward,side)||1;forward/=length;side/=length;
  const speed=5.4;
  const moveX=(Math.sin(state.yaw)*forward+Math.cos(state.yaw)*side)*speed*dt;
  const moveZ=(-Math.cos(state.yaw)*forward+Math.sin(state.yaw)*side)*speed*dt;
  moveWithCollisions(player,moveX,moveZ,PLAYER_RADIUS);
  state.walkTime+=dt*(moving?10:2.2);
  const swing=moving?Math.sin(state.walkTime)*.48:Math.sin(state.walkTime)*.035;
  legPivots[0].rotation.x=swing;legPivots[1].rotation.x=-swing;
  armPivots[0].rotation.x=-.58-swing*.42;armPivots[1].rotation.x=-.48+swing*.42;
  playerRig.position.y=moving?Math.abs(Math.sin(state.walkTime*2))*.045:0;
  player.rotation.y=-state.yaw;
  // Keep weapon and arms aimed with the camera's pitch.
  rifle.rotation.x=-state.pitch*.55;
  armPivots.forEach(a=>a.rotation.x+=-state.pitch*.16);
}
function damagePlayer(amount){
  if(state.mode!=='playing')return;state.health=Math.max(0,state.health-amount);ui.health.textContent=state.health;
  ui.healthBar.style.width=state.health+'%';ui.healthBar.style.background=state.health<35?'#ff6254':'var(--lime)';
  ui.damage.classList.add('flash');setTimeout(()=>ui.damage.classList.remove('flash'),150);playSound('damage');state.shakeTime=.28;
  if(state.health<=0)endGame();
}
function updateZombies(dt){
  for(const z of zombies){if(!z.alive)continue;
    const dx=player.position.x-z.group.position.x,dz=player.position.z-z.group.position.z;const dist=Math.hypot(dx,dz)||.001;
    z.phase+=dt*(5.8+z.speed*.8);
     // The zombie model faces local -Z. Rotate toward the player smoothly,
     // using the shortest angular path so it never moonwalks sideways.
     const targetYaw=Math.atan2(-dx,-dz);
     let turn=targetYaw-z.group.rotation.y;
     turn=Math.atan2(Math.sin(turn),Math.cos(turn));
     z.group.rotation.y+=turn*Math.min(1,dt*7.5);
    if(dist>1.42){
      const step=z.speed*dt;
      let mx=dx/dist*step, mz=dz/dist*step;
      // Zombies cannot pass through walls or solid cover.
      const before=z.group.position.clone();
      moveWithCollisions(z.group,mx,mz,ZOMBIE_RADIUS);
      // Keep the horde from occupying exactly the same spot.
      for(const other of zombies){
        if(other===z || !other.alive) continue;
        const sx=z.group.position.x-other.group.position.x;
        const sz=z.group.position.z-other.group.position.z;
        const sd=Math.hypot(sx,sz);
        if(sd>0 && sd<.62){
          const overlap=(.62-sd)*.5;
          z.group.position.x+=sx/sd*overlap;
          z.group.position.z+=sz/sd*overlap;
        }
      }
      const gait=Math.sin(z.phase);
      if(z.crawling){
        z.limbs[0].rotation.x=-.35+gait*.62;z.limbs[1].rotation.x=-.35-gait*.62;
        z.limbs[2].rotation.x=.55-gait*.7;z.limbs[3].rotation.x=.55+gait*.7;
      }else{
        z.limbs[0].rotation.x=gait*.55;z.limbs[1].rotation.x=-gait*.55;
        z.limbs[2].rotation.x=-.8+gait*.25;z.limbs[3].rotation.x=-.8-gait*.25;
      }
      z.group.position.y=Math.abs(Math.sin(z.phase*2))*.025;
      z.head.rotation.z=Math.sin(z.phase*.5)*.045;
      z.torso.rotation.z=Math.sin(z.phase)*.035;
    }
    else{z.attack-=dt;z.limbs[2].rotation.x=-1.35+Math.sin(z.phase)*.08;z.limbs[3].rotation.x=-1.35-Math.sin(z.phase)*.08;z.head.rotation.z=Math.sin(z.phase*1.7)*.08;if(z.attack<=0){damagePlayer(8+Math.floor(state.wave/3));z.attack=1.05;}}
  }
}
function updatePickups(dt){
  for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.phase+=dt*3;p.group.rotation.y+=dt*1.2;p.group.position.y=.55+Math.sin(p.phase)*.09;
    if(p.group.position.distanceTo(player.position)<1.35){state.coins+=p.value;ui.coins.textContent=state.coins;scene.remove(p.group);pickups.splice(i,1);playSound('coin');showToast(`+${p.value} MONEDAS`);}
  }
}
function fire(){
  if(state.mode!=='playing'||state.ammo<=0)return;
  const now=performance.now();if(now-state.lastShot<230)return;state.lastShot=now;state.ammo--;ui.ammo.textContent=state.ammo;
  flashMesh.visible=true;muzzleFlash.intensity=12;setTimeout(()=>{flashMesh.visible=false;muzzleFlash.intensity=0},55);
  rifle.position.z=-.47+.045;setTimeout(()=>rifle.position.z=-.47,70);
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  let closest=null,closestDistance=Infinity;
  const solidHits=raycaster.intersectObjects(worldProps,false);
  const wallDistance=solidHits.length?solidHits[0].distance:Infinity;
  for(const z of zombies){if(!z.alive)continue;const hits=raycaster.intersectObject(z.group,true);if(hits.length&&hits[0].distance<closestDistance&&hits[0].distance<wallDistance){closest=z;closestDistance=hits[0].distance;}}
  if(closest){closest.hp--;ui.hit.classList.remove('show');void ui.hit.offsetWidth;ui.hit.classList.add('show');playSound('hit');
    if(closest.hp<=0){const pos=closest.group.position.clone();pos.y=.7;removeZombie(closest);if(Math.random()<.2)dropCoin(pos);}
    else{closest.group.rotation.x=.06;setTimeout(()=>{if(closest.group)closest.group.rotation.x=0},100);}
  }
}

let audioContext=null;
const glockAudio = new Audio(new URL('./glock.mp3', import.meta.url).href);
glockAudio.preload = 'auto';
glockAudio.setAttribute('playsinline', '');
glockAudio.load();
function playGlockShot(){
  if(state.volume<=0) return;
  try {
    // A fresh playback instance avoids waiting for an older shot to finish.
    const shot = glockAudio.cloneNode();
    shot.volume = THREE.MathUtils.clamp(state.volume, 0, 1);
    shot.currentTime = 0;
    const playback = shot.play();
    if(playback && typeof playback.catch === 'function') playback.catch(()=>{});
    shot.addEventListener('ended',()=>{shot.removeAttribute('src');shot.load();},{once:true});
  } catch(e) { /* Audio opcional si el navegador bloquea la reproducción. */ }
}
function playSound(type){
  if(state.volume<=0)return;
  try{
    audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();
    const ctx=audioContext,now=ctx.currentTime,gain=ctx.createGain();gain.connect(ctx.destination);gain.gain.setValueAtTime(state.volume*.22,now);
    if(type==='shot'){
      const osc=ctx.createOscillator();osc.type='sawtooth';osc.frequency.setValueAtTime(145,now);osc.frequency.exponentialRampToValueAtTime(48,now+.12);gain.gain.setValueAtTime(state.volume*.32,now);gain.gain.exponentialRampToValueAtTime(.001,now+.14);osc.connect(gain);osc.start(now);osc.stop(now+.15);
      const noise=ctx.createBufferSource();const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.08),ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);noise.buffer=buffer;const ng=ctx.createGain();ng.gain.value=state.volume*.15;noise.connect(ng);ng.connect(ctx.destination);noise.start();
    }else{
      const osc=ctx.createOscillator();osc.type=type==='damage'?'sawtooth':'sine';const start=type==='coin'?640:type==='hit'?220:95;osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(type==='coin'?1050:type==='hit'?100:45,now+(type==='coin'?.18:.12));gain.gain.exponentialRampToValueAtTime(.001,now+(type==='coin'?.22:.16));osc.connect(gain);osc.start(now);osc.stop(now+.24);
    }
  }catch(e){/* Audio is optional if the browser blocks it. */}
}
function showToast(message){ui.toast.textContent=message;ui.toast.classList.remove('hidden');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>ui.toast.classList.add('hidden'),1900);}
function startGame(){
  clearGame();state.mode='playing';state.wave=1;state.coins=0;state.kills=0;state.health=100;state.ammo=12;state.yaw=0;state.pitch=-.08;state.elapsed=0;state.cameraMode=0;viewWeapon.visible=false;updateCameraButton();
  player.position.set(0,0,5);player.rotation.set(0,0,0);
  ui.coins.textContent='0';ui.health.textContent='100';ui.healthBar.style.width='100%';ui.healthBar.style.background='var(--lime)';ui.ammo.textContent='12';
  ui.menu.classList.add('hidden');ui.pause.classList.add('hidden');ui.settings.classList.add('hidden');ui.gameover.classList.add('hidden');ui.hud.classList.remove('hidden');ui.hint.classList.remove('hidden');
  setMapVariant();createFirstWaveCinematic();requestLock();
}
function clearGame(){for(const item of mapDecorations)scene.remove(item);mapDecorations=[];if(state.cinematic){scene.remove(state.cinematic.group);if(state.cinematic.flash)scene.remove(state.cinematic.flash);if(state.cinematic.smoke)scene.remove(state.cinematic.smoke);state.cinematic=null;cinematicCar=null;}for(const z of zombies)scene.remove(z.group);zombies.length=0;for(const p of pickups)scene.remove(p.group);pickups.length=0;}
function endGame(){state.mode='gameover';ui.hud.classList.add('hidden');ui.pause.classList.add('hidden');ui.gameover.classList.remove('hidden');ui.finalWave.textContent=String(state.wave).padStart(2,'0');ui.finalKills.textContent=state.kills;ui.finalCoins.textContent=state.coins;document.exitPointerLock?.();}
function requestLock(){if(!isTouchDevice&&renderer.domElement.requestPointerLock&&document.pointerLockElement!==renderer.domElement){renderer.domElement.requestPointerLock();}}
function reload(){if(state.mode!=='playing'||state.ammo===12)return;state.ammo=12;ui.ammo.textContent='12';showToast('CARGADOR RECARGADO');}
function updateCameraButton(){
  if(!ui.cameraBtn)return;
  ui.cameraBtn.textContent=state.cameraMode===0?'1ª PERSONA':'3ª PERSONA';
  ui.cameraBtn.setAttribute('aria-label',state.cameraMode===0?'Cambiar a primera persona':'Cambiar a tercera persona');
}
function toggleCamera(){
  state.cameraMode=state.cameraMode===0?1:0;
  updateCameraButton();
  showToast(state.cameraMode===1?'CÁMARA: PRIMERA PERSONA':'CÁMARA: TERCERA PERSONA');
}
function pauseGame(){if(state.mode!=='playing')return;state.mode='paused';ui.pause.classList.remove('hidden');ui.hint.classList.add('hidden');document.exitPointerLock?.();}
function resumeGame(){if(state.mode!=='paused')return;state.mode='playing';ui.pause.classList.add('hidden');requestLock();}
function openSettings(){ui.settings.classList.remove('hidden');}
function closeSettings(){ui.settings.classList.add('hidden');}
function goHome(){state.mode='menu';ui.hud.classList.add('hidden');ui.pause.classList.add('hidden');ui.gameover.classList.add('hidden');ui.settings.classList.add('hidden');ui.menu.classList.remove('hidden');clearGame();document.exitPointerLock?.();}

ui.start.addEventListener('click',startGame);ui.retry.addEventListener('click',startGame);ui.home.addEventListener('click',goHome);
ui.pauseBtn.addEventListener('click',pauseGame);ui.resume.addEventListener('click',resumeGame);ui.quit.addEventListener('click',goHome);
ui.menuSettings.addEventListener('click',openSettings);ui.pauseSettings.addEventListener('click',openSettings);ui.settingsClose.addEventListener('click',closeSettings);ui.settingsDone.addEventListener('click',closeSettings);
ui.volume.addEventListener('input',()=>{state.volume=Number(ui.volume.value)/100;ui.volumeLabel.textContent=ui.volume.value+'%';});
ui.sensitivity.addEventListener('input',()=>{state.sensitivity=Number(ui.sensitivity.value)/1000;ui.sensitivityLabel.textContent=ui.sensitivity.value;});
ui.shake.addEventListener('change',()=>state.shake=ui.shake.checked);
ui.shoot?.addEventListener('pointerdown',e=>{
  e.preventDefault();e.stopPropagation();
  if(state.mode==='playing' && state.ammo>0 && performance.now()-state.lastShot>=230){playGlockShot();fire();}
});
ui.reload?.addEventListener('pointerdown',e=>{e.preventDefault();reload();});
ui.cameraBtn?.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(state.mode==='playing')toggleCamera();});
// Joystick izquierdo: movimiento continuo, independiente del giro de cámara.
let joyPointer=null;
function updateJoystick(e){const r=ui.joystick.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width*.34),dy=(cy-e.clientY)/(r.height*.34);const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}touchMove.x=dx;touchMove.y=dy;ui.stick.style.transform=`translate(${dx*30}px,${-dy*30}px)`;}
ui.joystick?.addEventListener('pointerdown',e=>{if(state.mode!=='playing')return;joyPointer=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);updateJoystick(e);});
ui.joystick?.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoystick(e);});
function endJoystick(e){if(e.pointerId!==joyPointer)return;joyPointer=null;touchMove.x=0;touchMove.y=0;ui.stick.style.transform='translate(0,0)';}
ui.joystick?.addEventListener('pointerup',endJoystick);ui.joystick?.addEventListener('pointercancel',endJoystick);
// Arrastrar el lado derecho de la pantalla gira la cámara.
let lookPointer=null,lastLookX=0,lastLookY=0;
ui.look?.addEventListener('pointerdown',e=>{if(state.mode!=='playing'||e.target.closest('button'))return;lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;ui.look.setPointerCapture(e.pointerId);});
ui.look?.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;const dx=e.clientX-lastLookX,dy=e.clientY-lastLookY;lastLookX=e.clientX;lastLookY=e.clientY;state.yaw+=dx*state.sensitivity*.75;state.pitch=THREE.MathUtils.clamp(state.pitch-dy*state.sensitivity*.55,-.62,.48);player.rotation.y=-state.yaw;});
function endLook(e){if(e.pointerId===lookPointer)lookPointer=null;}
ui.look?.addEventListener('pointerup',endLook);ui.look?.addEventListener('pointercancel',endLook);
renderer.domElement.addEventListener('click',()=>{if(state.mode==='playing'){if(document.pointerLockElement!==renderer.domElement)requestLock();else { if(state.ammo>0 && performance.now()-state.lastShot>=230)playGlockShot(); fire(); }}});
document.addEventListener('pointerlockchange',()=>{
  if(document.pointerLockElement===renderer.domElement){ui.hint.classList.add('hidden');}
  else if(state.mode==='playing'&&!isTouchDevice){pauseGame();}
});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement&&state.mode==='playing'){
  state.yaw+=e.movementX*state.sensitivity;state.pitch=THREE.MathUtils.clamp(state.pitch-e.movementY*state.sensitivity,-.55,.42);player.rotation.y=-state.yaw;
}});
document.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);
  if(e.code==='Escape'&&state.mode==='playing')pauseGame();
  if(e.code==='KeyR'&&state.mode==='playing')reload();
  if(e.code==='KeyV'&&state.mode==='playing')toggleCamera();
});
document.addEventListener('keyup',e=>keys.delete(e.code));

let previous=performance.now();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.04);previous=now;
  if(state.mode==='playing'){state.elapsed+=dt;updatePlayer(dt);updateCamera(dt);if(state.cinematic)updateFirstWaveCinematic(dt);else updateZombies(dt);updatePickups(dt);}
  else{updateCamera(dt);}
  // Ambient animation: wind in weeds and subtle flicker in damaged street lamps.
  for(const item of animatedObjects){
    item.phase+=dt*(item.type==='sway'?1.35:.8);
    item.object.rotation.z=Math.sin(item.phase)*item.amount;
    item.object.rotation.x=Math.cos(item.phase*.7)*item.amount*.45;
  }
  for(const lamp of flickerLights){
    lamp.phase+=dt;
    const pulse=.88+Math.sin(lamp.phase*2.1)*.07+(Math.random()-.5)*.025;
    lamp.light.intensity=lamp.base*pulse;
    lamp.glow.scale.setScalar(.94+Math.sin(lamp.phase*2)*.06);
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.1));});
// The menu renders the same 3D world in the background for an immediate, atmospheric start.
player.position.set(0,0,5);state.yaw=.42;state.pitch=-.08;
for(let i=0;i<3;i++){const a=i/7*Math.PI*2;const z=buildZombie(Math.cos(a)*17,Math.sin(a)*17);z.speed=0;}
