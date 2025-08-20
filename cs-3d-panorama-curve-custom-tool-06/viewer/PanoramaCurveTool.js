//? Custom Tool - PanoramaCurveTool
// A tool for drawing curved lines across multiple viewports with measurement capabilities

import { AnnotationTool, getRenderingEngine, drawing, splines } from './dependencies.js';

export default class PanoramaCurveTool extends AnnotationTool {
  constructor(toolProps = {}, defaultProps = {}) {
    super(toolProps, defaultProps, {
      supportedInteractionTypes: ['Mouse'],
      configuration: {},
    });
    
    // Core data storage
    this._activeCurves = new Map(); // viewportId -> array of points
    this._finishedCurves = new Map(); // viewportId -> array of curves
    this._lastViewportId = null;
    
    // Measurement mode
    this._measureMode = false;
    this._measureSelections = new Map(); // viewportId -> {i0, i1, labelCanvas}
    
    // Curve removal tracking
    this._curveOrder = []; // Array of {viewportId, curveIndex, timestamp}
  }

  static get toolName() {
    return 'PanoramaCurve';
  }

  // ===== MAIN EVENT HANDLER - CornerStone HOOK =====
  preMouseDownCallback(evt) {
    const { currentPoints } = evt.detail;
    const viewport = this._getViewportFromEvent(evt); // get ViewPort by renderingEngine
    if (!viewport) return false;

    // when user click: send you clicked-point-coordinates on the screen (canvas)
    const clickCanvas = [currentPoints.canvas[0], currentPoints.canvas[1]];
    const viewportId = viewport.id;

    // Handle different interaction modes
    if (this._measureMode) {
      return this._handleMeasureMode(viewport, clickCanvas, viewportId);
    }

    if (this._isClickingOnHandle(viewport, clickCanvas, viewportId)) {
      return this._handleHandleClick(viewport, clickCanvas, viewportId);
    }

    return this._addNewPoint(viewport, clickCanvas, viewportId);
  }

  // ===== VIEWPORT HELPERS =====
  _getViewportFromEvent(evt) {
    const { element } = evt.detail;
    const renderingEngineId = element.dataset.renderingEngineId;
    const viewportId = element.dataset.viewportId;

    const renderingEngine = getRenderingEngine(renderingEngineId);
    if (!renderingEngine) return null;

    const viewport = renderingEngine.getViewport(viewportId);
    if (!viewport) return null;

    return viewport;
  }

  // ===== MEASUREMENT MODE HANDLING =====
  _handleMeasureMode(viewport, clickCanvas, viewportId) {
    const points = this._activeCurves.get(viewportId) || [];
    if (points.length === 0) return true;

    const hitIndex = this._findHandleIndex(viewport, clickCanvas, points);
    if (hitIndex === -1) return true; // Click not on handle

    this._updateMeasureSelection(viewportId, hitIndex, clickCanvas);
    viewport.getRenderingEngine().render();
    return true;
  }

  _updateMeasureSelection(viewportId, hitIndex, clickCanvas) {
    const selection = this._measureSelections.get(viewportId) || {};
    
    if (selection.i0 === undefined) {
      selection.i0 = hitIndex;
    } else if (selection.i1 === undefined) {
      selection.i1 = hitIndex;
      if (selection.i0 === selection.i1) {
        selection.i1 = undefined;
      }
    } else {
      // Reset selection with new start
      selection.i0 = hitIndex;
      selection.i1 = undefined;
    }
    
    selection.labelCanvas = [clickCanvas[0], clickCanvas[1]];
    this._measureSelections.set(viewportId, selection);
    this._lastViewportId = viewportId;
  }

  // ===== HANDLE CLICK HANDLING =====
  _isClickingOnHandle(viewport, clickCanvas, viewportId) {
    const points = this._activeCurves.get(viewportId) || [];
    if (points.length === 0) return false;

    const hitIndex = this._findHandleIndex(viewport, clickCanvas, points);
    return hitIndex !== -1;
  }

