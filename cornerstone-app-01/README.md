# Simple Cornerstone DICOM Viewer

A minimal web-based DICOM viewer built using [Cornerstone Core](https://cornerstonejs.org/) and [cornerstoneWADOImageLoader](https://github.com/cornerstonejs/cornerstoneWADOImageLoader).

This project demonstrates how to load and display DICOM images directly in the browser using CDN-hosted libraries.

---

## ✨ Features

* Load and view DICOM images with minimal setup
* Uses **Cornerstone Core** + **WADO Image Loader**
* Runs entirely in the browser
* No build tools or frameworks required

---

## 📂 Project Structure

```
project-folder/
│
├── index.html        # Main HTML page with viewer code
├── IMG-0001-00001.dcm # Example DICOM file (replace with your own)
└── README.md         # Documentation
```

---

## 📦 Requirements

* **Node.js** installed (for running a local static server)
* A **DICOM image file** you want to display
* A **modern browser** (Chrome, Firefox; Brave may require shields disabled)

---

## 🚀 Getting Started

1. **Download or Clone** this repository.

2. **Place your DICOM file** in the project folder.

   * Example: `IMG-0001-00001.dcm`
   * Update the file name in `index.html` if needed:

     ```javascript
     const imageId = 'wadouri:/IMG-0001-00001.dcm';
     ```

3. **Start a local server**:

   ```bash
   npx http-server .
   ```

4. **Open in your browser**:

   ```
   http://127.0.0.1:8080
   ```

---

## ⚠️ Notes & Troubleshooting

* You **must** use a local server — opening the HTML file directly (`file://`) will not work.
* Ensure the DICOM file path matches what’s in the code.
* If you’re using **Brave** or a privacy-focused browser, disable blocking features for local testing.
* Check the browser console for detailed errors if the image does not load.

---

## 📚 References

* [Cornerstone.js Documentation](https://cornerstonejs.org/)
* [cornerstoneWADOImageLoader](https://github.com/cornerstonejs/cornerstoneWADOImageLoader)
* [dicom-parser](https://github.com/cornerstonejs/dicomParser)
