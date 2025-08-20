
//? reset/remove-annotation handlers


import { getRenderingEngine, annotation, PanoramaCurveTool } from './dependencies.js';

export function setupResetHandlers(annotationControls, renderingEngineId, toolGroup) {
  const resetAllBtn = annotationControls.querySelector('#btn-reset-all');
  const toolSelect  = annotationControls.querySelector('select');
  const removeBtn   = annotationControls.querySelector('#btn-remove-selected');

  // Reset ALL
  resetAllBtn.addEventListener('click', () => {
    annotation.state.removeAllAnnotations();

    // clear PanoramaCurve across all viewports
    const re = getRenderingEngine(renderingEngineId);
    const pano = toolGroup?.getToolInstance('PanoramaCurve');
    if (pano && re) {
      re.getViewports().forEach((vp) => pano.clearViewport(vp.id));
    }

    if (re) {
      re.getViewports().forEach((vp) => {
        vp.resetCamera();
        vp.setProperties({ voiRange: { lower: -1000, upper: 3000 } });
        vp.render();
      });
    }
  });

  // Remove selected tool (just the LAST one)
  removeBtn.addEventListener('click', () => {
    const map = {
      Length: 'Length',
      Angle: 'Angle',
      'Ellipse ROI': 'EllipticalROI',
      Curve: 'PlanarFreehandROI',
      Probe: 'Probe',
      'Panorama Curve': 'PanoramaCurve'
    };

    const toolName = map[toolSelect.value];
    if (!toolName) return;

    const re = getRenderingEngine(renderingEngineId);
    if (!re) return;

    if (toolName === 'PanoramaCurve') {
      const pano = toolGroup?.getToolInstance('PanoramaCurve');
      if (pano) {
        // Debug: show current state before removal
        // console.log('=== BEFORE REMOVAL ===');
        // pano.debugCurveState();
        
        // Remove the last curve from ALL viewports (similar to other tools)
        const removed = pano.clearLastFromAllViewports();
        
        // Debug: show state after removal
        // console.log('=== AFTER REMOVAL ===');
        // pano.debugCurveState();
        console.log('Removal successful:', removed);
        
        // Don't deactivate the tool - let user continue drawing
        // toolGroup.setToolPassive('PanoramaCurve', { removeAllBindings: true });
      }
    } else {
      let removed = false;
      const vps = re.getViewports();

      // search viewports backwards so we remove the most recent one
      for (let i = vps.length - 1; i >= 0 && !removed; i--) {
        const vp = vps[i];
        const anns = annotation.state.getAnnotations(toolName, vp.element) || [];
        if (anns.length) {
          const last = anns[anns.length - 1];
          annotation.state.removeAnnotation(last.annotationUID);
          removed = true;
        }
      }

      // Don't deactivate the tool - let user continue drawing
      // toolGroup.setToolPassive(toolName, { removeAllBindings: true });
    }

    re.getViewports().forEach((vp) => vp.render());
  });
}
