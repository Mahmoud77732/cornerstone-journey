//? registers and configures cornerstone tools

import {
    ToolGroupManager, WindowLevelTool, 
    ZoomTool, csToolsEnums,
    addTool, PanTool, 
    StackScrollTool, LengthTool, 
    AngleTool, EllipticalROITool,
    PlanarFreehandROITool,
    ProbeTool,
    PanoramaCurveTool,   // custom tool
  } from './dependencies.js';

const { MouseBindings } = csToolsEnums;

// console.log('Available tools:', Object.keys(csToolsEnums));

export function setupTools(toolbar, renderingEngineId, viewportIds) {

  // Add a quick clear button for Panorama Curve on the toolbar
  /*
  const clearPanoBtn = document.createElement('button');
  clearPanoBtn.textContent = 'Clear Pano Curves';
  clearPanoBtn.style.padding = '5px 10px';
  clearPanoBtn.addEventListener('click', () => {
    const pano = toolGroup.getToolInstance(PanoramaCurveTool.toolName);
    pano?.clearLast(); // use last interacted viewport
    // Deactivate primary binding so user must pick a tool again
    toolGroup.setToolPassive(PanoramaCurveTool.toolName, { removeAllBindings: true });
    // Re-render all viewports
    const vps = toolGroup.getViewportsInfo();
    vps.forEach(({ renderingEngineId, viewportId }) => {
      const re = getRenderingEngine(renderingEngineId);
      re?.renderViewport(viewportId);
    });
  });
  toolbar.appendChild(clearPanoBtn);
  */

  addTool(WindowLevelTool);
  addTool(ZoomTool);
  addTool(PanTool);
  addTool(StackScrollTool);
  addTool(LengthTool);
  addTool(AngleTool);
  addTool(EllipticalROITool);
  addTool(ProbeTool);
  addTool(PanoramaCurveTool);

  addTool(PlanarFreehandROITool, {
    configuration: {
      interpolation: true,
      allowOpen: true,
    },
  });
  
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
    PlanarFreehandROITool.toolName,
    ProbeTool.toolName,
    PanoramaCurveTool.toolName
  ];


  tools.forEach((tool) => toolGroup.addTool(tool));

  // Toolbar buttons
  const toolButtons = [
    { label: 'WL', tool: WindowLevelTool.toolName },
    { label: 'Zoom', tool: ZoomTool.toolName },
    { label: 'Pan', tool: PanTool.toolName },
    { label: 'Scroll', tool: StackScrollTool.toolName },
    { label: 'Length', tool: LengthTool.toolName },
    { label: 'Angle', tool: AngleTool.toolName },
    { label: 'Ellipse ROI', tool: EllipticalROITool.toolName },
    { label: 'Curve', tool: PlanarFreehandROITool.toolName },
    { label: 'Probe', tool: ProbeTool.toolName },
    { label: 'Panorama Curve', tool: PanoramaCurveTool.toolName },
  ];

  toolButtons.forEach(({ label, tool }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.padding = '5px 10px';

    // when click on tool-button ->> deactivate all tools + activate this tool
    btn.addEventListener('click', () => {
      console.log(`Activating ${tool}`);
      // Deactivate all
      tools.forEach((t) => toolGroup.setToolPassive(t));
      toolGroup.setToolActive(tool, {
        bindings: [{ mouseButton: MouseBindings.Primary }],
      });
    });

    toolbar.appendChild(btn);
  });

  // Default bindings
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Secondary }],
  });
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Auxiliary }],
  });
  toolGroup.setToolActive(StackScrollTool.toolName);

  // Add to viewports
  viewportIds.forEach((vp) => toolGroup.addViewport(vp, renderingEngineId));

  return toolGroup;
}

