// src/main.js
import {
  RenderingEngine,
  Enums,
  init as coreInit,
} from '@cornerstonejs/core';

import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';

import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import * as cornerstone from '@cornerstonejs/core';
import dicomParser from 'dicom-parser'; // npm install dicom-parser


const content = document.getElementById('content');
const element = document.createElement('div');
element.style.width = '500px';
element.style.height = '500px';
content.appendChild(element);

/**
 * Create imageIds from a WADO-RS (DICOMweb) series without caching metadata.
 * Returns an array of wadors: imageIds that Cornerstone's WADO-RS loader understands.
 *
 * @param {object} opts
 * @param {string} opts.StudyInstanceUID
 * @param {string} opts.SeriesInstanceUID
 * @param {string} opts.wadoRsRoot - e.g. 'https://example.com/dicomweb'
 */
async function createImageIds({ StudyInstanceUID, SeriesInstanceUID, wadoRsRoot }) {
  // Query the instances endpoint for the series
  const url = `${wadoRsRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/dicom+json, application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch instances: ${response.status} ${response.statusText}`);
  }

  const instances = await response.json();

  // Each instance in DICOM JSON contains tags; SOPInstanceUID is (0008,0018)
  // The exact path can vary; the demo server returns DataElements like { "00080018": { "Value": ["..."] } }
  const imageIds = instances.map((instance) => {
    // try common DICOM JSON patterns
    let sopInstanceUID = undefined;

    if (instance['00080018'] && instance['00080018'].Value && instance['00080018'].Value[0]) {
      sopInstanceUID = instance['00080018'].Value[0];
    } else if (instance.SOPInstanceUID) {
      // some servers return plain keys
      sopInstanceUID = instance.SOPInstanceUID;
    } else if (instance['00080018'] && instance['00080018'].vr === 'UI' && instance['00080018'].InlineBinary) {
      // unlikely — fallback
      sopInstanceUID = instance['00080018'].InlineBinary;
    }

    if (!sopInstanceUID) {
      throw new Error('Failed to extract SOPInstanceUID from instance JSON: ' + JSON.stringify(instance));
    }

    // Return the wadors: style imageId
    return `wadors:${wadoRsRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${sopInstanceUID}`;
  });

  return imageIds;
}

/**
 * Runs the demo
 */
async function run() {
    
    await coreInit();

    // Link external dependencies
    dicomImageLoader.external.cornerstone = cornerstone;
    dicomImageLoader.external.dicomParser = dicomParser;

  // Replace these UIDs and URL with your study/series
  const studyUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463';
  const seriesUID = '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561';
  const wadoRsRoot = 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb';

  let imageIds;
  try {
    imageIds = await createImageIds({
      StudyInstanceUID: studyUID,
      SeriesInstanceUID: seriesUID,
      wadoRsRoot,
    });
  } catch (err) {
    console.error('createImageIds failed:', err);
    element.innerText = 'Failed to fetch instances. See console for details.';
    return;
  }

  // Rendering engine + viewport
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const viewportId = 'CT_AXIAL_STACK';
  const viewportInput = {
    viewportId,
    element,
    type: Enums.ViewportType.STACK,
  };

  renderingEngine.enableElement(viewportInput);

  const viewport = renderingEngine.getViewport(viewportId);

  // set stack; viewport will lazily load images (no manual metadata caching)
  viewport.setStack(imageIds, 60);

  // Render
  viewport.render();
}

run().catch((err) => {
  console.error('Unhandled error in run():', err);
  const content = document.getElementById('content');
  content.innerText = 'Error — check console for details.';
});
