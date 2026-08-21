/* ==========================================================
   ADVANCED THREE.JS SCENE — Particle Universe
   Liquid shader sphere · wireframe shell · 3,000 particles
   rings · dynamic lights · fog · mouse + scroll camera
   interactive satellites · cinematic post-processing · loader
   ========================================================== */

let scene, camera, renderer, composer, cinematicPass;
let sphereGroup, sphereMat, shellMesh;
let particleSystem, ring1, ring2;
let satellites = [];
let raycaster, ndcMouse;
let hoveredSatellite = null;

let mouseX = 0, mouseY = 0;
let targetRotX = 0, targetRotY = 0;
let dragging = false, lastX = 0, lastY = 0, camDist = 14;
const clock = new THREE.Clock();

initScene();
runLoader();
animate();
initScrollReveal();

/* ==========================================================
   SCENE SETUP
   ========================================================== */
function initScene() {
    const canvas = document.getElementById('bg');

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05010f, 0.021);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, camDist);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    buildLights();
    buildLiquidSphere();
    buildWireframeShell();
    buildRings();
    buildParticleGalaxy();
    buildSatellites();
    buildComposer();
    bindEvents();
}

/* ---------- Dynamic lights ---------- */
function buildLights() {
    const ambient = new THREE.AmbientLight(0x332255, 1.1);
    scene.add(ambient);

    const l1 = new THREE.PointLight(0xff59d6, 3, 40);
    l1.position.set(6, 5, 6);
    scene.add(l1);

    const l2 = new THREE.PointLight(0x4dd8ff, 3, 40);
    l2.position.set(-6, -4, -4);
    scene.add(l2);

    const l3 = new THREE.PointLight(0x9d6bff, 2.5, 40);
    l3.position.set(0, 6, -6);
    scene.add(l3);

    window.__lights = [l1, l2, l3];
}

/* ---------- Liquid GLSL shader sphere ---------- */
function buildLiquidSphere() {
    const geo = new THREE.IcosahedronGeometry(2.1, 5);

    sphereMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uDistort: { value: 0.35 },
            uColorA: { value: new THREE.Color(0xff3fd8) },
            uColorB: { value: new THREE.Color(0x4dd8ff) }
        },
        vertexShader: `
      uniform float uTime;
      uniform float uDistort;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vNoise;

      // --- Ashima simplex noise (3D) ---
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
        vec3 glow = baseColor * fresnel * 2.2;
        vec3 finalColor = baseColor * 0.35 + glow;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
    });

    const core = new THREE.Mesh(geo, sphereMat);
    sphereGroup = new THREE.Group();
    sphereGroup.add(core);
    scene.add(sphereGroup);
}

/* ---------- Wireframe energy shell ---------- */
function buildWireframeShell() {
    const geo = new THREE.IcosahedronGeometry(2.5, 1);
    const mat = new THREE.MeshBasicMaterial({
        color: 0x7fe7ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    shellMesh = new THREE.Mesh(geo, mat);
    sphereGroup.add(shellMesh);
}

/* ---------- Orbiting rings ---------- */
function buildRings() {
    ring1 = makeRing(3.5, 0xff6ec7, 0.02);
    ring1.rotation.x = Math.PI / 2.2;
    scene.add(ring1);

    ring2 = makeRing(4.2, 0x4dd8ff, 0.015);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    function makeRing(radius, color, tube) {
        const geo = new THREE.TorusGeometry(radius, tube, 16, 120);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
        return new THREE.Mesh(geo, mat);
    }
}

/* ---------- 3,000-particle GPU galaxy ---------- */
function buildParticleGalaxy() {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const palette = [
        new THREE.Color(0xff6ec7),
        new THREE.Color(0x7c4dff),
        new THREE.Color(0x48c6ef),
        new THREE.Color(0xffe66d),
        new THREE.Color(0x6effb0)
    ];

    for (let i = 0; i < count; i++) {
        const radius = 5 + Math.random() * 24;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const flatten = Math.random() < 0.7 ? 0.35 : 1;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi) * flatten * 0.4;
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

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
        pos.x += sin(uTime * 0.35 + position.z * 0.4) * 0.6;
        pos.y += cos(uTime * 0.3 + position.x * 0.4) * 0.6;
        pos.z += sin(uTime * 0.25 + position.y * 0.4) * 0.6;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * uPixelRatio * (260.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, glow);
      }
    `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geo, mat);
    scene.add(particleSystem);
}

