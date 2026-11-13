import * as T from './assets/vendor/three.module.js?v=1de39eabb239';
import {drawScreen} from './screen-textures.js?v=1de39eabb239';
import {createAtmosphere} from './sky-environment.js?v=1de39eabb239';

const V=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
const mix=(a,b,t)=>a.clone().lerp(b,t);

export async function createHardwareScene(stage,{initialProgress=0}={}){
  const [geo,securityTexture]=await Promise.all([
    fetch('./assets/world-land.json?v=1de39eabb239').then(r=>{if(!r.ok)throw Error('Map asset unavailable');return r.json();}),
    new T.TextureLoader().loadAsync('./assets/security-field.svg').catch(()=>null)
  ]);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.domElement.className='hardware-canvas';renderer.domElement.setAttribute('aria-hidden','true');
  stage.prepend(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#151b17');scene.fog=new T.FogExp2('#39423a',.012);
  const camera=new T.PerspectiveCamera(43,1,.025,170);
  const nightSky=createAtmosphere();scene.add(nightSky);
  scene.add(new T.HemisphereLight(0xd7ded8,0x252b25,1.3));
  const key=new T.DirectionalLight(0xf4edda,4.2);key.position.set(2,9,6);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;key.shadow.normalBias=.025;key.shadow.radius=3;scene.add(key);
  scene.add(key.target);
  const edge=new T.DirectionalLight(0xd9ded7,1.6);edge.position.set(-6,4,-4);scene.add(edge);
  const fill=new T.DirectionalLight(0xabb7b6,1.0);fill.position.set(6,2,2);scene.add(fill);
  function finishTexture(rough=false){
    const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d'),image=x.createImageData(512,512);let seed=92187;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let y=0;y<512;y++){const brush=(random()-.5)*9;for(let px=0;px<512;px++){const i=(y*512+px)*4,v=(rough?205:240)+brush+(random()-.5)*(rough?19:7);image.data[i]=image.data[i+1]=image.data[i+2]=v;image.data[i+3]=255;}}
    x.putImageData(image,0,0);const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(2.5,2.5);texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);if(!rough)texture.colorSpace=T.SRGBColorSpace;return texture;
  }
  const finish={color:finishTexture(),rough:finishTexture(true)};
  const material=(color,metalness=.43,roughness=.60)=>{const tint=new T.Color(color),hsl={};tint.getHSL(hsl);tint.setHSL(hsl.h,hsl.s*.28,hsl.l);return new T.MeshStandardMaterial({color:tint,metalness,roughness,map:finish.color,roughnessMap:finish.rough,bumpMap:finish.rough,bumpScale:.0012});};
  function rounded(w,h,d,r=.03){
    const s=new T.Shape(),x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    if(r<.005)return new T.BoxGeometry(w,h,d);
    const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:Math.min(r*.35,d*.2),bevelThickness:Math.min(r*.35,d*.2),curveSegments:5});g.translate(0,0,-d/2);return g;
  }
  function box(parent,w,h,d,x,y,z,color='#20272a',r=.025){const m=new T.Mesh(rounded(w,h,d,r),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(parent,radius,height,x,y,z,color='#252d30',axis='y'){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,height,20),material(color,.55,.3));m.position.set(x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;m.castShadow=true;parent.add(m);return m;}
  function lightDot(parent,x,y,z,color='#c9f890',r=.018){const m=new T.Mesh(new T.SphereGeometry(r,12,8),new T.MeshBasicMaterial({color,toneMapped:false,fog:false}));m.position.set(x,y,z);parent.add(m);return m;}
  function neon(parent,w,h,d,x,y,z,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color,.55,.5));m.position.set(x,y,z);parent.add(m);return m;}
  function fastener(parent,x,y,z,r=.018,axis='z'){
    const g=new T.Group();g.position.set(x,y,z);if(axis==='y')g.rotation.x=-Math.PI/2;if(axis==='x')g.rotation.y=Math.PI/2;if(axis==='back')g.rotation.y=Math.PI;parent.add(g);
    cylinder(g,r,.012,0,0,0,'#7e8679','z');box(g,r*1.35,.004,.003,0,0,.008,'#141a15',.001);box(g,.004,r*1.35,.003,0,0,.009,'#141a15',.001);return g;
  }
  function perforations(parent,columns,rows,sx,sy,x,y,z,r=.013,back=false){
    const geo=new T.CircleGeometry(r,8),mat=new T.MeshBasicMaterial({color:'#090e0b'}),holes=new T.InstancedMesh(geo,mat,columns*rows),item=new T.Object3D();
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){item.position.set(x+(col-(columns-1)/2)*sx,y+(row-(rows-1)/2)*sy,z);item.rotation.y=back?Math.PI:0;item.updateMatrix();holes.setMatrixAt(row*columns+col,item.matrix);}parent.add(holes);return holes;
  }
  const bakedTextures=[];
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=256;const contactContext=contactCanvas.getContext('2d'),contactGradient=contactContext.createRadialGradient(128,128,22,128,128,128);contactGradient.addColorStop(0,'#000000b0');contactGradient.addColorStop(.4,'#00000070');contactGradient.addColorStop(.7,'#00000030');contactGradient.addColorStop(1,'#00000000');contactContext.fillStyle=contactGradient;contactContext.fillRect(0,0,256,256);const contactTexture=new T.CanvasTexture(contactCanvas);bakedTextures.push(contactTexture);
  function contactShadow(parent,w,d,x,y,z,opacity=.65){const shadow=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:contactTexture,transparent:true,opacity,depthWrite:false,toneMapped:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,y,z);shadow.renderOrder=1;parent.add(shadow);return shadow;}
  function bakeFloor(surface,w,d,occluders){
    const ao=document.createElement('canvas'),light=document.createElement('canvas');ao.width=ao.height=light.width=light.height=1024;const a=ao.getContext('2d'),l=light.getContext('2d');a.fillStyle='#fff';a.fillRect(0,0,1024,1024);l.fillStyle='#242821';l.fillRect(0,0,1024,1024);
    for(const [x,z,ow,od] of occluders){a.save();a.translate((x/w+.5)*1024,(z/d+.5)*1024);a.scale(ow/w*1024,od/d*1024);const g=a.createRadialGradient(0,0,0,0,0,.8);g.addColorStop(0,'#000000a8');g.addColorStop(.45,'#00000069');g.addColorStop(1,'#00000000');a.fillStyle=g;a.fillRect(-1,-1,2,2);a.restore();}
    const wash=l.createRadialGradient(410,155,15,410,155,520);wash.addColorStop(0,'#a2a88a');wash.addColorStop(.4,'#666d59');wash.addColorStop(1,'#242821');l.fillStyle=wash;l.fillRect(0,0,1024,1024);
    const aoMap=new T.CanvasTexture(ao),lightMap=new T.CanvasTexture(light);lightMap.colorSpace=T.SRGBColorSpace;bakedTextures.push(aoMap,lightMap);surface.material.aoMap=aoMap;surface.material.aoMapIntensity=.8;surface.material.lightMap=lightMap;surface.material.lightMapIntensity=.32;surface.material.needsUpdate=true;
  }
  function port(parent,x,y,z,back=false){
    const g=new T.Group();g.position.set(x,y,z);if(back)g.rotation.y=Math.PI;parent.add(g);
    box(g,.19,.145,.055,0,0,0,'#66716e',.009);box(g,.15,.105,.012,0,0,.032,'#030707',.003);
    for(let i=0;i<8;i++)box(g,.009,.045,.01,-.058+i*.016,.018,.04,'#bc9254',.001);
    lightDot(g,-.075,.078,.03,'#ff723d',.009);lightDot(g,.075,.078,.03,'#83b86f',.009);return g;
  }
  function ethernetPlug(parent,point,back=false){
    const g=new T.Group();g.position.copy(point);if(back)g.rotation.y=Math.PI;parent.add(g);
    box(g,.14,.10,.17,0,0,.15,'#657765',.018);
    const head=box(g,.13,.085,.12,0,0,.025,'#b7c7af',.008);head.material=new T.MeshPhysicalMaterial({color:'#ced8c3',roughness:.17,metalness:0,transparent:true,opacity:.65,transmission:.12,clearcoat:1});
    box(g,.06,.014,.14,0,.057,.05,'#b0bda8',.004);
    for(let i=0;i<8;i++)box(g,.009,.009,.067,-.049+i*.014,.043,.014,'#bd9a54',.001);
    for(let i=0;i<3;i++)box(g,.15,.105,.012,0,0,.19+i*.025,'#415444',.003);
    return g;
  }
  function label(text,w=512,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.clearRect(0,0,w,h);x.fillStyle='#a9b6ad';x.font=`${Math.floor(h*.34)}px monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;}
  function labelPlane(parent,text,w,h,x,y,z,back=false){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:label(text),transparent:true,depthWrite:false}));m.position.set(x,y,z);if(back)m.rotation.y=Math.PI;parent.add(m);return m;}
  function screenTexture(kind,sent=false){
    const c=drawScreen(kind,sent),t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return {texture:t,canvas:c};
  }
  function displayPort(parent,x,y,z){
    box(parent,.20,.09,.045,x,y,z,'#73817c',.008);
    box(parent,.16,.052,.01,x,y,z-.026,'#080e0d',.003);
  }
  function displayPlug(parent,point){
    const g=new T.Group();g.position.copy(point);parent.add(g);
    box(g,.17,.078,.12,0,0,-.07,'#82908b',.008);
    box(g,.20,.10,.18,0,0,-.19,'#1c2825',.022);
    box(g,.07,.055,.12,0,0,-.33,'#35453d',.013);
    return g;
  }
  function makeMonitor(parent,w,h,screen,location,yaw=0,connection='display'){
    const g=new T.Group();g.position.copy(location);g.rotation.y=yaw;parent.add(g);
    const cy=.74+h/2+.58;
    box(g,w,h,.20,0,cy,0,'#20282b',.065);
    box(g,w*.69,h*.53,.12,0,cy+.10,-.14,'#30372f',.06);
    box(g,w-.035,h-.035,.018,0,cy,.11,'#080c0e',.05);
    const panel=new T.Mesh(new T.PlaneGeometry(w-.16,h-.19),new T.MeshBasicMaterial({map:screen, color:screen?0xffffff:0x111b19,toneMapped:false}));panel.position.set(0,cy,.125);g.add(panel);
    box(g,.46,.4,.065,0,cy-.25,-.14,'#343d40',.035);
    box(g,.16,cy-.99,.18,0,(cy+.49)/2,-.17,'#424c4d',.035);
    box(g,1.15,.07,.68,0,.705,.02,'#424b4b',.045);
    box(g,.24,.16,.26,0,cy-.25,-.17,'#4d5655',.025);
    for(let i=0;i<24;i++)box(g,.027,.13,.015,-.65+i*.055,cy+.60,-.113,'#090e10',.003);
    for(const xx of [-w/2+.13,w/2-.13])for(const yy of [cy-h/2+.12,cy+h/2-.12])fastener(g,xx,yy,-.130,.018,'back');
    perforations(g,16,3,.055,.037,0,cy+.36,-.224,.011,true);
    for(const x of [-.58,-.31]){box(g,.18,.075,.025,x,cy-.68,-.12,'#798073',.006);box(g,.145,.042,.01,x,cy-.68,-.138,'#10150f',.003);}
    cylinder(g,.045,.025,-.90,cy-.68,-.14,'#0a100c','z');
    for(let i=0;i<4;i++)cylinder(g,.012,.008,w/2-.19-i*.07,cy-h/2+.055,.127,'#616a5b','z');
    contactShadow(g,1.65,1.0,0,.711,.03,.68);
    if(connection==='display')displayPort(g,.94,cy-.68,-.15);
    else {port(g,.94,cy-.68,-.15,true);labelPlane(g,'NETWORK / CAT6',.72,.11,.94,cy-.46,-.121,true);}
    labelPlane(g,'SM / SYSTEMS',.42,.085,0,cy-h/2+.04,.128);
    lightDot(g,w/2-.11,cy-h/2+.055,.13,'#8cb182',.012);
    return {group:g,panel,cy:cy+location.y,w,h};
  }
  function desk(parent,x=0,z=0,w=9.4,lift=0){
    box(parent,w,.17,3.1,x,.59+lift,z,'#222d2b',.05);box(parent,w,.035,3.08,x,.69+lift,z,'#303a35',.02);
    for(const side of [-1,1])for(const fore of [-1,1]){const lx=x+side*(w/2-.6),lz=z+fore*1.05;box(parent,.15,.61+lift,.15,lx,.22+lift/2,lz,'#232c2b');box(parent,.28,.04,.28,lx,-.08,lz,'#111810',.015);fastener(parent,lx,.42+lift,lz+.082,.025);}
    for(const fore of [-1,1])box(parent,w-1.15,.14,.12,x,.43+lift,z+fore*1.05,'#3b4438',.015);
    box(parent,w-1.2,.16,.13,x,.13+lift*.3,z-1.05,'#333c30',.015);
    neon(parent,w*.61,.018,.012,x-w*.12,.56+lift,z+1.563,'#778272');neon(parent,w*.20,.018,.012,x+w*.32,.56+lift,z+1.563,'#a59982');
    contactShadow(parent,w+1.5,4.2,x,-.094,z,.75);
  }
  function industrialRoom(origin,width=32,back=-6.8){
    const g=new T.Group();g.position.copy(origin);scene.add(g);
    const aperture=width-10,depth=16,front=back+depth;
    const wall=(w,h,d,x,y,z,color='#333a34')=>{const m=box(g,w,h,d,x,y,z,color,.012);m.material.metalness=.08;m.material.roughness=.94;return m;};
    // Raised sill conceals the outdoor ground line; the sky reads through real window openings.
    wall(aperture,2.2,.28,0,1.0,back,'#394139');
    wall(aperture,1.5,.28,0,8.45,back,'#29302a');
    for(const side of [-1,1]){
      wall(5,9.3,.28,side*(aperture/2+2.5),4.55,back,'#303830');
      wall(.24,9.3,depth,side*width/2,4.55,back+depth/2,'#252d27');
      box(g,.22,9.15,.20,side*(width/2-1.2),4.5,back+.23,'#535c50',.012);
    }
    wall(width,.20,depth,0,9.1,back+depth/2,'#242b25');
    box(g,width,.16,.35,0,9.0,front,'#485044',.012);
    // Recessed mullions and a deep sill give the window a substantial industrial frame.
    for(const x of [-aperture/2,-aperture/4,0,aperture/4,aperture/2])box(g,.10,5.55,.20,x,4.925,back+.14,'#6f786a',.012);
    for(const y of [2.15,7.70])box(g,aperture+.15,.13,.23,0,y,back+.15,'#717b6b',.012);
    box(g,aperture+.35,.13,.72,0,2.10,back+.34,'#4c5648',.012);
    for(const x of [-width*.22,width*.22]){
      box(g,3.3,.13,.30,x,8.91,back+4.3,'#50584b',.012);
      const light=new T.Mesh(new T.BoxGeometry(3.0,.018,.20),new T.MeshBasicMaterial({color:'#d6d6c8',toneMapped:false}));light.position.set(x,8.835,back+4.3);g.add(light);
    }
    // Quiet panel joints and a baseboard locate the equipment against the room, not an infinite plane.
    box(g,width,.12,.08,0,.02,back+.19,'#171d18',.005);
    for(const x of [-width/2+2.5,width/2-2.5])box(g,.018,8.8,.03,x,4.5,back+.16,'#1b221c',.003);
    return g;
  }
  const room=new T.Group();scene.add(room);
  const sourceArchitecture=industrialRoom(V(0,0,0));
  const floor=new T.Mesh(new T.PlaneGeometry(160,120),material('#101817',.25,.57));floor.rotation.x=-Math.PI/2;floor.position.y=-.1;floor.receiveShadow=true;scene.add(floor);
  const floorBaseColor=floor.material.color.clone();
  bakeFloor(floor,160,120,[[0,0,9.4,3.1],[5.3,0,.9,1.4]]);
  const grid=new T.GridHelper(120,100,0x3b423a,0x282f29);grid.position.y=-.095;grid.material.transparent=true;grid.material.opacity=.14;scene.add(grid);
  const workstation=new T.Group();room.add(workstation);desk(workstation);
  const mainScreen=screenTexture('main'), leftScreen=screenTexture('left'), rightScreen=screenTexture('right');
  const main=makeMonitor(workstation,3.8,2.2,mainScreen.texture,V(0,0,0));
  const leftMonitor=makeMonitor(workstation,2.4,1.65,leftScreen.texture,V(-3.1,0,-.18),.25);
  const rightMonitor=makeMonitor(workstation,2.4,1.65,rightScreen.texture,V(3.1,0,-.18),-.25);
  const sourceTower=new T.Group();sourceTower.position.set(5.3,0,0);workstation.add(sourceTower);
  box(sourceTower,.78,1.62,1.20,0,.79,0,'#243040',.065);box(sourceTower,.71,1.51,.025,0,.79,.62,'#0c1420',.04);
  for(const x of [-.26,.26])for(const z of [-.40,.40])box(sourceTower,.16,.08,.18,x,-.06,z,'#131a14',.018);
  box(sourceTower,.64,1.38,.018,0,.80,-.62,'#323b30',.016);
  perforations(sourceTower,10,9,.043,.043,0,.58,-.635,.013,true);
  for(const x of [-.28,.28])for(const y of [.18,1.39])fastener(sourceTower,x,y,-.64,.021,'back');
  for(const y of [.87,.98]){box(sourceTower,.14,.065,.03,-.19,y,-.65,'#79816f',.006);box(sourceTower,.105,.035,.009,-.19,y,-.671,'#0a100b',.002);}
  box(sourceTower,.21,.15,.025,.17,.18,-.65,'#141b14',.013);
  contactShadow(workstation,1.5,1.9,5.3,-.094,0,.8);
  for(const y of [.35,.87]){const fan=new T.Mesh(new T.TorusGeometry(.22,.015,8,40),new T.MeshBasicMaterial({color:y<.5?'#6f776d':'#8f978c',toneMapped:false}));fan.position.set(0,y,.65);sourceTower.add(fan);for(let i=0;i<6;i++){const blade=box(sourceTower,.24,.035,.015,0,y,.64,'#344758',.008);blade.rotation.z=i*Math.PI/3;}}
  neon(sourceTower,.018,1.48,.012,-.32,.75,.65,'#a8b4a2');labelPlane(sourceTower,'WORKSTATION / 01',.62,.10,0,1.36,.65);
  port(sourceTower,.12,1.12,-.62,true);labelPlane(sourceTower,'ETHERNET / LAN',.62,.10,0,.91,-.65,true);
  const sourceGlow=new T.PointLight('#d6dfc8',.65,5,2);sourceGlow.position.set(4.5,1.3,1);workstation.add(sourceGlow);
  const keys=new T.Group();keys.position.set(.1,.74,.95);workstation.add(keys);
  box(keys,2.35,.07,.74,0,0,0,'#252d2d',.035);
  contactShadow(workstation,2.8,1.1,.1,.712,.95,.55);
  const keyGeometry=rounded(.102,.036,.098,.009),keyMaterial=material('#48524c',.06,.68);
  const keyboard=new T.InstancedMesh(keyGeometry,keyMaterial,75),dummy=new T.Object3D();
  for(let r=0;r<5;r++)for(let col=0;col<15;col++){dummy.position.set(-1.03+col*.145,.05,-.27+r*.13);dummy.scale.setScalar(r===4&&col>=4&&col<=10?0:1);dummy.updateMatrix();keyboard.setMatrixAt(r*15+col,dummy.matrix);}keys.add(keyboard);keyboard.castShadow=true;
  box(keys,1.0,.037,.098,-.015,.05,.25,'#535c4d',.009);
  const mouse=new T.Group();mouse.position.set(1.75,.80,1);workstation.add(mouse);const mouseShell=new T.Mesh(new T.SphereGeometry(.22,32,20),material('#344039',.04,.65));mouseShell.scale.set(.7,.35,1.1);mouse.add(mouseShell);box(mouse,.006,.006,.15,0,.077,-.11,'#131b13',.001);cylinder(mouse,.028,.022,0,.075,-.045,'#111811','x');
  const router=new T.Group();router.position.set(-3.65,.90,.80);workstation.add(router);
  box(router,1.50,.28,1.1,0,0,0,'#414b4c',.065);box(router,1.46,.025,1.06,0,.16,0,'#5a6361',.025);
  for(const x of [-.57,.57])for(const z of [-.35,.35]){box(router,.14,.06,.16,x,-.17,z,'#172017',.018);fastener(router,x,.180,z,.019,'y');}
  box(router,1.37,.012,.95,0,-.137,0,'#242d23',.018);
  cylinder(router,.042,.03,.48,-.025,-.57,'#10170f','z');
  contactShadow(workstation,1.85,1.4,-3.65,.712,.80,.65);
  for(let i=0;i<20;i++)box(router,.028,.008,.58,-.56+i*.06,.178,-.05,'#151e1c',.002);
  for(let i=0;i<4;i++)port(router,-.48+i*.30,-.025,.58);
  port(router,-.55,-.05,-.58,true);
  labelPlane(router,'GATEWAY / 01',.92,.09,0,.055,.566);
  for(let i=0;i<4;i++)lightDot(router,-.48+i*.3,.1,.572,i===0?'#ff7640':'#8eac77',.012);
  for(const side of [-1,1]){const a=new T.Group();a.position.set(side*.59,.15,-.39);a.rotation.z=side*.11;router.add(a);cylinder(a,.075,.10,0,.02,0,'#5c6560','x');cylinder(a,.034,.90,0,.49,0,'#27312e');cylinder(a,.046,.38,0,.75,0,'#313b36');}
  function cable(parent,points,color='#111b1b',radius=.035){const curve=new T.CatmullRomCurve3(points);const mesh=new T.Mesh(new T.TubeGeometry(curve,100,radius,10,false),material(color,.06,.65));mesh.castShadow=true;parent.add(mesh);curve.mesh=mesh;return curve;}
  const backPort=V(5.42,1.12,-.66), routerPort=V(-3.23,.875,1.38);
  const firstCableStart=backPort.clone().add(V(0,0,-.27)),firstCableEnd=routerPort.clone().add(V(0,0,.27));
  const firstCable=cable(room,[firstCableStart,V(5.42,.98,-1.65),V(3.8,.84,-1.95),V(-1.9,.84,-1.95),V(-2.05,.84,-1.1),V(-2.05,.84,1.7),V(-3.23,.875,1.95),firstCableEnd],'#324c55',.046);
  const plug=ethernetPlug(room,backPort,true);
  const routerPlug=ethernetPlug(room,routerPort);
  [main,leftMonitor,rightMonitor].forEach((display,i)=>{
    const gpu=V(5.12+i*.18,1.45,-.64);displayPort(sourceTower,-.18+i*.18,1.45,-.60);displayPlug(workstation,gpu);
    const socket=V(.94,display.cy-.68,-.19);displayPlug(display.group,socket);display.group.updateMatrixWorld(true);
    const end=display.group.localToWorld(socket.clone().add(V(0,0,-.39))),approach=display.group.localToWorld(socket.clone().add(V(0,0,-.80)));
    cable(workstation,[gpu.clone().add(V(0,0,-.39)),V(gpu.x,1.35,-2.2-i*.12),V(end.x,.91,-2.2-i*.12),approach,end],'#202e3c',.024);
  });
  const routerWan=V(-4.2,.85,.18);ethernetPlug(workstation,routerWan,true);
  const uplinkEnd=V(-5.2,.18,-2.1);
  const uplinkCable=cable(workstation,[routerWan.clone().add(V(0,0,-.27)),V(-4.2,.86,-1.85),V(-5.15,.80,-2.1),V(-5.2,.18,-1.55),uplinkEnd.clone().add(V(0,0,.27))],'#283c4a',.032);
  ethernetPlug(workstation,uplinkEnd);
  const edgeGateway=new T.Group();edgeGateway.position.copy(uplinkEnd.clone().add(V(0,0,-.36)));workstation.add(edgeGateway);
  box(edgeGateway,.70,.42,.7,0,.03,0,'#1c2b3c',.035);port(edgeGateway,0,0,.35);labelPlane(edgeGateway,'WAN / UPLINK',.60,.09,0,.15,.36);
  // Real geographic dots; activity is an authored visualization.
  const mapCenter=V(-18,4,0),mapGroup=new T.Group();mapGroup.position.copy(mapCenter);scene.add(mapGroup);
  const positions=new Float32Array(geo.dots.length*3);geo.dots.forEach(([lon,lat],i)=>{positions[i*3]=lon/180*7.5;positions[i*3+1]=lat/90*3.75;positions[i*3+2]=0;});
  const pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(positions,3));
  const dots=new T.Points(pg,new T.PointsMaterial({color:'#8f9f8a',size:.037,sizeAttenuation:true,transparent:true,opacity:.78,fog:false}));mapGroup.add(dots);
  const mapPlane=new T.Mesh(new T.PlaneGeometry(16.3,8.6),new T.MeshBasicMaterial({color:0x080f11,transparent:true,opacity:.74,fog:false}));mapPlane.position.z=-.12;mapGroup.add(mapPlane);
  const gridLines=[];for(let i=-7;i<=7;i++)gridLines.push(V(i,-3.7,-.06),V(i,3.7,-.06));for(let i=-3;i<=3;i++)gridLines.push(V(-7.5,i,-.06),V(7.5,i,-.06));
  const gg=new T.BufferGeometry().setFromPoints(gridLines),mapGrid=new T.LineSegments(gg,new T.LineBasicMaterial({color:0x34483c,transparent:true,opacity:.25,fog:false}));mapGroup.add(mapGrid);
  const mapPoint=(lon,lat)=>mapCenter.clone().add(V(lon/180*7.5,lat/90*3.75,0));
  // Illustrative origin, not attribution: the red route travels west to Southern California.
  const attackStart=mapPoint(116,40), attackEnd=mapPoint(-118,34);
  const arcCurve=new T.QuadraticBezierCurve3(attackStart,mix(attackStart,attackEnd,.5).add(V(0,2,4.1)),attackEnd);
  const heroArc=new T.Mesh(new T.TubeGeometry(arcCurve,160,.017,8,false),new T.MeshBasicMaterial({color:'#ff3d3f',transparent:true,opacity:.95,toneMapped:false,fog:false}));scene.add(heroArc);
  // One scroll-driven signal persists through the local network and map; ambient traffic is separate.
  const signal=new T.Group();scene.add(signal);const signalCore=new T.Mesh(new T.SphereGeometry(.075,32,24),new T.MeshBasicMaterial({color:'#d7ac87',toneMapped:false,fog:false}));signal.add(signalCore);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.18,'#ffffffb0');gradient.addColorStop(.5,'#ffffff30');gradient.addColorStop(1,'#ffffff00');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);
  const signalHalo=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),color:'#c9906b',transparent:true,blending:T.AdditiveBlending,depthWrite:false,depthTest:false,toneMapped:false}));signalHalo.scale.set(.68,.68,1);signal.add(signalHalo);
  const signalLight=new T.PointLight('#c9906b',1.5,2.8,2);signal.add(signalLight);
  const routerTransit=new T.CatmullRomCurve3([firstCableEnd,routerPort,V(-3.65,.95,.8),routerWan,routerWan.clone().add(V(0,0,-.27))]);
  // Follow the router uplink, pass through its gateway, then enter behind the map.
  const gatewayExit=uplinkEnd.clone().add(V(0,0,-.76));
  const mapCable=cable(room,[gatewayExit,V(-6,.18,-3.2),V(-9,.18,-3.2),attackStart.clone().add(V(1.1,-3.7,-2.2)),attackStart.clone().add(V(.7,-.7,-1.2)),attackStart.clone().add(V(0,0,-.5)),attackStart],'#53634d',.042);
  const networkTransit=new T.CurvePath();networkTransit.add(uplinkCable);networkTransit.add(new T.LineCurve3(uplinkCable.getPoint(1),gatewayExit));networkTransit.add(mapCable);
  function endpoint(point){const g=new T.Group();g.position.copy(point);scene.add(g);const ring=new T.Mesh(new T.RingGeometry(.11,.135,48),new T.MeshBasicMaterial({color:'#ff5344',side:T.DoubleSide,transparent:true,opacity:.8,fog:false,toneMapped:false}));g.add(ring);lightDot(g,0,0,.015,'#ff6645',.035);return g;}
  const startRing=endpoint(attackStart),endRing=endpoint(attackEnd);
  const ambientArcs=[];
  const locations=[[-74,41],[-118,34],[-46,-23],[-3,51],[2,48],[12,52],[37,55],[77,28],[103,1],[116,40],[139,35],[151,-33],[18,-34],[31,30],[-99,19],[-123,49],[28,41],[55,25]];
  for(let i=0;i<30;i++){
    const a=locations[i%locations.length],destination=(i*7+5+Math.floor(i/18)*4)%locations.length,b=locations[destination===i%locations.length?(destination+3)%locations.length:destination];
    const severity=i<18?'elevated':i<27?'high':'severe',color=i<18?'#c9b46c':i<27?'#dc8a4f':'#cf5348';
    const start=mapPoint(...a),end=mapPoint(...b),curve=new T.QuadraticBezierCurve3(start,mix(start,end,.5).add(V(0,.55+(i%5)*.18,1.0+(i%4)*.31)),end);
    const line=new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(64)),new T.LineBasicMaterial({color,transparent:true,opacity:.2,toneMapped:false,fog:false}));scene.add(line);
    const point=lightDot(scene,0,0,0,color,i<18?.026:.032);ambientArcs.push({curve,line,point,severity,phase:(i*.173)%1,speed:.00006+(i%5)*.000011});
  }
  stage.dataset.mapSeverityCounts='18,9,3';
  const servers=new T.Group();servers.position.copy(attackEnd.clone().sub(V(.65,2.8,.15)));scene.add(servers);
  function rack(parent,x){
    const g=new T.Group();g.position.x=x;parent.add(g);
    box(g,1.7,3.7,.95,0,1.85,-.43,'#303a3c',.07);box(g,1.48,3.5,.07,0,1.85,.085,'#0a1012',.035);
    box(g,1.72,.10,1.02,0,-.05,-.42,'#20271f',.023);contactShadow(g,2.35,1.85,0,-.094,-.35,.8);
    for(const side of [-1,1]){perforations(g,1,28,.04,.116,side*.78,1.85,.144,.014);for(const y of [.11,3.59])fastener(g,side*.78,y,.148,.023);}
    for(const xx of [-.78,.78])box(g,.075,3.5,.07,xx,1.85,.1,'#77817b',.008);
    for(let row=0;row<7;row++){
      const y=.32+row*.43;box(g,1.43,.34,.11,0,y,.155,'#3b4645',.026);
      box(g,.08,.22,.05,-.62,y,.235,'#9aa59a',.012);box(g,.08,.22,.05,.62,y,.235,'#9aa59a',.012);
      for(const side of [-1,1]){fastener(g,side*.67,y+.12,.222,.014);fastener(g,side*.67,y-.12,.222,.014);box(g,.025,.15,.07,side*.58,y,.274,'#65705f',.01);box(g,.08,.022,.07,side*.62,y+.075,.274,'#65705f',.009);box(g,.08,.022,.07,side*.62,y-.075,.274,'#65705f',.009);}
      for(let col=0;col<12;col++)box(g,.025,.18,.016,-.43+col*.07,y,.222,'#111a1a',.003);
      lightDot(g,.47,y+.06,.245,row%3===0?'#ff784b':'#8dc78c',.015);lightDot(g,.54,y+.06,.245,'#89b28c',.012);
    }
    box(g,1.43,.34,.11,0,3.33,.155,'#495952',.026);
    for(let i=0;i<4;i++)port(g,-.48+i*.32,3.33,.24);
    labelPlane(g,'NETWORK / SWITCH',1.15,.13,0,3.59,.16);return g;
  }
  rack(servers,0);rack(servers,-2);rack(servers,2);
  port(servers,.65,2.8,.20);
  ethernetPlug(servers,V(.65,2.8,.24));ethernetPlug(servers,V(-.48,3.33,.28));
  const serverPatch=cable(servers,[V(.65,2.8,.51),V(.65,2.8,.79),V(.23,2.65,.85),V(-.48,2.95,.85),V(-.48,3.33,.78),V(-.48,3.33,.55)],'#384d3e',.032);
  const alertAnchor=servers.position.clone().add(V(.65,2.8,.61));
  const alertGlow=new T.PointLight('#ff485d',0,5,2);alertGlow.position.copy(alertAnchor.clone().add(V(0,.3,.5)));scene.add(alertGlow);
  const deskRise=.8,terminalBase=servers.position.clone().add(V(6,0,2.4)),terminalGroup=new T.Group();terminalGroup.position.copy(terminalBase);scene.add(terminalGroup);desk(terminalGroup,0,0,6.2,deskRise);
  const defenseArchitecture=industrialRoom(servers.position.clone().add(V(3.2,0,0)),38,-5.6);
  const terminal=makeMonitor(terminalGroup,3.3,1.9,null,V(0,deskRise,0),0,'display');
  // The same quiet security field surrounds the physical console and the project pages.
  const securityWall=new T.Group();scene.add(securityWall);
  if(securityTexture){
    securityTexture.colorSpace=T.SRGBColorSpace;
    const wall=new T.Mesh(new T.PlaneGeometry(25,16.67),new T.MeshBasicMaterial({map:securityTexture,transparent:true,depthWrite:false,fog:false,toneMapped:false,side:T.DoubleSide,opacity:.24}));
    wall.position.copy(terminalBase.clone().add(V(-2,4.4,-4.5)));securityWall.add(wall);
  }
  // The network terminates at a workstation, with a separate video connection to its monitor.
  const tower=new T.Group();tower.position.set(3.65,0,.2);terminalGroup.add(tower);
  box(tower,.64,1.45,1.10,0,.665,0,'#303d38',.055);
  for(const x of [-.22,.22])for(const z of [-.37,.37])box(tower,.13,.05,.15,x,-.075,z,'#141c13',.014);
  for(const x of [-.23,.23])for(const y of [.12,1.21])fastener(tower,x,y,-.572,.017,'back');
  perforations(tower,8,7,.043,.045,0,.58,-.58,.012,true);
  contactShadow(terminalGroup,1.3,1.8,3.65,-.094,.2,.78);
  box(tower,.60,1.35,.025,0,.665,.568,'#1c2824',.035);
  for(let i=0;i<14;i++)box(tower,.42,.025,.014,0,.25+i*.063,.59,'#080f0d',.003);
  lightDot(tower,.19,1.23,.59,'#91c992',.025);
  neon(tower,.015,1.14,.012,-.24,.66,.59,'#a8b4a2');
  labelPlane(tower,'WORKSTATION',.52,.10,0,1.09,.59);
  port(tower,.12,.97,-.57,true);displayPort(tower,-.12,1.20,-.57);
  // Add a keyboard and mouse to make the endpoint read as an operator's station.
  const terminalKeyboard=keys.clone();terminalKeyboard.position.set(0,.74+deskRise,.95);terminalGroup.add(terminalKeyboard);
  const terminalMouse=mouse.clone();terminalMouse.position.set(1.75,.80+deskRise,1);terminalGroup.add(terminalMouse);
  contactShadow(terminalGroup,2.8,1.1,0,.712+deskRise,.95,.56);
  const serverFloor=new T.Mesh(new T.PlaneGeometry(32,23),material('#121b1c',.12,.76));serverFloor.rotation.x=-Math.PI/2;serverFloor.position.copy(servers.position.clone().add(V(4,-.10,1)));serverFloor.receiveShadow=true;scene.add(serverFloor);
  bakeFloor(serverFloor,32,23,[[-4,-1,6.1,1.7],[2,1.4,6.2,3.1],[5.65,1.6,.9,1.4]]);
  const switchSocket=servers.position.clone().add(V(.48,3.33,.28));
  const workstationSocket=terminalBase.clone().add(V(3.77,.97,-.41));
  const secondStart=switchSocket.clone().add(V(0,0,.27)),secondEnd=workstationSocket.clone().add(V(0,0,-.27));
  ethernetPlug(servers,V(.48,3.33,.28));
  // Stay in front of the racks, then outside the desk's right edge. Never rise through its slab.
  const secondCable=cable(room,[secondStart,switchSocket.clone().add(V(0,0,.85)),servers.position.clone().add(V(.48,.22,1.38)),servers.position.clone().add(V(3.2,.18,1.00)),terminalBase.clone().add(V(3.77,.18,-1.40)),terminalBase.clone().add(V(3.77,.40,-1.12)),terminalBase.clone().add(V(3.77,.97,-1.02)),secondEnd],'#53634d',.042);
  const secondPlug=ethernetPlug(room,workstationSocket,true);
  const displayStart=V(3.53,1.20,-.37),displayEnd=V(.94,terminal.cy-.68,-.19);
  displayPlug(terminalGroup,displayStart);displayPlug(terminalGroup,displayEnd);
  cable(terminalGroup,[displayStart.clone().add(V(0,0,-.39)),V(3.53,1.15,-1.9),V(2.9,.84,-1.9),V(1.10,.84,-1.9),V(.94,1.05,-1.72),V(.94,terminal.cy-.68,-1.05),displayEnd.clone().add(V(0,0,-.39))],'#202d28',.032);
  // Batch static metal/plastic parts by material, keeping detailed geometry with few draw calls.
  function batch(group){
    scene.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),buckets=new Map(),remove=[];
    group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.material.isMeshStandardMaterial||(o.material.map&&o.material.map!==finish.color))return;const m=o.material,key=[m.color.getHex(),m.metalness,m.roughness].join('/');let b=buckets.get(key);if(!b){b={material:m,geometries:[]};buckets.set(key,b);}let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));b.geometries.push(g);remove.push(o);});
    for(const b of buckets.values()){const count=b.geometries.reduce((n,g)=>n+g.attributes.position.count,0),positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2);let offset=0,uvOffset=0;for(const g of b.geometries){positions.set(g.attributes.position.array,offset);normals.set(g.attributes.normal.array,offset);if(g.attributes.uv)uvs.set(g.attributes.uv.array,uvOffset);offset+=g.attributes.position.array.length;uvOffset+=g.attributes.position.count*2;g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(normals,3));g.setAttribute('uv',new T.BufferAttribute(uvs,2));const m=new T.Mesh(g,b.material);m.castShadow=true;m.receiveShadow=true;group.add(m);}
    remove.forEach(o=>{o.parent.remove(o);o.geometry.dispose();});
  }
  batch(workstation);batch(servers);batch(terminalGroup);batch(sourceArchitecture);batch(defenseArchitecture);
  const sourceWallMaterials=[];sourceArchitecture.traverse(o=>{if(o.material){o.material.transparent=true;sourceWallMaterials.push(o.material);}});
  const enterWorld=V(1.14,main.cy-.68,.15);
  const enterOverlay=document.createElement('div');enterOverlay.className='physical-enter';enterOverlay.setAttribute('aria-hidden','true');stage.append(enterOverlay);
  const alertOverlay=document.createElement('div');alertOverlay.className='server-alert';alertOverlay.setAttribute('aria-hidden','true');alertOverlay.innerHTML='<span>△ SERVER / ALERT E01</span><strong>Suspicious activity</strong><small>Ready for analyst review</small>';stage.append(alertOverlay);
  const packetTag=document.createElement('div');packetTag.className='packet-tag';packetTag.setAttribute('aria-hidden','true');packetTag.innerHTML='<span>E01 / ILLUSTRATED</span><strong>AI-ASSISTED ABUSE</strong>';stage.append(packetTag);
  const launchpad=stage.querySelector('.terminal-launchpad');
  // Project real HTML into the physical display plane; native links remain sharp and clickable.
  function projectLaunchpad(p){
    const center=terminal.panel.getWorldPosition(new T.Vector3());
    const shown=p>.75&&camera.position.z>center.z+.1;
    launchpad.style.display=shown?'block':'none';launchpad.inert=!shown||p<.87;
    if(!shown)return;
    const screenW=terminal.w-.16,screenH=terminal.h-.19;
    const projection=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(terminal.panel.matrixWorld);
    const point=(x,y)=>{const v=new T.Vector4(x,y,0,1).applyMatrix4(projection);return [(v.x+v.w)*width/2,(v.w-v.y)*height/2,v.w];};
    const a=point(-screenW/2,screenH/2),b=point(screenW/2,screenH/2),c=point(-screenW/2,-screenH/2),normal=a[2];
    const matrix=[(b[0]-a[0])/1200,(b[1]-a[1])/1200,0,(b[2]-a[2])/1200,(c[0]-a[0])/650,(c[1]-a[1])/650,0,(c[2]-a[2])/650,0,0,normal,0,a[0],a[1],0,normal].map(v=>v/normal);
    launchpad.style.transform=`matrix3d(${matrix.join(',')})`;
  }
  let width=1,height=1,progress=clamp(Number.isFinite(initialProgress)?initialProgress:0),frame=0,sentState=false,lastTime=0,paused=false;
  function resize(){width=stage.clientWidth;height=stage.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
  resize();
  const focus=(position,target)=>({position,target});
  function blend(a,b,t){return focus(mix(a.position,b.position,t),mix(a.target,b.target,t));}
  // Construct the orbit once, rather than allocating its arc-length cache on
  // every frame of the tight Enter-to-workstation turn.
  let enterOrbit=null,orbitAspect=0;
  function cameraPose(p){
    const aspect=width/height,dist=aspect<.85?Math.min(22,12/Math.sqrt(aspect)):Math.max(10.3,14/aspect);
    const initial=focus(V(.4,3.65,dist),V(.4,1.95,0));
    const close=focus(enterWorld.clone().add(V(.02,.02,aspect<.85?1.65:1.1)),enterWorld);
    if(p<.17)return blend(initial,close,ease(.015,.135,p));
    const back=focus(V(7.1,2.7,-3.0),backPort);
    if(p<.25){const q=ease(.17,.25,p);if(!enterOrbit||orbitAspect!==aspect){enterOrbit=new T.CatmullRomCurve3([close.position,V(5.1,3.3,2.7),V(7.5,2.9,-1.8),back.position]);orbitAspect=aspect;}return focus(enterOrbit.getPoint(q),mix(enterWorld,backPort,q));}
    const routerPose=focus(V(-2.1,2.5,3.5),V(-3.65,.98,.80));
    if(p<.35){const q=ease(.25,.35,p),point=firstCable.getPointAt(q),offset=mix(back.position.clone().sub(firstCableStart),routerPose.position.clone().sub(firstCableEnd),q),target=mix(backPort,point,ease(0,.2,q));return focus(point.clone().add(offset),mix(target,routerPose.target,ease(.75,1,q)));}
    const mapDistance=aspect<.85?20.5/aspect:12.8;
    const mapPose=focus(mapCenter.clone().add(V(0,1.3,mapDistance)),mapCenter);
    if(p<.375)return routerPose;
    if(p<.44){const q=ease(.375,.44,p),point=networkTransit.getPoint(q),position=point.clone().add(mix(routerPose.position.clone().sub(networkTransit.getPoint(0)),mapPose.position.clone().sub(attackStart),q));return focus(position,mix(routerPose.target,mix(point,mapPose.target,ease(.7,1,q)),ease(0,.25,q)));}
    if(p<.56)return mapPose;
    const startPose=focus(attackStart.clone().add(V(.2,.55,2.5)),attackStart);
    if(p<.59)return blend(mapPose,startPose,ease(.56,.59,p));
    if(p<.69){const q=ease(.59,.69,p),point=arcCurve.getPoint(q),ahead=arcCurve.getPoint(Math.min(1,q+.045*ease(0,.12,q)));return focus(point.clone().add(V(.2,.55,2.5)),ahead);}
    const serverPose=focus(servers.position.clone().add(V(2.6,3.25,5.8)),alertAnchor);
    const arcEndPose=focus(attackEnd.clone().add(V(.2,.55,2.5)),attackEnd);
    if(p<.75)return blend(arcEndPose,serverPose,ease(.69,.75,p));
    // The event becomes an alert. Pull back to the analyst's environment without
    // carrying a packet through the server network or implying a second attack.
    const roomCenter=servers.position.clone().add(V(3.2,2.0,1.25));
    const roomDistance=Math.max(12.8,13.8/aspect);
    const roomPose=focus(roomCenter.clone().add(V(1.4,2.0,roomDistance)),roomCenter);
    if(p<.85)return blend(serverPose,roomPose,ease(.75,.85,p));
    const terminalCenter=terminalBase.clone().add(V(0,terminal.cy,.15));
    const finalDistance=Math.max(3.7,4.5/aspect);
    const finalPose=focus(terminalCenter.clone().add(V(0,.1,finalDistance)),terminalCenter);
    if(p<.96)return blend(roomPose,finalPose,ease(.85,.96,p));
    return finalPose;
  }
  function render(time=0){
    frame=0;lastTime=time;
    if(paused)return;
    const p=progress,pose=cameraPose(p);camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
    sourceArchitecture.visible=p<.46;defenseArchitecture.visible=p>=.69;const roomOpacity=1-ease(.375,.46,p);sourceWallMaterials.forEach(m=>m.opacity=roomOpacity);
    const mapAtmosphere=ease(.365,.455,p)*(1-ease(.655,.745,p));
    floor.material.color.copy(floorBaseColor).multiplyScalar(1-.72*mapAtmosphere);
    nightSky.position.copy(camera.position);nightSky.material.opacity=1;nightSky.visible=true;const dusk=(1-.18*ease(.69,.80,p))*(1-.72*mapAtmosphere);nightSky.material.color.setRGB(dusk,dusk,dusk*.98);
    const lightingCenter=mix(V(0,0,0),servers.position,ease(.655,.745,p));key.target.position.copy(lightingCenter);key.position.copy(lightingCenter).add(V(2,9,6));
    workstation.visible=p<.43;firstCable.mesh.visible=plug.visible=routerPlug.visible=p<.43;secondCable.mesh.visible=p>=.69;secondPlug.visible=p>=.69;
    mapCable.mesh.visible=p<.455;
    floor.visible=true;grid.visible=p<.43||p>=.69;
    const mapGain=ease(.375,.45,p)*(1-ease(.665,.69,p));mapPlane.material.opacity=.86*mapGain;dots.material.opacity=.78*mapGain;mapGrid.material.opacity=.25*mapGain;
    mapGroup.visible=p>.375&&p<.69;heroArc.visible=p>.43&&p<.69;heroArc.material.opacity=.95*mapGain;startRing.visible=p>.43&&p<.69;endRing.visible=startRing.visible;
    servers.visible=serverFloor.visible=terminalGroup.visible=securityWall.visible=p>=.69;
    const mapLive=p>.43&&p<.69;
    signal.visible=p>=.205&&p<.69;
    let signalColor='#d2aa81',signalPosition=backPort;
    if(p<.25)signalPosition=mix(backPort,firstCableStart,ease(.205,.25,p));
    else if(p<.35)signalPosition=firstCable.getPointAt(ease(.25,.35,p));
    else if(p<.375)signalPosition=routerTransit.getPoint(ease(.35,.375,p));
    else if(p<.44)signalPosition=networkTransit.getPoint(ease(.375,.44,p));
    else if(p<.59)signalPosition=attackStart;
    else signalPosition=arcCurve.getPoint(ease(.59,.69,p));
    if(p>=.375)signalColor='#ff392d';
    signal.position.copy(signalPosition);signalCore.material.color.set(signalColor);signalHalo.material.color.set(signalColor);signalLight.color.set(signalColor);
    const tagged=p>=.205&&p<.69,tagPoint=signalPosition.clone().project(camera);
    packetTag.style.display=tagged&&tagPoint.z>-1&&tagPoint.z<1?'grid':'none';
    if(tagged){
      packetTag.dataset.phase=p>=.43?'map':'local';
      const px=(tagPoint.x*.5+.5)*width,py=(-tagPoint.y*.5+.5)*height,tagWidth=packetTag.offsetWidth,tagHeight=packetTag.offsetHeight;
      const right=px+tagWidth+28<width-16;
      packetTag.dataset.side=right?'right':'left';
      packetTag.style.left=`${Math.max(16,Math.min(width-tagWidth-16,right?px+20:px-tagWidth-20))}px`;
      packetTag.style.top=`${Math.max(width<600?125:135,Math.min(height-tagHeight-130,py-tagHeight-18))}px`;
    }
    signal.scale.setScalar(1);signalHalo.material.opacity=.9;
    alertGlow.intensity=p>=.69&&p<.90?3.5:0;
    const showAlert=p>=.69&&p<.85;alertOverlay.style.display=showAlert?'grid':'none';
    if(showAlert){const a=alertAnchor.clone().add(V(0,.65,.1)).project(camera),safeTop=(width<600?90:110)+alertOverlay.offsetHeight;alertOverlay.style.left=`${Math.max(120,Math.min(width-120,(a.x*.5+.5)*width))}px`;alertOverlay.style.top=`${Math.max(safeTop,Math.min(height-180,(-a.y*.5+.5)*height))}px`;}
    const phase=(time*.001)%3;endRing.scale.setScalar(1+.22*Math.sin(phase*2));startRing.scale.setScalar(1+.15*Math.sin(phase*2+1));
    ambientArcs.forEach(({curve,line,point,phase,speed})=>{line.visible=point.visible=mapLive;const q=(time*speed+phase)%1;line.material.opacity=(.05+Math.max(0,Math.sin(q*Math.PI))*.23)*mapGain;point.position.copy(curve.getPoint(q));});
    if(p>=.145)sentState=true;else if(p<.135)sentState=false;
    const nowSent=sentState;
    enterOverlay.style.setProperty('--enter-fill',String(clamp((p-.015)/(.145-.015))));
    if(p<.175){
      const center=enterWorld.clone().project(camera),a=enterWorld.clone().add(V(-.33,-.12,0)).project(camera),b=enterWorld.clone().add(V(.33,.12,0)).project(camera);
      const ew=Math.abs(b.x-a.x)*width/2,eh=Math.abs(b.y-a.y)*height/2;
      enterOverlay.style.display='flex';enterOverlay.style.left=`${(center.x*.5+.5)*width}px`;enterOverlay.style.top=`${(-center.y*.5+.5)*height}px`;enterOverlay.style.width=`${ew}px`;enterOverlay.style.height=`${eh}px`;enterOverlay.style.fontSize=`${Math.max(8,eh*.25)}px`;if(enterOverlay.dataset.state!==(nowSent?'sent':'ready')){sentState=nowSent;enterOverlay.dataset.state=nowSent?'sent':'ready';enterOverlay.textContent=nowSent?'SENT ↗':'ENTER ↵';enterOverlay.classList.toggle('sent',nowSent);}
    }else enterOverlay.style.display='none';
    renderer.render(scene,camera);projectLaunchpad(p);
    if(mapLive&&!document.hidden)frame=requestAnimationFrame(render);
  }
  const observer=new ResizeObserver(()=>{if(frame)cancelAnimationFrame(frame);resize();render(lastTime);});observer.observe(stage);
  function visibility(){if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else if(!document.hidden)render(lastTime);}
  document.addEventListener('visibilitychange',visibility);
  document.body.classList.add('webgl-ready');
  render();
  return {setProgress(p,{immediate=false}={}){if(progress===p&&!immediate)return;progress=clamp(p);if(paused||document.hidden)return;if(immediate){if(frame)cancelAnimationFrame(frame);render(performance.now());}else if(!frame)frame=requestAnimationFrame(render);},captureFrame(){if(paused)return null;try{if(frame)cancelAnimationFrame(frame);render(performance.now());return renderer.domElement.toDataURL('image/webp',.8);}catch{return null;}},pause(value){const changed=paused!==value;paused=value;if(value){launchpad.inert=true;if(frame){cancelAnimationFrame(frame);frame=0;}}else if(changed)render(performance.now());},resize(){if(frame)cancelAnimationFrame(frame);resize();render(lastTime);},dispose(){observer.disconnect();document.removeEventListener('visibilitychange',visibility);if(frame)cancelAnimationFrame(frame);scene.traverse(o=>{o.geometry?.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{m.map?.dispose();m.dispose();});}});finish.color.dispose();finish.rough.dispose();bakedTextures.forEach(texture=>texture.dispose());renderer.dispose();renderer.domElement.remove();enterOverlay.remove();alertOverlay.remove();packetTag.remove();launchpad.style.display='none';launchpad.inert=true;}};
}
