
import {
  init as coreInit,
  RenderingEngine,
  metaData,
  Enums,
  volumeLoader,
  setVolumesForViewports,
} from '@cornerstonejs/core';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';

// Just makes Enums.ViewportType shorter to write ->> ViewportType
// const { ViewportType } = Enums;

const content = document.getElementById('content');

const viewportGrid = document.createElement('div');
viewportGrid.style.display = 'flex';
viewportGrid.style.flexDirection = 'row';

// element for axial view
const element1 = document.createElement('div');
element1.style.width = '500px';
element1.style.height = '500px';

// element for sagittal view
const element2 = document.createElement('div');
element2.style.width = '500px';
element2.style.height = '500px';

viewportGrid.appendChild(element1);
viewportGrid.appendChild(element2);

content.appendChild(viewportGrid);

async function run() {
  await coreInit();
  await dicomImageLoaderInit();

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
    imageIds.push(`wadouri:/dicom_images/malocclusion-volume/DICOM/I${i}`); // replace slices path with yours
  }

  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const volumeId = 'myVolume';
  const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });

  const viewportId1 = 'CT_AXIAL';
  const viewportId2 = 'CT_SAGITTAL';

  const viewportInputs = [
    {
      viewportId: viewportId1,
      element: element1,
      type: Enums.ViewportType.ORTHOGRAPHIC,
      defaultOptions: { orientation: Enums.OrientationAxis.AXIAL },
    },
    {
      viewportId: viewportId2,
      element: element2,
      type: Enums.ViewportType.ORTHOGRAPHIC,
      defaultOptions: { orientation: Enums.OrientationAxis.SAGITTAL },
    },
  ];

  renderingEngine.setViewports(viewportInputs);

  await volume.load();

  setVolumesForViewports(
    renderingEngine,
    [{ volumeId }],
    [viewportId1, viewportId2]
  );
}

run();
