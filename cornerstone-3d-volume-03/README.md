# 📖 DICOM Volume Viewer with Cornerstone3D

This project demonstrates how to load a stack of DICOM slices into a 3D volume using **Cornerstone3D** and display multiple orthogonal views (axial, sagittal) side‑by‑side in the browser.

---

## 🚀 Features

* Load a series of DICOM files from disk using `wadouri` loader.
* Construct a 3D volume from 2D slices.
* Display **Axial** (top view) and **Sagittal** (side view) orientations.
* Simple **metadata provider** to inject missing spatial information when DICOM headers are incomplete.
* GPU accelerated rendering with Cornerstone3D.

---

## 🛠️ Tech Stack

* [Cornerstone3D Core](https://github.com/cornerstonejs/cornerstone3D)
* [dicom-image-loader](https://github.com/cornerstonejs/dicomImageLoader)
* JavaScript / ES Modules
* HTML + CSS (basic layout)

---

## 📂 Project Structure

```
project/
│
├── index.html          # Main HTML container
├── main.js             # Application logic (viewer setup)
├── dicom_images/       # Directory containing DICOM slices (I0, I1, …, I516)
│   └── malocclusion-volume/
│       └── DICOM/
│           ├── I0
│           ├── I1
│           ├── …
│           └── I516
└── README.md           # Project documentation
```

---

## 📜 Code Walkthrough

### 1. Initialization

```js
await coreInit();
await dicomImageLoaderInit();
```

Sets up Cornerstone core and enables DICOM decoding.

### 2. Metadata Provider

```js
metaData.addProvider((type, imageId) => {
  if (type === 'imagePlaneModule') {
    const match = imageId.match(/I(\d+)/);
    if (!match) return;
    const index = parseInt(match[1], 10);

    return {
      frameOfReferenceUID: 'fakeFrame',
      rows: 512,
      columns: 512,
      imageOrientationPatient: [1, 0, 0, 0, 1, 0],
      imagePositionPatient: [0, 0, index * 1.0],
      pixelSpacing: [1.0, 1.0],
    };
  }
}, 10000);
```

If the DICOMs lack spatial metadata, this block provides **synthetic geometry**. Adjust values to match real patient spacing if available.

### 3. Building Image IDs

```js
const imageIds = [];
for (let i = 0; i < 517; i++) {
  imageIds.push(`wadouri:/dicom_images/malocclusion-volume/DICOM/I${i}`);
}
```

Generates references for all slices `I0 … I516`.

### 4. Rendering Engine & Volume

```js
const renderingEngine = new RenderingEngine('myRenderingEngine');
const volume = await volumeLoader.createAndCacheVolume('myVolume', { imageIds });
```

Creates the **rendering engine** and loads the DICOM slices into a 3D volume.

### 5. Viewports

```js
const viewportInputs = [
  {
    viewportId: 'CT_AXIAL',
    element: element1,
    type: ViewportType.ORTHOGRAPHIC,
    defaultOptions: { orientation: Enums.OrientationAxis.AXIAL },
  },
  {
    viewportId: 'CT_SAGITTAL',
    element: element2,
    type: ViewportType.ORTHOGRAPHIC,
    defaultOptions: { orientation: Enums.OrientationAxis.SAGITTAL },
  },
];
```

Defines two windows for orthogonal viewing.

### 6. Displaying the Volume

```js
await volume.load();
setVolumesForViewports(renderingEngine, [{ volumeId: 'myVolume' }], ['CT_AXIAL', 'CT_SAGITTAL']);
```

Loads volume data into both viewports and renders them side‑by‑side.

---

## ▶️ Running the Project

1. Place your DICOM files inside `dicom_images/malocclusion-volume/DICOM/` with names `I0 … I516`.
2. Serve the project with a local web server (e.g., `npm install -g http-server` → `http-server .`).
3. Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🔧 Customization

* **Metadata**: Replace fake spacing/positions with actual DICOM values when available.
* **Additional Viewports**: Add coronal or oblique orientations by extending the `viewportInputs` array.
* **UI Enhancements**: Add slice scrolling, window/level adjustments, and 3D rendering.

---

## 📚 Resources

* [Cornerstone3D Docs](https://docs.cornerstonejs.org/)
* [Cornerstone DICOM Loader](https://github.com/cornerstonejs/dicomImageLoader)
* [Medical Imaging Orientation Explained](https://www.radiologymasterclass.co.uk/tutorials/axial_coronal_sagittal)

---

## ✅ Next Steps

* Improve geometry handling by extracting metadata directly from the first DICOM slice.
* Add support for interaction (zoom, pan, slice scroll).
* Experiment with 3D rendering (MPR/MIP).

---