  _findHandleIndex(viewport, clickCanvas, points) {
    /*
    * canvasToWorld = user clicked here on screen → find out where that is in the dataset.
    * worldToCanvas = I know the medical point → where should I draw it on screen?
    ex:
      const worldPt = [20.5, 35.2, 0];   // mm in patient space
      const canvasPt = viewport.worldToCanvas(worldPt);
      console.log(canvasPt); // e.g. [450, 220] pixels
    That means:
      In the CT scan, the point is 20.5 mm across, 35.2 mm down.
      On the screen, it should be drawn at pixel (450,220).
    */
    const canvasPoints = points.map(world => viewport.worldToCanvas(world));
    const thresholdPx = 8;

    for (let i = 0; i < canvasPoints.length; i++) {
      const dx = canvasPoints[i][0] - clickCanvas[0];
      const dy = canvasPoints[i][1] - clickCanvas[1];
      if (Math.hypot(dx, dy) <= thresholdPx) {
        return i;
      }
    }
    return -1;
  }

  _handleHandleClick(viewport, clickCanvas, viewportId) {
    const points = this._activeCurves.get(viewportId) || [];
    const hitIndex = this._findHandleIndex(viewport, clickCanvas, points);

    if (hitIndex === points.length - 1) {
      // Clicked last point: remove it
      points.pop();
    } else {
      // Clicked earlier point: remove curve points after it
      points.splice(hitIndex + 1);
    }

    this._activeCurves.set(viewportId, points);
    this._lastViewportId = viewportId;
    viewport.getRenderingEngine().render();
    return true;
  }

  // ===== NEW POINT ADDITION =====
  _addNewPoint(viewport, clickCanvas, viewportId) {
    const worldPos = viewport.canvasToWorld(clickCanvas);
    const points = this._activeCurves.get(viewportId) || [];
    
    points.push(worldPos);
    this._activeCurves.set(viewportId, points);
    this._lastViewportId = viewportId;

    // Track new curve if this is the first point
    if (points.length === 1) {
      this._trackNewCurve(viewportId);
    }

    viewport.getRenderingEngine().render();
    return true;
  }

  _trackNewCurve(viewportId) {
    const timestamp = Date.now() + this._curveOrder.length;
    this._curveOrder.push({
      viewportId: viewportId,
      curveIndex: -1, // -1 indicates active curve
      timestamp: timestamp
    });
  }

  // ===== RENDERING =====
  renderAnnotation(enabledElement, svgDrawingHelper) {
    const { viewport } = enabledElement || {};
    if (!viewport) return false;

    let rendered = false;

    // Render finished curves
    rendered |= this._renderFinishedCurves(viewport, svgDrawingHelper);
    
    // Render active curve
    rendered |= this._renderActiveCurve(viewport, svgDrawingHelper);
    
    // Render measurements if in measure mode
    if (this._measureMode) {
      this._renderMeasurements(viewport, svgDrawingHelper);
    }

    return rendered;
  }

  _renderFinishedCurves(viewport, svgDrawingHelper) {
    const finished = this._finishedCurves.get(viewport.id) || [];
    let rendered = false;

    finished.forEach((curvePoints, index) => {
      if (curvePoints.length < 2) return;
      
      const canvasPoints = curvePoints.map(world => viewport.worldToCanvas(world));
      const splinePoints = this._createSpline(canvasPoints);
      const uid = `panorama-curve-${viewport.id}-finished-${index}`;
      
      this._drawCurve(svgDrawingHelper, uid, splinePoints, canvasPoints);
      rendered = true;
    });

    return rendered;
  }

  _renderActiveCurve(viewport, svgDrawingHelper) {
    const points = this._activeCurves.get(viewport.id);
    if (!points || points.length === 0) return false;

    const canvasPoints = points.map(world => viewport.worldToCanvas(world));
    const splinePoints = this._createSpline(canvasPoints);
    const uid = `panorama-curve-${viewport.id}-active`;

    this._drawCurve(svgDrawingHelper, uid, splinePoints, canvasPoints);
    this._drawCurveCenter(svgDrawingHelper, uid, splinePoints);
    this._drawLengthLabels(svgDrawingHelper, uid, splinePoints, canvasPoints, viewport);

    return true;
  }

