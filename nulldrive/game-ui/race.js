/**
 * NULLDRIVE: Overclock — playable Neo-Kyoto Night GP.
 * Three.js circuit, arcade physics, 3 AI rivals. Consumed by game-ui/index.html.
 * Tokens and the HUD live in Slipstream (shared.css / shared.js); this module
 * only owns the world, the cars, and the race.
 */
import * as THREE from 'three';

const ROAD = 10.2;
const WALL = 13.4;
const LAPS_DEFAULT = 3;
const BOT = /(?:\?|&)bot(?:[=&]|$)/.test(location.search);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = (a) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- track ---------- */
function pushLine(pts, x0, z0, x1, z1, n, jog) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  // Left normal, so a positive jog bends the straight without changing its ends.
  const lx = -dz / len, lz = dx / len;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const j = jog ? jog(t) : 0;
    pts.push([x0 + dx * t + lx * j, z0 + dz * t + lz * j]);
  }
}
function pushArc(pts, cx, cz, r, a0, a1, n) {
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
}
function dedupe(pts) {
  const out = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.8) out.push(p);
  }
  return out;
}
function buildControlPoints() {
  const HW = 250, HH = 430, R = 105;
  const xR = HW - R, xL = -HW + R, zB = -HH + R, zT = HH - R;
  const pts = [];
  // South straight, start/finish at the middle, heading +X. Kept clean for the grid.
  pushLine(pts, 0, -HH, xR, -HH, 8);
  pushArc(pts, xR, zB, R, -Math.PI / 2, 0, 8);
  // East straight — second full-throttle zone, gentle.
  pushLine(pts, HW, zB, HW, zT, 12, (t) => Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI) * 18);
  pushArc(pts, xR, zT, R, 0, Math.PI / 2, 8);
  // North esses.
  pushLine(pts, xR, HH, xL, HH, 14, (t) => -Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI) * 42);
  pushArc(pts, xL, zT, R, Math.PI / 2, Math.PI, 8);
  // West chicane: one smooth infield bulge, flat tangent at both ends.
  pushLine(pts, -HW, zT, -HW, zB, 14, (t) => Math.sin(t * Math.PI) ** 2 * 62);
  pushArc(pts, xL, zB, R, Math.PI, Math.PI * 3 / 2, 8);
  pushLine(pts, xL, -HH, 0, -HH, 8);
  return dedupe(pts);
}
// Rewrite the west bulge: Math.sin(t*PI)**2 is one clean bump. The extra factor I
// left in is always 1. That's intentional — one committed direction change.

function resampleClosed(pts, spacing) {
  const p = pts.slice();
  const a0 = p[0], bN = p[p.length - 1];
  if (Math.hypot(a0[0] - bN[0], a0[1] - bN[1]) > 0.01) p.push([a0[0], a0[1]]);
  const out = [];
  let acc = 0, target = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const ax = p[i][0], az = p[i][1], bx = p[i + 1][0], bz = p[i + 1][1];
    const dx = bx - ax, dz = bz - az;
    const seglen = Math.hypot(dx, dz);
    if (seglen < 1e-4) continue;
    while (target <= acc + seglen + 1e-4) {
      const t = (target - acc) / seglen;
      if (t >= -0.001 && t < 0.9999) out.push([ax + dx * t, az + dz * t]);
      target += spacing;
      if (out.length > 20000) break;
    }
    acc += seglen;
  }
  if (out.length > 2) {
    const a = out[0], b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < spacing * 0.45) out.pop();
  }
  return out;
}

function buildTrack() {
  const points = resampleClosed(buildControlPoints(), 4);
  const N = points.length;
  const samples = points.map((p, i) => ({ x: p[0], z: p[1], i, s: 0, seglen: 0, y: 0 }));
  for (let i = 0; i < N; i++) {
    const a = samples[i], b = samples[(i + 1) % N];
    a.seglen = Math.hypot(b.x - a.x, b.z - a.z) || 0.001;
  }
  let total = 0;
  for (let i = 0; i < N; i++) { samples[i].s = total; total += samples[i].seglen; }
  for (let i = 0; i < N; i++) {
    const a = samples[i], b = samples[(i + 1) % N];
    const prev = samples[(i - 1 + N) % N];
    a.tx = (b.x - a.x) / a.seglen;
    a.tz = (b.z - a.z) / a.seglen;
    a.yaw = Math.atan2(a.tx, a.tz);
    a.rx = a.tz;
    a.rz = -a.tx;
    a.curv = wrap(a.yaw - prev.yaw) / ((prev.seglen + a.seglen) * 0.5);
    a.y = Math.sin((a.s / total) * Math.PI * 2) * 4.5 + Math.sin((a.s / total) * Math.PI * 4) * 1.2;
  }
  const rawCurv = samples.map((s) => s.curv);
  for (let i = 0; i < N; i++) {
    let acc = 0;
    for (let k = -3; k <= 3; k++) acc += rawCurv[(i + k + N) % N];
    samples[i].curv = acc / 7;
  }
  // Soft proximity check — non-adjacent samples should not collapse the circuit.
  let close = 0;
  for (let i = 0; i < N; i += 2) {
    for (let j = i + 24; j < N - 24; j += 2) {
      const dx = samples[i].x - samples[j].x, dz = samples[i].z - samples[j].z;
      if (dx * dx + dz * dz < 22 * 22) close++;
    }
  }
  if (close > 0) console.warn('NULLDRIVE track self-proximity samples:', close);
  const gates = [];
  const gateCount = 8;
  for (let g = 0; g < gateCount; g++) gates.push((total * g) / gateCount);
  return { samples, len: total, gates };
}

function sampleAt(track, s) {
  const { samples, len } = track;
  const N = samples.length;
  s = ((s % len) + len) % len;
  let lo = 0, hi = N - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].s < s) lo = mid + 1;
    else hi = mid;
  }
  const i1 = lo % N;
  const i0 = (i1 - 1 + N) % N;
  const a = samples[i0], b = samples[i1];
  let span = b.s - a.s; if (span < 0) span += len;
  let along = s - a.s; if (along < 0) along += len;
  const t = span > 0 ? clamp(along / span, 0, 1) : 0;
  return { a, b, t, i: i0 };
}
function poseAt(track, s, lane) {
  const q = sampleAt(track, s);
  const yaw = q.a.yaw + wrap(q.b.yaw - q.a.yaw) * q.t;
  const x = q.a.x + (q.b.x - q.a.x) * q.t;
  const z = q.a.z + (q.b.z - q.a.z) * q.t;
  const y = q.a.y + (q.b.y - q.a.y) * q.t;
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);
  return { x: x + rx * lane, z: z + rz * lane, y, yaw, s: ((s % track.len) + track.len) % track.len, i: q.i };
}

