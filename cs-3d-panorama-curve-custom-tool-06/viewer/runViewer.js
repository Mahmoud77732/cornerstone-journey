
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
  const { content, element1, element2, toolbar, annotationControls, finishCurveBtn, measureCurveBtn } = setupUI();

  // Load the dataset with progress
  const volumeId = await loadVolume(content);

  // Setup rendering engine and viewports
  const { renderingEngineId, viewportId1, viewportId2 } =
    await createViewports(content, element1, element2, volumeId);

  let viewportIds = [viewportId1, viewportId2];

  // Setup tools
  const toolGroup = setupTools(toolbar, renderingEngineId, viewportIds);

  // Wire Finish Curve button to tell the custom tool to finalize current curve for active viewport
  finishCurveBtn.addEventListener('click', () => {
    const tool = toolGroup.getToolInstance('PanoramaCurve');
    if (tool && typeof tool.finishCurve === 'function') {
      // Let the tool pick the last interacted viewport
      tool.finishCurve();
    }
  });

  // Wire Measure Curve Segment: toggles selection mode for two points on active curve
  measureCurveBtn.addEventListener('click', () => {
    const tool = toolGroup.getToolInstance('PanoramaCurve');
    if (tool && typeof tool.toggleMeasureMode === 'function') {
      tool.toggleMeasureMode();
    }
  });

  // Setup reset/remove handlers
  setupResetHandlers(annotationControls, renderingEngineId, toolGroup);

  console.log('DICOM Viewer initialized!');
}

