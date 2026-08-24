# 3D Motion — Advanced Three.js Experience

A shader-driven 3D landing page built with Three.js — a liquid-distortion sphere, GPU-animated particles, interactive orbiting satellites, and cinematic post-processing, wrapped in a polished, scroll-reveal marketing UI.

![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Overview

Every visual effect on this page runs live on the GPU — nothing is a pre-rendered video or static image. The liquid sphere deforms in real time, the particle field drifts continuously, and the camera responds to both your mouse and your scroll position as you move through the page.

## 🚀 Features

- **Liquid Shader Sphere** — a custom GLSL vertex shader deforms the core in real time using simplex noise, with a fresnel-lit neon rim in the fragment shader.
- **Wireframe Energy Shell** — a counter-rotating, breathing wireframe shell wraps the liquid core.
- **3,000-Particle Field** — a GPU-animated point cloud drifts through space using per-vertex shader displacement.
- **Floating Rings** — five independently rotating rings orbit the central sphere.
- **Dynamic Lighting** — colored point lights orbit the scene, catching the shell and rings as they pass.
- **Interactive Satellites** — six small orbiting models glow and scale on raycasted hover, and pulse on click.
- **Cinematic Post-Processing** — `UnrealBloomPass` plus a custom `ShaderPass` for vignette, chromatic aberration, and film grain.
- **Mouse & Scroll Camera** — the camera drifts with your cursor and dollies through the scene as you scroll.
- **Custom Loading Animation** — a conic-gradient progress ring with a live percentage counter, fading out once ready.
- **Scroll-Reveal UI** — sections and cards fade and rise into view via `IntersectionObserver`.
- **3D Card Tilt** — feature cards tilt toward the cursor on hover, each with its own accent color and animated glowing border.

## 📂 Project Structure

```
3d-motion-threejs/
├── index.html    # Page structure: nav, hero, feature cards, CTA, footer, loader
├── style.css     # All styling: hero, cards, CTA, loader, responsive layout
├── script.js     # Full Three.js scene, shaders, post-processing, camera + UI logic
└── README.md
```

## 🛠️ Tech Stack

- [Three.js](https://threejs.org/) r128
- Custom GLSL vertex/fragment shaders
- Three.js post-processing addons: `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`
- Vanilla HTML, CSS, and JavaScript — no build step, no framework

## ▶️ Running Locally

The post-processing addons load from a CDN at runtime, which some browsers block over CORS when the file is opened directly (`file://`). Serve the folder with a local server instead:

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

| Action               | Effect                      |
| -------------------- | --------------------------- |
| Move mouse           | Camera parallax drift       |
| Click + drag         | Rotate the camera           |
| Scroll page          | Dolly/rise camera animation |
| Hover a satellite    | Glow + scale up             |
| Click a satellite    | Pulse animation             |
| Hover a feature card | 3D tilt + glowing border    |

## ⚡ Performance Note

This scene is GPU-intensive: a 5-level subdivided noise-displaced sphere, 3,000 shader-driven particles, bloom, and a full-screen cinematic shader pass every frame. It runs smoothly on modern discrete or integrated GPUs, but may lag on older hardware or budget mobile devices.

## 📄 License

Free to use, fork, and modify for personal or commercial projects.

## 🙌 Credits

Simplex noise implementation adapted from the widely-used Ashima Arts / Ian McEwan GLSL noise utility.
