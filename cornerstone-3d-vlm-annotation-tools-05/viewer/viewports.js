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

  setVolumesForViewports(renderingEngine, [{ volumeId }], [viewportId1, viewportId2]);

  return { renderingEngineId, viewportId1, viewportId2 };
}

