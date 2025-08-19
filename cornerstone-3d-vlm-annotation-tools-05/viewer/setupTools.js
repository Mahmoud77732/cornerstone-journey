//? registers and configures cornerstone tools


import {
    ToolGroupManager, WindowLevelTool, 
    ZoomTool, csToolsEnums,
    addTool, PanTool, 
    StackScrollTool, LengthTool, 
    AngleTool, EllipticalROITool,
    PlanarFreehandROITool,
    ProbeTool
  } from './dependencies.js';

const { MouseBindings } = csToolsEnums;

console.log('Available tools:', Object.keys(csToolsEnums));

export function setupTools(toolbar, renderingEngineId, viewportIds) {
  addTool(WindowLevelTool);
  addTool(ZoomTool);
  addTool(PanTool);
  addTool(StackScrollTool);
  addTool(LengthTool);
  addTool(AngleTool);
  addTool(EllipticalROITool);
  addTool(ProbeTool);

  addTool(PlanarFreehandROITool, {
    configuration: {
      interpolation: true,   // 👈 smooth curve
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
    ProbeTool.toolName
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
    { label: 'Probe', tool: ProbeTool.toolName }
  ];

  toolButtons.forEach(({ label, tool }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.padding = '5px 10px';

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

