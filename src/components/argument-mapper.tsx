'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  baseWidth: number; // Base width before content adjustment
  baseHeight: number; // Base height before content adjustment
}

interface ArgumentBox {
  title: string;
  content: string;
  position: Position;
}

interface ArgumentData {
  [key: string]: ArgumentBox;
}

// Adjust constants
const CANVAS_WIDTH = 1000;
const CANVAS_CENTER = CANVAS_WIDTH / 2;
const BOX_WIDTH = 300;
const MIN_HEIGHT = 150;
const MAX_HEIGHT = 1000;
const SIDE_MARGIN = 100;
const ROW_GAP = 120; // Increased default gap between rows
const LINE_HEIGHT = 24;
const PADDING = 20;

const ArgumentMapper = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const [argumentData, setArgumentData] = useState<ArgumentData>({
    claim: {
      title: 'Claim',
      content: '',
      position: {
        x: CANVAS_CENTER - (BOX_WIDTH / 2), // Centered
        y: 50,
        width: BOX_WIDTH,
        height: MIN_HEIGHT,
        baseWidth: BOX_WIDTH,
        baseHeight: MIN_HEIGHT
      }
    },
    warrant: {
      title: 'Warrant',
      content: '',
      position: {
        x: SIDE_MARGIN, // Left side
        y: 0, // Will be calculated
        width: BOX_WIDTH,
        height: MIN_HEIGHT,
        baseWidth: BOX_WIDTH,
        baseHeight: MIN_HEIGHT
      }
    },
    rebuttal: {
      title: 'Rebuttal',
      content: '',
      position: {
        x: CANVAS_WIDTH - SIDE_MARGIN - BOX_WIDTH, // Right side
        y: 0, // Will be calculated
        width: BOX_WIDTH,
        height: MIN_HEIGHT,
        baseWidth: BOX_WIDTH,
        baseHeight: MIN_HEIGHT
      }
    },
    backing: {
      title: 'Backing',
      content: '',
      position: {
        x: SIDE_MARGIN, // Same as warrant
        y: 0, // Will be calculated
        width: BOX_WIDTH,
        height: MIN_HEIGHT,
        baseWidth: BOX_WIDTH,
        baseHeight: MIN_HEIGHT
      }
    },
    rebuttalBacking: {
      title: 'Rebuttal Backing',
      content: '',
      position: {
        x: CANVAS_WIDTH - SIDE_MARGIN - BOX_WIDTH, // Same as rebuttal
        y: 0, // Will be calculated
        width: BOX_WIDTH,
        height: MIN_HEIGHT,
        baseWidth: BOX_WIDTH,
        baseHeight: MIN_HEIGHT
      }
    },
    data: {
      title: 'Data',
      content: '',
      position: {
        x: CANVAS_CENTER - (BOX_WIDTH / 2), // Centered
        y: 0, // Will be calculated
        width: BOX_WIDTH,
        height: MIN_HEIGHT,
        baseWidth: BOX_WIDTH,
        baseHeight: MIN_HEIGHT
      }
    }
  });

  const calculateHeight = (content: string): number => {
    if (!content) return MIN_HEIGHT;

    // Create a temporary div to measure actual wrapped text height
    const tempDiv = document.createElement('div');
    tempDiv.style.width = `${BOX_WIDTH - (PADDING * 2)}px`;
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.fontSize = '14px'; // Match text-sm
    tempDiv.style.lineHeight = '1.5'; // Match the div's line-height
    tempDiv.style.wordBreak = 'break-word';
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.textContent = content;
    
    document.body.appendChild(tempDiv);
    const contentHeight = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);

    // Fixed heights: title (40px) + content + one line padding (24px)
    const totalHeight = 40 + contentHeight + 24; // 24px is one line height
    return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, totalHeight));
  };

  // Update positions regardless of content
  useEffect(() => {
    const updatedData = { ...argumentData };
    
    // First, calculate all heights
    Object.entries(updatedData).forEach(([key, data]) => {
      const newHeight = calculateHeight(data.content);
      updatedData[key].position.height = newHeight;
    });

    // Row 1: Claim (fixed y position)
    const claimY = 50;
    updatedData.claim.position.y = claimY;
    
    // Row 2: Fixed distance from claim
    const row2Y = claimY + updatedData.claim.position.height + ROW_GAP;
    updatedData.warrant.position.y = row2Y;
    updatedData.rebuttal.position.y = row2Y;
    
    // Row 3: Fixed distance from row 2
    const row3Y = row2Y + Math.max(
      updatedData.warrant.position.height,
      updatedData.rebuttal.position.height
    ) + ROW_GAP;
    updatedData.backing.position.y = row3Y;
    updatedData.rebuttalBacking.position.y = row3Y;
    
    // Row 4: Fixed distance from row 3
    const row4Y = row3Y + Math.max(
      updatedData.backing.position.height,
      updatedData.rebuttalBacking.position.height
    ) + ROW_GAP;
    updatedData.data.position.y = row4Y;

    setArgumentData(updatedData);
  }, [argumentData.claim.content, argumentData.warrant.content, argumentData.rebuttal.content,
      argumentData.backing.content, argumentData.rebuttalBacking.content, argumentData.data.content]);

  const handleContentChange = (key: string, value: string) => {
    setArgumentData((prev) => {
      const newData = {
        ...prev,
        [key]: {
          ...prev[key],
          content: value
        }
      };
      return newData;
    });
  };

  // SVG Components
  const ArrowMarkers = () => (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="6"
        markerHeight="4"
        refX="6"
        refY="2"
        orient="auto"
      >
        <polygon points="0 0, 6 2, 0 4" fill="#666" />
      </marker>
    </defs>
  );

  const VisualizationBox = ({ title, content, position }: ArgumentBox) => (
    <g transform={`translate(${position.x}, ${position.y})`}>
      <rect
        width={position.width}
        height={position.height}
        fill="white"
        stroke="#666"
        strokeWidth="1"
      />
      <text 
        x={position.width / 2} 
        y="24" 
        textAnchor="middle" 
        className="font-bold"
      >
        {title}
      </text>
      <foreignObject 
        x={PADDING} 
        y={40}
        width={position.width - (PADDING * 2)} 
        height={position.height - 40}
      >
        <div 
          className="w-full text-sm whitespace-pre-wrap break-words"
          style={{ 
            lineHeight: '1.5'
          }}
        >
          {content || `No ${title.toLowerCase()} provided...`}
        </div>
      </foreignObject>
    </g>
  );

  // Separate PNG export function
  const exportPng = async () => {
    if (svgRef.current) {
      try {
        const svgElement = svgRef.current;
        
        // Calculate total height needed by finding the lowest box
        const totalHeight = Math.max(
          ...Object.values(argumentData).map(data => 
            data.position.y + data.position.height
          )
        ) + 50; // Add some bottom margin

        // Update SVG viewBox to match content
        svgElement.setAttribute('viewBox', `0 0 ${CANVAS_WIDTH} ${totalHeight}`);
        
        // Create a container with exact dimensions
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = `${CANVAS_WIDTH}px`;
        container.style.height = `${totalHeight}px`;
        container.style.backgroundColor = 'white';
        
        // Clone SVG with proper dimensions
        const svgClone = svgElement.cloneNode(true) as SVGElement;
        svgClone.setAttribute('width', `${CANVAS_WIDTH}px`);
        svgClone.setAttribute('height', `${totalHeight}px`);
        container.appendChild(svgClone);
        document.body.appendChild(container);

        // Capture with html2canvas
        const canvas = await html2canvas(container, {
          backgroundColor: 'white',
          scale: 2,
          logging: false,
          useCORS: true,
          width: CANVAS_WIDTH,
          height: totalHeight,
          onclone: (clonedDoc) => {
            const foreignObjects = clonedDoc.getElementsByTagName('foreignObject');
            Array.from(foreignObjects).forEach(fo => {
              const div = fo.querySelector('div');
              if (div) {
                div.style.height = 'auto';
                div.style.overflow = 'visible';
                div.style.whiteSpace = 'pre-wrap';
                div.style.wordBreak = 'break-word';
                div.style.lineHeight = '1.5';
                div.style.fontSize = '14px';
              }
            });
          }
        });

        // Convert to PNG and download
        const dataUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = 'argument-structure.png';
        downloadLink.click();

        // Cleanup
        document.body.removeChild(container);
      } catch (error) {
        console.error('Error exporting PNG:', error);
      }
    }
  };

  // Add Import icon to imports at top
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Split by section divider and process each section
        const sections = text.split('---\n\n');
        
        const newData = { ...argumentData };
        
        sections.forEach(section => {
          // Split into title and content
          const [title, ...contentLines] = section.split('\n');
          // Remove empty lines at the end
          while (contentLines.length > 0 && !contentLines[contentLines.length - 1]) {
            contentLines.pop();
          }
          const content = contentLines.join('\n');
          
          // Find matching key in argumentData
          const key = Object.keys(argumentData).find(k => 
            argumentData[k].title.toUpperCase() === title.trim()
          );
          
          if (key) {
            newData[key] = {
              ...newData[key],
              content: content.trim()
            };
          }
        });

        setArgumentData(newData);
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please check the file format.');
      }
    };

    reader.readAsText(file);
  };

  // Add these new functions to your component
  const downloadTemplate = () => {
    const template = Object.entries(argumentData)
      .map(([_, data]) => {
        return `${data.title.toUpperCase()}\nEnter your ${data.title.toLowerCase()} here...\n\n`;
      })
      .join('---\n\n');

    const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'argument-structure-template.txt';
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  const exportTxt = () => {
    try {
      const textContent = Object.entries(argumentData)
        .map(([_, data]) => {
          return `${data.title.toUpperCase()}\n${data.content || 'No content provided.'}\n\n`;
        })
        .join('---\n\n');

      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'argument-structure.txt';
      downloadLink.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting text:', error);
    }
  };

  const getTooltipContent = (title: string): string => {
    const tooltips: { [key: string]: string } = {
      'Claim': 'The main point or conclusion of the argument',
      'Warrant': 'The premise or assumption that supports the claim',
      'Rebuttal': 'A counterargument or objection to the claim',
      'Backing': 'A statement or evidence that supports the warrant',
      'Rebuttal Backing': 'A statement or evidence that supports the rebuttal',
      'Data': 'Information or evidence that supports the claim'
    };
    return tooltips[title] || '';
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">Validity Argument Builder</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Developed by</span>
                <a 
                  href="https://mengliu.info/" 
                  className="text-xs font-medium hover:underline inline-flex items-center gap-1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Meng Liu
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="text-sm space-y-1.5">
                <p>
                  <span className="font-medium">Create and visualize argument structure diagrams with ease</span> based on Kane's (1992, 2006, 2013) argument-based validation framework.
                </p>
                <p className="text-muted-foreground">
                  The layout automatically adjusts as you type. No need to worry about formatting, alignment, or spacing.
                </p>
              </div>

              <div className="rounded-lg overflow-hidden border">
                <div className="px-3 py-2 bg-muted/50 border-b">
                  <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Citation</h3>
                </div>
                <div className="p-3 bg-background">
                  <p className="text-sm leading-relaxed">
                    Liu, M., & Henry, A. (2025). Resolving the crisis in L2 motivational self system research: Constructive dialogue and argument-based validation. <span className="italic font-medium">Studies in Second Language Acquisition</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {/* Hidden file input */}
              <input
                type="file"
                id="file-import"
                className="hidden"
                accept=".txt"
                onChange={handleImport}
              />
              
              {/* Template button with tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      className="w-[120px]"
                      onClick={downloadTemplate}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download a template file showing the correct format for importing text</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Import button with tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      className="w-[120px]"
                      onClick={() => document.getElementById('file-import')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Import a text file in the template format to automatically fill the form</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Export PNG button with tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      className="w-[120px]"
                      onClick={exportPng}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PNG
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save the argument structure diagram as a PNG image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Export TXT button with tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      className="w-[120px]"
                      onClick={exportTxt}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      TXT
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save your argument content as a text file for later use</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Input Form Section */}
            <div className="col-span-4 flex flex-col h-full">
              <div className="grid grid-rows-6 gap-3 flex-grow">
                {Object.entries(argumentData).map(([key, data]) => (
                  <div key={key} className="flex flex-col">
                    <label className="block text-sm font-medium mb-1">{data.title}</label>
                    <p className="text-xs text-muted-foreground mb-2">{getTooltipContent(data.title)}</p>
                    <Textarea
                      value={data.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(key, e.target.value)}
                      placeholder={`Enter ${data.title.toLowerCase()}...`}
                      className="flex-grow resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Visualization Section */}
            <div className="col-span-8 bg-background p-4 rounded-lg border-input border">
              <svg 
                ref={svgRef}
                viewBox={`0 0 ${CANVAS_WIDTH} ${Math.max(800, argumentData.data.position.y + argumentData.data.position.height + 100)}`} 
                className="w-full h-auto min-h-[800px]"
                preserveAspectRatio="xMidYMid meet"
              >
                <ArrowMarkers />
                
                {/* Main vertical line (Data to Claim) */}
                <path 
                  d={`M${CANVAS_CENTER} ${argumentData.data.position.y} L${CANVAS_CENTER} ${argumentData.claim.position.y + argumentData.claim.position.height}`} 
                  stroke="#666" 
                  fill="none" 
                  strokeWidth="1"
                  markerEnd="url(#arrowhead)"
                />
                
                {/* Warrant to center arrow */}
                <path 
                  d={`M${argumentData.warrant.position.x + argumentData.warrant.position.width} ${argumentData.warrant.position.y + 40} L${CANVAS_CENTER} ${argumentData.warrant.position.y + 40}`} 
                  stroke="#666" 
                  fill="none" 
                  strokeWidth="1"
                  markerEnd="url(#arrowhead)"
                />
                
                {/* Rebuttal to center arrow */}
                <path 
                  d={`M${argumentData.rebuttal.position.x} ${argumentData.rebuttal.position.y + 40} L${CANVAS_CENTER} ${argumentData.rebuttal.position.y + 40}`} 
                  stroke="#666" 
                  fill="none" 
                  strokeWidth="1"
                  markerEnd="url(#arrowhead)"
                />
                
                {/* Annotations */}
                <text 
                  x="410" 
                  y={argumentData.claim.position.y + argumentData.claim.position.height + 30} 
                  className="text-sm font-medium italic"
                >
                  Therefore
                </text>
                <text 
                  x={argumentData.warrant.position.x + argumentData.warrant.position.width + 10} 
                  y={argumentData.warrant.position.y + 35} 
                  className="text-sm font-medium italic"
                >
                  Since
                </text>
                <text 
                  x={argumentData.rebuttal.position.x - 50} 
                  y={argumentData.rebuttal.position.y + 35} 
                  className="text-sm font-medium italic"
                >
                  Unless
                </text>

                {/* Boxes */}
                {Object.entries(argumentData).map(([key, data]) => (
                  <VisualizationBox key={key} {...data} />
                ))}
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArgumentMapper;
