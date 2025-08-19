//? entrypoint

//! imports you need: exist in './viewer/dependencies.js' file

import { runViewer } from './viewer/runViewer.js';

runViewer();



// =========================================================
// =========================================================
// =========================================================

//! All Code in one file

/*
//! <imports>-----------------------------------------

import {init as coreInit, 
  RenderingEngine, 
  metaData, 
  Enums, 
  volumeLoader, 
  setVolumesForViewports, 
  getRenderingEngine
} from '@cornerstonejs/core';

import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';

import {init as toolsInit, 
  ToolGroupManager, 
  WindowLevelTool, 
  ZoomTool, 
  Enums as csToolsEnums,
  addTool, 
  PanTool, 
  StackScrollTool,
  LengthTool, 
  AngleTool, 
  EllipticalROITool,
  annotation
  } from '@cornerstonejs/tools'; // npm install @cornerstonejs/tools

//! </imports>-----------------------------------------

//! <DOM-html-elements>-----------------------------------------

// Just makes Enums.ViewportType shorter to write ->> ViewportType
const { ViewportType } = Enums;
const { MouseBindings } = csToolsEnums;

const content = document.getElementById('content');

const viewportGrid = document.createElement('div');
viewportGrid.style.display = 'flex';
viewportGrid.style.flexDirection = 'row';

// element for axial view
const element1 = document.createElement('div');
element1.style.width = '500px';
element1.style.height = '500px';

// element for sagittal view
const element2 = document.createElement('div');
element2.style.width = '500px';
element2.style.height = '500px';


// Create container for annotation controls
const annotationControls = document.createElement('div');
annotationControls.style.display = 'flex';
annotationControls.style.gap = '10px';
annotationControls.style.margin = '10px';

// Button: Reset All
const resetAllBtn2 = document.createElement('button');
resetAllBtn2.textContent = 'Reset All Annotations';
annotationControls.appendChild(resetAllBtn2);

// Dropdown: remove specific tool
const toolSelect = document.createElement('select');
['Length', 'Angle', 'Ellipse ROI'].forEach((name) => {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = `Remove ${name}`;
  toolSelect.appendChild(option);
});
annotationControls.appendChild(toolSelect);

const removeBtn = document.createElement('button');
removeBtn.textContent = 'Remove Selected Tool';
annotationControls.appendChild(removeBtn);


viewportGrid.appendChild(element1);
viewportGrid.appendChild(element2);
content.appendChild(viewportGrid);

// Insert above viewports
content.insertBefore(annotationControls, viewportGrid);

//! </DOM-html-elements>-----------------------------------------

//! <run()>-----------------------------------------

async function run() {
  // Show loading overlay with progress bar
  const loading = document.createElement('div');
  loading.style.padding = '10px';
  loading.style.background = 'rgba(0,0,0,0.7)';
  loading.style.color = 'white';
  loading.style.margin = '10px 0';
  loading.style.fontFamily = 'sans-serif';

  const label = document.createElement('span');
  label.textContent = 'Loading volume... ';

  const progress = document.createElement('progress');
  progress.max = 100;
  progress.value = 0;
  progress.style.width = '300px';
  progress.style.marginLeft = '10px';

  loading.appendChild(label);
  loading.appendChild(progress);
  content.insertBefore(loading, content.firstChild);

  await coreInit();
  await dicomImageLoaderInit();
  await toolsInit();

  metaData.addProvider((type, imageId) => {
    if (type === 'imagePlaneModule') {
      const match = imageId.match(/I(\d+)/);
      if (!match) return;
      const index = parseInt(match[1], 10);

      const info = {
        frameOfReferenceUID: 'fakeFrame',
        rows: 512,
        columns: 512,
        imageOrientationPatient: [1, 0, 0, 0, 1, 0],   // row (1,0,0), col (0,1,0)
        imagePositionPatient: [0, 0, index * 1.0],     // Z increases by 1 per slice
        pixelSpacing: [1.0, 1.0],                      // [row, column]
      };

      // console.log('Providing metadata for', imageId, info);
      return info;
    }
  }, 10000);

  // ---- Build the list of imageIds ----
  const imageIds = [];
  for (let i = 0; i < 517; i++) {
    imageIds.push(`wadouri:/dicom_images/malocclusion-volume/DICOM/I${i}`);
  }

  const renderingEngineId = 'myRenderingEngine';
  // const renderingEngine = new RenderingEngine(renderingEngineId);
  const renderingEngine = new RenderingEngine(renderingEngineId, {
    useCPURendering: false, // Prefer GPU/WebGL
  });

  const volumeId = 'myVolume';
  const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });
  // await volume.load();

  // Attach progress callback
  // Track loading progress
  await volume.load((progressEvent) => {
    if (progressEvent && progressEvent.total !== undefined) {
      const percent = Math.floor(
        (progressEvent.loaded / progressEvent.total) * 100
      );
      progress.value = percent;
    }
  });

  // Remove loading overlay once done
  loading.remove();

  const viewportId1 = 'CT_AXIAL';
  const viewportId2 = 'CT_SAGITTAL';

  const viewportInputs = [
    {
      viewportId: viewportId1,
      element: element1,
      type: ViewportType.ORTHOGRAPHIC,
      defaultOptions: { orientation: Enums.OrientationAxis.AXIAL },
    },
    {
      viewportId: viewportId2,
      element: element2,
      type: ViewportType.ORTHOGRAPHIC,
      defaultOptions: { orientation: Enums.OrientationAxis.SAGITTAL },
    },
  ];

  renderingEngine.setViewports(viewportInputs);

  setVolumesForViewports(
    renderingEngine,
    [{ volumeId }],
    [viewportId1, viewportId2]
  );

  // ---- Tools ----
  addTool(WindowLevelTool);
  addTool(ZoomTool);
  addTool(PanTool);
  addTool(StackScrollTool);
  addTool(LengthTool);
  addTool(AngleTool);
  addTool(EllipticalROITool);
  
  const toolGroupId = 'myToolGroup';
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
  
  const tools = [
  WindowLevelTool.toolName,
  ZoomTool.toolName,
  PanTool.toolName,
  StackScrollTool.toolName,
  LengthTool.toolName,
  AngleTool.toolName,
  EllipticalROITool.toolName,
  ];

  tools.forEach((tool) => toolGroup.addTool(tool));

  //! ---- Toolbar ----
  // ---- Toolbar ----
  const toolbar = document.createElement('div');
  toolbar.style.display = 'flex';
  toolbar.style.gap = '10px';
  toolbar.style.margin = '10px';

  const toolButtons = [
    { label: 'WL', tool: WindowLevelTool.toolName },
    { label: 'Zoom', tool: ZoomTool.toolName },
    { label: 'Pan', tool: PanTool.toolName },
    { label: 'Scroll', tool: StackScrollTool.toolName },
    { label: 'Length', tool: LengthTool.toolName },
    { label: 'Angle', tool: AngleTool.toolName },
    { label: 'Ellipse ROI', tool: EllipticalROITool.toolName },
  ];

  toolButtons.forEach(({ label, tool }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.padding = '5px 10px';

    btn.addEventListener('click', () => {
      console.log(`Activating ${tool}`);
      // Disable all tools first
      tools.forEach((t) => toolGroup.setToolPassive(t));
      toolGroup.setToolActive(tool, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
    });

    toolbar.appendChild(btn);
  });

  content.insertBefore(toolbar, viewportGrid);

  // Bind mouse buttons to tools
  // toolGroup.setToolActive(WindowLevelTool.toolName, {
  //   bindings: [{ mouseButton: MouseBindings.Primary }],  // Left Click
  // });

  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Secondary }], // Right Click
  });

  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Auxiliary }],
  });

  toolGroup.setToolActive(StackScrollTool.toolName);


  // Associate the tool group with your viewports
  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);
}

//! </run()>-----------------------------------------

run();

//! <reset buttons>-----------------------------------------


// Reset everything
resetAllBtn2.addEventListener('click', () => {
  annotation.state.removeAllAnnotations();
  const renderingEngine = getRenderingEngine('myRenderingEngine');
  if (renderingEngine) {
    renderingEngine.getViewports().forEach((vp) => {
      vp.resetCamera();
      vp.setProperties({ voiRange: { lower: -1000, upper: 3000 } });
      vp.render();
    });
  }
});

// Remove only annotations of a specific tool
removeBtn.addEventListener('click', () => {
  const map = {
    Length: 'Length',
    Angle: 'Angle',
    'Ellipse ROI': 'EllipticalROI',
  };
  const toolName = map[toolSelect.value];
  if (!toolName) return;

  // Remove across both viewports (shared fakeFrame)
  annotation.state.removeAnnotations(toolName, 'fakeFrame');


  const re = getRenderingEngine('myRenderingEngine');
  re?.getViewports().forEach((vp) => vp.render());
});

//! </reset buttons>-----------------------------------------

*/

// =========================================================
// =========================================================
// =========================================================