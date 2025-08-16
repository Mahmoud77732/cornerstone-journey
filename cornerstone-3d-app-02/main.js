import { RenderingEngine, Enums, init as coreInit } from '@cornerstonejs/core';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';

const content = document.getElementById('content');
const element = document.createElement('div');

element.style.width = '500px';
element.style.height = '500px';

content.appendChild(element);

async function run() {
  await coreInit(); // Turn on Cornerstone Core and wait until it’s ready
  await dicomImageLoaderInit(); // Turn on the DICOM file reader and wait until it is ready.

  // Get Cornerstone imageIds and fetch metadata into RAM
  // const imageId = 'wadouri:http://localhost:5173/IMG-0001-00001.dcm';
  const imageId1 = 'wadouri:/IMG-0001-00001.dcm';
  const imageId2 = 'wadouri:/CTImage.dcm';

  const renderingEngineId = 'myRenderingEngine'; // any name
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const viewportId = 'viewport1'; // any name

  const viewportInput = {
    viewportId,
    element,
    type: Enums.ViewportType.STACK,
  };

  renderingEngine.enableElement(viewportInput);

  const viewport = renderingEngine.getViewport(viewportId);

  viewport.setStack([imageId1, imageId2], 1);

  viewport.render();
}

run();