/* ---------- Interactive orbiting satellites ---------- */
function buildSatellites() {
    const count = 6;
    const colors = [0xff6ec7, 0x48c6ef, 0x7c4dff, 0xffe66d, 0x6effb0, 0xff9f4d];

    for (let i = 0; i < count; i++) {
        const geo = new THREE.IcosahedronGeometry(0.32, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: colors[i % colors.length],
            emissive: colors[i % colors.length],
            emissiveIntensity: 0.6,
            metalness: 0.4,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(geo, mat);

        mesh.userData = {
            radius: 5 + Math.random() * 2.5,
            speed: 0.15 + Math.random() * 0.2,
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
        1.2,   // strength
        0.45,  // radius
        0.15   // threshold
    );
    composer.addPass(bloom);
    window.__bloom = bloom;

    // Custom cinematic pass: vignette + chromatic aberration + film grain
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

        vec2 offset = dir * dist * 0.0018;
        float r = texture2D(tDiffuse, uv - offset).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv + offset).b;
        vec3 color = vec3(r, g, b);

        float vignette = smoothstep(0.95, 0.35, dist);
        color *= vignette;

        float grain = (fract(sin(dot(uv * uResolution.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.035;
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
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

        ndcMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        ndcMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (dragging) {
            targetRotY += (e.clientX - lastX) * 0.005;
            targetRotX += (e.clientY - lastY) * 0.005;
            lastX = e.clientX; lastY = e.clientY;
        }
    });

    renderer.domElement.addEventListener('mousedown', e => {
        dragging = true; lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => dragging = false);

    renderer.domElement.addEventListener('wheel', e => {
        camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.01, 6, 30);
    }, { passive: true });

    renderer.domElement.addEventListener('click', () => {
        if (hoveredSatellite) hoveredSatellite.userData.pulse = 1;
    });

    renderer.domElement.addEventListener('touchstart', e => {
        dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }, { passive: true });
    renderer.domElement.addEventListener('touchend', () => dragging = false);
    renderer.domElement.addEventListener('touchmove', e => {
        targetRotY += (e.touches[0].clientX - lastX) * 0.005;
        targetRotX += (e.touches[0].clientY - lastY) * 0.005;
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }, { passive: true });
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    sphereGroup.rotation.y += 0.003;

    // Wireframe shell breathes
    const breathe = 1 + Math.sin(t * 1.4) * 0.04;
    shellMesh.scale.set(breathe, breathe, breathe);
    shellMesh.material.opacity = 0.4 + Math.sin(t * 1.4) * 0.15;

    // Rings
    ring1.rotation.z += 0.006;
    ring2.rotation.z -= 0.004;

    // Particle galaxy
    particleSystem.material.uniforms.uTime.value = t;
    particleSystem.rotation.y += 0.0009;

    // Orbiting colored lights
    const [l1, l2, l3] = window.__lights;
    l1.position.set(Math.sin(t * 0.6) * 7, Math.cos(t * 0.4) * 5, Math.cos(t * 0.6) * 7);
    l2.position.set(Math.cos(t * 0.5) * -7, Math.sin(t * 0.5) * 4, Math.sin(t * 0.3) * -7);
    l3.position.set(Math.sin(t * 0.4) * 4, 6 + Math.sin(t * 0.7) * 2, Math.cos(t * 0.4) * -6);

    // Interactive satellites: orbit + hover raycast + click pulse
    updateSatellites(t);

    // Cinematic pass time (film grain)
    cinematicPass.uniforms.uTime.value = t;

    // Camera: mouse parallax + drag orbit + scroll-driven fly-through
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
            Math.cos(angle) * d.radius,
            Math.sin(d.tilt) * 2 + Math.sin(angle * 1.3) * 1.2,
            Math.sin(angle) * d.radius
        );

        const targetScale = (sat === hoveredSatellite ? 1.6 : 1) + d.pulse;
        d.hoverScale += (targetScale - d.hoverScale) * 0.15;
        sat.scale.setScalar(d.hoverScale);
        d.pulse *= 0.9;

        sat.material.emissiveIntensity = sat === hoveredSatellite ? 1.4 : 0.6;
    });
}

function updateCamera(t) {
    const scrollMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const scrollProgress = THREE.MathUtils.clamp(window.scrollY / scrollMax, 0, 1);

    const autoY = t * 0.05;
    const scrollAngle = scrollProgress * Math.PI * 1.4;
    const dist = camDist + scrollProgress * 7;
    const height = 2 + scrollProgress * 5;

    const angle = targetRotY + autoY + scrollAngle;
    camera.position.x = Math.sin(angle) * dist + mouseX * 1.2;
    camera.position.z = Math.cos(angle) * dist;
    camera.position.y = height + Math.sin(targetRotX) * 4 - mouseY * 1.5;
    camera.lookAt(0, 0, 0);
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
    const targets = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    targets.forEach(el => observer.observe(el));
}