/* ---------- geometry helpers ---------- */
function addStrip(geoPos, geoIdx, samples, lat0, lat1, yLift, close = true) {
  const N = samples.length;
  const base = geoPos.length / 3;
  for (let i = 0; i < N; i++) {
    const s = samples[i];
    geoPos.push(
      s.x + s.rx * lat0, s.y + yLift, s.z + s.rz * lat0,
      s.x + s.rx * lat1, s.y + yLift, s.z + s.rz * lat1
    );
  }
  const seg = close ? N : N - 1;
  for (let i = 0; i < seg; i++) {
    const i0 = base + i * 2;
    const i1 = base + ((i + 1) % N) * 2;
    geoIdx.push(i0, i0 + 1, i1 + 1, i0, i1 + 1, i1);
  }
}
function meshFrom(pos, idx, material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.matrixAutoUpdate = false;
  m.updateMatrix();
  return m;
}
function wallStrip(samples, lat, height, material) {
  const pos = [], idx = [];
  const N = samples.length;
  for (let i = 0; i < N; i++) {
    const s = samples[i];
    const x = s.x + s.rx * lat, z = s.z + s.rz * lat;
    pos.push(x, s.y, z, x, s.y + height, z);
  }
  for (let i = 0; i < N; i++) {
    const i0 = i * 2;
    const i1 = ((i + 1) % N) * 2;
    idx.push(i0, i1, i1 + 1, i0, i1 + 1, i0 + 1);
  }
  return meshFrom(pos, idx, material);
}

function windowTexture(rnd) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#090b12';
  g.fillRect(0, 0, 64, 128);
  const cols = ['#00f0ff', '#ff2e88', '#ffc23d', '#eaf2ff', '#8b5cff', '#ff7a1a'];
  for (let y = 3; y < 128; y += 7) {
    for (let x = 2; x < 64; x += 6) {
      if (rnd() > 0.42) {
        g.globalAlpha = 0.35 + rnd() * 0.65;
        g.fillStyle = cols[(rnd() * cols.length) | 0];
        g.fillRect(x, y, 3, 4);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function signTexture(text, color) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 128);
  g.font = '700 62px Orbitron, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = color;
  g.shadowBlur = 28;
  g.fillStyle = color;
  g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildCar(hex) {
  const color = new THREE.Color(hex);
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: 0x141820, metalness: 0.72, roughness: 0.34 });
  const trim = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.7, roughness: 0.4, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x070910, roughness: 0.08, metalness: 0.95 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 2.4 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xeaf2ff, emissive: 0xd7ecff, emissiveIntensity: 2.2 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.36, 4.35), paint);
  body.position.y = 0.46;
  g.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.18, 1.15), paint);
  nose.position.set(0, 0.4, 2.15);
  g.add(nose);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.36, 1.45), glass);
  cab.position.set(0, 0.78, -0.15);
  g.add(cab);
  for (const x of [-0.98, 0.98]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 3.5), trim);
    skirt.position.set(x, 0.3, 0.05);
    g.add(skirt);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.06, 0.32), trim);
  wing.position.set(0, 1.02, -1.95);
  g.add(wing);
  for (const x of [-0.62, 0.62]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.08), trim);
    st.position.set(x, 0.86, -1.95);
    g.add(st);
  }
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 3.2), trim);
  blade.position.set(0, 0.66, 0.15);
  g.add(blade);
  for (const x of [-0.55, 0.55]) {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.06), tail);
    tl.position.set(x, 0.55, -2.2);
    g.add(tl);
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.06), lamp);
    hl.position.set(x, 0.42, 2.2);
    g.add(hl);
  }
  const glow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 3.3), trim);
  glow.position.y = 0.2;
  g.add(glow);

  const spins = [], pivots = [];
  const spots = [[-0.95, 1.32], [0.95, 1.32], [-0.95, -1.38], [0.95, -1.38]];
  spots.forEach(([x, z], i) => {
    const pivot = new THREE.Group();
    const spin = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14), rubber);
    tire.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 10), trim);
    hub.rotation.z = Math.PI / 2;
    spin.add(tire, hub);
    pivot.add(spin);
    pivot.position.set(x, 0.36, z);
    g.add(pivot);
    spins.push(spin);
    if (i < 2) pivots.push(pivot);
  });

  const flames = [];
  for (const x of [-0.32, 0.32]) {
    const f = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.9, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0, depthWrite: false })
    );
    f.rotation.x = Math.PI / 2;
    f.position.set(x, 0.34, -2.7);
    g.add(f);
    flames.push(f);
  }

  const spot = new THREE.SpotLight(0xe7f4ff, 28, 70, 0.5, 0.5, 1.5);
  spot.position.set(0, 0.55, 1.5);
  const target = new THREE.Object3D();
  target.position.set(0, 0.15, 14);
  g.add(spot, target);
  spot.target = target;

  g.userData = { trim, spins, pivots, flames, tail };
  return g;
}