  _createSpline(canvasPoints) {
    const spline = new splines.CatmullRomSpline();
    spline.resolution = 12;
    spline.setControlPoints(canvasPoints);
    return spline.getPolylinePoints();
  }

  _drawCurve(svgDrawingHelper, uid, splinePoints, canvasPoints) {
    // Draw the curve line
    drawing.drawPolyline(svgDrawingHelper, uid, uid, splinePoints, {
      color: 'lime',
      width: 2,
      closePath: false,
    });

    // Draw handles at control points
    drawing.drawHandles(svgDrawingHelper, uid, 'handles', canvasPoints, {
      color: 'yellow',
      handleRadius: 3,
    });
  }

  _drawCurveCenter(svgDrawingHelper, uid, splinePoints) {
    if (splinePoints.length < 2) return;

    const center = this._calculateCurveCenter(splinePoints);
    drawing.drawHandle(svgDrawingHelper, uid, 'center', center, {
      color: 'cyan',
      handleRadius: 5,
      fill: 'rgba(0,255,255,0.3)'
    }, 0);
  }

  _calculateCurveCenter(splinePoints) {
    // Find polyline midpoint by arc length
    const totalLength = this._calculatePolylineLength(splinePoints);
    const targetLength = totalLength / 2;
    
    let accumulatedLength = 0;
    for (let i = 1; i < splinePoints.length; i++) {
      const segmentLength = Math.hypot(
        splinePoints[i][0] - splinePoints[i-1][0],
        splinePoints[i][1] - splinePoints[i-1][1]
      );
      
      if (accumulatedLength + segmentLength >= targetLength) {
        const t = (targetLength - accumulatedLength) / segmentLength;
        return [
          splinePoints[i-1][0] + t * (splinePoints[i][0] - splinePoints[i-1][0]),
          splinePoints[i-1][1] + t * (splinePoints[i][1] - splinePoints[i-1][1])
        ];
      }
      accumulatedLength += segmentLength;
    }
    
    return splinePoints[0];
  }

