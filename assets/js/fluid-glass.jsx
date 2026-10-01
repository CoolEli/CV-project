import * as THREE from 'three';
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { useFBO, MeshTransmissionMaterial } from '@react-three/drei';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { easing } from 'maath';

const CAM_Z = 20;
const BAR_Z = 15;
const BG_Z = -5;
const FOV = 15;
const VEIL_OPACITY = 0.08;

function pickTarget() {
  /* 桌面端导航已改为纯白扁平，不再用 3D 玻璃条跟随（返回 null 即隐藏玻璃条）；
     移动端仍跟随 .mobile-tools */
  const tools = document.querySelector('.header .mobile-tools');
  if (tools) {
    const r = tools.getBoundingClientRect();
    if (r.width > 4 && r.height > 4) return r;
  }
  return null;
}

function snapshot() {
  const root = document.getElementById('fluidglass-root');
  if (!root) return null;
  const cr = root.getBoundingClientRect();
  const pr = pickTarget();
  if (!cr.width || !cr.height || !pr) return null;
  return { cr, pr };
}

function toWorld(rect, canvasRect, planeZ) {
  const dist = CAM_Z - planeZ;
  const worldH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const s = worldH / canvasRect.height;
  const cx = rect.left - canvasRect.left + rect.width / 2;
  const cy = rect.top - canvasRect.top + rect.height / 2;
  return {
    x: (cx - canvasRect.width / 2) * s,
    y: -(cy - canvasRect.height / 2) * s,
    w: Math.max(rect.width * s, 0.001),
    h: Math.max(rect.height * s, 0.001)
  };
}

function useFluidTexture() {
  return useMemo(() => {
    const cv = document.querySelector('#liquid-ether-fixed canvas');
    if (!cv || !cv.width || !cv.height) return null;
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function BgQuad({ scene, fluidTex, snap }) {
  const bg = useRef();
  const veil = useRef();

  useFrame(() => {
    const show = !!(snap && fluidTex && bg.current && veil.current);
    if (bg.current) bg.current.visible = show;
    if (veil.current) veil.current.visible = show;
    if (!show) return;
    const p = toWorld(snap.pr, snap.cr, BG_Z);
    bg.current.position.set(p.x, p.y, BG_Z);
    bg.current.scale.set(p.w, p.h, 1);
    veil.current.position.set(p.x, p.y, BG_Z + 0.02);
    veil.current.scale.set(p.w, p.h, 1);
    fluidTex.repeat.set(snap.pr.width / window.innerWidth, snap.pr.height / window.innerHeight);
    fluidTex.offset.set(
      snap.pr.left / window.innerWidth,
      1 - snap.pr.top / window.innerHeight - snap.pr.height / window.innerHeight
    );
  });

  return createPortal(
    <>
      <mesh ref={bg} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={fluidTex} toneMapped={false} />
      </mesh>
      <mesh ref={veil} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#0a0a0c" transparent opacity={VEIL_OPACITY} toneMapped={false} depthWrite={false} />
      </mesh>
    </>,
    scene
  );
}

function GlassBar({ buffer, snap }) {
  const mesh = useRef();
  const mat = useRef();
  const [geom, setGeom] = useState(null);
  const last = useRef({ w: 0, h: 0 });

  useFrame((state, dt) => {
    if (!snap) { if (mesh.current) mesh.current.visible = false; return; }
    const p = toWorld(snap.pr, snap.cr, BAR_Z);
    if (Math.abs(p.w - last.current.w) > 1e-4 || Math.abs(p.h - last.current.h) > 1e-4) {
      last.current = { w: p.w, h: p.h };
      const depth = Math.max(0.02, p.h * 0.75);
      const radius = Math.min(p.w, p.h, depth) / 2 * 0.94;
      const g = new RoundedBoxGeometry(p.w, p.h, depth, 4, radius);
      setGeom(prev => { if (prev) prev.dispose(); return g; });
    }
    if (!mesh.current) return;
    mesh.current.visible = true;
    easing.damp3(mesh.current.position, [p.x, p.y, BAR_Z], 0.25, dt);
    if (mat.current) mat.current.thickness = 0.5;
  });

  if (!geom) return null;
  return (
    <mesh ref={mesh} geometry={geom}>
      <MeshTransmissionMaterial
        ref={mat}
        buffer={buffer.texture}
        transmission={1}
        roughness={0.08}
        ior={1.42}
        thickness={0.55}
        chromaticAberration={0.14}
        anisotropy={0.04}
        /* ★ 深色玻璃：与 CV/Contact 按钮调性一致 */
        color="#18181b"
        attenuationColor="#0a0a0c"
        attenuationDistance={0.12}
      />
    </mesh>
  );
}

function GlassStage() {
  const buffer = useFBO();
  const [scene] = useState(() => new THREE.Scene());
  const [snap, setSnap] = useState(null);
  const fluidTex = useFluidTexture();

  useEffect(() => {
    const update = () => setSnap(snapshot());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  useFrame(state => {
    if (fluidTex) fluidTex.needsUpdate = true;
    const { gl, camera } = state;
    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
  });

  return (
    <>
      <BgQuad scene={scene} fluidTex={fluidTex} snap={snap} />
      <GlassBar buffer={buffer} snap={snap} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[0, 6, 14]} intensity={1.6} />
      <directionalLight position={[0, -5, 10]} intensity={0.4} />
    </>
  );
}

function App() {
  useEffect(() => {
    document.body.classList.add('fg3d-on');
    return () => document.body.classList.remove('fg3d-on');
  }, []);
  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 100 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#000000', 0)}
      style={{ display: 'block', width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none' }}
    >
      <GlassStage />
    </Canvas>
  );
}

(function mountFluidGlass() {
  try {
    const rootEl = document.getElementById('fluidglass-root');
    const fluidOk = !!document.querySelector('#liquid-ether-fixed canvas');
    let webglOk = false;
    try {
      const c = document.createElement('canvas');
      webglOk = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { webglOk = false; }
    if (!rootEl || !fluidOk || !webglOk) return;
    createRoot(rootEl).render(<App />);
  } catch (err) {
    const el = document.getElementById('fluidglass-root');
    if (el) el.remove();
  }
})();
