(function(){
  'use strict';
  const root=document.documentElement;
  const langButtons=[...document.querySelectorAll('[data-lang]')];
  const translatable=[...document.querySelectorAll('[data-en][data-zh]')];
  const title={en:'Eli Zeng — XR, HCI & Digital Cultural Heritage',zh:'曾韩擂 — XR、人机交互与数字文化遗产'};
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const glassRoot = document.getElementById('glass-filters-root');
  let glassUid = 0;

  function supportsSVGFilters(){
    if(typeof window==='undefined' || typeof document==='undefined') return false;
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    if(isWebkit || isFirefox) return false;
    const div = document.createElement('div');
    div.style.backdropFilter = 'url(#nonexistent-glass-filter)';
    return div.style.backdropFilter !== '';
  }
  const SVG_FILTER_OK = supportsSVGFilters();

  function createGlassSurface(el, options){
    const opts = Object.assign({
      borderRadius: 24,borderWidth: 0.07,brightness: 26,opacity: 0.6,
      blur: 12,displace: 0,distortionScale: -140,
      redOffset: 0,greenOffset: 8,blueOffset: 16,
      xChannel: 'R',yChannel: 'G',mixBlendMode: 'difference'
    }, options||{});

    if(!SVG_FILTER_OK){
      el.classList.add('glass-surface--fallback');
      return {update(){}, destroy(){}};
    }
    el.classList.add('glass-surface--svg');

    const uid = 'g' + (++glassUid);
    const filterId = 'glass-filter-' + uid;
    const redGradId = 'red-grad-' + uid;
    const blueGradId = 'blue-grad-' + uid;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.setAttribute('aria-hidden', 'true');

    const defs = document.createElementNS(SVG_NS, 'defs');
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('colorInterpolationFilters', 'sRGB');
    filter.setAttribute('x', '0%');
    filter.setAttribute('y', '0%');
    filter.setAttribute('width', '100%');
    filter.setAttribute('height', '100%');

    const feImage = document.createElementNS(SVG_NS, 'feImage');
    feImage.setAttribute('x', '0');
    feImage.setAttribute('y', '0');
    feImage.setAttribute('width', '100%');
    feImage.setAttribute('height', '100%');
    feImage.setAttribute('preserveAspectRatio', 'none');
    feImage.setAttribute('result', 'map');
    filter.appendChild(feImage);

    const mkDisp = (offset, id, result) => {
      const d = document.createElementNS(SVG_NS, 'feDisplacementMap');
      d.setAttribute('in', 'SourceGraphic');
      d.setAttribute('in2', 'map');
      d.setAttribute('id', id);
      d.setAttribute('result', result);
      d.setAttribute('scale', String(opts.distortionScale + offset));
      d.setAttribute('xChannelSelector', opts.xChannel);
      d.setAttribute('yChannelSelector', opts.yChannel);
      return d;
    };
    const mkColor = (inId, result, mat) => {
      const c = document.createElementNS(SVG_NS, 'feColorMatrix');
      c.setAttribute('in', inId);
      c.setAttribute('type', 'matrix');
      c.setAttribute('values', mat);
      c.setAttribute('result', result);
      return c;
    };

    filter.appendChild(mkDisp(opts.redOffset, 'redchannel', 'dispRed'));
    filter.appendChild(mkColor('dispRed', 'red',
      '1 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 1 0'));
    filter.appendChild(mkDisp(opts.greenOffset, 'greenchannel', 'dispGreen'));
    filter.appendChild(mkColor('dispGreen', 'green',
      '0 0 0 0 0\n0 1 0 0 0\n0 0 0 0 0\n0 0 0 1 0'));
    filter.appendChild(mkDisp(opts.blueOffset, 'bluechannel', 'dispBlue'));
    filter.appendChild(mkColor('dispBlue', 'blue',
      '0 0 0 0 0\n0 0 0 0 0\n0 0 1 0 0\n0 0 0 1 0'));

    const b1 = document.createElementNS(SVG_NS, 'feBlend');
    b1.setAttribute('in', 'red');
    b1.setAttribute('in2', 'green');
    b1.setAttribute('mode', 'screen');
    b1.setAttribute('result', 'rg');
    filter.appendChild(b1);

    const b2 = document.createElementNS(SVG_NS, 'feBlend');
    b2.setAttribute('in', 'rg');
    b2.setAttribute('in2', 'blue');
    b2.setAttribute('mode', 'screen');
    b2.setAttribute('result', 'output');
    filter.appendChild(b2);

    const fg = document.createElementNS(SVG_NS, 'feGaussianBlur');
    fg.setAttribute('in', 'output');
    fg.setAttribute('stdDeviation', String(opts.displace));
    filter.appendChild(fg);

    defs.appendChild(filter);
    svg.appendChild(defs);
    glassRoot.appendChild(svg);

    function buildMap(){
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, rect.width || 400);
      const h = Math.max(1, rect.height || 200);
      const edgeSize = Math.min(w, h) * opts.borderWidth * 0.5;
      const svgContent = `
        <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${w}" height="${h}" fill="black"></rect>
          <rect x="0" y="0" width="${w}" height="${h}" rx="${opts.borderRadius}" fill="url(#${redGradId})"/>
          <rect x="0" y="0" width="${w}" height="${h}" rx="${opts.borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:${opts.mixBlendMode}"/>
          <rect x="${edgeSize}" y="${edgeSize}" width="${w-edgeSize*2}" height="${h-edgeSize*2}" rx="${opts.borderRadius}" fill="hsl(0 0% ${opts.brightness}% / ${opts.opacity})" style="filter:blur(${opts.blur}px)"/>
        </svg>`;
      return 'data:image/svg+xml,' + encodeURIComponent(svgContent);
    }

    function updateMap(){ feImage.setAttribute('href', buildMap()); }
    updateMap();
    el.style.setProperty('--glass-filter', `url(#${filterId})`);

    let raf = 0;
    const ro = new ResizeObserver(() => {
      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTimeout(updateMap, 0));
    });
    ro.observe(el);

    return {
      update: updateMap,
      destroy(){ ro.disconnect(); if(svg.parentNode) svg.parentNode.removeChild(svg); }
    };
  }

  const cards = [...document.querySelectorAll('.outline-card')];
  cards.forEach(card => {
    if(card.closest('#research')) return;
    const layers = ['fg-inner-glow','fg-ca','fg-sheen','fg-grain'];
    layers.forEach(cls => {
      const div = document.createElement('div');
      div.className = cls;
      div.setAttribute('aria-hidden', 'true');
      card.appendChild(div);
    });
    const isProject = !!card.closest('#projects');
    card._glass = createGlassSurface(card, isProject ? {
      borderRadius: 24,
      brightness: 30,
      opacity: 0.72,
      blur: 14,
      distortionScale: -320,
      redOffset: -18,
      greenOffset: 12,
      blueOffset: 32
    } : {
      borderRadius: 24,
      brightness: 26,
      opacity: 0.6,
      blur: 12,
      distortionScale: -140,
      greenOffset: 8,
      blueOffset: 16
    });
  });
  /* 桌面端导航已改为纯白扁平样式，不再加液态玻璃；仅移动端按钮保留玻璃 */
  const topGlass = [
    {sel:'.mobile-tools .burger', white:false},
    {sel:'.mobile-tools .mobile-lang', white:false}
  ];
  const topGlassEls = [];
  topGlass.forEach(({sel, white}) => {
    const el = document.querySelector(sel);
    if(el && !el._glass){
      el._glass = createGlassSurface(el, {
        borderRadius: 999,
        brightness: white ? 60 : 26,
        opacity: white ? 0.5 : 0.6,
        blur: 8,
        distortionScale: -340,
        redOffset: -18,
        greenOffset: 12,
        blueOffset: 32
      });
      topGlassEls.push(el);
    }
  });
  requestAnimationFrame(() => {
    [...cards, ...topGlassEls].forEach(c => c._glass && c._glass.update && c._glass.update());
  });

  /* LiquidEther */
  function createLiquidEther(mountEl, userOpts){
    if(!window.THREE){ console.warn('Three.js not loaded'); return null; }
    const THREE = window.THREE;
    const opts = Object.assign({
      mouseForce:20,cursorSize:100,isViscous:false,viscous:30,
      iterationsViscous:32,iterationsPoisson:32,dt:0.014,BFECC:true,
      resolution:0.5,isBounce:false,
      colors:['#1f1f1f','#4a4a4a','#a0a0a0','#ffffff'],
      autoDemo:true,autoSpeed:0.5,autoIntensity:2.2,
      takeoverDuration:0.25,autoResumeDelay:1000,autoRampDuration:0.6,
      backgroundColor:'#000000',lightMode:false
    }, userOpts||{});

    function makePaletteTexture(stops){
      let arr = (Array.isArray(stops)&&stops.length>0) ? (stops.length===1?[stops[0],stops[0]]:stops) : ['#ffffff','#ffffff'];
      const w=arr.length;
      const data=new Uint8Array(w*4);
      for(let i=0;i<w;i++){
        const c=new THREE.Color(arr[i]);
        data[i*4+0]=Math.round(c.r*255);
        data[i*4+1]=Math.round(c.g*255);
        data[i*4+2]=Math.round(c.b*255);
        data[i*4+3]=255;
      }
      const tex=new THREE.DataTexture(data,w,1,THREE.RGBAFormat);
      tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;
      tex.wrapS=THREE.ClampToEdgeWrapping;tex.wrapT=THREE.ClampToEdgeWrapping;
      tex.generateMipmaps=false;tex.needsUpdate=true;
      return tex;
    }

    const paletteTex = makePaletteTexture(opts.colors);
    const bg = new THREE.Color(opts.backgroundColor);
    const bgVec4 = opts.lightMode
      ? new THREE.Vector4(bg.r,bg.g,bg.b,1)
      : new THREE.Vector4(0,0,0,0);

    class CommonClass {
      constructor(){this.width=0;this.height=0;this.aspect=1;this.pixelRatio=1;this.time=0;this.delta=0;this.container=null;this.renderer=null;this.clock=null;}
      init(c){
        this.container=c;
        this.pixelRatio=Math.min(window.devicePixelRatio||1,2);
        this.resize();
        this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
        this.renderer.autoClear=false;
        this.renderer.setClearColor(new THREE.Color(0x000000),0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width,this.height);
        this.renderer.domElement.style.width='100%';
        this.renderer.domElement.style.height='100%';
        this.renderer.domElement.style.display='block';
        this.clock=new THREE.Clock();this.clock.start();
      }
      resize(){
        if(!this.container) return;
        const r=this.container.getBoundingClientRect();
        this.width=Math.max(1,Math.floor(r.width));
        this.height=Math.max(1,Math.floor(r.height));
        this.aspect=this.width/this.height;
        if(this.renderer) this.renderer.setSize(this.width,this.height,false);
      }
      update(){this.delta=this.clock.getDelta();this.time+=this.delta;}
    }
    const Common=new CommonClass();

    class MouseClass {
      constructor(){
        this.coords=new THREE.Vector2();this.coords_old=new THREE.Vector2();this.diff=new THREE.Vector2();
        this.timer=null;this.container=null;this.docTarget=null;this.listenerTarget=null;
        this.isHoverInside=false;this.hasUserControl=false;this.isAutoActive=false;
        this.autoIntensity=2.0;this.takeoverActive=false;this.takeoverStartTime=0;this.takeoverDuration=0.25;
        this.takeoverFrom=new THREE.Vector2();this.takeoverTo=new THREE.Vector2();
        this.onInteract=null;
        this._onMouseMove=this.onDocumentMouseMove.bind(this);
        this._onTouchStart=this.onDocumentTouchStart.bind(this);
        this._onTouchMove=this.onDocumentTouchMove.bind(this);
        this._onTouchEnd=this.onTouchEnd.bind(this);
        this._onDocumentLeave=this.onDocumentLeave.bind(this);
      }
      init(c){
        this.container=c;
        this.docTarget=c.ownerDocument||null;
        const dv=(this.docTarget&&this.docTarget.defaultView)||(typeof window!=='undefined'?window:null);
        if(!dv) return;
        this.listenerTarget=dv;
        this.listenerTarget.addEventListener('mousemove',this._onMouseMove);
        this.listenerTarget.addEventListener('touchstart',this._onTouchStart,{passive:true});
        this.listenerTarget.addEventListener('touchmove',this._onTouchMove,{passive:true});
        this.listenerTarget.addEventListener('touchend',this._onTouchEnd);
        if(this.docTarget) this.docTarget.addEventListener('mouseleave',this._onDocumentLeave);
      }
      dispose(){
        if(this.listenerTarget){
          this.listenerTarget.removeEventListener('mousemove',this._onMouseMove);
          this.listenerTarget.removeEventListener('touchstart',this._onTouchStart);
          this.listenerTarget.removeEventListener('touchmove',this._onTouchMove);
          this.listenerTarget.removeEventListener('touchend',this._onTouchEnd);
        }
        if(this.docTarget) this.docTarget.removeEventListener('mouseleave',this._onDocumentLeave);
        this.listenerTarget=null;this.docTarget=null;this.container=null;
      }
      isPointInside(cx,cy){
        if(!this.container) return false;
        const r=this.container.getBoundingClientRect();
        if(r.width===0||r.height===0) return false;
        return cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom;
      }
      updateHoverState(cx,cy){this.isHoverInside=this.isPointInside(cx,cy);return this.isHoverInside;}
      setCoords(x,y){
        if(!this.container) return;
        if(this.timer) window.clearTimeout(this.timer);
        const r=this.container.getBoundingClientRect();
        if(r.width===0||r.height===0) return;
        const nx=(x-r.left)/r.width;const ny=(y-r.top)/r.height;
        this.coords.set(nx*2-1,-(ny*2-1));
        this.timer=window.setTimeout(()=>{},100);
      }
      setNormalized(nx,ny){this.coords.set(nx,ny);}
      onDocumentMouseMove(e){
        if(!this.updateHoverState(e.clientX,e.clientY)) return;
        if(this.onInteract) this.onInteract();
        if(this.isAutoActive&&!this.hasUserControl&&!this.takeoverActive){
          if(!this.container) return;
          const r=this.container.getBoundingClientRect();
          if(r.width===0||r.height===0) return;
          const nx=(e.clientX-r.left)/r.width;
          const ny=(e.clientY-r.top)/r.height;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(nx*2-1,-(ny*2-1));
          this.takeoverStartTime=performance.now();
          this.takeoverActive=true;this.hasUserControl=true;this.isAutoActive=false;
          return;
        }
        this.setCoords(e.clientX,e.clientY);
        this.hasUserControl=true;
      }
      onDocumentTouchStart(e){
        if(e.touches.length!==1) return;
        const t=e.touches[0];
        if(!this.updateHoverState(t.clientX,t.clientY)) return;
        if(this.onInteract) this.onInteract();
        this.setCoords(t.clientX,t.clientY);this.hasUserControl=true;
      }
      onDocumentTouchMove(e){
        if(e.touches.length!==1) return;
        const t=e.touches[0];
        if(!this.updateHoverState(t.clientX,t.clientY)) return;
        if(this.onInteract) this.onInteract();
        this.setCoords(t.clientX,t.clientY);
      }
      onTouchEnd(){this.isHoverInside=false;}
      onDocumentLeave(){this.isHoverInside=false;}
      update(){
        if(this.takeoverActive){
          const t=(performance.now()-this.takeoverStartTime)/(this.takeoverDuration*1000);
          if(t>=1){
            this.takeoverActive=false;
            this.coords.copy(this.takeoverTo);
            this.coords_old.copy(this.coords);
            this.diff.set(0,0);
          } else {
            const k=t*t*(3-2*t);
            this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo,k);
          }
        }
        this.diff.subVectors(this.coords,this.coords_old);
        this.coords_old.copy(this.coords);
        if(this.coords_old.x===0&&this.coords_old.y===0) this.diff.set(0,0);
        if(this.isAutoActive&&!this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
      }
    }
    const Mouse=new MouseClass();

    class AutoDriver {
      constructor(mouse,manager,o){
        this.mouse=mouse;this.manager=manager;this.enabled=o.enabled;this.speed=o.speed;
        this.resumeDelay=o.resumeDelay||3000;this.rampDurationMs=(o.rampDuration||0)*1000;
        this.active=false;this.current=new THREE.Vector2(0,0);this.target=new THREE.Vector2();
        this.lastTime=performance.now();this.activationTime=0;this.margin=0.2;
        this._tmpDir=new THREE.Vector2();this.pickNewTarget();
      }
      pickNewTarget(){
        const r=Math.random;
        this.target.set((r()*2-1)*(1-this.margin),(r()*2-1)*(1-this.margin));
      }
      forceStop(){this.active=false;this.mouse.isAutoActive=false;}
      update(){
        if(!this.enabled) return;
        const now=performance.now();
        const idle=now-this.manager.lastUserInteraction;
        if(idle<this.resumeDelay){if(this.active)this.forceStop();return;}
        if(this.mouse.isHoverInside){if(this.active)this.forceStop();return;}
        if(!this.active){
          this.active=true;this.current.copy(this.mouse.coords);
          this.lastTime=now;this.activationTime=now;
        }
        if(!this.active) return;
        this.mouse.isAutoActive=true;
        let dtSec=(now-this.lastTime)/1000;this.lastTime=now;
        if(dtSec>0.2) dtSec=0.016;
        const dir=this._tmpDir.subVectors(this.target,this.current);
        const dist=dir.length();
        if(dist<0.01){this.pickNewTarget();return;}
        dir.normalize();
        let ramp=1;
        if(this.rampDurationMs>0){
          const t=Math.min(1,(now-this.activationTime)/this.rampDurationMs);
          ramp=t*t*(3-2*t);
        }
        const step=this.speed*dtSec*ramp;
        const move=Math.min(step,dist);
        this.current.addScaledVector(dir,move);
        this.mouse.setNormalized(this.current.x,this.current.y);
      }
    }

    const face_vert=`attribute vec3 position;uniform vec2 px;uniform vec2 boundarySpace;varying vec2 uv;precision highp float;void main(){vec3 pos=position;vec2 scale=1.0-boundarySpace*2.0;pos.xy=pos.xy*scale;uv=vec2(0.5)+(pos.xy)*0.5;gl_Position=vec4(pos,1.0);}`;
    const line_vert=`attribute vec3 position;uniform vec2 px;precision highp float;varying vec2 uv;void main(){vec3 pos=position;uv=0.5+pos.xy*0.5;vec2 n=sign(pos.xy);pos.xy=abs(pos.xy)-px*1.0;pos.xy*=n;gl_Position=vec4(pos,1.0);}`;
    const mouse_vert=`precision highp float;attribute vec3 position;attribute vec2 uv;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 pos=position.xy*scale*2.0*px+center;vUv=uv;gl_Position=vec4(pos,0.0,1.0);}`;
    const advection_frag=`precision highp float;uniform sampler2D velocity;uniform float dt;uniform bool isBFECC;uniform vec2 fboSize;uniform vec2 px;varying vec2 uv;void main(){vec2 ratio=max(fboSize.x,fboSize.y)/fboSize;if(isBFECC==false){vec2 vel=texture2D(velocity,uv).xy;vec2 uv2=uv-vel*dt*ratio;vec2 newVel=texture2D(velocity,uv2).xy;gl_FragColor=vec4(newVel,0.0,0.0);}else{vec2 spot_new=uv;vec2 vel_old=texture2D(velocity,uv).xy;vec2 spot_old=spot_new-vel_old*dt*ratio;vec2 vel_new1=texture2D(velocity,spot_old).xy;vec2 spot_new2=spot_old+vel_new1*dt*ratio;vec2 error=spot_new2-spot_new;vec2 spot_new3=spot_new-error/2.0;vec2 vel_2=texture2D(velocity,spot_new3).xy;vec2 spot_old2=spot_new3-vel_2*dt*ratio;vec2 newVel2=texture2D(velocity,spot_old2).xy;gl_FragColor=vec4(newVel2,0.0,0.0);}}`;
    const color_frag=`precision highp float;uniform sampler2D velocity;uniform sampler2D palette;uniform vec4 bgColor;uniform bool lightMode;varying vec2 uv;void main(){vec2 vel=texture2D(velocity,uv).xy;float lenv=clamp(length(vel),0.0,1.0);vec3 c=texture2D(palette,vec2(lenv,0.5)).rgb;float peak=max(c.r,max(c.g,c.b));vec3 chroma=clamp(c/max(peak,0.0001),0.0,1.0);chroma=pow(chroma,vec3(1.25));vec3 ink=lightMode?chroma:c;vec3 outRGB=mix(bgColor.rgb,ink,lenv);float outA=mix(bgColor.a,1.0,lenv);gl_FragColor=vec4(outRGB,outA);}`;
    const divergence_frag=`precision highp float;uniform sampler2D velocity;uniform float dt;uniform vec2 px;varying vec2 uv;void main(){float x0=texture2D(velocity,uv-vec2(px.x,0.0)).x;float x1=texture2D(velocity,uv+vec2(px.x,0.0)).x;float y0=texture2D(velocity,uv-vec2(0.0,px.y)).y;float y1=texture2D(velocity,uv+vec2(0.0,px.y)).y;float divergence=(x1-x0+y1-y0)/2.0;gl_FragColor=vec4(divergence/dt);}`;
    const externalForce_frag=`precision highp float;uniform vec2 force;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 circle=(vUv-0.5)*2.0;float d=1.0-min(length(circle),1.0);d*=d;gl_FragColor=vec4(force*d,0.0,1.0);}`;
    const poisson_frag=`precision highp float;uniform sampler2D pressure;uniform sampler2D divergence;uniform vec2 px;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x*2.0,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x*2.0,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y*2.0)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y*2.0)).r;float div=texture2D(divergence,uv).r;float newP=(p0+p1+p2+p3)/4.0-div;gl_FragColor=vec4(newP);}`;
    const pressure_frag=`precision highp float;uniform sampler2D pressure;uniform sampler2D velocity;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){float step=1.0;float p0=texture2D(pressure,uv+vec2(px.x*step,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x*step,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y*step)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y*step)).r;vec2 v=texture2D(velocity,uv).xy;vec2 gradP=vec2(p0-p1,p2-p3)*0.5;v=v-gradP*dt;gl_FragColor=vec4(v,0.0,1.0);}`;
    const viscous_frag=`precision highp float;uniform sampler2D velocity;uniform sampler2D velocity_new;uniform float v;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){vec2 old=texture2D(velocity,uv).xy;vec2 new0=texture2D(velocity_new,uv+vec2(px.x*2.0,0.0)).xy;vec2 new1=texture2D(velocity_new,uv-vec2(px.x*2.0,0.0)).xy;vec2 new2=texture2D(velocity_new,uv+vec2(0.0,px.y*2.0)).xy;vec2 new3=texture2D(velocity_new,uv-vec2(0.0,px.y*2.0)).xy;vec2 newv=4.0*old+v*dt*(new0+new1+new2+new3);newv/=4.0*(1.0+v*dt);gl_FragColor=vec4(newv,0.0,0.0);}`;

    class ShaderPass {
      constructor(props){
        this.props=props||{};this.uniforms=this.props.material?.uniforms;
        this.scene=null;this.camera=null;this.material=null;this.geometry=null;this.plane=null;
      }
      init(){
        this.scene=new THREE.Scene();this.camera=new THREE.Camera();
        if(this.uniforms){
          this.material=new THREE.RawShaderMaterial(this.props.material);
          this.geometry=new THREE.PlaneGeometry(2.0,2.0);
          this.plane=new THREE.Mesh(this.geometry,this.material);
          this.scene.add(this.plane);
        }
      }
      update(){
        Common.renderer.setRenderTarget(this.props.output||null);
        Common.renderer.render(this.scene,this.camera);
        Common.renderer.setRenderTarget(null);
      }
    }

    class Advection extends ShaderPass {
      constructor(sp){
        super({material:{vertexShader:face_vert,fragmentShader:advection_frag,uniforms:{boundarySpace:{value:sp.cellScale},px:{value:sp.cellScale},fboSize:{value:sp.fboSize},velocity:{value:sp.src.texture},dt:{value:sp.dt},isBFECC:{value:true}}},output:sp.dst});
        this.uniforms=this.props.material.uniforms;this.init();
      }
      init(){super.init();this.createBoundary();}
      createBoundary(){
        const g=new THREE.BufferGeometry();
        const v=new Float32Array([-1,-1,0,-1,1,0,-1,1,0,1,1,0,1,1,0,1,-1,0,1,-1,0,-1,-1,0]);
        g.setAttribute('position',new THREE.BufferAttribute(v,3));
        const m=new THREE.RawShaderMaterial({vertexShader:line_vert,fragmentShader:advection_frag,uniforms:this.uniforms});
        this.line=new THREE.LineSegments(g,m);this.scene.add(this.line);
      }
      update({dt,isBounce,BFECC}){
        this.uniforms.dt.value=dt;this.line.visible=isBounce;
        this.uniforms.isBFECC.value=BFECC;super.update();
      }
    }

    class ExternalForce extends ShaderPass {
      constructor(sp){super({output:sp.dst});this.init(sp);}
      init(sp){
        super.init();
        const g=new THREE.PlaneGeometry(1,1);
        const m=new THREE.RawShaderMaterial({vertexShader:mouse_vert,fragmentShader:externalForce_frag,blending:THREE.AdditiveBlending,depthWrite:false,uniforms:{px:{value:sp.cellScale},force:{value:new THREE.Vector2(0,0)},center:{value:new THREE.Vector2(0,0)},scale:{value:new THREE.Vector2(sp.cursor_size,sp.cursor_size)}}});
        this.mouse=new THREE.Mesh(g,m);this.scene.add(this.mouse);
      }
      update(props){
        const fx=(Mouse.diff.x/2)*props.mouse_force;
        const fy=(Mouse.diff.y/2)*props.mouse_force;
        const csX=props.cursor_size*props.cellScale.x;
        const csY=props.cursor_size*props.cellScale.y;
        const cx=Math.min(Math.max(Mouse.coords.x,-1+csX+props.cellScale.x*2),1-csX-props.cellScale.x*2);
        const cy=Math.min(Math.max(Mouse.coords.y,-1+csY+props.cellScale.y*2),1-csY-props.cellScale.y*2);
        const u=this.mouse.material.uniforms;
        u.force.value.set(fx,fy);u.center.value.set(cx,cy);
        u.scale.value.set(props.cursor_size,props.cursor_size);super.update();
      }
    }

    class Viscous extends ShaderPass {
      constructor(sp){
        super({material:{vertexShader:face_vert,fragmentShader:viscous_frag,uniforms:{boundarySpace:{value:sp.boundarySpace},velocity:{value:sp.src.texture},velocity_new:{value:sp.dst_.texture},v:{value:sp.viscous},px:{value:sp.cellScale},dt:{value:sp.dt}}},output:sp.dst,output0:sp.dst_,output1:sp.dst});
        this.init();
      }
      update({viscous,iterations,dt}){
        let a,b;this.uniforms.v.value=viscous;
        for(let i=0;i<iterations;i++){
          if(i%2===0){a=this.props.output0;b=this.props.output1;}
          else{a=this.props.output1;b=this.props.output0;}
          this.uniforms.velocity_new.value=a.texture;
          this.props.output=b;this.uniforms.dt.value=dt;super.update();
        }
        return b;
      }
    }

    class Divergence extends ShaderPass {
      constructor(sp){
        super({material:{vertexShader:face_vert,fragmentShader:divergence_frag,uniforms:{boundarySpace:{value:sp.boundarySpace},velocity:{value:sp.src.texture},px:{value:sp.cellScale},dt:{value:sp.dt}}},output:sp.dst});
        this.init();
      }
      update({vel}){this.uniforms.velocity.value=vel.texture;super.update();}
    }

    class Poisson extends ShaderPass {
      constructor(sp){
        super({material:{vertexShader:face_vert,fragmentShader:poisson_frag,uniforms:{boundarySpace:{value:sp.boundarySpace},pressure:{value:sp.dst_.texture},divergence:{value:sp.src.texture},px:{value:sp.cellScale}}},output:sp.dst,output0:sp.dst_,output1:sp.dst});
        this.init();
      }
      update({iterations}){
        let a,b;
        for(let i=0;i<iterations;i++){
          if(i%2===0){a=this.props.output0;b=this.props.output1;}
          else{a=this.props.output1;b=this.props.output0;}
          this.uniforms.pressure.value=a.texture;
          this.props.output=b;super.update();
        }
        return b;
      }
    }

    class Pressure extends ShaderPass {
      constructor(sp){
        super({material:{vertexShader:face_vert,fragmentShader:pressure_frag,uniforms:{boundarySpace:{value:sp.boundarySpace},pressure:{value:sp.src_p.texture},velocity:{value:sp.src_v.texture},px:{value:sp.cellScale},dt:{value:sp.dt}}},output:sp.dst});
        this.init();
      }
      update({vel,pressure}){
        this.uniforms.velocity.value=vel.texture;
        this.uniforms.pressure.value=pressure.texture;super.update();
      }
    }

    class Simulation {
      constructor(o){
        this.options=Object.assign({iterations_poisson:32,iterations_viscous:32,mouse_force:20,resolution:0.5,cursor_size:100,viscous:30,isBounce:false,dt:0.014,isViscous:false,BFECC:true},o||{});
        this.fbos={vel_0:null,vel_1:null,vel_viscous0:null,vel_viscous1:null,div:null,pressure_0:null,pressure_1:null};
        this.fboSize=new THREE.Vector2();this.cellScale=new THREE.Vector2();this.boundarySpace=new THREE.Vector2();
        this.init();
      }
      init(){this.calcSize();this.createAllFBO();this.createShaderPass();}
      getFloatType(){
        const isIOS=/(iPad|iPhone|iPod)/i.test(navigator.userAgent);
        return isIOS?THREE.HalfFloatType:THREE.FloatType;
      }
      createAllFBO(){
        const t=this.getFloatType();
        const o={type:t,depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.ClampToEdgeWrapping,wrapT:THREE.ClampToEdgeWrapping};
        for(const k in this.fbos) this.fbos[k]=new THREE.WebGLRenderTarget(this.fboSize.x,this.fboSize.y,o);
      }
      createShaderPass(){
        this.advection=new Advection({cellScale:this.cellScale,fboSize:this.fboSize,dt:this.options.dt,src:this.fbos.vel_0,dst:this.fbos.vel_1});
        this.externalForce=new ExternalForce({cellScale:this.cellScale,cursor_size:this.options.cursor_size,dst:this.fbos.vel_1});
        this.viscous=new Viscous({cellScale:this.cellScale,boundarySpace:this.boundarySpace,viscous:this.options.viscous,src:this.fbos.vel_1,dst:this.fbos.vel_viscous1,dst_:this.fbos.vel_viscous0,dt:this.options.dt});
        this.divergence=new Divergence({cellScale:this.cellScale,boundarySpace:this.boundarySpace,src:this.fbos.vel_viscous0,dst:this.fbos.div,dt:this.options.dt});
        this.poisson=new Poisson({cellScale:this.cellScale,boundarySpace:this.boundarySpace,src:this.fbos.div,dst:this.fbos.pressure_1,dst_:this.fbos.pressure_0});
        this.pressure=new Pressure({cellScale:this.cellScale,boundarySpace:this.boundarySpace,src_p:this.fbos.pressure_0,src_v:this.fbos.vel_viscous0,dst:this.fbos.vel_0,dt:this.options.dt});
      }
      calcSize(){
        const w=Math.max(1,Math.round(this.options.resolution*Common.width));
        const h=Math.max(1,Math.round(this.options.resolution*Common.height));
        this.cellScale.set(1.0/w,1.0/h);this.fboSize.set(w,h);
      }
      resize(){
        this.calcSize();
        for(const k in this.fbos) this.fbos[k].setSize(this.fboSize.x,this.fboSize.y);
      }
      update(){
        if(this.options.isBounce) this.boundarySpace.set(0,0);
        else this.boundarySpace.copy(this.cellScale);
        this.advection.update({dt:this.options.dt,isBounce:this.options.isBounce,BFECC:this.options.BFECC});
        this.externalForce.update({cursor_size:this.options.cursor_size,mouse_force:this.options.mouse_force,cellScale:this.cellScale});
        let vel=this.fbos.vel_1;
        if(this.options.isViscous) vel=this.viscous.update({viscous:this.options.viscous,iterations:this.options.iterations_viscous,dt:this.options.dt});
        this.divergence.update({vel});
        const pressure=this.poisson.update({iterations:this.options.iterations_poisson});
        this.pressure.update({vel,pressure});
      }
    }

    class Output {
      constructor(){this.init();}
      init(){
        this.simulation=new Simulation({
          iterations_poisson:opts.iterationsPoisson,iterations_viscous:opts.iterationsViscous,
          mouse_force:opts.mouseForce,resolution:opts.resolution,cursor_size:opts.cursorSize,
          viscous:opts.viscous,isBounce:opts.isBounce,dt:opts.dt,isViscous:opts.isViscous,BFECC:opts.BFECC
        });
        this.scene=new THREE.Scene();this.camera=new THREE.Camera();
        this.output=new THREE.Mesh(
          new THREE.PlaneGeometry(2,2),
          new THREE.RawShaderMaterial({
            vertexShader:face_vert,fragmentShader:color_frag,
            transparent:true,depthWrite:false,
            uniforms:{
              velocity:{value:this.simulation.fbos.vel_0.texture},
              boundarySpace:{value:new THREE.Vector2()},
              palette:{value:paletteTex},
              bgColor:{value:bgVec4},
              lightMode:{value:opts.lightMode}
            }
          })
        );
        this.scene.add(this.output);
      }
      resize(){this.simulation.resize();}
      render(){
        Common.renderer.setRenderTarget(null);
        Common.renderer.render(this.scene,this.camera);
      }
      update(){this.simulation.update();this.render();}
    }

    let visible=true,running=false,rafId=0,resizeRaf=0;
    let lastUserInteraction=performance.now();
    let autoDriver=null;

    function initManager(){
      Common.init(mountEl);
      Mouse.init(mountEl);
      Mouse.autoIntensity=opts.autoIntensity;
      Mouse.takeoverDuration=opts.takeoverDuration;
      Mouse.onInteract=()=>{lastUserInteraction=performance.now();if(autoDriver) autoDriver.forceStop();};
      const manager={get lastUserInteraction(){return lastUserInteraction;}};
      autoDriver=new AutoDriver(Mouse,manager,{enabled:opts.autoDemo,speed:opts.autoSpeed,resumeDelay:opts.autoResumeDelay,rampDuration:opts.autoRampDuration});
      const output=new Output();
      mountEl.prepend(Common.renderer.domElement);

      function resize(){Common.resize();output.resize();}
      function render(){
        if(autoDriver) autoDriver.update();
        Mouse.update();Common.update();output.update();
      }
      function loop(){if(!running) return;render();rafId=requestAnimationFrame(loop);}
      function start(){if(running) return;running=true;loop();}
      function pause(){running=false;if(rafId){cancelAnimationFrame(rafId);rafId=0;}}

      const ro=new ResizeObserver(()=>{
        if(resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf=requestAnimationFrame(resize);
      });
      ro.observe(mountEl);

      const io=new IntersectionObserver(entries=>{
        const e=entries[0];
        visible=e.isIntersecting&&e.intersectionRatio>0;
        if(visible&&!document.hidden) start();
        else pause();
      },{threshold:[0,0.01,0.1]});
      io.observe(mountEl);

      const onVis=()=>{if(document.hidden) pause();else if(visible) start();};
      document.addEventListener('visibilitychange',onVis);

      const onResize=()=>{
        if(resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf=requestAnimationFrame(resize);
      };
      window.addEventListener('resize',onResize);

      start();
      return {
        pause,
        resume(){ if(visible && !document.hidden) start(); },
        destroy(){
          pause();ro.disconnect();io.disconnect();
          document.removeEventListener('visibilitychange',onVis);
          window.removeEventListener('resize',onResize);
          Mouse.dispose();
          if(Common.renderer){
            const c=Common.renderer.domElement;
            if(c&&c.parentNode) c.parentNode.removeChild(c);
            Common.renderer.dispose();
            try{Common.renderer.forceContextLoss();}catch(e){}
          }
        }
      };
    }

    if(prefersReducedMotion) return null;
    return initManager();
  }

  /* TechText */
  function createTechText(container, options){
    const cfg = Object.assign({text:'Eli Zeng',fontFamily:'',fontWeight:600,fontSize:400,letterSpacing:-0.05,color:'#ffffff',accentColor:'#ffffff',reach:200,softness:0.7,dashLength:4,dashGap:2,strokeWidth:1.5,lineStyle:'dashed',reveal:'letter',specks:15,selection:true,labels:true,draggable:true,sweep:true,speed:1},options||{});
    const LABEL_FONT='10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    const FALLOFF_STEPS=8,SPRING=320,DAMPING=22;
    const approach=(cur,tar,dt,sec)=>cur+(tar-cur)*(1-Math.exp(-dt/sec));
    const hexToRgb=hex=>{let h=String(hex||'').replace('#','');if(h.length===3)h=h.replace(/./g,c=>c+c);const n=parseInt(h.slice(0,6),16);return Number.isNaN(n)?[255,255,255]:[(n>>16)&255,(n>>8)&255,n&255];};
    const rgba=(hex,a)=>{const [r,g,b]=hexToRgb(hex);return `rgba(${r}, ${g}, ${b}, ${a})`;};
    const noise=(...vals)=>{let h=2166136261;for(const v of vals){h=Math.imul(h^(v|0),16777619);h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;}return (h>>>0)/4294967296;};
    const signed=v=>v>0?`+${v}`:v<0?`−${-v}`:'0';

    const canvas=document.createElement('canvas');
    canvas.className='tech-text-canvas';
    container.appendChild(canvas);
    const ctx=canvas.getContext('2d');
    const scratch=document.createElement('canvas');
    const scratchCtx=scratch.getContext('2d');
    if(!ctx||!scratchCtx) return null;

    let width=1,height=1,dpr=1,raf=0,last=performance.now();
    let visible=true,alive=true,layoutKey='',requestedFont='';
    let word=null,glyphs=[],presence=0,clock=0,pulse=0,placed=false,dragging=-1;
    const pointer={x:0,y:0,inside:false},grab={x:0,y:0},lens={x:0,y:0};
    const frame={x1:0,y1:0,x2:0,y2:0,alpha:0,index:-1};

    const family=()=>cfg.fontFamily||getComputedStyle(container).fontFamily||'sans-serif';
    const fontFor=(size)=>`${cfg.fontWeight} ${size}px ${family()}`;
    const setFont=(target,size)=>{target.font=fontFor(size);if('letterSpacing' in target) target.letterSpacing=`${cfg.letterSpacing*size}px`;target.textAlign='left';target.textBaseline='alphabetic';};

    const sprite=(view,glyph,stroke)=>{
      const pad=Math.ceil(cfg.strokeWidth*2+4);
      const left=glyph.box.x1-pad,top=glyph.box.y1-pad;
      const w=glyph.box.x2-glyph.box.x1+pad*2,h=glyph.box.y2-glyph.box.y1+pad*2;
      const image=document.createElement('canvas');
      image.width=Math.max(1,Math.ceil(w*dpr));image.height=Math.max(1,Math.ceil(h*dpr));
      const c=image.getContext('2d');if(!c) return {image,left,top};
      c.setTransform(dpr,0,0,dpr,-left*dpr,-top*dpr);setFont(c,view.size);
      if(stroke){
        c.lineJoin='round';c.lineWidth=cfg.strokeWidth*2;c.lineCap='butt';
        c.strokeStyle=cfg.color;
        if(cfg.lineStyle!=='solid') c.setLineDash([Math.max(1,cfg.dashLength),Math.max(1,cfg.dashGap)]);
        c.strokeText(glyph.char,glyph.x,view.baseline);c.setLineDash([]);
        c.globalCompositeOperation='destination-out';c.fillStyle='#000';
        c.fillText(glyph.char,glyph.x,view.baseline);c.globalCompositeOperation='source-over';
      } else {c.fillStyle=cfg.color;c.fillText(glyph.char,glyph.x,view.baseline);}
      return {image,left,top};
    };

    const refreshFonts=()=>{layoutKey='';wake();};

    const ensureLayout=()=>{
      const key=[cfg.text,family(),cfg.fontWeight,cfg.fontSize,cfg.letterSpacing,cfg.color,cfg.dashLength,cfg.dashGap,cfg.strokeWidth,cfg.lineStyle,width,height,dpr].join('|');
      if(key===layoutKey&&word) return word;
      layoutKey=key;
      const wanted=fontFor(64);
      if(document.fonts&&wanted!==requestedFont){
        requestedFont=wanted;
        document.fonts.load(wanted,cfg.text).then(refreshFonts,refreshFonts);
      }
      const probe=scratchCtx;setFont(probe,cfg.fontSize);
      let m=probe.measureText(cfg.text);
      const fit=Math.min(1,(width*0.9)/Math.max(m.actualBoundingBoxLeft+m.actualBoundingBoxRight,1),(height*0.66)/Math.max(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,1));
      const size=cfg.fontSize*fit;setFont(probe,size);m=probe.measureText(cfg.text);
      const inkWidth=m.actualBoundingBoxLeft+m.actualBoundingBoxRight;
      const inkHeight=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
      const x=(width-inkWidth)/2+m.actualBoundingBoxLeft;
      const baseline=(height-inkHeight)/2+m.actualBoundingBoxAscent;
      const next={size,baseline,left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight,top:baseline-m.actualBoundingBoxAscent,bottom:baseline+m.actualBoundingBoxDescent};
      word=next;
      const chars=Array.from(cfg.text);const previous=glyphs;glyphs=[];
      let prefix='';
      chars.forEach((char,i)=>{
        prefix+=char;
        const own=probe.measureText(char);
        const gx=x+probe.measureText(prefix).width-own.width;
        if(!char.trim()) return;
        const base={char,x:gx,box:{x1:gx-own.actualBoundingBoxLeft,y1:baseline-own.actualBoundingBoxAscent,x2:gx+own.actualBoundingBoxRight,y2:baseline+own.actualBoundingBoxDescent}};
        const kept=previous[glyphs.length];
        glyphs.push({...base,offset:kept?.char===char?kept.offset:{x:0,y:0},velocity:{x:0,y:0},outline:0,index:i,fill:sprite(next,base,false),dashes:sprite(next,base,true)});
      });
      dragging=-1;frame.index=-1;return next;
    };

    const glyphAt=(x,y)=>{
      if(!word||y<word.top-24||y>word.bottom+24) return -1;
      let best=-1,bestDistance=Infinity;
      glyphs.forEach((glyph,i)=>{
        const x1=glyph.box.x1+glyph.offset.x;const x2=glyph.box.x2+glyph.offset.x;
        const d=x<x1?x1-x:x>x2?x-x2:0;
        if(d<bestDistance){bestDistance=d;best=i;}
      });
      return bestDistance<28?best:-1;
    };

    const falloff=(target,cx,cy,radius,strength,softness)=>{
      const inner=Math.min(1,Math.max(0,1-softness));
      const gradient=target.createRadialGradient(cx,cy,0,cx,cy,radius);
      gradient.addColorStop(0,`rgba(0, 0, 0, ${strength})`);
      if(inner>0.995){
        gradient.addColorStop(0.995,`rgba(0, 0, 0, ${strength})`);
        gradient.addColorStop(1,'rgba(0, 0, 0, 0)');
        return gradient;
      }
      for(let i=0;i<=FALLOFF_STEPS;i++){
        const t=i/FALLOFF_STEPS;const eased=t*t*(3-2*t);
        gradient.addColorStop(inner+(1-inner)*t,`rgba(0, 0, 0, ${strength*(1-eased)})`);
      }
      return gradient;
    };

    const blit=(target,art,dx,dy,originX,originY)=>{
      target.drawImage(art.image,Math.round((art.left+dx)*dpr-originX),Math.round((art.top+dy)*dpr-originY));
    };

    const drawReveal=()=>{
      const radius=cfg.reach*dpr,cx=lens.x*dpr,cy=lens.y*dpr;
      ctx.globalCompositeOperation='destination-out';
      ctx.fillStyle=falloff(ctx,cx,cy,radius,presence,cfg.softness);
      ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);
      ctx.globalCompositeOperation='source-over';
      const x0=Math.max(0,Math.floor(cx-radius));const y0=Math.max(0,Math.floor(cy-radius));
      const x1=Math.min(canvas.width,Math.ceil(cx+radius));const y1=Math.min(canvas.height,Math.ceil(cy+radius));
      if(x1<=x0||y1<=y0) return;
      const w=x1-x0,h=y1-y0;
      if(scratch.width<w||scratch.height<h){scratch.width=Math.max(scratch.width,w);scratch.height=Math.max(scratch.height,h);}
      scratchCtx.setTransform(1,0,0,1,0,0);
      scratchCtx.globalCompositeOperation='source-over';
      scratchCtx.clearRect(0,0,w,h);
      for(const glyph of glyphs) blit(scratchCtx,glyph.dashes,glyph.offset.x,glyph.offset.y,x0,y0);
      scratchCtx.globalCompositeOperation='destination-in';
      scratchCtx.fillStyle=falloff(scratchCtx,cx-x0,cy-y0,radius,1,cfg.softness);
      scratchCtx.fillRect(0,0,w,h);
      scratchCtx.globalCompositeOperation='source-over';
      ctx.globalAlpha=presence;ctx.drawImage(scratch,0,0,w,h,x0,y0,w,h);ctx.globalAlpha=1;
    };

    const crisp=v=>(Math.round(v*dpr)+0.5)/dpr;

    const perimeterPoint=(distance,w,h)=>{
      let d=((distance%(2*(w+h)))+2*(w+h))%(2*(w+h));
      if(d<w) return [frame.x1+d,frame.y1,0,-1];
      d-=w;if(d<h) return [frame.x2,frame.y1+d,1,0];
      d-=h;if(d<w) return [frame.x2-d,frame.y2,0,1];
      d-=w;return [frame.x1,frame.y2-d,-1,0];
    };

    const drawSpecks=(a)=>{
      const w=frame.x2-frame.x1,h=frame.y2-frame.y1;
      if(w<2||h<2) return;
      const perimeter=2*(w+h),seed=frame.index+1,grid=3;
      for(let k=0;k<cfg.specks;k++){
        const period=0.5+noise(seed,k,11)*1.2;const t=pulse/period+noise(seed,k,17);
        const cycle=Math.floor(t),life=t-cycle;
        if(life>0.7) continue;
        const [px,py,nx,ny]=perimeterPoint(noise(seed,k,cycle)*perimeter,w,h);
        const pick=noise(seed,k,cycle,2);
        const size=pick<0.46?2:pick<0.7?3:pick<0.84?5:pick<0.94?8:11;
        const large=size>=8;
        const out=(large?9:4)+Math.floor(noise(seed,k,cycle,1)*5)*grid;
        const x=frame.x1+Math.round((px+nx*out-frame.x1)/grid)*grid;
        const y=frame.y1+Math.round((py+ny*out-frame.y1)/grid)*grid;
        const tone=noise(seed,k,cycle,3);
        const blink=life<0.06||(life>0.32&&life<0.36)?0.35:1;
        const alpha=a*(large?0.3+0.4*tone:0.3+0.6*tone)*blink;
        const left=Math.round(x-size/2),top=Math.round(y-size/2);
        if(tone<0.26||(large&&tone<0.78)){
          ctx.strokeStyle=rgba(cfg.accentColor,alpha);
          ctx.strokeRect(left+0.5,top+0.5,size,size);
          if(large&&tone>0.5){ctx.fillStyle=rgba(cfg.accentColor,alpha);ctx.fillRect(Math.round(x)-1,Math.round(y)-1,2,2);}
        } else {ctx.fillStyle=rgba(cfg.accentColor,alpha);ctx.fillRect(left,top,size,size);}
      }
      for(let j=0;j<2;j++){
        const head=(pulse*0.42*cfg.speed+j*0.5)*perimeter;
        for(let i=0;i<4;i++){
          const [x,y]=perimeterPoint(head-i*6,w,h);
          const size=i===0?3:2;
          ctx.fillStyle=rgba(cfg.accentColor,a*[0.95,0.55,0.32,0.16][i]);
          ctx.fillRect(Math.round(x-size/2),Math.round(y-size/2),size,size);
        }
      }
    };

    const drawFrame=()=>{
      const glyph=glyphs[frame.index];
      if(!glyph||frame.alpha<0.01) return;
      const a=frame.alpha;
      const x1=crisp(frame.x1),y1=crisp(frame.y1),x2=crisp(frame.x2),y2=crisp(frame.y2);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const moved=Math.hypot(glyph.offset.x,glyph.offset.y);
      if(moved>1){
        const hx=(glyph.box.x1+glyph.box.x2)/2,hy=(glyph.box.y1+glyph.box.y2)/2;
        ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+glyph.offset.x,hy+glyph.offset.y);
        ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.strokeStyle=rgba(cfg.accentColor,0.45*a);ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.rect(Math.round(hx)-2,Math.round(hy)-2,4,4);
        ctx.fillStyle=rgba(cfg.accentColor,0.7*a);ctx.fill();
      }
      ctx.beginPath();ctx.rect(x1,y1,x2-x1,y2-y1);ctx.lineWidth=1;ctx.strokeStyle=rgba(cfg.accentColor,0.5*a);ctx.stroke();
      ctx.beginPath();
      for(const [cx,cy] of [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]) ctx.rect(Math.round(cx)-2,Math.round(cy)-2,5,5);
      ctx.fillStyle=rgba(cfg.accentColor,0.95*a);ctx.fill();
      if(cfg.specks>0){ctx.lineWidth=1;drawSpecks(a);}
      if(!cfg.labels) return;
      ctx.font=LABEL_FONT;ctx.textAlign='left';ctx.textBaseline='bottom';
      ctx.fillStyle=rgba(cfg.accentColor,0.62*a);
      const label=moved>1?`${signed(Math.round(glyph.offset.x))}, ${signed(Math.round(-glyph.offset.y))}`:`${glyph.char}  ${Math.round(glyph.box.x2-glyph.box.x1)} × ${Math.round(glyph.box.y2-glyph.box.y1)}`;
      ctx.fillText(label,Math.round(frame.x1),Math.round(frame.y1)-7);
    };

    const tick=now=>{
      raf=0;if(!alive) return;
      const dt=Math.min(0.05,Math.max(0.001,(now-last)/1000));last=now;
      const view=ensureLayout();
      const sweeping=cfg.sweep&&!prefersReducedMotion&&!pointer.inside&&dragging<0;
      if(sweeping) clock+=dt*cfg.speed;
      pulse+=dt;
      let targetX=pointer.x,targetY=pointer.y;
      if(sweeping){
        targetX=view.left+(view.right-view.left)*(0.5-0.5*Math.cos(clock*0.45));
        targetY=view.top+(view.bottom-view.top)*(0.45+0.1*Math.sin(clock*0.8));
      }
      const active=pointer.inside||sweeping||dragging>=0;
      if(active&&!placed){lens.x=targetX;lens.y=targetY;}
      if(active){
        const lag=pointer.inside?0.05:0.22;
        lens.x=approach(lens.x,targetX,dt,lag);lens.y=approach(lens.y,targetY,dt,lag);
      }
      placed=active;
      presence=approach(presence,cfg.reveal==='area'&&active&&dragging<0?1:0,dt,0.16);

      let moving=false;
      glyphs.forEach((glyph,i)=>{
        if(i===dragging){
          glyph.offset.x=approach(glyph.offset.x,pointer.x-grab.x,dt,0.03);
          glyph.offset.y=approach(glyph.offset.y,pointer.y-grab.y,dt,0.03);
          glyph.velocity.x=0;glyph.velocity.y=0;moving=true;return;
        }
        const {offset,velocity}=glyph;
        if(Math.abs(offset.x)<0.05&&Math.abs(offset.y)<0.05&&Math.hypot(velocity.x,velocity.y)<0.5){
          offset.x=0;offset.y=0;velocity.x=0;velocity.y=0;return;
        }
        velocity.x+=(-SPRING*offset.x-DAMPING*velocity.x)*dt;
        velocity.y+=(-SPRING*offset.y-DAMPING*velocity.y)*dt;
        offset.x+=velocity.x*dt;offset.y+=velocity.y*dt;moving=true;
      });

      const focus=dragging>=0?dragging:active?glyphAt(lens.x,lens.y):-1;
      if(focus>=0&&cfg.selection){
        const glyph=glyphs[focus];
        const bx1=glyph.box.x1+glyph.offset.x-6;const by1=glyph.box.y1+glyph.offset.y-6;
        const bx2=glyph.box.x2+glyph.offset.x+6;const by2=glyph.box.y2+glyph.offset.y+6;
        if(frame.index<0||frame.alpha<0.02){frame.x1=bx1;frame.y1=by1;frame.x2=bx2;frame.y2=by2;}
        const glide=focus===dragging?0.02:0.08;
        frame.x1=approach(frame.x1,bx1,dt,glide);frame.y1=approach(frame.y1,by1,dt,glide);
        frame.x2=approach(frame.x2,bx2,dt,glide);frame.y2=approach(frame.y2,by2,dt,glide);
        frame.index=focus;
      }
      frame.alpha=approach(frame.alpha,focus>=0&&cfg.selection?1:0,dt,0.1);

      glyphs.forEach((glyph,i)=>{
        const target=cfg.reveal==='letter'&&i===focus&&i!==dragging?1:0;
        glyph.outline=approach(glyph.outline,target,dt,0.09);
        if(Math.abs(glyph.outline-target)>0.002) moving=true;else glyph.outline=target;
      });

      if(cfg.draggable){
        container.style.cursor=dragging>=0?'grabbing':(focus>=0&&pointer.inside)?'grab':'';
      }

      ctx.setTransform(1,0,0,1,0,0);
      ctx.globalCompositeOperation='source-over';
      ctx.clearRect(0,0,canvas.width,canvas.height);

      for(const glyph of glyphs){
        const moved=Math.hypot(glyph.offset.x,glyph.offset.y);
        if(moved>1){
          ctx.globalAlpha=Math.min(1,moved/24)*0.55;
          blit(ctx,glyph.dashes,0,0,0,0);ctx.globalAlpha=1;
        }
      }
      for(const glyph of glyphs){
        if(glyph.outline<0.999){
          ctx.globalAlpha=1-glyph.outline;
          blit(ctx,glyph.fill,glyph.offset.x,glyph.offset.y,0,0);
        }
        if(glyph.outline>0.001){
          ctx.globalAlpha=glyph.outline;
          blit(ctx,glyph.dashes,glyph.offset.x,glyph.offset.y,0,0);
        }
        ctx.globalAlpha=1;
      }
      if(presence>0.001) drawReveal();
      drawFrame();

      const settling=moving
        ||Math.abs(presence-(cfg.reveal==='area'&&active&&dragging<0?1:0))>0.002
        ||(frame.alpha>0.01&&frame.alpha<0.99);
      if((active||settling)&&visible&&alive) raf=requestAnimationFrame(tick);
    };

    function wake(){
      if(raf||!visible||!alive) return;
      last=performance.now();raf=requestAnimationFrame(tick);
    }

    const resize=()=>{
      width=Math.max(1,container.clientWidth);height=Math.max(1,container.clientHeight);
      dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      layoutKey='';wake();
    };

    const locate=e=>{
      const rect=container.getBoundingClientRect();
      pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;
    };
    const onMove=e=>{locate(e);pointer.inside=true;wake();};
    const onLeave=()=>{if(dragging>=0)return;pointer.inside=false;wake();};
    const onDown=e=>{
      locate(e);pointer.inside=true;
      if(cfg.draggable&&(e.pointerType!=='mouse'||e.button===0)){
        const i=glyphAt(pointer.x,pointer.y);
        if(i>=0){dragging=i;grab.x=pointer.x-glyphs[i].offset.x;grab.y=pointer.y-glyphs[i].offset.y;container.setPointerCapture?.(e.pointerId);}
      }
      wake();
    };
    const onUp=e=>{
      if(dragging>=0){
        dragging=-1;container.releasePointerCapture?.(e.pointerId);
        const rect=container.getBoundingClientRect();
        pointer.inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
      }
      wake();
    };

    container.addEventListener('pointermove',onMove,{passive:true});
    container.addEventListener('pointerenter',onMove,{passive:true});
    container.addEventListener('pointerdown',onDown,{passive:true});
    container.addEventListener('pointerup',onUp,{passive:true});
    container.addEventListener('pointercancel',onUp,{passive:true});
    container.addEventListener('pointerleave',onLeave,{passive:true});

    const ro=new ResizeObserver(resize);ro.observe(container);
    const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake();});io.observe(container);
    if(document.fonts) document.fonts.ready.then(refreshFonts,refreshFonts);
    resize();

    return {
      setText(next){cfg.text=String(next??'');container.setAttribute('aria-label',cfg.text);layoutKey='';wake();},
      destroy(){
        alive=false;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();
        container.removeEventListener('pointermove',onMove);
        container.removeEventListener('pointerenter',onMove);
        container.removeEventListener('pointerdown',onDown);
        container.removeEventListener('pointerup',onUp);
        container.removeEventListener('pointercancel',onUp);
        container.removeEventListener('pointerleave',onLeave);
      }
    };
  }

  /* TextTyper */
  class TextTyper {
    constructor(el,opts={}){
      this.el=el;this.text=opts.text!=null?String(opts.text):'';
      this.typingSpeed=opts.typingSpeed??50;this.deletingSpeed=opts.deletingSpeed??30;
      this.initialDelay=opts.initialDelay??0;this.pauseDuration=opts.pauseDuration??2000;
      this.loop=opts.loop??false;this.cursorCharacter=opts.cursorCharacter??'|';
      this.hideCursorWhileTyping=opts.hideCursorWhileTyping??false;
      this.currentCharIndex=0;this.displayedText='';this.isDeleting=false;
      this.timeout=null;this.active=false;this.played=false;this._everPlayed=false;
      this.build();
    }
    build(){
      this.el.classList.add('text-type');
      this.el.setAttribute('aria-label',this.text);
      while(this.el.firstChild) this.el.removeChild(this.el.firstChild);
      this.contentEl=document.createElement('span');
      this.contentEl.className='text-type__content';this.el.appendChild(this.contentEl);
      this.cursorEl=document.createElement('span');
      this.cursorEl.className='text-type__cursor';
      this.cursorEl.setAttribute('aria-hidden','true');
      this.cursorEl.textContent=this.cursorCharacter;this.el.appendChild(this.cursorEl);
    }
    start(){
      if(this.active||this.played) return;
      this.active=true;
      const d=this._everPlayed?0:this.initialDelay;
      this._everPlayed=true;this.timeout=setTimeout(()=>this.tick(),d);
    }
    tick(){
      if(!this.active) return;
      const full=this.text;
      if(!this.isDeleting){
        if(this.currentCharIndex<full.length){
          this.displayedText+=full[this.currentCharIndex];
          this.contentEl.textContent=this.displayedText;this.currentCharIndex++;
          if(this.hideCursorWhileTyping) this.cursorEl.classList.remove('text-type__cursor--hidden');
          this.timeout=setTimeout(()=>this.tick(),this.typingSpeed);
        } else if(this.loop){
          this.timeout=setTimeout(()=>{this.isDeleting=true;this.tick();},this.pauseDuration);
        } else {this.played=true;this.active=false;}
      } else {
        if(this.displayedText.length>0){
          this.displayedText=this.displayedText.slice(0,-1);
          this.contentEl.textContent=this.displayedText;
          if(this.hideCursorWhileTyping) this.cursorEl.classList.add('text-type__cursor--hidden');
          this.timeout=setTimeout(()=>this.tick(),this.deletingSpeed);
        } else {
          this.isDeleting=false;this.currentCharIndex=0;
          this.timeout=setTimeout(()=>this.tick(),this.pauseDuration);
        }
      }
    }
    reset(){
      clearTimeout(this.timeout);
      this.isDeleting=false;this.active=false;this.played=false;
      this.currentCharIndex=0;this.displayedText='';
      this.contentEl.textContent='';
      this.cursorEl.classList.remove('text-type__cursor--hidden');
    }
    setText(next){
      this.text=String(next??'');this.el.setAttribute('aria-label',this.text);
      clearTimeout(this.timeout);
      this.isDeleting=false;this.active=false;this.played=false;
      this.currentCharIndex=0;this.displayedText='';
      this.contentEl.textContent='';
      this.cursorEl.classList.remove('text-type__cursor--hidden');
      if(this.el._visible) this.start();
    }
  }

  /* Dither Cursor */
  function initDitherCursor(){
    const canvas=document.getElementById('dither-trail');
    if(!canvas) return;
    if(prefersReducedMotion){canvas.style.display='none';return;}
    if(window.matchMedia('(hover: none)').matches){canvas.style.display='none';return;}
    const ctx=canvas.getContext('2d');if(!ctx) return;

    let width=window.innerWidth,height=window.innerHeight;
    const dpr=Math.min(window.devicePixelRatio||1,2);

    function resize(){
      width=window.innerWidth;height=window.innerHeight;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      canvas.style.width=width+'px';canvas.style.height=height+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();window.addEventListener('resize',resize);

    const CFG={color:'#ffffff',dotSize:6,spacing:4,fadeSpeed:0.045,spread:12,maxParticles:600};
    const particles=[];

    function spawn(x,y){
      const count=2+Math.floor(Math.random()*3);
      for(let i=0;i<count;i++){
        const angle=Math.random()*Math.PI*2;
        const radius=Math.random()*CFG.spread;
        particles.push({x:x+Math.cos(angle)*radius,y:y+Math.sin(angle)*radius,size:CFG.dotSize*(0.5+Math.random()*0.9),life:1.0});
      }
      if(particles.length>CFG.maxParticles) particles.splice(0,particles.length-CFG.maxParticles);
    }

    let lastX=0,lastY=0,moved=false;
    window.addEventListener('pointermove',e=>{
      const x=e.clientX,y=e.clientY;
      if(!moved){lastX=x;lastY=y;moved=true;return;}
      if(Math.hypot(x-lastX,y-lastY)>CFG.spacing){spawn(x,y);lastX=x;lastY=y;}
    },{passive:true});

    function frame(){
      ctx.clearRect(0,0,width,height);
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];
        p.life-=CFG.fadeSpeed;
        if(p.life<=0){particles.splice(i,1);continue;}
        ctx.globalAlpha=p.life;ctx.fillStyle=CFG.color;
        const sz=Math.max(1,Math.round(p.size));
        ctx.fillRect(Math.round(p.x-sz/2),Math.round(p.y-sz/2),sz,sz);
      }
      ctx.globalAlpha=1;requestAnimationFrame(frame);
    }
    frame();
  }

  const mountEl=document.getElementById('liquid-ether-fixed');
  if(mountEl&&!prefersReducedMotion){
    createLiquidEther(mountEl,{
      colors:['#0a0a0a','#3a3a3a','#8a8a8a','#ffffff'],
      backgroundColor:'#000000',lightMode:false,
      mouseForce:30,cursorSize:200,resolution:0.5,
      autoDemo:true,autoSpeed:0.45,autoIntensity:2.8,
      autoResumeDelay:800,autoRampDuration:0.5
    });
  }

  const eliTitle=document.getElementById('eliTitle');
  if(eliTitle&&!prefersReducedMotion){
    const lang0=()=>root.lang==='zh-CN'?'zh':'en';
    const initial=eliTitle.dataset[lang0()]||'Eli Zeng';
    eliTitle._techText=createTechText(eliTitle,{
      text:initial,
      fontFamily:'"BubbledotICG-FinePos","Geist Pixel Circle",monospace',
      fontWeight:400,fontSize:400,letterSpacing:-0.05,
      color:'#ffffff',accentColor:'#ffffff',
      reach:220,softness:0.7,dashLength:4,dashGap:2,
      strokeWidth:1.5,lineStyle:'dashed',reveal:'letter',
      specks:15,selection:true,labels:true,draggable:true,sweep:true,speed:1
    });
  } else if(eliTitle){
    eliTitle.style.cssText='display:grid;place-items:center;height:100%;font-family:"BubbledotICG-FinePos","Geist Pixel Circle",monospace;font-size:clamp(40px,9vw,130px);letter-spacing:-.05em;color:#fff';
    eliTitle.textContent=eliTitle.dataset.en||'Eli Zeng';
  }

  const bgSections=[...document.querySelectorAll('[data-bg]')];
  let bgRaf=0;
  function updateBgState(){
    const midY=window.innerHeight/2;
    let current='dark';
    for(const sec of bgSections){
      const r=sec.getBoundingClientRect();
      if(r.top<=midY&&r.bottom>=midY){current=sec.dataset.bg;break;}
    }
    document.body.classList.toggle('dark-active',current==='dark');
    document.body.classList.toggle('light-active',current==='light');
  }
  function onBgScroll(){
    if(bgRaf) return;
    bgRaf=requestAnimationFrame(()=>{updateBgState();bgRaf=0;});
  }
  window.addEventListener('scroll',onBgScroll,{passive:true});
  window.addEventListener('resize',onBgScroll);
  updateBgState();

  const backToTop=document.getElementById('backToTop');
  if(backToTop){
    let btnRaf=0;
    function updateBtn(){ backToTop.classList.toggle('is-visible',window.scrollY>280); }
    function onBtnScroll(){
      if(btnRaf) return;
      btnRaf=requestAnimationFrame(()=>{updateBtn();btnRaf=0;});
    }
    window.addEventListener('scroll',onBtnScroll,{passive:true});
    window.addEventListener('resize',onBtnScroll);
    updateBtn();
    backToTop.addEventListener('click',()=>{
      const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
      if(history.replaceState) history.replaceState(null,'','#home');
    });
  }

  function setLang(lang){
    root.lang=lang==='zh'?'zh-CN':'en';
    translatable.forEach(el=>{
      const next=el.dataset[lang]??el.textContent;
      if(el._typer) el._typer.setText(next);
      else if(el._techText) el._techText.setText(next);
      else if(el!==eliTitle) el.textContent=next;
    });
    document.querySelectorAll('[data-lang]').forEach(btn=>{
      const on=btn.dataset.lang===lang;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-pressed',on?'true':'false');
    });
    document.querySelectorAll('.lang-toggle,.mobile-lang').forEach(toggle=>{
      toggle.dataset.active=lang;
    });
    document.title=title[lang];
    try{localStorage.setItem('eli-site-lang',lang);}catch(e){}
  }
  let savedLang='en';
  try{savedLang=localStorage.getItem('eli-site-lang')==='zh'?'zh':'en';}catch(e){}
  setLang(savedLang);
  langButtons.forEach(btn=>btn.addEventListener('click',()=>setLang(btn.dataset.lang)));

  const typeEls=[...document.querySelectorAll('[data-type-effect]')];
  if(!prefersReducedMotion&&typeEls.length){
    const isZh=root.lang==='zh-CN';
    typeEls.forEach((el,i)=>{
      const text=el.dataset[isZh?'zh':'en']||el.textContent.trim();
      el._typer=new TextTyper(el,{
        text,
        initialDelay:120+(i%3)*100,
        typingSpeed:isZh?70:48,
        deletingSpeed:28,
        pauseDuration:2000,
        loop:false,
        hideCursorWhileTyping:false
      });
      el._visible=false;
    });

    const typeObs=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        const el=entry.target;const typer=el._typer;
        if(!typer) return;
        if(entry.isIntersecting){
          el._visible=true;clearTimeout(el._resetTimer);
          if(!typer.active&&!typer.played) typer.start();
        } else {
          el._visible=false;clearTimeout(el._resetTimer);
          el._resetTimer=setTimeout(()=>{if(!el._visible) typer.reset();},260);
        }
      });
    },{threshold:0.15});
    typeEls.forEach(el=>typeObs.observe(el));
  }

  const burger=document.getElementById('burger');
  const mobileMenu=document.getElementById('mobileMenu');
  function closeMenu(){mobileMenu.setAttribute('aria-hidden','true');burger.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
  function openMenu(){mobileMenu.setAttribute('aria-hidden','false');burger.setAttribute('aria-expanded','true');document.body.classList.add('menu-open');}
  burger.addEventListener('click',()=>burger.getAttribute('aria-expanded')==='true'?closeMenu():openMenu());
  mobileMenu.querySelector('[data-close-menu]').addEventListener('click',closeMenu);
  mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  window.addEventListener('resize',()=>{if(window.innerWidth>760)closeMenu();});

  const counters=document.querySelectorAll('.counter');
  const easeOutCubic=t=>1-Math.pow(1-t,3);
  let counted=false;
  function runCounters(){
    if(counted)return;counted=true;
    counters.forEach((el,i)=>{
      const target=Number(el.dataset.target||0);
      const start=performance.now()+480+i*90;
      const duration=1500+i*80;
      function step(now){
        if(now<start){requestAnimationFrame(step);return;}
        const p=Math.min(1,(now-start)/duration);
        el.textContent=Math.round(target*easeOutCubic(p));
        if(p<1)requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  const counterObserver=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))runCounters();},{threshold:.25});
  const statNode=document.querySelector('.stats');
  if(statNode) counterObserver.observe(statNode);

  const cursor=document.getElementById('cursorGlow');
  let rafPending=false,mx=0,my=0;
  window.addEventListener('pointermove',e=>{
    mx=e.clientX;my=e.clientY;
    if(!rafPending){
      rafPending=true;
      requestAnimationFrame(()=>{cursor.style.left=mx+'px';cursor.style.top=my+'px';rafPending=false;});
    }
  });

  const sections=['home','research','experience','projects','skills','education','contact'].map(id=>document.getElementById(id)).filter(Boolean);
  const navLinks=document.querySelectorAll('[data-nav]');

  function scrollToSection(id){
    const target=document.getElementById(id);
    if(!target) return;
    const header=document.querySelector('.header');
    const offset=(header?.getBoundingClientRect().height||0)+18;
    const top=Math.max(0,window.scrollY+target.getBoundingClientRect().top-offset);
    window.scrollTo({top,behavior:'smooth'});
    if(history.replaceState) history.replaceState(null,'','#'+id);
  }

  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    const href=link.getAttribute('href');
    if(!href||href==='#') return;
    const id=href.slice(1);
    if(!document.getElementById(id)) return;
    link.addEventListener('click',event=>{
      event.preventDefault();closeMenu();scrollToSection(id);
    });
  });

  function setActiveNav(id){
    navLinks.forEach(n=>n.classList.remove('active'));
    document.querySelectorAll('[data-nav="'+id+'"]').forEach(n=>n.classList.add('active'));
  }

  const sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting) setActiveNav(entry.target.id);});
  },{rootMargin:'-35% 0px -55% 0px',threshold:.01});
  sections.forEach(s=>sectionObserver.observe(s));

  const revealNodes=document.querySelectorAll('.reveal-section');
  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  },{threshold:.12});
  revealNodes.forEach(node=>revealObserver.observe(node));

  initDitherCursor();

  /* 项目页面路由 */
  const projectPage = document.getElementById('projectPage');
  const projectBack = document.getElementById('projectBack');
  const projectPageKicker = document.getElementById('projectPageKicker');
  const projectPageTitle = document.getElementById('projectPageTitle');
  const experienceWrap = document.getElementById('experienceWrap');
  const experienceEnterFs = document.getElementById('experienceEnterFs');
  const experienceExitFs = document.getElementById('experienceExitFs');
  const experienceIframe = document.getElementById('experienceIframe');
  const experiencePlaceholder = document.getElementById('experiencePlaceholder');
  const experienceOpenExternal = document.getElementById('experienceOpenExternal');

  /* 体验区全屏 / 小窗切换（默认小窗，用户手动切换） */
  function isExperienceFullscreen(){
    return !!(experienceWrap && experienceWrap.classList.contains('is-fullscreen'));
  }
  function enterExperienceFullscreen(){
    if(!experienceWrap) return;
    experienceWrap.classList.add('is-fullscreen');
    if(experienceEnterFs) experienceEnterFs.hidden = true;
    if(experienceExitFs) experienceExitFs.hidden = false;
  }
  function exitExperienceFullscreen(){
    if(!experienceWrap) return;
    experienceWrap.classList.remove('is-fullscreen');
    if(experienceEnterFs) experienceEnterFs.hidden = false;
    if(experienceExitFs) experienceExitFs.hidden = true;
  }

  const PROJECT_META = {
    'project-01': {
      kicker:{en:'01 / HERITAGE', zh:'01 / 遗产'},
      title:{en:'Bronze Heritage Gesture Interaction', zh:'青铜器手势交互'},
      externalUrl: 'https://cooleli.github.io/Bronze-Ware-Interaction/',
      embedUrl: 'https://cooleli.github.io/Bronze-Ware-Interaction/'
    },
    'project-02': {
      kicker:{en:'02 / DUNHUANG', zh:'02 / 敦煌'},
      title:{en:'Dunhuang Interactive Heritage', zh:'敦煌互动文化遗产'},
      directUrl: 'https://cooleli.github.io/Portfolio-page/Dunhuang%20Interactive%20Heritage%20project/'
    },
    'project-03': {
      kicker:{en:'03 / MR', zh:'03 / MR'},
      title:{en:'MR RV Interior Customization', zh:'MR 房车内饰定制'}
    },
    'project-04': {
      kicker:{en:'04 / PATTERN', zh:'04 / 纹样'},
      title:{en:'Traditional Pattern Interaction', zh:'传统纹样交互'}
    },
    'project-05': {
      kicker:{en:'05 / APP', zh:'05 / APP'},
      title:{en:'APP Interaction Design', zh:'APP 交互设计'}
    },
    'project-06': {
      kicker:{en:'06 / PRODUCT', zh:'06 / 产品'},
      title:{en:'Product Design', zh:'产品设计'}
    }
  };

  function currentLang(){
    return root.lang === 'zh-CN' ? 'zh' : 'en';
  }

  function renderProjectPageContent(hash){
    const meta = PROJECT_META[hash];
    if (!meta) return;
    const lang = currentLang();
    projectPageKicker.textContent = meta.kicker[lang] || meta.kicker.en;
    projectPageTitle.textContent = meta.title[lang] || meta.title.en;
    document.title = (meta.title[lang] || meta.title.en) + ' — Eli Zeng';
    /* 体验区：有 embedUrl 的项目显示嵌入 iframe，否则显示占位 */
    const embedUrl = meta.embedUrl;
    if (experienceIframe && experiencePlaceholder) {
      if (embedUrl) {
        if (experienceIframe.getAttribute('src') !== embedUrl) {
          experienceIframe.setAttribute('src', embedUrl);
        }
        experienceIframe.title = (meta.title[lang] || meta.title.en) + ' — interactive experience';
        experienceIframe.hidden = false;
        experiencePlaceholder.hidden = true;
      } else {
        experienceIframe.removeAttribute('src');
        experienceIframe.hidden = true;
        experiencePlaceholder.hidden = false;
      }
    }
    if (experienceOpenExternal) {
      if (meta.externalUrl) {
        experienceOpenExternal.hidden = false;
        experienceOpenExternal.dataset.url = meta.externalUrl;
      } else {
        experienceOpenExternal.hidden = true;
      }
    }
  }

  function openProjectPage(hash){
    const meta = PROJECT_META[hash];
    if (!meta) return;
    renderProjectPageContent(hash);
    exitExperienceFullscreen();
    projectPage.scrollTop = 0;
    projectPage.classList.add('is-open');
    projectPage.setAttribute('aria-hidden', 'false');
    document.body.classList.add('project-open');
  }

  function closeProjectPage(){
    exitExperienceFullscreen();
    projectPage.classList.remove('is-open');
    projectPage.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-open');
  }

  function handleProjectHash(){
    const hash = location.hash.slice(1);
    if (PROJECT_META[hash]) {
      openProjectPage(hash);
    } else {
      closeProjectPage();
      if (sections.some(s => s.id === hash)) {
        document.title = title[currentLang()];
      }
    }
  }
  window.addEventListener('hashchange', handleProjectHash);
  handleProjectHash();

  document.querySelectorAll('#projects .outline-card').forEach(card => {
    const hash = card.dataset.project;
    if (!hash || !PROJECT_META[hash]) return;

    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Open project in new tab: ' + hash);

    /* 所有项目卡片统一：在新标签页打开对应项目的详情页（含介绍 + 体验区）。
       新标签页地址的选择：
       - file:// 本地双击：location.href 一定是作品集本身，用真实 URL。
         新标签页保持正常的安全上下文，体验区 iframe 里的摄像头等权限不受影响。
       - http(s) 顶层：可能是正式部署，也可能是 UU 等预览工具把粘贴的代码放在顶层跑。
         先试真实 URL，再校验新标签页里有没有作品集标记（#projectPage）：
         有就保留；加载完还没有（跳到了工具站），或 8 秒内始终确认不了，
         就关掉该标签页，改用当前文档的 Blob 快照——内容一定正确。
       - 被嵌在 iframe 里，或顶层是 blob:/data:/about: 等特殊协议：location.href 不可靠，
         直接用 Blob 快照。
       （v16 曾统一用 Blob 快照，导致 file:// 下新标签页是 blob:null 不透明源、非安全上下文，
        iframe 里 getUserMedia 被拦截，手势模式无法启动。） */
    const openBlobTab = (targetHash) => {
      const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
      const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
      const w = window.open(URL.createObjectURL(blob) + '#' + targetHash, '_blank');
      if (w) {
        try { w.opener = null; } catch (e) {}
      } else {
        /* 弹窗被拦截时，退回在当前标签页打开 */
        location.hash = targetHash;
      }
    };
    const openProjectInNewTab = (targetHash) => {
      try {
        const topLevel = window.self === window.top;
        const proto = location.protocol;
        /* 不用 noopener 特性串（部分浏览器会因此让 window.open 返回 null），
           改为手动断开 opener，既能通过返回值判断弹窗是否被拦截，又不留 opener 关联 */
        if (topLevel && proto === 'file:') {
          const w = window.open(location.href.split('#')[0] + '#' + targetHash, '_blank');
          if (w) { try { w.opener = null; } catch (e) {} }
          else { location.hash = targetHash; }
          return;
        }
        if (topLevel && (proto === 'http:' || proto === 'https:')) {
          const w = window.open(location.href.split('#')[0] + '#' + targetHash, '_blank');
          if (!w) { location.hash = targetHash; return; }
          try { w.opener = null; } catch (e) {}
          const deadline = Date.now() + 8000;
          const fail = () => {
            try { w.close(); } catch (e) {}
            openBlobTab(targetHash);
          };
          const verify = () => {
            if (w.closed) return;
            if (Date.now() > deadline) { fail(); return; }
            try {
              const d = w.document;
              if (d.getElementById('projectPage')) return;   /* 是作品集，保留 */
              if (d.readyState === 'complete') { fail(); return; } /* 加载完也不是，换 Blob */
            } catch (e) {
              /* 跨域暂时读不到（可能正在跳转），继续等到 deadline */
            }
            setTimeout(verify, 400);
          };
          setTimeout(verify, 800);
          return;
        }
        openBlobTab(targetHash);
      } catch (err) {
        location.hash = targetHash;
      }
    };
    const go = (e) => {
      if (e) e.preventDefault();
      if (e) e.stopPropagation();
      const meta = PROJECT_META[hash];
      if (meta.directUrl) {
        const w = window.open(meta.directUrl, '_blank');
        if (!w) window.location.href = meta.directUrl;
        return;
      }
      openProjectInNewTab(hash);
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        go(e);
      }
    });
  });

  projectBack.addEventListener('click', () => {
    closeProjectPage();
    if (history.replaceState) history.replaceState(null, '', '#home');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'});
    document.title = title[currentLang()];
  });

  if (experienceEnterFs) experienceEnterFs.addEventListener('click', enterExperienceFullscreen);
  if (experienceExitFs) experienceExitFs.addEventListener('click', exitExperienceFullscreen);
  if (experienceOpenExternal) experienceOpenExternal.addEventListener('click', () => {
    const url = experienceOpenExternal.dataset.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectPage.classList.contains('is-open')) {
      if (isExperienceFullscreen()) {
        exitExperienceFullscreen();
        return;
      }
      closeProjectPage();
      if (history.replaceState) history.replaceState(null, '', '#home');
      window.scrollTo({top: 0, behavior: 'smooth'});
      document.title = title[currentLang()];
    }
  });

  const _origSetLang = setLang;
  setLang = function(lang){
    _origSetLang(lang);
    if (window.__renderFolder) window.__renderFolder(lang);
    if (projectPage.classList.contains('is-open')) {
      const hash = location.hash.slice(1);
      if (PROJECT_META[hash]) renderProjectPageContent(hash);
    }
  };
  langButtons.forEach(btn => {
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);
  });
  const langButtonsNew = [...document.querySelectorAll('[data-lang]')];
  langButtonsNew.forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
})();
