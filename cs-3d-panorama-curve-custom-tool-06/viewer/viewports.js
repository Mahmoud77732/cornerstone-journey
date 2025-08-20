//? viewport creation (axial, sagittal, etc.)

import { RenderingEngine, setVolumesForViewports, Enums } from './dependencies.js';

export async function createViewports(content, element1, element2, volumeId) {
  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

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

  // ✅ Attach dataset IDs so tools can find them
  element1.dataset.viewportId = viewportId1;
  element1.dataset.renderingEngineId = renderingEngineId;
  element2.dataset.viewportId = viewportId2;
  element2.dataset.renderingEngineId = renderingEngineId;

  setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId1, viewportId2]);

  return { renderingEngineId, viewportId1, viewportId2 };
}

