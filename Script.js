/* ==========================================================
   ADVANCED THREE.JS SCENE — 3D Motion Experience
   Liquid shader sphere · wireframe shell · 3,000 GPU particles
   floating rings · dynamic lights · interactive satellites
   cinematic post-processing · mouse + scroll camera · loader
   ========================================================== */

let scene, camera, renderer, composer, cinematicPass;
let sphereGroup, sphereMat, wireSphere;
let particles, rings = [];
let satellites = [];
let raycaster, ndcMouse;
let hoveredSatellite = null;

let mouseX = 0, mouseY = 0;
let targetRotX = 0, targetRotY = 0;
let dragging = false, lastX = 0, lastY = 0, camDist = 7;

const anchor = new THREE.Vector3(2.1, 0.1, 0); // main sphere sits off-center, matching the hero layout
const clock = new THREE.Clock();

initScene();
runLoader();
animate();
initScrollReveal();
initCardTilt();

/* ==========================================================
   SCENE SETUP
   ========================================================== */
function initScene() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02030a, 0.035);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = camDist;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    buildLights();
    buildLiquidSphere();
    buildWireframeShell();
    buildParticleField();
    buildRings();
    buildSatellites();
    buildComposer();
    bindEvents();
}

/* ---------- Dynamic lights ---------- */
function buildLights() {
    scene.add(new THREE.AmbientLight(0x6d5cff, 1.5));

    const l1 = new THREE.PointLight(0x00d9ff, 25, 15);
    l1.position.set(3, 3, 4);
    scene.add(l1);

    const l2 = new THREE.PointLight(0xff20d0, 20, 15);
    l2.position.set(-4, -2, 3);
    scene.add(l2);

    window.__lights = [l1, l2];
}

/* ---------- Liquid GLSL shader sphere ---------- */
function buildLiquidSphere() {
    const geo = new THREE.IcosahedronGeometry(1.65, 5);

    sphereMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uDistort: { value: 0.28 },
            uColorA: { value: new THREE.Color(0x8b5cff) },
            uColorB: { value: new THREE.Color(0x00d9ff) }
        },
        vertexShader: `
      uniform float uTime;
      uniform float uDistort;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vNoise;

      vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
      vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        float n = snoise(position * 1.6 + uTime * 0.25);
        vNoise = n;
        vec3 displaced = position + normal * n * uDistort;

        vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
        vPosition = worldPosition.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
        fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vNoise;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.4);

        vec3 baseColor = mix(uColorA, uColorB, (vNoise + 1.0) * 0.5);
        vec3 glow = baseColor * fresnel * 2.0;
        vec3 finalColor = baseColor * 0.4 + glow;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
    });

    const core = new THREE.Mesh(geo, sphereMat);
    sphereGroup = new THREE.Group();
    sphereGroup.add(core);
    sphereGroup.position.copy(anchor);
    scene.add(sphereGroup);
}

/* ---------- Wireframe energy shell ---------- */
function buildWireframeShell() {
    const geo = new THREE.IcosahedronGeometry(1.78, 3);
    const mat = new THREE.MeshBasicMaterial({
        color: 0x00d9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.2
    });
    wireSphere = new THREE.Mesh(geo, mat);
    wireSphere.position.copy(anchor);
    scene.add(wireSphere);
}

/* ---------- GPU-animated particle field ---------- */
function buildParticleField() {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const palette = [
        new THREE.Color(0x00d9ff),
        new THREE.Color(0x8b5cff),
        new THREE.Color(0xff36c8),
        new THREE.Color(0x55ddff)
    ];

    for (let i = 0; i < count; i++) {
        const radius = 4 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        sizes[i] = Math.random() * 2 + 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
      attribute vec3 color;
      attribute float aSize;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;

      void main() {
        vColor = color;
        vec3 pos = position;
        pos.x += sin(uTime * 0.3 + position.z * 0.4) * 0.4;
        pos.y += cos(uTime * 0.25 + position.x * 0.4) * 0.4;
        pos.z += sin(uTime * 0.2 + position.y * 0.4) * 0.4;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * uPixelRatio * (120.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, glow * 0.85);
      }
    `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geo, mat);
    scene.add(particles);
}

