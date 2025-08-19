
import {init as coreInit, RenderingEngine, metaData, Enums, volumeLoader, setVolumesForViewports, getRenderingEngine
} from '@cornerstonejs/core';

import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';

import {init as toolsInit, ToolGroupManager, WindowLevelTool, ZoomTool, Enums as csToolsEnums,
  addTool, PanTool, StackScrollTool } from '@cornerstonejs/tools'; // npm install @cornerstonejs/tools

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

viewportGrid.appendChild(element1);
viewportGrid.appendChild(element2);

content.appendChild(viewportGrid);

async function run() {
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
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const volumeId = 'myVolume';
  const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });

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

  await volume.load();

  setVolumesForViewports(
    renderingEngine,
    [{ volumeId }],
    [viewportId1, viewportId2]
  );

  addTool(WindowLevelTool);
  addTool(ZoomTool);
  addTool(PanTool);
  addTool(StackScrollTool);

  const toolGroupId = 'myToolGroup';
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  toolGroup.addTool(WindowLevelTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(StackScrollTool.toolName);

  // Bind mouse buttons to tools
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Primary }],  // Left Click
  });
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Secondary }], // Right Click
  });
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Auxiliary }], //
  });
  toolGroup.setToolActive(StackScrollTool.toolName);

  // Associate the tool group with your viewports
  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);
}

run();

document.getElementById('resetBtn').addEventListener('click', () => {
  const renderingEngine = getRenderingEngine('myRenderingEngine');
  if (!renderingEngine) return;

  // Loop through all viewports and reset their camera + VOI
  renderingEngine.getViewports().forEach((viewport) => {
    viewport.resetCamera();   
    // Reset brightness/contrast (VOI)
    viewport.setProperties({
      voiRange: {
        lower: -1000,  // Default for CT (air), 40 for soft tissue
        upper: 3000,   // Default for CT (bone), 80 for soft tissue
      }
    }); 
    viewport.render();
  });
});


