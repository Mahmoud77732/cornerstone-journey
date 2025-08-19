//? reset/remove-annotation handlers


import { getRenderingEngine, annotation } from './dependencies.js';

export function setupResetHandlers(annotationControls, renderingEngineId) {
  const resetAllBtn = annotationControls.querySelector('button:first-child');
  const toolSelect = annotationControls.querySelector('select');
  const removeBtn = annotationControls.querySelector('button:last-child');

  // Reset ALL
  resetAllBtn.addEventListener('click', () => {
    annotation.state.removeAllAnnotations();
    const re = getRenderingEngine(renderingEngineId);
    if (re) {
      re.getViewports().forEach((vp) => {
        vp.resetCamera();
        vp.setProperties({ voiRange: { lower: -1000, upper: 3000 } });
        vp.render();
      });
    }
  });

  // Remove annotations by type
  removeBtn.addEventListener('click', () => {
    const map = {
      Length: 'Length',
      Angle: 'Angle',
      'Ellipse ROI': 'EllipticalROI', // Cornerstone’s annotation metadata actually store the class name  without the "Tool" suffix
      Curve: 'PlanarFreehandROI',
      Probe: 'Probe'
    };

    const toolName = map[toolSelect.value];
    if (!toolName) return;

    annotation.state.removeAnnotations(toolName, 'fakeFrame');
    const re = getRenderingEngine(renderingEngineId);
    re?.getViewports().forEach((vp) => vp.render());
  });
}

