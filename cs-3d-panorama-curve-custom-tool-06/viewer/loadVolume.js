
import { volumeLoader, metaData } from './dependencies.js';

export async function loadVolume(content) {
  // Create loading overlay
  const loading = document.createElement('div');
  loading.style.padding = '10px';
  loading.style.background = 'rgba(0,0,0,0.7)';
  loading.style.color = 'white';
  loading.style.margin = '10px 0';
  loading.style.fontFamily = 'sans-serif';

  const label = document.createElement('span');
  label.textContent = 'Loading volume... ';
  const progress = document.createElement('progress');
  progress.max = 100;
  progress.value = 0;
  progress.style.width = '300px';
  progress.style.marginLeft = '10px';

  loading.appendChild(label);
  loading.appendChild(progress);
  content.insertBefore(loading, content.firstChild);

  metaData.addProvider((type, imageId) => {
    if (type === 'imagePlaneModule') {
      const match = imageId.match(/I(\d+)/);
      if (!match) return;
      const index = parseInt(match[1], 10);

      const info = {
        frameOfReferenceUID: 'fakeFrame',
        rows: 512,
        columns: 512,
        imageOrientationPatient: [1, 0, 0, 0, 1, 0],   // row (1,0,0), col (0,1,0)
        imagePositionPatient: [0, 0, index * 1.0],     // Z increases by 1 per slice
        pixelSpacing: [1.0, 1.0],                      // [row, column]
      };

      // console.log('Providing metadata for', imageId, info);
      return info;
    }
  }, 10000);

  // ---- Build the list of imageIds ----
  const imageIds = [];
  for (let i = 0; i < 517; i++) {
    imageIds.push(`wadouri:./dicom_images/malocclusion-volume/DICOM/I${i}`);
  }

  // Load volume with progress
  const volumeId = 'myVolume';
  const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });

  await volume.load((evt) => {
    if (evt?.total !== undefined) {
      progress.value = Math.floor((evt.loaded / evt.total) * 100);
    }
  });

  loading.remove();
  return volumeId;
}