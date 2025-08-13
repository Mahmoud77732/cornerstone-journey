# Simple Cornerstone 3D DICOM Viewer

A minimal **Cornerstone3D** DICOM viewer built with [@cornerstonejs/core](https://www.cornerstonejs.org/) and [@cornerstonejs/dicom-image-loader](https://github.com/cornerstonejs/cornerstone3D-beta/tree/main/packages/dicom-image-loader), running with **Vite**.

This project demonstrates how to load and display DICOM images directly in the browser using Cornerstone's modern 3D rendering engine.

---

## ✨ Features

* Load and view DICOM images with Cornerstone3D's Rendering Engine
* Uses **@cornerstonejs/core** + **@cornerstonejs/dicom-image-loader**
* Runs entirely in the browser
* Vite-based development setup for fast refresh

---

## 📦 Installation

1. **Install dependencies:**

```bash
npm install @cornerstonejs/core
npm install @cornerstonejs/tools
npm install @cornerstonejs/dicom-image-loader
npm install @cornerstonejs/nifti-volume-loader
npm install @icr/polyseg-wasm
npm install vite
npm install @originjs/vite-plugin-commonjs
```

2. **Project structure:**

```
project-folder/
│
├── index.html             # HTML page with viewer container
├── main.js                # Cornerstone3D viewer code
├── vite.config.ts         # Vite configuration
|── public/ 
├──   IMG-0001-00001.dcm   # Example DICOM file (replace with your own)
|──   CTImage.dcm
└── README.md              # Documentation
```

3. **Run the development server:**

```bash
npm install
npx vite
```

4. **Open in your browser:**

```
http://localhost:5173
```

---

## 📂 Code Overview

**main.js**

* Initializes Cornerstone Core and DICOM Image Loader
* Creates a rendering engine and stack viewport
* Loads a DICOM image (`wadouri:/IMG-0001-00001.dcm`) and renders it

```javascript
await coreInit();
await dicomImageLoaderInit();

const imageId = 'wadouri:/IMG-0001-00001.dcm';
const renderingEngine = new RenderingEngine('myRenderingEngine');
renderingEngine.enableElement({ viewportId, element, type: Enums.ViewportType.STACK });
const viewport = renderingEngine.getViewport(viewportId);
viewport.setStack([imageId], 0);
viewport.render();
```

**vite.config.ts**

* Configures Vite to work with CommonJS modules like `dicom-parser`

```ts
import { defineConfig } from 'vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig({
  plugins: [viteCommonjs()],
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: ['dicom-parser'],
  },
  worker: { format: 'es' },
});
```

---

## ⚠️ Notes & Troubleshooting

* The path `wadouri:/IMG-0001-00001.dcm` expects the DICOM file to be in the project root.
* You must run via a local server (Vite handles this).
* If images don't load, check your browser's console for CORS or file path issues.
* Privacy-focused browsers may block local file loads; disable protections during testing.

---

## 📚 References

* [Cornerstone3D Documentation](https://www.cornerstonejs.org/)
* [@cornerstonejs/dicom-image-loader](https://github.com/cornerstonejs/cornerstone3D-beta/tree/main/packages/dicom-image-loader)
* [dicom-parser](https://github.com/cornerstonejs/dicomParser)
