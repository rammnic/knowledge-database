"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2, Settings, RotateCcw, Play, X } from "lucide-react";

// Динамический импорт для избежания SSR проблем с canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted">Загрузка графа знаний...</p>
      </div>
    </div>
  ),
});

interface GraphNode {
  id: string;
  name: string;
  slug: string;
  maturity: "SEED" | "SAPLING" | "EVERGREEN";
  val: number;
  tags: string[];
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: "BACKLINK" | "TAG" | "AI";
  weight: number;
  similarity?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface TooltipData {
  node: any;
  x: number;
  y: number;
  links: { target: string; type: string; weight: number; similarity?: number }[];
}

// Default simulation parameters
const defaultParams = {
  linkStrength: 0.5,
  chargeStrength: -100,
  linkDistance: 60,
  centerStrength: 0.3,
  linkCurvature: 0.2,
  nodeRelSize: 6,
  velocityDecay: 0.3,
};

export function KnowledgeGraph() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Фильтры
  const [maturityFilters, setMaturityFilters] = useState({
    SEED: true,
    SAPLING: true,
    EVERGREEN: true,
  });
  const [linkTypeFilters, setLinkTypeFilters] = useState({
    BACKLINK: true,
    TAG: true,
    AI: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  
  // Simulation parameters
  const [simParams, setSimParams] = useState({
    linkStrength: 0.5,
    chargeStrength: -100,
    linkDistance: 60,
    centerStrength: 0.3,
    linkCurvature: 0.2,
    nodeRelSize: 6,
    velocityDecay: 0.3,
  });
  
  // Flag to prevent resize handler from interfering with fullscreen transitions
  const isTransitioning = useRef(false);
  
  // Store original dimensions for fullscreen restore
  const originalDimensions = useRef({ width: 0, height: 0 });

  // Fetch graph data
  useEffect(() => {
    async function fetchGraphData() {
      try {
        const res = await fetch(`/api/graph?similarityThreshold=${similarityThreshold}`);
        if (res.ok) {
          const data = await res.json();
          setGraphData(data);
        }
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
      }
    }
    fetchGraphData();
  }, [similarityThreshold]);

  // Handle resize with ResizeObserver
  useEffect(() => {
    // Skip resize handling during fullscreen transitions
    if (isTransitioning.current) return;
    
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (document.fullscreenElement) {
        const newDims = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
        setDimensions(newDims);
      } else if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Canvas заполняет весь контейнер без вычитаний
        const newDims = { 
          width: Math.max(width, 100), 
          height: Math.max(height, 300) 
        };
        setDimensions(newDims);
        
        // Only update originalDimensions if it's not set yet (first load)
        if (originalDimensions.current.width === 0) {
          originalDimensions.current = newDims;
        }
      }
    };
    
    // Initial dimension update
    updateDimensions();
    
    // Use ResizeObserver for more reliable dimension tracking
    const resizeObserver = new ResizeObserver(() => {
      if (!isTransitioning.current) {
        updateDimensions();
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener("resize", updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Фильтрация данных
  const filteredData = useMemo(() => {
    if (!graphData) return null;

    const filteredNodes = graphData.nodes.filter((node) => {
      const maturityMatch = maturityFilters[node.maturity];
      const searchMatch = !searchQuery || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase());
      return maturityMatch && searchMatch;
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = graphData.links.filter(
      (link) => 
        nodeIds.has(link.source) && 
        nodeIds.has(link.target) &&
        linkTypeFilters[link.type]
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, maturityFilters, linkTypeFilters, searchQuery]);

  // Deep clone filtered data to force graph to re-render properly
  const graphDataForRender = useMemo(() => {
    if (!filteredData) return null;
    return JSON.parse(JSON.stringify(filteredData));
  }, [filteredData]);

  const getNodeColor = useCallback((maturity: string, isHovered: boolean) => {
    const colors: Record<string, string> = {
      SEED: "#22c55e",
      SAPLING: "#84cc16",
      EVERGREEN: "#0891b2",
    };
    const color = colors[maturity] || "#6b7280";
    return isHovered ? color : color + "cc";
  }, []);

  const getLinkColor = useCallback((type: string) => {
    switch (type) {
      case "BACKLINK":
        return "rgba(34, 211, 238, 0.6)"; // cyan
      case "TAG":
        return "rgba(34, 197, 94, 0.5)"; // green
      case "AI":
        return "rgba(168, 85, 247, 0.5)"; // purple
      default:
        return "rgba(107, 114, 128, 0.3)";
    }
  }, []);

  const handleNodeClick = useCallback(
    (node: any) => {
      router.push(`/notes/${node.slug}`);
    },
    [router]
  );

  const handleNodeRightClick = useCallback(
    (node: any, event: MouseEvent) => {
      event.preventDefault();
      setSelectedNode(selectedNode === node.id ? null : node.id);
    },
    [selectedNode]
  );

  const handleNodeHover = useCallback(
    (node: any, prevNode: any) => {
      setHoveredNode(node?.id || null);
      
      if (node && graphData) {
        // Находим все связи узла
        const nodeLinks = graphData.links
          .filter((link) => link.source === node.id || link.target === node.id)
          .map((link) => ({
            target: link.source === node.id ? link.target : link.source,
            type: link.type,
            weight: link.weight,
            similarity: link.similarity,
          }));
        
        // Получаем позицию для tooltip (приблизительно)
        setTooltip({
          node,
          x: 10,
          y: 10,
          links: nodeLinks,
        });
      } else {
        setTooltip(null);
      }
    },
    [graphData]
  );

  const centerOnNode = useCallback((nodeId: string) => {
    if (graphRef.current && filteredData) {
      const node = filteredData.nodes.find((n: any) => n.id === nodeId);
      if (node) {
        graphRef.current.centerAt(node.x || 0, node.y || 0, 1000);
        graphRef.current.zoom(2, 1000);
      }
    }
  }, [filteredData]);

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Сохраняем текущие размеры перед входом в fullscreen
      if (containerRef.current && originalDimensions.current.width > 0) {
        // Already have dimensions, use them
      } else if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        originalDimensions.current = { 
          width: Math.max(width, 100), 
          height: Math.max(height, 300) 
        };
      }
      isTransitioning.current = true;
      containerRef.current?.requestFullscreen();
    } else {
      isTransitioning.current = true;
      document.exitFullscreen();
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      
      if (isFull) {
        // При входе в fullscreen - используем размеры окна
        setTimeout(() => {
          const newDims = {
            width: window.innerWidth,
            height: window.innerHeight,
          };
          setDimensions(newDims);
          isTransitioning.current = false;
        }, 100);
      } else {
        // При выходе из fullscreen - НЕ восстанавливаем сохранённые размеры
        // Вместо этого сбрасываем флаг isTransitioning и даём ResizeObserver пересчитать
        setTimeout(() => {
          isTransitioning.current = false;
          // ResizeObserver сам пересчитает размеры при изменении контейнера
        }, 100);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Поиск - центрируем на первом найденном
  useEffect(() => {
    if (searchQuery && filteredData && filteredData.nodes.length > 0) {
      const found = filteredData.nodes.find((n: any) =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (found) {
        centerOnNode(found.id);
      }
    }
  }, [searchQuery, filteredData, centerOnNode]);

  const toggleMaturityFilter = (maturity: keyof typeof maturityFilters) => {
    setMaturityFilters((prev) => ({
      ...prev,
      [maturity]: !prev[maturity],
    }));
  };

  const toggleLinkTypeFilter = (linkType: keyof typeof linkTypeFilters) => {
    setLinkTypeFilters((prev) => ({
      ...prev,
      [linkType]: !prev[linkType],
    }));
  };

  const handleSimilarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimilarityThreshold(parseFloat(e.target.value));
  };

  // Handle simulation parameter changes
  const handleParamChange = (param: string, value: number) => {
    setSimParams((prev) => ({ ...prev, [param]: value }));
  };

  // Apply simulation parameters to graph
  const applySimulationParams = useCallback(() => {
    if (!graphRef.current) return;
    
    // Apply D3 forces
    const linkForce = graphRef.current.d3Force('link');
    if (linkForce) {
      linkForce.strength(simParams.linkStrength);
      linkForce.distance(simParams.linkDistance);
    }
    
    const chargeForce = graphRef.current.d3Force('charge');
    if (chargeForce) {
      chargeForce.strength(simParams.chargeStrength);
    }
    
    const centerForce = graphRef.current.d3Force('center');
    if (centerForce) {
      centerForce.strength(simParams.centerStrength);
    }
    
    // Reheat simulation to apply changes
    graphRef.current.d3ReheatSimulation();
  }, [simParams]);

  // Reset parameters to defaults
  const resetParams = useCallback(() => {
    setSimParams(defaultParams);
    // Apply default params after a small delay to ensure state is updated
    setTimeout(() => {
      if (!graphRef.current) return;
      const linkForce = graphRef.current.d3Force('link');
      if (linkForce) {
        linkForce.strength(defaultParams.linkStrength);
        linkForce.distance(defaultParams.linkDistance);
      }
      const chargeForce = graphRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(defaultParams.chargeStrength);
      }
      const centerForce = graphRef.current.d3Force('center');
      if (centerForce) {
        centerForce.strength(defaultParams.centerStrength);
      }
      graphRef.current.d3ReheatSimulation();
    }, 50);
  }, []);

  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="glass rounded-2xl p-4 h-full min-h-[400px] relative overflow-hidden"
      >
        <div className="flex items-center justify-center h-full text-muted">
          <p>Нет данных для отображения графа</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="glass rounded-2xl p-4 h-full min-h-[500px] relative overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <h3 className="text-lg font-semibold">Сеть знаний</h3>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Поиск заметки..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-border focus:border-primary focus:outline-none w-48"
        />
      </div>

      {/* Filters */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        {/* Settings button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${
            showSettings 
              ? "bg-primary/20 text-primary border border-primary/50" 
              : "bg-surface/80 hover:bg-surface text-muted"
          }`}
          title="Настройки графа"
        >
          <Settings className="w-4 h-4" />
        </button>
        
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-surface/80 hover:bg-surface transition-colors"
          title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-muted" />
          ) : (
            <Maximize2 className="w-4 h-4 text-muted" />
          )}
        </button>
        
        {/* Maturity filters */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => toggleMaturityFilter("SEED")}
            className={`px-2 py-1 rounded-full flex items-center gap-1 transition-all ${
              maturityFilters.SEED
                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                : "bg-surface text-muted border border-border"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" /> <span>🌱 Seed</span>
          </button>
          <button
            onClick={() => toggleMaturityFilter("SAPLING")}
            className={`px-2 py-1 rounded-full flex items-center gap-1 transition-all ${
              maturityFilters.SAPLING
                ? "bg-lime-500/20 text-lime-400 border border-lime-500/50"
                : "bg-surface text-muted border border-border"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-lime-500" /> <span>🌿 Sapling</span>
          </button>
          <button
            onClick={() => toggleMaturityFilter("EVERGREEN")}
            className={`px-2 py-1 rounded-full flex items-center gap-1 transition-all ${
              maturityFilters.EVERGREEN
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                : "bg-surface text-muted border border-border"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500" /> <span>🌳 Evergreen</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-4 z-30 w-72 bg-surface/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Параметры графа</h4>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-surface rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Link Strength */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Сила связей</span>
                <span className="text-primary font-mono">{simParams.linkStrength.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={simParams.linkStrength}
                onChange={(e) => handleParamChange('linkStrength', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Charge Strength */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Отталкивание узлов</span>
                <span className="text-primary font-mono">{simParams.chargeStrength}</span>
              </div>
              <input
                type="range"
                min="-300"
                max="-30"
                step="10"
                value={simParams.chargeStrength}
                onChange={(e) => handleParamChange('chargeStrength', parseInt(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Link Distance */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Длина связей</span>
                <span className="text-primary font-mono">{simParams.linkDistance}</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={simParams.linkDistance}
                onChange={(e) => handleParamChange('linkDistance', parseInt(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Center Strength */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Притяжение к центру</span>
                <span className="text-primary font-mono">{simParams.centerStrength.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={simParams.centerStrength}
                onChange={(e) => handleParamChange('centerStrength', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Link Curvature */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Кривизна линий</span>
                <span className="text-primary font-mono">{simParams.linkCurvature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.02"
                value={simParams.linkCurvature}
                onChange={(e) => handleParamChange('linkCurvature', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Node Size */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Размер узлов</span>
                <span className="text-primary font-mono">{simParams.nodeRelSize}</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                step="0.5"
                value={simParams.nodeRelSize}
                onChange={(e) => handleParamChange('nodeRelSize', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Velocity Decay */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Трение</span>
                <span className="text-primary font-mono">{simParams.velocityDecay.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.02"
                value={simParams.velocityDecay}
                onChange={(e) => handleParamChange('velocityDecay', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-border">
            <button
              onClick={applySimulationParams}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs font-medium transition-colors"
            >
              <Play className="w-3 h-3" />
              Применить
            </button>
            <button
              onClick={resetParams}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface hover:bg-background text-muted rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Legend / Link Type Filters */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
        <div className="text-xs text-muted mb-1">Типы связей:</div>
        <div className="flex flex-col gap-1 bg-surface/80 backdrop-blur-sm p-2 rounded-lg">
          <button
            onClick={() => toggleLinkTypeFilter("BACKLINK")}
            className={`flex items-center gap-2 text-xs transition-all ${
              linkTypeFilters.BACKLINK 
                ? "text-cyan-400" 
                : "text-muted opacity-40 line-through"
            }`}
          >
            <span className={`w-6 h-0.5 ${linkTypeFilters.BACKLINK ? "bg-cyan-400/60" : "bg-cyan-400/20"}`} />
            <span>Backlink (ссылка)</span>
          </button>
          <button
            onClick={() => toggleLinkTypeFilter("TAG")}
            className={`flex items-center gap-2 text-xs transition-all ${
              linkTypeFilters.TAG 
                ? "text-green-400" 
                : "text-muted opacity-40 line-through"
            }`}
          >
            <span className={`w-6 h-0.5 border-t-2 border-dashed ${linkTypeFilters.TAG ? "border-green-400/50" : "border-green-400/20"}`} />
            <span>Tag (общий тег)</span>
          </button>
          <button
            onClick={() => toggleLinkTypeFilter("AI")}
            className={`flex items-center gap-2 text-xs transition-all ${
              linkTypeFilters.AI 
                ? "text-purple-400" 
                : "text-muted opacity-40 line-through"
            }`}
          >
            <span 
              className={`w-6 h-0.5 ${linkTypeFilters.AI ? "bg-purple-400/50" : "bg-purple-400/20"}`}
              style={linkTypeFilters.AI ? { backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(168, 85, 247, 0.5) 2px, rgba(168, 85, 247, 0.5) 4px)' } : { backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(168, 85, 247, 0.2) 2px, rgba(168, 85, 247, 0.2) 4px)' }}
            />
            <span>AI (схожесть)</span>
          </button>
        </div>

        {/* AI Similarity Threshold Slider */}
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="text-xs text-muted mb-1">Порог AI схожести:</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.3"
              max="0.8"
              step="0.05"
              value={similarityThreshold}
              onChange={handleSimilarityChange}
              className="w-20 h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <span className="text-xs text-purple-400 font-mono w-12">
              {similarityThreshold.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-muted">
        {filteredData.nodes.length} узлов • {filteredData.links.length} связей
      </div>

      {/* Graph container */}
      <div className="absolute inset-0">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphDataForRender}
          width={dimensions.width}
          height={dimensions.height}
          nodeId="id"
          nodeLabel={(node: any) => `${node.name} (${node.maturity})`}
          nodeColor={(node: any) => getNodeColor(node.maturity, hoveredNode === node.id)}
          nodeVal="val"
          nodeRelSize={simParams.nodeRelSize}
          linkColor={(link: any) => {
            const isHighlighted =
              hoveredNode === link.source || hoveredNode === link.target;
            const baseColor = getLinkColor(link.type);
            return isHighlighted ? baseColor.replace("0.5", "0.9").replace("0.6", "1") : baseColor;
          }}
          linkWidth={(link: any) => {
            const isHighlighted =
              hoveredNode === link.source || hoveredNode === link.target;
            // For AI links, use similarity to adjust width
            if (link.type === "AI" && link.similarity) {
              const baseWidth = link.similarity * 3; // Scale by similarity
              return isHighlighted ? baseWidth + 1.5 : baseWidth * 0.7;
            }
            return isHighlighted ? link.weight + 1 : link.weight * 0.5;
          }}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          linkCurvature={simParams.linkCurvature}
          onNodeClick={handleNodeClick}
          onNodeRightClick={handleNodeRightClick}
          onNodeHover={handleNodeHover}
          backgroundColor="rgba(8, 15, 30, 0.6)"
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={simParams.velocityDecay}
          warmupTicks={50}
        />
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-surface border border-border rounded-lg p-3 shadow-lg max-w-xs pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 20, dimensions.width - 200),
            top: Math.min(tooltip.y + 20, dimensions.height - 150),
          }}
        >
          <div className="font-semibold text-sm mb-1">{tooltip.node.name}</div>
          <div className="text-xs text-muted mb-2">
            {tooltip.node.maturity === "SEED" && <span>🌱 Seed</span>}
            {tooltip.node.maturity === "SAPLING" && <span>🌿 Sapling</span>}
            {tooltip.node.maturity === "EVERGREEN" && <span>🌳 Evergreen</span>}
          </div>
          {tooltip.node.tags && tooltip.node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tooltip.node.tags.slice(0, 5).map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary-light rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-muted">
            {tooltip.links.length} связей
          </div>
          {/* Show AI similarity details */}
          {tooltip.links.filter(l => l.type === "AI").length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="text-xs text-purple-400 mb-1">AI связи:</div>
              {tooltip.links
                .filter(l => l.type === "AI")
                .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
                .slice(0, 5)
                .map((link, idx) => (
                  <div key={idx} className="text-xs text-muted flex justify-between gap-2">
                    <span className="truncate max-w-[120px]">{link.target}</span>
                    <span className="text-purple-400 font-mono">
                      {(link.similarity || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}