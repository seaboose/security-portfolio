import * as T from './assets/vendor/three.module.js?v=1de39eabb239';

// An authored overcast panorama: soft cloud volumes, a natural horizon, no remote asset.
export function createAtmosphere(){
  const canvas=document.createElement('canvas');canvas.width=4096;canvas.height=2048;
  const ctx=canvas.getContext('2d'),layer=document.createElement('canvas');layer.width=1024;layer.height=512;
  const cloud=layer.getContext('2d'),pixels=cloud.createImageData(layer.width,layer.height);
  const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
  const hash=(x,y)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
  function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);return mix(mix(hash(ix,iy),hash(ix+1,iy),fx),mix(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy);}
  function fbm(x,y){let value=0,weight=.52;for(let i=0;i<5;i++){value+=noise(x,y)*weight;x=x*2.03+17.3;y=y*2.01+9.2;weight*=.48;}return value;}
  const stops=[[0,[37,54,62]],[.28,[73,92,101]],[.47,[133,147,150]],[.57,[172,177,166]],[.68,[85,95,90]],[1,[27,33,29]]];
  for(let y=0;y<layer.height;y++){
    const v=y/(layer.height-1);let stop=0;while(stop<stops.length-2&&v>stops[stop+1][0])stop++;
    const a=stops[stop],b=stops[stop+1],blend=(v-a[0])/(b[0]-a[0]),base=a[1].map((c,i)=>mix(c,b[1][i],blend));
    for(let x=0;x<layer.width;x++){
      const u=x/layer.width,n=fbm(u*9.5,v*7.5+4.1),detail=noise(u*38,v*30),coverage=Math.max(0,Math.min(1,(n-.36)*3.3))*(1-smooth(Math.max(0,Math.min(1,(v-.53)/.14))));
      const shade=Math.max(0,Math.min(1,(n-.34)*2.1+detail*.08)),warm=Math.max(0,1-Math.abs(u-.29)*3.4)*Math.max(0,1-Math.abs(v-.52)*5.5);
      const tint=[mix(101,190,shade)+warm*8,mix(113,194,shade)+warm*5,mix(115,190,shade)];
      const i=(y*layer.width+x)*4;for(let c=0;c<3;c++)pixels.data[i+c]=mix(base[c],tint[c],coverage);pixels.data[i+3]=255;
    }
  }
  cloud.putImageData(pixels,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(layer,0,0,4096,2048);
  const haze=ctx.createLinearGradient(0,760,0,1400);haze.addColorStop(0,'#e9e8df00');haze.addColorStop(.53,'#e9e8df15');haze.addColorStop(1,'#e9e8df00');ctx.fillStyle=haze;ctx.fillRect(0,760,4096,640);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const sky=new T.Mesh(new T.SphereGeometry(115,48,32),new T.MeshBasicMaterial({map:texture,side:T.BackSide,depthWrite:false,depthTest:true,fog:false,toneMapped:false,transparent:true}));
  sky.renderOrder=-1000;sky.rotation.y=.6;return sky;
}