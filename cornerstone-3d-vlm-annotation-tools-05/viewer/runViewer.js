
import { setupUI } from './setupUI.js';
import { createViewports } from './viewports.js';
import { loadVolume } from './loadVolume.js';
import { setupTools } from './setupTools.js';
import { setupResetHandlers } from './reset.js';

import { coreInit, dicomImageLoaderInit, toolsInit } from './dependencies.js';

export async function runViewer() {
  await coreInit();
  await dicomImageLoaderInit();
  await toolsInit();

  // DOM elements
  const { content, element1, element2, toolbar, annotationControls } = setupUI();

  // Load the dataset with progress
  const volumeId = await loadVolume(content);

  // Setup rendering engine and viewports
  const { renderingEngineId, viewportId1, viewportId2 } =
    await createViewports(content, element1, element2, volumeId);

  let viewportIds = [viewportId1, viewportId2];

  // Setup tools
  const toolGroup = setupTools(toolbar, renderingEngineId, viewportIds);

  // Setup reset/remove handlers
  setupResetHandlers(annotationControls, renderingEngineId);

  console.log('DICOM Viewer initialized!');
}