/* ---------- Floating rings ---------- */
function buildRings() {
    for (let i = 0; i < 5; i++) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(2.1 + i * 0.25, 0.008, 8, 160),
            new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0x00d9ff : 0xff36c8,
                transparent: true,
                opacity: 0.3
            })
        );
        ring.position.copy(anchor);
        ring.rotation.x = Math.random() * Math.PI;
        ring.rotation.y = Math.random() * Math.PI;
        scene.add(ring);
        rings.push(ring);
    }
}

/* ---------- Interactive orbiting satellites ---------- */
function buildSatellites() {
    const count = 6;
    const colors = [0x00d9ff, 0xff36c8, 0x8b5cff, 0x55ddff, 0xff8fd8, 0x6effc9];

    for (let i = 0; i < count; i++) {
        const geo = new THREE.IcosahedronGeometry(0.14, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: colors[i % colors.length],
            emissive: colors[i % colors.length],
            emissiveIntensity: 0.7,
            metalness: 0.4,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(geo, mat);

        mesh.userData = {
            radius: 2.6 + Math.random() * 1.4,
            speed: 0.18 + Math.random() * 0.22,
            phase: Math.random() * Math.PI * 2,
            tilt: Math.random() * Math.PI,
            hoverScale: 1,
            pulse: 0
        };

        satellites.push(mesh);
        scene.add(mesh);
    }

    raycaster = new THREE.Raycaster();
    ndcMouse = new THREE.Vector2();
}

/* ---------- Cinematic post-processing ---------- */
function buildComposer() {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));

    const bloom = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.0,   // strength
        0.5,   // radius
        0.2    // threshold
    );
    composer.addPass(bloom);
    window.__bloom = bloom;

    const cinematicShader = {
        uniforms: {
            tDiffuse: { value: null },
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        vec2 dir = uv - 0.5;
        float dist = length(dir);

        vec2 offset = dir * dist * 0.0015;
        float r = texture2D(tDiffuse, uv - offset).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv + offset).b;
        vec3 color = vec3(r, g, b);

        float vignette = smoothstep(1.0, 0.4, dist);
        color *= vignette;

        float grain = (fract(sin(dot(uv * uResolution.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
        color += grain;

        gl_FragColor = vec4(color, 1.0);
      }
    `
    };

    cinematicPass = new THREE.ShaderPass(cinematicShader);
    cinematicPass.renderToScreen = true;
    composer.addPass(cinematicPass);
}

/* ---------- Interaction ---------- */
function bindEvents() {
    window.addEventListener('resize', onResize);

    window.addEventListener('mousemove', e => {
        mouseX = e.clientX / window.innerWidth - 0.5;
        mouseY = e.clientY / window.innerHeight - 0.5;

        ndcMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        ndcMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (dragging) {
            targetRotY += (e.clientX - lastX) * 0.004;
            targetRotX += (e.clientY - lastY) * 0.004;
            lastX = e.clientX; lastY = e.clientY;
        }
    });

    renderer.domElement.addEventListener('mousedown', e => {
        dragging = true; lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => dragging = false);

    renderer.domElement.addEventListener('click', () => {
        if (hoveredSatellite) hoveredSatellite.userData.pulse = 1;
    });

    window.addEventListener('resize', onResize);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(window.innerWidth, window.innerHeight);
    cinematicPass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
}

/* ==========================================================
   ANIMATION LOOP
   ========================================================== */
function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Liquid sphere
    sphereMat.uniforms.uTime.value = t;
    sphereGroup.rotation.x = t * 0.18;
    sphereGroup.rotation.y = t * 0.25;

    // Wireframe shell counter-rotates, breathes
    wireSphere.rotation.x = -t * 0.12;
    wireSphere.rotation.y = t * 0.18;
    const breathe = 1 + Math.sin(t * 1.2) * 0.05;
    wireSphere.scale.set(breathe, breathe, breathe);

    // Float the sphere + shell together
    sphereGroup.position.y = anchor.y + Math.sin(t * 0.7) * 0.15;
    wireSphere.position.y = sphereGroup.position.y;

    // Particle field
    particles.material.uniforms.uTime.value = t;
    particles.rotation.y = t * 0.025;
    particles.rotation.x = Math.sin(t * 0.1) * 0.1;

    // Rings
    rings.forEach((ring, i) => {
        ring.rotation.x += 0.0015 * (i + 1);
        ring.rotation.y += 0.002 * (i + 1);
        ring.rotation.z = Math.sin(t * 0.4 + i) * 0.25;
    });

    // Dynamic lights orbit the sphere
    const [l1, l2] = window.__lights;
    l1.position.set(anchor.x + Math.sin(t) * 4, Math.cos(t) * 3, Math.sin(t * 0.6) * 3);
    l2.position.set(anchor.x + Math.cos(t * 0.7) * 4, Math.sin(t * 0.7) * 3, Math.cos(t * 0.5) * 3);

    // Interactive satellites
    updateSatellites(t);

    // Cinematic grain time
    cinematicPass.uniforms.uTime.value = t;

    // Camera: mouse drift + drag + scroll-driven dolly
    updateCamera(t);

    composer.render();
}

function updateSatellites(t) {
    raycaster.setFromCamera(ndcMouse, camera);
    const hits = raycaster.intersectObjects(satellites);
    hoveredSatellite = hits.length > 0 ? hits[0].object : null;

    satellites.forEach(sat => {
        const d = sat.userData;
        const angle = t * d.speed + d.phase;
        sat.position.set(
            anchor.x + Math.cos(angle) * d.radius,
            anchor.y + Math.sin(d.tilt) * 1.2 + Math.sin(angle * 1.3) * 0.8,
            Math.sin(angle) * d.radius
        );

        const targetScale = (sat === hoveredSatellite ? 1.8 : 1) + d.pulse;
        d.hoverScale += (targetScale - d.hoverScale) * 0.15;
        sat.scale.setScalar(d.hoverScale);
        d.pulse *= 0.9;

        sat.material.emissiveIntensity = sat === hoveredSatellite ? 1.6 : 0.7;
    });
}

function updateCamera(t) {
    const scrollMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const scrollProgress = THREE.MathUtils.clamp(window.scrollY / scrollMax, 0, 1);

    // Base mouse drift + drag offset (smoothed)
    const targetX = mouseX * 0.8 + targetRotY * 2;
    const targetY = mouseY * 0.5 + targetRotX * 1.2;
    camera.position.x += (targetX - camera.position.x) * 0.035;
    camera.position.y += (-targetY - camera.position.y) * 0.035;

    // Scroll-driven dolly + rise
    const targetZ = camDist + scrollProgress * 6;
    camera.position.z += (targetZ - camera.position.z) * 0.05;

    camera.lookAt(0, scrollProgress * 1.5, 0);
}

/* ==========================================================
   CUSTOM LOADER
   ========================================================== */
function runLoader() {
    const loader = document.getElementById('loader');
    const ring = document.getElementById('loaderRing');
    const percentText = document.getElementById('loaderPercent');

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 18 + 6;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => loader.classList.add('loaded'), 250);
        }
        ring.style.setProperty('--p', progress.toFixed(0));
        percentText.textContent = `${progress.toFixed(0)}%`;
    }, 140);
}

/* ==========================================================
   SCROLL REVEAL
   ========================================================== */
function initScrollReveal() {
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ==========================================================
   CARD 3D TILT ON HOVER
   ========================================================== */
function initCardTilt() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = ((y / rect.height) - 0.5) * -8;
            const rotateY = ((x / rect.width) - 0.5) * 8;

            card.style.transform = `
        perspective(900px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-8px)
      `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}