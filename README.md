# particle-universe-threejs
Interactive 3D particle universe built with Three.js — GLSL liquid-shader sphere, GPU particles, cinematic bloom, and scroll-controlled camera.

# Particle Universe — Three.js

Interactive 3D particle universe built with Three.js — a GLSL liquid-shader sphere, GPU-animated particles, cinematic bloom, and a scroll-controlled camera.

![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Overview

A fully real-time WebGL scene — no pre-rendered video. Every effect (the sphere's liquid surface, particle drift, glow, and camera motion) is computed live on the GPU, frame by frame.

## 🚀 The Advanced Additions

- **GLSL shaders / liquid distortion** — the sphere's surface deforms in real time using simplex noise in a custom vertex shader, not a static mesh.
- **Interactive 3D models** — six small orbiting satellites you can hover (raycasted, they light up and scale) and click (they pulse).
- **Scroll-controlled camera** — as you scroll, the camera dollies out, rises, and rotates around the scene, blended smoothly with mouse parallax and drag.
- **Cinematic post-processing** — `UnrealBloomPass` plus a custom `ShaderPass` for vignette, chromatic aberration, and film grain.
- **Custom loading animation** — a conic-gradient progress ring with a live percentage counter, fading out once ready.

## 🪐 Core Scene

- Liquid-distorted sphere with a fresnel-lit neon rim
- Pulsing wireframe energy shell that breathes independently around the core
- 3,000-particle galaxy, animated entirely on the GPU via shader displacement
- Two counter-rotating rings
- Three dynamic colored point lights orbiting the scene
- Volumetric exponential fog for depth
- Mouse-responsive camera (parallax + drag-to-rotate + scroll wheel zoom)
- Continuous, seamless animation loop

## 📂 Project Structure

```
particle-universe-threejs/
├── index.html    # Page structure, loader markup, CDN script tags
├── style.css     # Loader, hero, glass cards, scroll-reveal, responsive layout
├── script.js     # Full Three.js scene, shaders, post-processing, camera logic
└── README.md
```

## 🛠️ Tech Stack

- [Three.js](https://threejs.org/) r128
- Custom GLSL vertex/fragment shaders
- Three.js post-processing addons: `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`
- Vanilla HTML, CSS, and JavaScript — no build step, no framework

## ▶️ Running Locally

The post-processing addons are loaded from a CDN at runtime, which some browsers block over CORS when a file is opened directly (`file://`). Serve the folder with a local server instead:

**Option 1 — Node**
```bash
npx serve .
```

**Option 2 — Python**
```bash
python3 -m http.server 8000
```

**Option 3 — VS Code**
Install the "Live Server" extension, right-click `index.html`, and choose **Open with Live Server**.

Then open the printed local URL (e.g. `http://localhost:8000`) in your browser.

## 🎮 Controls

| Action | Effect |
|---|---|
| Move mouse | Camera parallax tilt |
| Click + drag | Rotate the scene |
| Scroll wheel | Zoom camera distance |
| Scroll page | Fly-through camera animation |
| Hover a satellite | Glow + scale up |
| Click a satellite | Pulse animation |

## ⚡ Performance Note

This scene is GPU-intensive (a 5-level subdivided noise-displaced sphere, 3,000 shader-driven particles, bloom, and a full-screen cinematic shader pass every frame). It runs smoothly on modern discrete or integrated GPUs, but may lag on older hardware or budget mobile devices.

## 📄 License

Free to use, fork, and modify for personal or commercial projects.

## 🙌 Credits

Simplex noise implementation adapted from the widely-used Ashima Arts / Ian McEwan GLSL noise utility.