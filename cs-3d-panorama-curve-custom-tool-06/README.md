# Cornerstone DICOM Viewer

This project is a **DICOM Viewer** built with [Cornerstone3D](https://github.com/cornerstonejs/cornerstone3D). It loads CT data and displays **axial** and **sagittal** views with interactive tools.

---

## ✨ Features

* Two synchronized orthographic viewports (Axial, Sagittal)
* Interactive tools:

  * **Window/Level** (Left mouse button)
  * **Zoom** (Right mouse button)
  * **Pan** (Middle mouse button)
  * **Stack Scroll**
* Reset button to restore camera and default VOI range

---

## 📦 Installation

Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Run

Start a local dev server (example with Vite):

```bash
npm run dev

or

npx vite
```

Open in your browser:

```
http://localhost:5173
```

---

## 📂 DICOM Data Setup

> ⚠️ **Note:** DICOM images are **not stored in this repository** to keep it lightweight.

### Steps:

1. Create a local folder for your DICOM series, e.g.:

   ```
   /dicom_images/malocclusion-volume/DICOM/
   ```
2. Place your DICOM slices inside that folder, named as:

   ```
   I0, I1, I2, ... I516
   ```
3. Ensure the image loading path in `main.js` matches your setup:

   ```js
   imageIds.push(`wadouri:/dicom_images/malocclusion-volume/DICOM/I${i}`);
   ```

   Update the `/dicom_images/...` prefix if your environment uses a different path.

---

## 🔧 Configuration

* **Viewport size** (default `500px x 500px`):

  ```js
  element1.style.width = '500px';
  element1.style.height = '500px';
  ```

* **Reset VOI range** (default for CT):

  ```js
  voiRange: { lower: -1000, upper: 3000 }
  ```

---

## 📜 Scripts

* `npm run dev` → Start dev server
* `npm run build` → Build for production
* `npm run preview` → Preview production build

---

## 📌 Dependencies

* [`@cornerstonejs/core`](https://www.npmjs.com/package/@cornerstonejs/core)
* [`@cornerstonejs/tools`](https://www.npmjs.com/package/@cornerstonejs/tools)
* [`@cornerstonejs/dicom-image-loader`](https://www.npmjs.com/package/@cornerstonejs/dicom-image-loader)

---

## 📁 Example Project Structure

```
project-root/
│
├── public/
│   └── dicom_images/
│       └── malocclusion-volume/
│           └── DICOM/
│               ├── I0
│               ├── I1
│               ├── I2
│               └── ...
│
├── main.js
├── index.html
├── package.json
└── README.md
```

---

## 🛠 Notes

* Configure your dev/hosting server to serve the `/dicom_images/` folder as static files.
* Adjust paths in `main.js` if your dataset lives elsewhere.