  _calculatePolylineLength(points) {
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      totalLength += Math.hypot(
        points[i][0] - points[i-1][0],
        points[i][1] - points[i-1][1]
      );
    }
    return totalLength;
  }

  _drawLengthLabels(svgDrawingHelper, uid, splinePoints, canvasPoints, viewport) {
    if (canvasPoints.length < 2) return;

    const totalLength = this._calculatePolylineLength(splinePoints);
    const segmentLength = this._calculateSegmentLength(splinePoints, canvasPoints);
    const mmPerPx = this._estimateMmPerPixel(viewport, splinePoints[0]);

    const totalMM = totalLength * mmPerPx;
    const segmentMM = segmentLength * mmPerPx;

    const lastPoint = canvasPoints[canvasPoints.length - 1];
    drawing.drawTextBox(svgDrawingHelper, uid, 'length-label', [
      `Segment: ${segmentMM.toFixed(2)} mm`,
      `Total: ${totalMM.toFixed(2)} mm`
    ], [lastPoint[0], lastPoint[1]], {
      color: 'yellow',
      background: 'rgba(0,0,0,0.35)',
      fontSize: '12px',
      padding: 6,
    });
  }

  _calculateSegmentLength(splinePoints, canvasPoints) {
    if (canvasPoints.length < 2) return 0;

    const startPt = canvasPoints[canvasPoints.length - 2];
    const endPt = canvasPoints[canvasPoints.length - 1];
    
    const i0 = this._findNearestSplineIndex(splinePoints, startPt);
    const i1 = this._findNearestSplineIndex(splinePoints, endPt);
    
    const startIdx = Math.min(i0, i1);
    const endIdx = Math.max(i0, i1);
    
    let segmentLength = 0;
    for (let i = startIdx + 1; i <= endIdx; i++) {
      segmentLength += Math.hypot(
        splinePoints[i][0] - splinePoints[i-1][0],
        splinePoints[i][1] - splinePoints[i-1][1]
      );
    }
    
    return segmentLength;
  }

  _findNearestSplineIndex(splinePoints, targetPoint) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < splinePoints.length; i++) {
      const dx = splinePoints[i][0] - targetPoint[0];
      const dy = splinePoints[i][1] - targetPoint[1];
      const distance = dx * dx + dy * dy;
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    return nearestIndex;
  }

  _estimateMmPerPixel(viewport, canvasPoint) {
    const worldPoint = viewport.canvasToWorld(canvasPoint);
    const worldPointX = viewport.canvasToWorld([canvasPoint[0] + 1, canvasPoint[1]]);
    const worldPointY = viewport.canvasToWorld([canvasPoint[0], canvasPoint[1] + 1]);
    
    const spacingX = Math.hypot(
      worldPointX[0] - worldPoint[0],
      worldPointX[1] - worldPoint[1],
      worldPointX[2] - worldPoint[2]
    );
    
    const spacingY = Math.hypot(
      worldPointY[0] - worldPoint[0],
      worldPointY[1] - worldPoint[1],
      worldPointY[2] - worldPoint[2]
    );
    
    return (spacingX + spacingY) / 2 || 1;
  }

  _renderMeasurements(viewport, svgDrawingHelper) {
    const selection = this._measureSelections.get(viewport.id);
    if (!selection || selection.i0 === undefined) return;

    const points = this._activeCurves.get(viewport.id) || [];
    if (points.length === 0) return;

    const canvasPoints = points.map(world => viewport.worldToCanvas(world));
    const marks = [canvasPoints[selection.i0]];
    
    if (selection.i1 !== undefined) {
      marks.push(canvasPoints[selection.i1]);
      this._renderMeasurementLabel(svgDrawingHelper, viewport, canvasPoints, selection);
    }

    // Highlight selected points
    drawing.drawHandles(svgDrawingHelper, 'measure-sel', 'measure-sel', marks, {
      color: 'red',
      handleRadius: 4,
    });
  }

  _renderMeasurementLabel(svgDrawingHelper, viewport, canvasPoints, selection) {
    const points = this._activeCurves.get(viewport.id) || [];
    const splinePoints = this._createSpline(canvasPoints);
    
    const i0 = this._findNearestSplineIndex(splinePoints, canvasPoints[selection.i0]);
    const i1 = this._findNearestSplineIndex(splinePoints, canvasPoints[selection.i1]);
    
    const startIdx = Math.min(i0, i1);
    const endIdx = Math.max(i0, i1);
    
    let segmentLength = 0;
    for (let i = startIdx + 1; i <= endIdx; i++) {
      segmentLength += Math.hypot(
        splinePoints[i][0] - splinePoints[i-1][0],
        splinePoints[i][1] - splinePoints[i-1][1]
      );
    }
    
    const mmPerPx = this._estimateMmPerPixel(viewport, splinePoints[startIdx]);
    const segmentMM = segmentLength * mmPerPx;
    
    const labelPosition = selection.labelCanvas || canvasPoints[selection.i1];
    drawing.drawTextBox(svgDrawingHelper, 'measure-label', 'measure-label', [
      `Between P${selection.i0+1} and P${selection.i1+1}: ${segmentMM.toFixed(2)} mm`
    ], [labelPosition[0], labelPosition[1]], {
      color: 'yellow',
      background: 'rgba(0,0,0,0.35)',
      fontSize: '12px',
      padding: 6
    });
  }

  // ===== CURVE MANAGEMENT =====
  finishCurve(viewportId) {
    const vpId = viewportId || this._lastViewportId;
    if (!vpId) return;

    const points = this._activeCurves.get(vpId) || [];
    if (points.length >= 2) {
      const finished = this._finishedCurves.get(vpId) || [];
      const curveIndex = finished.length;
      
      finished.push(points.slice());
      this._finishedCurves.set(vpId, finished);
      
      // Track the finished curve
      const timestamp = Date.now() + this._curveOrder.length;
      this._curveOrder.push({
        viewportId: vpId,
        curveIndex: curveIndex,
        timestamp: timestamp
      });
    }
    
    // Reset active points for new curve
    this._activeCurves.set(vpId, []);
  }

  // ===== CLEARING METHODS =====
  clearViewport(viewportId) {
    if (!viewportId) return;
    
    this._activeCurves.delete(viewportId);
    this._finishedCurves.delete(viewportId);
    
    // Remove tracking entries for this viewport
    this._curveOrder = this._curveOrder.filter(entry => entry.viewportId !== viewportId);
  }

  clearAll() {
    this._activeCurves.clear();
    this._finishedCurves.clear();
    this._curveOrder = [];
  }

  clearLast(viewportId) {
    const vpId = viewportId || this._lastViewportId;
    if (!vpId) return;

    const active = this._activeCurves.get(vpId) || [];
    if (active.length > 0) {
      this._activeCurves.set(vpId, []);
      return;
    }

    const finished = this._finishedCurves.get(vpId) || [];
    if (finished.length > 0) {
      finished.pop();
      this._finishedCurves.set(vpId, finished);
    }
  }

  clearLastFromAllViewports() {
    if (this._curveOrder.length === 0) return false;

    const lastEntry = this._curveOrder[this._curveOrder.length - 1];
    
    if (lastEntry.curveIndex === -1) {
      // Remove active curve
      this._activeCurves.set(lastEntry.viewportId, []);
      this._curveOrder.pop();
      return true;
    } else {
      // Remove finished curve
      const finished = this._finishedCurves.get(lastEntry.viewportId);
      if (finished && finished.length > lastEntry.curveIndex) {
        finished.splice(lastEntry.curveIndex, 1);
        this._finishedCurves.set(lastEntry.viewportId, finished);
        this._curveOrder.pop();
        this._rebuildCurveOrder();
        return true;
      }
    }
    
    return false;
  }

  _rebuildCurveOrder() {
    const newCurveOrder = [];
    
    // Add active curves first (most recent)
    this._activeCurves.forEach((points, viewportId) => {
      if (points.length > 0) {
        newCurveOrder.push({
          viewportId: viewportId,
          curveIndex: -1,
          timestamp: Date.now()
        });
      }
    });
    
    // Add finished curves
    this._finishedCurves.forEach((curves, viewportId) => {
      curves.forEach((curve, index) => {
        newCurveOrder.push({
          viewportId: viewportId,
          curveIndex: index,
          timestamp: Date.now() + index
        });
      });
    });
    
    // Sort by timestamp
    newCurveOrder.sort((a, b) => a.timestamp - b.timestamp);
    this._curveOrder = newCurveOrder;
  }

  // ===== UTILITY METHODS =====
  toggleMeasureMode() {
    this._measureMode = !this._measureMode;
    if (!this._measureMode) {
      this._measureSelections.clear();
    }
  }

  getCurveState() {
    return {
      activeCurves: Array.from(this._activeCurves.entries()).map(([vpId, points]) => ({
        viewportId: vpId,
        pointCount: points.length
      })),
      finishedCurves: Array.from(this._finishedCurves.entries()).map(([vpId, curves]) => ({
        viewportId: vpId,
        curveCount: curves.length
      })),
      removalOrder: this._curveOrder.map((entry, index) => ({
        index: index,
        viewportId: entry.viewportId,
        curveIndex: entry.curveIndex,
        isActive: entry.curveIndex === -1,
        timestamp: entry.timestamp
      }))
    };
  }

  /*
  debugCurveState() {
    console.log('=== PANORAMA CURVE DEBUG STATE ===');
    console.log('Active curves:');
    this._activeCurves.forEach((points, vpId) => {
      if (points.length > 0) {
        console.log(`  Viewport ${vpId}: ${points.length} points`);
      }
    });
    
    console.log('Finished curves:');
    this._finishedCurves.forEach((curves, vpId) => {
      if (curves.length > 0) {
        console.log(`  Viewport ${vpId}: ${curves.length} curves`);
      }
    });
    
    console.log('Removal order (newest to oldest):');
    this._curveOrder.forEach((entry, index) => {
      const type = entry.curveIndex === -1 ? 'ACTIVE' : 'FINISHED';
      console.log(`  ${index}: Viewport ${entry.viewportId}, ${type}, Index: ${entry.curveIndex}`);
    });
    console.log('=====================================');
  }
  */
}