function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: {},
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vP;
      void main(){
        vec3 n = normalize(vP);
        float h = n.y;
        vec3 top = vec3(0.04, 0.05, 0.09);
        vec3 mid = vec3(0.28, 0.08, 0.36);
        vec3 hor = vec3(0.72, 0.18, 0.42);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.28, h));
        c = mix(c, top, smoothstep(0.18, 0.85, h));
        vec3 sunDir = normalize(vec3(-0.55, 0.16, 0.25));
        float d = max(dot(n, sunDir), 0.0);
        float disc = smoothstep(0.972, 0.985, d);
        float bands = step(0.55, fract((n.y + 0.02) * 38.0));
        vec3 sunCol = vec3(1.0, 0.55, 0.22);
        c += sunCol * pow(d, 6.0) * 0.55;
        c = mix(c, sunCol * 1.15, disc * (1.0 - bands * 0.82));
        c += vec3(0.55, 0.75, 1.0) * pow(max(n.y, 0.0), 0.35) * 0.04;
        gl_FragColor = vec4(c, 1.0);
      }`
  });
}

/* ---------- world ---------- */
function buildWorld(track) {
  const { samples } = track;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a0a24, 70, 980);
  scene.background = new THREE.Color(0x05060a);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 24, 16), skyMaterial());
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  const rnd = mulberry32(0x4e304b01);
  // Stars
  const starPos = [];
  for (let i = 0; i < 380; i++) {
    const r = 500 + rnd() * 700;
    const a = rnd() * Math.PI * 2;
    starPos.push(Math.cos(a) * r, 30 + rnd() * 280, Math.sin(a) * r);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xeaf2ff, size: 1.5, transparent: true, opacity: 0.75, fog: false })));

  // Distant ridge
  const ridgeMat = new THREE.MeshBasicMaterial({ color: 0x0b0d14, fog: false });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const h = 40 + rnd() * 90;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(28 + rnd() * 36, h, 5), ridgeMat);
    cone.position.set(Math.cos(a) * 780, h * 0.35 - 20, Math.sin(a) * 780);
    scene.add(cone);
  }

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(900, 48),
    new THREE.MeshStandardMaterial({ color: 0x07060e, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.4;
  scene.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({ color: 0x4a536c, roughness: 0.62, metalness: 0.12, side: THREE.DoubleSide });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 4.5, roughness: 0.35, side: THREE.DoubleSide });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xeaf2ff });
  const kerbMatA = new THREE.MeshStandardMaterial({ color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 0.7, side: THREE.DoubleSide });
  const kerbMatB = new THREE.MeshStandardMaterial({ color: 0xeaf2ff, emissive: 0xeaf2ff, emissiveIntensity: 0.25, side: THREE.DoubleSide });
  const runoffMat = new THREE.MeshStandardMaterial({ color: 0x1a0d22, roughness: 0.95, side: THREE.DoubleSide });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0c0e16, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.1, side: THREE.DoubleSide });

  const roadP = [], roadI = [];
  addStrip(roadP, roadI, samples, -ROAD, ROAD, 0.02);
  scene.add(meshFrom(roadP, roadI, roadMat));

  const runP = [], runI = [];
  addStrip(runP, runI, samples, -WALL + 0.2, -ROAD, 0.01);
  addStrip(runP, runI, samples, ROAD, WALL - 0.2, 0.01);
  scene.add(meshFrom(runP, runI, runoffMat));

  // Kerbs, alternating blocks ~8m.
  const kerbA = { p: [], i: [] }, kerbB = { p: [], i: [] };
  const N = samples.length;
  for (let i = 0; i < N; i++) {
    const bucket = (Math.floor(samples[i].s / 8) % 2 === 0) ? kerbA : kerbB;
    const s = samples[i];
    const next = samples[(i + 1) % N];
    const base = bucket.p.length / 3;
    for (const lat of [-1, 1]) {
      const inner = lat * ROAD, outer = lat * (ROAD + 1.15);
      bucket.p.push(s.x + s.rx * inner, s.y + 0.045, s.z + s.rz * inner);
      bucket.p.push(s.x + s.rx * outer, s.y + 0.045, s.z + s.rz * outer);
      // one segment per sample — push both ends now and index a single quad pair
    }
    // We pushed 4 verts (left inner/outer, right inner/outer) but indexing that as a strip is awkward.
    // Rebuild kerbs below instead.
    bucket.p.length = base * 3;
  }
  function kerbChunks(which) {
    const pos = [], idx = [];
    for (let i = 0; i < N; i++) {
      if ((Math.floor(samples[i].s / 8) % 2 === 0) !== which) continue;
      const s = samples[i], n = samples[(i + 1) % N];
      for (const sign of [-1, 1]) {
        const inner = sign * ROAD, outer = sign * (ROAD + 1.15);
        const b = pos.length / 3;
        pos.push(
          s.x + s.rx * inner, s.y + 0.05, s.z + s.rz * inner,
          s.x + s.rx * outer, s.y + 0.05, s.z + s.rz * outer,
          n.x + n.rx * outer, n.y + 0.05, n.z + n.rz * outer,
          n.x + n.rx * inner, n.y + 0.05, n.z + n.rz * inner
        );
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
    }
    return meshFrom(pos, idx, which ? kerbMatA : kerbMatB);
  }
  scene.add(kerbChunks(true), kerbChunks(false));

  const edgeP = [], edgeI = [];
  addStrip(edgeP, edgeI, samples, -ROAD, -ROAD + 0.38, 0.06);
  addStrip(edgeP, edgeI, samples, ROAD - 0.38, ROAD, 0.06);
  scene.add(meshFrom(edgeP, edgeI, edgeMat));

  // Lane dashes at ±3.4m
  const dashP = [], dashI = [];
  for (const lat of [-3.4, 3.4]) {
    for (let i = 0; i < N; i++) {
      if (Math.floor(samples[i].s / 7) % 2 !== 0) continue;
      const s = samples[i], n = samples[Math.min(N - 1, i + 1) === i ? (i + 1) % N : (i + 1) % N];
      const b = dashP.length / 3;
      const w = 0.12;
      dashP.push(
        s.x + s.rx * (lat - w), s.y + 0.07, s.z + s.rz * (lat - w),
        s.x + s.rx * (lat + w), s.y + 0.07, s.z + s.rz * (lat + w),
        n.x + n.rx * (lat + w), n.y + 0.07, n.z + n.rz * (lat + w),
        n.x + n.rx * (lat - w), n.y + 0.07, n.z + n.rz * (lat - w)
      );
      dashI.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  }
  scene.add(meshFrom(dashP, dashI, dashMat));

  // Start / finish band
  const sf = samples[0];
  const sfNext = samples[1];
  const sfPos = [], sfIdx = [];
  const bands = 10;
  for (let k = 0; k < bands; k++) {
    const a0 = -ROAD + (k / bands) * ROAD * 2;
    const a1 = a0 + (ROAD * 2) / bands;
    const matWhite = k % 2 === 0;
    const b = sfPos.length / 3;
    // store later with two materials — push into separate arrays
    void matWhite; void b; void a0; void a1;
  }
  const whiteP = [], whiteI = [], blackP = [], blackI = [];
  for (let k = 0; k < bands; k++) {
    const a0 = -ROAD + (k / bands) * ROAD * 2;
    const a1 = a0 + (ROAD * 2) / bands;
    const dest = k % 2 === 0 ? [whiteP, whiteI] : [blackP, blackI];
    const b = dest[0].length / 3;
    dest[0].push(
      sf.x + sf.rx * a0, sf.y + 0.08, sf.z + sf.rz * a0,
      sf.x + sf.rx * a1, sf.y + 0.08, sf.z + sf.rz * a1,
      sfNext.x + sfNext.rx * a1, sfNext.y + 0.08, sfNext.z + sfNext.rz * a1,
      sfNext.x + sfNext.rx * a0, sfNext.y + 0.08, sfNext.z + sfNext.rz * a0
    );
    dest[1].push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  scene.add(meshFrom(whiteP, whiteI, new THREE.MeshBasicMaterial({ color: 0xf4f7ff })));
  scene.add(meshFrom(blackP, blackI, new THREE.MeshBasicMaterial({ color: 0x12141c })));
  void sfPos; void sfIdx;

  scene.add(wallStrip(samples, -WALL, 1.35, wallMat));
  scene.add(wallStrip(samples, WALL, 1.35, wallMat));
  const capP = [], capI = [];
  addStrip(capP, capI, samples, -WALL - 0.08, -WALL + 0.22, 1.38);
  addStrip(capP, capI, samples, WALL - 0.22, WALL + 0.08, 1.38);
  scene.add(meshFrom(capP, capI, capMat));

  // Sector arches. Finish arch is pulse, the rest are volt.
  track.gates.forEach((gs, gi) => {
    const q = sampleAt(track, gs);
    const s = q.a;
    const color = gi === 0 ? 0xff2e88 : 0x00f0ff;
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: gi === 0 ? 2.4 : 1.3, roughness: 0.4 });
    const width = ROAD - 0.4;
    const h = gi === 0 ? 6.2 : 4.6;
    const post = new THREE.BoxGeometry(0.28, h, 0.28);
    for (const sign of [-1, 1]) {
      const m = new THREE.Mesh(post, mat);
      m.position.set(s.x + s.rx * sign * width, s.y + h / 2, s.z + s.rz * sign * width);
      scene.add(m);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(width * 2, 0.2, 0.22), mat);
    bar.position.set(s.x, s.y + h, s.z);
    bar.rotation.y = s.yaw;
    scene.add(bar);
  });

  // City
  const win = windowTexture(rnd);
  const bmat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.04,
    emissive: 0xffffff,
    emissiveMap: win,
    emissiveIntensity: 0.9
  });
  const boxes = [];
  for (let i = 0; i < N; i += 7) {
    const s = samples[i];
    for (const side of [-1, 1]) {
      if (rnd() < 0.28) continue;
      const along = (rnd() - 0.5) * 16;
      const dist = 18 + rnd() * 26;
      const x = s.x + s.rx * side * dist + s.tx * along;
      const z = s.z + s.rz * side * dist + s.tz * along;
      let ok = true;
      for (let j = 0; j < N; j += 3) {
        const dx = x - samples[j].x, dz = z - samples[j].z;
        if (dx * dx + dz * dz < 16 * 16) { ok = false; break; }
      }
      if (!ok) continue;
      const h = 8 + rnd() ** 0.55 * 52;
      boxes.push({ x, y: h / 2 + s.y, z, w: 6 + rnd() * 9, h, d: 6 + rnd() * 9, shade: 0.45 + rnd() * 0.55 });
    }
  }
  if (boxes.length) {
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bmat, boxes.length);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    boxes.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.rotation.y = rnd() * 0.4;
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      col.setRGB(0.05 * b.shade, 0.06 * b.shade, 0.1 * b.shade);
      inst.setColorAt(i, col);
    });
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    scene.add(inst);
  }

  // Neon blades — tall emissive fins so the skyline reads in car colors.
  const bladeCols = [0x00f0ff, 0xff2e88, 0xb6ff3b, 0xff7a1a, 0x8b5cff];
  const bladeMat = bladeCols.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.0, roughness: 0.35 }));
  const bladeGeo = new THREE.BoxGeometry(1, 1, 1);
  bladeMat.forEach((mat, mi) => {
    const count = 8;
    const inst = new THREE.InstancedMesh(bladeGeo, mat, count);
    const dummy = new THREE.Object3D();
    for (let k = 0; k < count; k++) {
      const s = samples[((mi * 17 + k * 11) * 37) % N];
      const side = k % 2 === 0 ? 1 : -1;
      const dist = 20 + (k % 5) * 3;
      const h = 14 + (k % 4) * 6;
      dummy.position.set(s.x + s.rx * side * dist, s.y + h / 2, s.z + s.rz * side * dist);
      dummy.scale.set(0.6, h, 3.2);
      dummy.rotation.y = s.yaw;
      dummy.updateMatrix();
      inst.setMatrixAt(k, dummy.matrix);
    }
    scene.add(inst);
  });

  const signs = ['NEO-KYOTO', 'NIGHT GP', 'MONSOON', 'VOID RUN', 'SLIPSTREAM', 'OVERCLOCK', 'APEX LINE', 'HARTZ'];
  const signCols = ['#00f0ff', '#ff2e88', '#ffc23d', '#b6ff3b', '#8b5cff', '#ff7a1a', '#eaf2ff', '#ff2e88'];
  signs.forEach((text, i) => {
    const s = samples[(i * Math.floor(N / signs.length) + 8) % N];
    const side = i % 2 === 0 ? 1 : -1;
    const mat = new THREE.MeshBasicMaterial({ map: signTexture(text, signCols[i]), transparent: true, depthWrite: false, toneMapped: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), mat);
    plane.position.set(s.x + s.rx * side * 22, s.y + 8 + (i % 3) * 3, s.z + s.rz * side * 22);
    plane.lookAt(s.x, plane.position.y, s.z);
    scene.add(plane);
  });

  const hemi = new THREE.HemisphereLight(0xb9a0e0, 0x1a1020, 2.4);
  const moon = new THREE.DirectionalLight(0xffd0b0, 2.6);
  moon.position.set(-180, 140, 60);
  scene.add(hemi, moon, new THREE.AmbientLight(0x3a2458, 0.85));

  return scene;
}

function mapData(track) {
  const { samples, len } = track;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const s of samples) {
    minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
    minZ = Math.min(minZ, s.z); maxZ = Math.max(maxZ, s.z);
  }
  const pad = 16, W = 220, H = 190;
  const sx = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (W - pad * 2);
  const sz = (z) => pad + ((maxZ - z) / (maxZ - minZ || 1)) * (H - pad * 2);
  let d = '';
  for (let i = 0; i < samples.length; i += 3) {
    const s = samples[i];
    d += (i === 0 ? 'M' : 'L') + sx(s.x).toFixed(1) + ' ' + sz(s.z).toFixed(1);
  }
  d += 'Z';
  const s0 = samples[0];
  return {
    path: d,
    len,
    // SD.minimap samples the path backwards (1 - t). Callers pass raw 0-1;
    // the page flips so the blip travels with the cars.
    flip: true,
    sf: {
      x1: sx(s0.x - s0.rx * ROAD).toFixed(1),
      y1: sz(s0.z - s0.rz * ROAD).toFixed(1),
      x2: sx(s0.x + s0.rx * ROAD).toFixed(1),
      y2: sz(s0.z + s0.rz * ROAD).toFixed(1)
    }
  };
}

/* ---------- physics ---------- */
function makeCarState(def, pose) {
  return {
    name: def.name,
    carName: def.carName,
    color: def.color,
    you: !!def.you,
    stats: def.stats,
    phase: def.phase || 0,
    weave: def.weave ?? 0.6,
    caution: def.caution ?? 0.92,
    x: pose.x, z: pose.z, y: pose.y, yaw: pose.yaw, s: pose.s, i: pose.i,
    speed: 0, slip: 0, steerV: 0,
    boost: def.you ? 0.72 : 0.4,
    boosting: false, wasBoost: false, boostReady: false, boosts: 0,
    lapMs: 0, lapTimes: [], best: def.best || 0, completed: 0, next: 1,
    lapStartS: pose.s,
    dmg: { front: 0, left: 0, right: 0, rear: 0 },
    hitCd: 0, off: false, wrongT: 0, wrong: false,
    topKmh: 0, overtakes: 0, lastPos: 0, band: 1,
    finishMs: null, mesh: null
  };
}

function queryTrack(track, car) {
  const { samples, len } = track;
  const N = samples.length;
  const W = 40;
  let best = car.i || 0;
  let bestD = Infinity;
  const center = car.i || 0;
  for (let k = -W; k <= W; k++) {
    const i = (center + k + N * 8) % N;
    const s = samples[i];
    const dx = car.x - s.x, dz = car.z - s.z;
    const d = dx * dx + dz * dz;
    if (d < bestD) { bestD = d; best = i; }
  }
  const a = samples[best];
  const b = samples[(best + 1) % N];
  const abx = b.x - a.x, abz = b.z - a.z;
  const ab2 = abx * abx + abz * abz || 1;
  let t = ((car.x - a.x) * abx + (car.z - a.z) * abz) / ab2;
  t = clamp(t, 0, 1);
  const px = a.x + abx * t, pz = a.z + abz * t;
  const lat = (car.x - px) * a.rx + (car.z - pz) * a.rz;
  let span = b.s - a.s; if (span < 0) span += len;
  const s = (a.s + span * t) % len;
  car.i = best;
  return { a, b, t, px, pz, lat, s, y: a.y + (b.y - a.y) * t };
}

function stepCar(track, car, input, dt, events, shakeRef, racing) {
  const st = car.stats;
  car.hitCd = Math.max(0, car.hitCd - dt);
  car.steerV += ((input.steer || 0) - car.steerV) * Math.min(1, dt * (car.you ? 9 : 5));
  const steer = clamp(car.steerV, -1, 1);

  const wantBoost = !!input.boost && car.boost > 0.04 && racing;
  car.boosting = wantBoost;
  if (car.boosting) {
    if (!car.wasBoost) car.boosts++;
    car.boost = Math.max(0, car.boost - st.drain * dt);
    if (car.boost <= 0) car.boosting = false;
  }
  car.wasBoost = car.boosting;

  const drifting = Math.abs(steer) > (st.twitch > 1.1 ? 0.48 : 0.7) && car.speed > 26 && (Math.abs(steer) > 0.86 || (input.brake || 0) > 0.45);
  let regen = st.regen * (car.draft ? 2 : 1);
  if (drifting) regen *= st.driftCharge || 1;
  if (!car.boosting) car.boost = Math.min(1, car.boost + regen * dt);
  if (car.you && racing) {
    if (!car.boosting && car.boost >= 0.995 && !car.boostReady) {
      car.boostReady = true;
      events.push({ type: 'toast', toast: { type: 'boost', title: 'Nitro ready', msg: 'Hold SHIFT or SPACE to overclock.' } });
    }
    if (car.boost < 0.35) car.boostReady = false;
  }

  const dmgTop = 1 - 0.07 * car.dmg.front - 0.04 * car.dmg.rear;
  const band = car.you ? 1 : car.band;
  const top = st.top * (car.boosting ? st.boostTop : 1) * dmgTop * band;
  const throttle = racing ? (input.throttle || 0) : 0;
  const brake = racing ? (input.brake || 0) : 0;
  if (throttle > 0.05 && car.speed < top) {
    const t = car.speed / Math.max(1, top);
    const a = st.accel * (1 - t * t) * (car.boosting ? st.boostAccel : 1);
    car.speed += a * throttle * dt;
  }
  if (brake > 0.05 && !(drifting && Math.abs(steer) > 0.4)) car.speed -= st.brake * brake * dt;
  car.speed -= car.speed * st.drag * dt;
  if (car.speed < 0) car.speed = 0;
  if (car.speed > top) car.speed += (top - car.speed) * Math.min(1, dt * 2);

  const speedFactor = 1 / (1 + car.speed * 0.016);
  const turn = steer * st.turn * (st.twitch || 1) * (0.42 + 0.58 * speedFactor) * (drifting ? 1.28 : 1);
  car.yaw += turn * dt;

  const dmgGrip = 1 - 0.12 * (car.dmg.left + car.dmg.right);
  let grip = st.grip * dmgGrip * (drifting ? 0.26 : 1) * (car.off ? 0.62 : 1);
  const induced = steer * car.speed * st.slip * (drifting ? 1.35 : 0.55);
  car.slip += (induced - car.slip) * Math.min(1, grip * dt);
  if (drifting && brake > 0.4) {
    car.slip += steer * 16 * dt;
    car.speed -= st.brake * 0.3 * brake * dt;
  }
  const maxSlip = drifting ? 24 : 9;
  car.slip = clamp(car.slip, -maxSlip, maxSlip);

  const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
  const rx = Math.cos(car.yaw), rz = -Math.sin(car.yaw);
  car.x += (fx * car.speed + rx * car.slip) * dt;
  car.z += (fz * car.speed + rz * car.slip) * dt;

  const q = queryTrack(track, car);
  const prevS = car.s;
  car.s = q.s;
  car.y = q.y;
  const absL = Math.abs(q.lat);

  if (absL > WALL) {
    const sign = Math.sign(q.lat) || 1;
    const nx = q.a.rx * sign, nz = q.a.rz * sign;
    car.x = q.px + q.a.rx * sign * (WALL - 0.3);
    car.z = q.pz + q.a.rz * sign * (WALL - 0.3);
    let vx = fx * car.speed + rx * car.slip;
    let vz = fz * car.speed + rz * car.slip;
    const out = vx * nx + vz * nz;
    if (out > 0) { vx -= nx * out; vz -= nz * out; }
    const impact = Math.max(0, out);
    vx -= nx * Math.min(5, impact * 0.35);
    vz -= nz * Math.min(5, impact * 0.35);
    car.speed = Math.max(0, vx * fx + vz * fz);
    car.slip = vx * rx + vz * rz;
    if (impact > 7 && car.hitCd <= 0) {
      car.hitCd = 0.5;
      car.speed *= 0.7;
      const zone = sign > 0 ? 'right' : 'left';
      car.dmg[zone] = Math.min(1, car.dmg[zone] + 0.2);
      if (impact > 16) car.dmg.front = Math.min(1, car.dmg.front + 0.12);
      if (car.you && racing) {
        events.push({ type: 'crash' });
        events.push({ type: 'toast', toast: { type: 'danger', title: 'Heavy contact', msg: 'Wall. Ease off and get back to the racing line.' } });
        shakeRef.v = Math.min(1, shakeRef.v + 0.18 + impact * 0.012);
      }
    }
  }

  const shoulder = absL > ROAD + 0.45 && absL < WALL - 0.55;
  if (shoulder) {
    const depth = clamp((absL - ROAD) / (WALL - ROAD), 0, 1);
    const cap = st.top * (0.62 - 0.22 * depth);
    if (car.speed > cap) car.speed += (cap - car.speed) * Math.min(1, dt * 2.6);
    if (!car.off && car.you && racing) {
      events.push({ type: 'toast', toast: { type: 'warn', title: 'Off track', msg: 'Runoff is slow. Get back between the neon lines.' } });
    }
    car.off = true;
  } else car.off = false;

  // Heading vs track tangent.
  const fwd = Math.sin(car.yaw) * q.a.tx + Math.cos(car.yaw) * q.a.tz;
  if (fwd < -0.25 && car.speed > 8) car.wrongT += dt;
  else car.wrongT = Math.max(0, car.wrongT - dt * 2);
  const wasWrong = car.wrong;
  car.wrong = car.wrongT > 0.4;
  if (car.you && racing && car.wrong && !wasWrong) {
    events.push({ type: 'toast', toast: { type: 'danger', title: 'Wrong way', msg: 'Turn around. Checkpoints only count in race direction.' } });
  }

  car.topKmh = Math.max(car.topKmh, car.speed * 3.6);

  if (racing) {
    let ds = car.s - prevS;
    if (ds > track.len * 0.5) ds -= track.len;
    if (ds < -track.len * 0.5) ds += track.len;
    if (ds > 0.03) advanceGates(track, car, prevS, ds, events, racing);
    car.lapMs += dt * 1000;
  }
  return q;
}

function advanceGates(track, car, prev, ds, events) {
  const { gates, len } = track;
  let cursor = prev;
  let remain = ds;
  for (let guard = 0; guard < 4 && remain > 0.02; guard++) {
    const gS = gates[car.next];
    let dist = gS - cursor;
    if (dist < 0) dist += len;
    if (dist <= remain + 0.08 && dist < len * 0.45) {
      const idx = car.next;
      car.next = (car.next + 1) % gates.length;
      cursor = gS;
      remain -= dist;
      if (idx === 0) completeLap(track, car, events);
    } else break;
  }
}

function completeLap(track, car, events) {
  if (car.finishMs != null) return;
  const ms = car.lapMs;
  const prevBest = car.best;
  const isBest = !prevBest || ms < prevBest;
  if (isBest) car.best = ms;
  car.lapTimes.push(ms);
  const delta = prevBest ? ms - prevBest : 0;
  car.completed += 1;
  car.lapMs = 0;
  car.lapStartS = 0;
  if (car.you) {
    events.push({ type: 'lap', ms, lap: car.completed, best: car.best, delta, isBest: isBest && !!prevBest });
    if (car.completed === track.laps - 1) {
      events.push({ type: 'toast', toast: { type: 'warn', title: 'Final lap', msg: 'Last lap. Every tenth counts.' } });
    }
  }
  if (car.completed >= track.laps) {
    car.finishMs = track.raceMs;
    if (car.you) track.finish = true;
  }
}

function progressOf(track, car) {
  let dist = car.s;
  return car.completed * track.len + dist;
}

function aiInput(track, cars, car, raceT) {
  const look = 16 + car.speed * 0.5;
  const ahead = sampleAt(track, car.s + look);
  const sm = sampleAt(track, car.s + 10);
  let lane = clamp(sm.a.curv * 480, -5.2, 5.2);
  lane += Math.sin(raceT * 0.45 + car.phase) * car.weave;
  let brake = 0;
  for (const o of cars) {
    if (o === car) continue;
    let ds = progressOf(track, o) - progressOf(track, car);
    if (ds > track.len * 0.5) ds -= track.len;
    if (ds < -track.len * 0.5) ds += track.len;
    if (ds > 0 && ds < 18) {
      const olat = (o.x - sm.a.x) * sm.a.rx + (o.z - sm.a.z) * sm.a.rz;
      const my = (car.x - sm.a.x) * sm.a.rx + (car.z - sm.a.z) * sm.a.rz;
      if (Math.abs(olat - my) < 3.3) {
        lane += my >= olat ? 2.6 : -2.6;
        if (ds < 8 && o.speed <= car.speed + 2) brake = Math.max(brake, 0.35);
      }
    }
  }
  lane = clamp(lane, -(ROAD - 1.6), ROAD - 1.6);
  const tx = ahead.a.x + ahead.a.rx * lane;
  const tz = ahead.a.z + ahead.a.rz * lane;
  const desired = Math.atan2(tx - car.x, tz - car.z);
  const steer = clamp(wrap(desired - car.yaw) / 0.42, -1, 1);

  // Curvature over the braking zone.
  let cmax = 0;
  const reach = 18 + car.speed * 0.7;
  for (let d = 6; d < reach; d += 8) {
    const q = sampleAt(track, car.s + d);
    cmax = Math.max(cmax, Math.abs(q.a.curv));
  }
  const latA = 24 + car.stats.grip * 2.6;
  let vTarget = Math.min(car.stats.top * car.band * car.caution, Math.sqrt(latA / (cmax + 0.0012)));
  if (cmax < 0.006) vTarget = car.stats.top * car.band * car.caution;
  let throttle = 0;
  if (car.speed < vTarget * 0.94) throttle = 1;
  else if (car.speed > vTarget * 1.05) brake = Math.max(brake, clamp((car.speed - vTarget) / 14, 0, 1));
  else throttle = 0.55;
  const boost = cmax < 0.003 && car.boost > 0.55 && car.speed > 45 && Math.abs(steer) < 0.35;
  return { steer, throttle, brake, boost };
}

function collide(track, cars, events, shakeRef, racing) {
  const min = 2.5;
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      const dx = b.x - a.x, dz = b.z - a.z;
      const d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 < 1e-8) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d, nz = dz / d;
      const push = (min - d) * 0.55;
      a.x -= nx * push; a.z -= nz * push;
      b.x += nx * push; b.z += nz * push;
      a.speed = Math.max(0, a.speed * 0.88);
      b.speed = Math.max(0, b.speed * 0.88);
      hitCar(a, nx, nz, events, shakeRef, racing);
      hitCar(b, -nx, -nz, events, shakeRef, racing);
    }
  }
}
function hitCar(car, nx, nz, events, shakeRef, racing) {
  if (car.hitCd > 0) return;
  car.hitCd = 0.55;
  const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
  const ahead = nx * fx + nz * fz;
  const side = nx * Math.cos(car.yaw) - nz * Math.sin(car.yaw);
  let zone = 'front';
  if (ahead < -0.35) zone = 'rear';
  else if (Math.abs(side) > Math.abs(ahead)) zone = side > 0 ? 'right' : 'left';
  car.dmg[zone] = Math.min(1, car.dmg[zone] + 0.15);
  car.slip += side * 3;
  if (car.you && racing) {
    events.push({ type: 'crash' });
    events.push({ type: 'toast', toast: { type: 'danger', title: 'Contact', msg: 'You clipped a rival. Nitro still charges in the draft.' } });
    shakeRef.v = Math.min(1, shakeRef.v + 0.26);
  }
}

function rankOf(track, cars, car) {
  const me = progressOf(track, car);
  let p = 1;
  for (const o of cars) if (o !== car && progressOf(track, o) > me + 0.4) p++;
  return p;
}

function drafting(track, cars, car) {
  const sm = sampleAt(track, car.s);
  for (const o of cars) {
    if (o === car) continue;
    let ds = progressOf(track, o) - progressOf(track, car);
    if (ds > track.len * 0.5) ds -= track.len;
    if (ds < -track.len * 0.5) ds += track.len;
    if (ds > 4 && ds < 16) {
      const olat = (o.x - sm.a.x) * sm.a.rx + (o.z - sm.a.z) * sm.a.rz;
      const my = (car.x - sm.a.x) * sm.a.rx + (car.z - sm.a.z) * sm.a.rz;
      if (Math.abs(olat - my) < 3.1) return true;
    }
  }
  return false;
}

/* ---------- boot ---------- */
const ATTRACT_DEFS = [
  { name: 'VEX', carName: 'KAGE R-7', color: '#00f0ff', you: true },
  { name: 'KAIZEN', carName: 'SERAPH GT', color: '#ff2e88' },
  { name: 'ORIN-9', carName: 'MERIDIAN X', color: '#b6ff3b' },
  { name: 'HALCYON', carName: 'OBSIDIAN V12', color: '#ff7a1a' }
];
function attractStats(i) {
  const tops = [95, 99, 88, 103];
  return {
    top: tops[i], accel: 12 + i, brake: 30, grip: 5.2, turn: 1.9, slip: 0.4,
    twitch: 1, drain: 0.22, regen: 0.1, boostTop: 1.1, boostAccel: 1.3,
    drag: 0.08, driftCharge: 1
  };
}

export async function boot(canvas) {
  if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
  const track = buildTrack();
  track.laps = LAPS_DEFAULT;
  track.raceMs = 0;
  track.finish = false;
  const scene = buildWorld(track);
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1800);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.85;
  renderer.setClearColor(0x05060a, 1);


  // Speed lines live on the camera.
  const lineN = 64;
  const lineGeo = new THREE.BufferGeometry();
  const lineArr = new Float32Array(lineN * 2 * 3);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(lineArr, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0xeaf2ff, transparent: true, opacity: 0, depthWrite: false });
  const speedLines = new THREE.LineSegments(lineGeo, lineMat);
  speedLines.frustumCulled = false;
  camera.add(speedLines);
  const lineSeed = Array.from({ length: lineN }, (_, i) => ({
    a: (i / lineN) * Math.PI * 2 + (i % 5) * 0.2,
    r: 0.3 + (i % 7) * 0.18,
    z: (i % 10) / 10
  }));

  // Rain, local to the camera so the monsoon stays on the windscreen.
  const rainN = 280;
  const rainGeo = new THREE.BufferGeometry();
  const rainArr = new Float32Array(rainN * 2 * 3);
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainArr, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xc9e8ff, transparent: true, opacity: 0.28, depthWrite: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  camera.add(rain);
  const rainDrop = Array.from({ length: rainN }, () => ({
    x: (Math.random() - 0.5) * 16,
    y: Math.random() * 10,
    z: -2 - Math.random() * 16
  }));

  const meshes = ATTRACT_DEFS.map((d) => {
    const m = buildCar(d.color);
    scene.add(m);
    return m;
  });

  const map = mapData(track);
  const shakeRef = { v: 0 };
  let events = [];
  let cars = [];
  let mode = 'attract';
  let raceT = 0;
  let countT = 0;
  let countIdx = 0;
  let frozen = null;
  let camPos = new THREE.Vector3();
  let look = new THREE.Vector3();
  let camReady = false;
  const clockMarks = [0, 0.8, 1.6, 2.4];
  const clockLabels = ['3', '2', '1', 'GO'];

  function paint(mesh, hex) {
    const c = new THREE.Color(hex);
    mesh.userData.trim.color.copy(c);
    mesh.userData.trim.emissive.copy(c);
  }
  function placeAttract() {
    mode = 'attract';
    frozen = null;
    track.finish = false;
    track.laps = LAPS_DEFAULT;
    cars = ATTRACT_DEFS.map((d, i) => {
      const s = (track.len * i) / ATTRACT_DEFS.length;
      const pose = poseAt(track, s, (i - 1.5) * 2.2);
      const car = makeCarState({ ...d, stats: attractStats(i), phase: i * 1.7, weave: 0.8, caution: 0.95, you: i === 0 }, pose);
      car.speed = 55 + i * 4;
      car.mesh = meshes[i];
      paint(meshes[i], d.color);
      meshes[i].visible = true;
      return car;
    });
  }
  placeAttract();

  function resize() {
    const w = Math.max(1, canvas.clientWidth || canvas.parentElement?.clientWidth || 1);
    const h = Math.max(1, canvas.clientHeight || canvas.parentElement?.clientHeight || 1);
    const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function updateFx(car) {
    const speed = car ? car.speed : 0;
    const boost = !!(car && car.boosting);
    const k = clamp((speed - 28) / 55, 0, 1);
    const intensity = clamp(k + (boost ? 0.55 : 0), 0, 1);
    lineMat.opacity = intensity * 0.65;
    lineMat.color.set(boost ? 0xff2e88 : 0xeaf2ff);
    const attr = lineGeo.getAttribute('position');
    for (let i = 0; i < lineN; i++) {
      const s = lineSeed[i];
      s.r += 0.012 + intensity * 0.05;
      if (s.r > 2.4) s.r = 0.25;
      const rad = 0.55 + s.r;
      const len = 0.12 + intensity * (0.35 + s.r * 0.25);
      const x = Math.cos(s.a) * rad * 1.35;
      const y = Math.sin(s.a) * rad * 0.62;
      const z = -1.2 - (s.r * 0.45);
      attr.setXYZ(i * 2, x, y, z);
      attr.setXYZ(i * 2 + 1, x + Math.cos(s.a) * len, y + Math.sin(s.a) * len * 0.55, z - len * 0.45);
    }
    attr.needsUpdate = true;
    speedLines.visible = intensity > 0.04;

    const rp = rainGeo.getAttribute('position');
    for (let i = 0; i < rainN; i++) {
      const d = rainDrop[i];
      d.y -= 0.28 + speed * 0.01;
      d.z += 0.05;
      if (d.y < -1 || d.z > -0.5) {
        d.y = 6 + Math.random() * 4;
        d.z = -4 - Math.random() * 14;
        d.x = (Math.random() - 0.5) * 18;
      }
      rp.setXYZ(i * 2, d.x, d.y, d.z);
      rp.setXYZ(i * 2 + 1, d.x + (Math.random() - 0.5) * 0.05, d.y - 0.45, d.z + 0.15);
    }
    rp.needsUpdate = true;
  }

  function updateCamera(dt, car) {
    if (!car) return;
    const back = 6.1, up = 2.05;
    const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
    const desired = new THREE.Vector3(
      car.x - fx * back + Math.cos(car.yaw) * car.steerV * 0.35,
      car.y + up,
      car.z - fz * back - Math.sin(car.yaw) * car.steerV * 0.35
    );
    const lookAt = new THREE.Vector3(
      car.x + fx * 11,
      car.y + 0.85,
      car.z + fz * 11
    );
    const damp = 1 - Math.pow(0.0016, Math.max(0.001, dt));
    if (!camReady) { camPos.copy(desired); look.copy(lookAt); camReady = true; }
    camPos.lerp(desired, damp);
    look.lerp(lookAt, damp);
    const boost = car.boosting ? 0.07 : 0;
    shakeRef.v = Math.max(boost, shakeRef.v - dt * 0.9);
    const mag = shakeRef.v;
    camera.position.set(
      camPos.x + (Math.random() - 0.5) * mag,
      camPos.y + (Math.random() - 0.5) * mag * 0.6,
      camPos.z + (Math.random() - 0.5) * mag
    );
    camera.lookAt(look);
    camera.fov += ((68 + clamp(car.speed / 8, 0, 12) + (car.boosting ? 7 : 0)) - camera.fov) * Math.min(1, dt * 4);
    camera.updateProjectionMatrix();
  }

  function syncMesh(car, dt) {
    const m = car.mesh;
    if (!m) return;
    m.visible = true;
    m.position.set(car.x, car.y, car.z);
    const ahead = sampleAt(track, car.s + 4);
    const pitch = Math.atan2((ahead.a.y - car.y), 4);
    m.rotation.order = 'YXZ';
    m.rotation.set(pitch * 0.9, car.yaw, -car.steerV * 0.09 - car.slip * 0.012);
    const spin = car.speed / 0.36 * dt;
    m.userData.spins.forEach((w) => { w.rotation.x += spin; });
    m.userData.pivots.forEach((p) => { p.rotation.y = -car.steerV * 0.32; });
    const flame = car.boosting ? 0.85 : 0;
    m.userData.flames.forEach((f) => {
      f.material.opacity = flame * (0.55 + Math.random() * 0.45);
      f.scale.set(1, 0.7 + Math.random() * 0.8 + (car.boosting ? 0.6 : 0), 1);
    });
    m.userData.tail.emissiveIntensity = car.boosting ? 4 : 2.2;
    if (m.children) {
      const spot = m.children.find((c) => c.isSpotLight);
      if (spot) spot.intensity = 30 + (car.boosting ? 18 : 0);
    }
  }

  function snapshot() {
    const player = cars.find((c) => c.you) || cars[0];
    const racing = mode === 'run' || mode === 'count' || mode === 'done';
    let playerSnap = null;
    if (player && racing) {
      let dist = player.s - player.lapStartS;
      if (dist < 0) dist += track.len;
      const frac = clamp(dist / track.len, 0, 1);
      const delta = player.best ? player.lapMs - player.best * frac : 0;
      let aheadGap = null, aheadPos = player.lastPos;
      let bestLead = Infinity, leaderGap = null;
      for (const o of cars) {
        if (o === player) continue;
        const gap = progressOf(track, o) - progressOf(track, player);
        if (gap > 0 && gap < bestLead) { bestLead = gap; aheadGap = o; }
      }
      let gapText = '—', gapPos = Math.max(1, (player.lastPos || 1) - 1);
      if (aheadGap) {
        gapText = '+' + (bestLead / Math.max(14, player.speed)).toFixed(2);
        gapPos = Math.max(1, (player.lastPos || 2) - 1);
      } else {
        let bd = Infinity, behind = null;
        for (const o of cars) {
          if (o === player) continue;
          const gap = progressOf(track, player) - progressOf(track, o);
          if (gap > 0 && gap < bd) { bd = gap; behind = o; }
        }
        if (behind) {
          gapText = '−' + (bd / Math.max(14, player.speed)).toFixed(2);
          gapPos = 2;
        }
        void leaderGap;
      }
      playerSnap = {
        speed: player.speed,
        boost: player.boost,
        boosting: player.boosting,
        lap: Math.min(track.laps, player.completed + 1),
        laps: track.laps,
        lapMs: player.lapMs,
        best: player.best || 0,
        delta,
        pos: player.lastPos || rankOf(track, cars, player),
        total: cars.length,
        gapText, gapPos,
        u: (player.s / track.len) % 1,
        damage: { ...player.dmg },
        wrong: player.wrong,
        off: player.off,
        finished: mode === 'done',
        topKmh: player.topKmh,
        overtakes: player.overtakes,
        boosts: player.boosts
      };
    }
    const ev = events;
    events = [];
    return {
      mode,
      player: playerSnap,
      rivals: cars.filter((c) => !c.you).map((c) => ({ u: (c.s / track.len) % 1, color: c.color, name: c.name })),
      events: ev,
      results: frozen
    };
  }

  function buildResults() {
    const ranked = cars.slice().sort((a, b) => {
      if (a.finishMs != null && b.finishMs != null) return a.finishMs - b.finishMs;
      if (a.finishMs != null) return -1;
      if (b.finishMs != null) return 1;
      return progressOf(track, b) - progressOf(track, a);
    });
    const winner = ranked[0];
    const winT = winner.finishMs != null ? winner.finishMs : track.raceMs;
    return ranked.map((c) => {
      let time = c.finishMs;
      if (time == null) {
        const gapM = Math.max(0, progressOf(track, winner) - progressOf(track, c));
        time = winT + (gapM / Math.max(28, c.speed)) * 1000;
      }
      return {
        name: c.name,
        car: c.carName,
        color: c.color,
        you: !!c.you,
        finishMs: time,
        gapMs: Math.max(0, time - winT),
        laps: c.lapTimes.slice(),
        best: c.lapTimes.length ? Math.min(...c.lapTimes) : 0,
        topKmh: c.topKmh,
        overtakes: c.overtakes,
        boosts: c.boosts
      };
    });
  }

  function stepRun(dt, input) {
    raceT += dt;
    track.raceMs += dt * 1000;
    const player = cars.find((c) => c.you);
    for (const car of cars) {
      if (!car.you && player && mode === 'run') {
        const gap = progressOf(track, player) - progressOf(track, car);
        car.band = 1 + clamp(gap / 260, -1, 1) * 0.08;
      } else car.band = 1;
      car.draft = drafting(track, cars, car);
      const inp = (car.you && !BOT) ? input : aiInput(track, cars, car, raceT);
      stepCar(track, car, inp || {}, dt, events, shakeRef, true);
    }
    collide(track, cars, events, shakeRef, true);
    if (track.finish && mode === 'run') {
      mode = 'done';
      const playerNow = cars.find((c) => c.you);
      if (playerNow && playerNow.finishMs == null) playerNow.finishMs = track.raceMs;
      frozen = buildResults();
      events.push({ type: 'finish' });
    }
    // Positions + overtake toasts after integration.
    for (const car of cars) {
      const p = rankOf(track, cars, car);
      if (car.you && car.lastPos && p !== car.lastPos && mode === 'run' && raceT - (car.lastPosT || 0) > 0.7) {
        car.lastPosT = raceT;
        if (p < car.lastPos) {
          car.overtakes++;
          events.push({ type: 'toast', toast: { type: 'ok', title: 'Overtake', msg: 'You moved up to P' + p + '.' } });
        } else {
          events.push({ type: 'toast', toast: { type: 'warn', title: 'Position lost', msg: 'Dropped to P' + p + '.' } });
        }
      }
      car.lastPos = p;
    }
  }

  function stepCount(dt) {
    countT += dt;
    if (countIdx < clockLabels.length && countT >= clockMarks[countIdx]) {
      events.push({ type: 'count', label: clockLabels[countIdx] });
      if (clockLabels[countIdx] === 'GO') mode = 'run';
      countIdx++;
    }
  }

  function stepAttract(dt) {
    raceT += dt;
    for (const car of cars) {
      car.band = 1;
      car.draft = false;
      const inp = aiInput(track, cars, car, raceT);
      stepCar(track, car, inp, dt, events, shakeRef, false);
      // Keep attract cars looping without lap bookkeeping.
      if (car.s < 0) car.s += track.len;
    }
    collide(track, cars, events, shakeRef, false);
    events.length = 0;
  }

  function frame(dt, input, paused) {
    const step = paused ? 0 : Math.min(0.05, Math.max(0, dt));
    if (step > 0) {
      if (mode === 'attract') stepAttract(step);
      else if (mode === 'count') stepCount(step);
      else if (mode === 'run') stepRun(step, input || {});
    }
    const focus = (mode === 'attract') ? cars[0] : (cars.find((c) => c.you) || cars[0]);
    const visualDt = Math.min(0.05, Math.max(0.001, dt));
    cars.forEach((c) => syncMesh(c, visualDt));
    updateCamera(visualDt, focus);
    updateFx(focus);
    renderer.render(scene, camera);
    return snapshot();
  }

  function startRace(cfg) {
    const list = cfg.cars;
    track.laps = cfg.laps || LAPS_DEFAULT;
    track.raceMs = 0;
    track.finish = false;
    frozen = null;
    countT = 0;
    countIdx = 0;
    raceT = 0;
    shakeRef.v = 0;
    const base = 42;
    cars = list.map((def, slot) => {
      const s = base - slot * 8;
      const lane = (slot % 2 === 0 ? -1 : 1) * 2.5;
      const pose = poseAt(track, s, lane);
      const car = makeCarState({ ...def, phase: slot * 1.3 + 0.4 }, pose);
      car.mesh = meshes[slot];
      paint(meshes[slot], def.color);
      meshes[slot].visible = true;
      return car;
    });
    for (let i = list.length; i < meshes.length; i++) meshes[i].visible = false;
    mode = 'count';
    camReady = false;
  }

  function endRace() {
    placeAttract();
    camReady = false;
  }

  // Warm up one frame so the menu has a city behind it.
  frame(0.016, {}, false);

  return { frame, startRace, endRace, map, resize };
}
