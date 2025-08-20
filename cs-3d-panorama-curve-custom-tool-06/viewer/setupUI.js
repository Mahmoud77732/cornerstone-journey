//? builds DOM (toolbar, reset buttons, etc.)


export function setupUI() {
  const content = document.getElementById('content');

  // Viewports container
  const viewportGrid = document.createElement('div');
  viewportGrid.style.display = 'flex';
  viewportGrid.style.flexDirection = 'row';

  // Axial viewport
  const element1 = document.createElement('div');
  element1.style.width = '500px';
  element1.style.height = '500px';

  // Sagittal viewport
  const element2 = document.createElement('div');
  element2.style.width = '500px';
  element2.style.height = '500px';

  viewportGrid.appendChild(element1);
  viewportGrid.appendChild(element2);

  // ---- Toolbar (for tool switching) ----
  const toolbar = document.createElement('div');
  toolbar.style.display = 'flex';
  toolbar.style.gap = '10px';
  toolbar.style.margin = '10px';

  // ---- Annotation Controls ----
  const annotationControls = document.createElement('div');
  annotationControls.style.display = 'flex';
  annotationControls.style.gap = '10px';
  annotationControls.style.margin = '10px';

  // Reset button
  const resetAllBtn = document.createElement('button');
  resetAllBtn.id = 'btn-reset-all';               // add id
  resetAllBtn.textContent = 'Reset All Annotations';
  annotationControls.appendChild(resetAllBtn);

  // Dropdown + remove button
  const toolSelect = document.createElement('select');
  ['Length', 'Angle', 'Ellipse ROI', 'Curve', 'Probe', 'Panorama Curve'].forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = `Remove ${name}`;
    toolSelect.appendChild(option);
  });
  annotationControls.appendChild(toolSelect);

  const removeBtn = document.createElement('button');
  removeBtn.id = 'btn-remove-selected';           // add id
  removeBtn.textContent = 'Remove Selected Tool';
  annotationControls.appendChild(removeBtn);

  // Measure curve segment button
  const measureCurveBtn = document.createElement('button');
  measureCurveBtn.id = 'btn-measure-curve';       // add id
  measureCurveBtn.textContent = 'Measure Curve Segment';
  annotationControls.appendChild(measureCurveBtn);

  // Finish current curve button
  const finishCurveBtn = document.createElement('button');
  finishCurveBtn.id = 'btn-finish-curve';         // add id
  finishCurveBtn.textContent = 'Finish Panorama Curve';
  annotationControls.appendChild(finishCurveBtn);

  // Insert into content
  content.appendChild(toolbar);
  content.appendChild(annotationControls); // {resetAllBtn, toolSelect, removeBtn}
  content.appendChild(viewportGrid);

  return { content, element1, element2, toolbar, annotationControls, finishCurveBtn, measureCurveBtn };
}

