"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2 } from "lucide-react";

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
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface TooltipData {
  node: any;
  x: number;
  y: number;
  links: { target: string; type: string; weight: number }[];
}

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
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Flag to prevent resize handler from interfering with fullscreen transitions
  const isTransitioning = useRef(false);
  
  // Store original dimensions for fullscreen restore
  const originalDimensions = useRef({ width: 0, height: 0 });

  // Fetch graph data
  useEffect(() => {
    async function fetchGraphData() {
      try {
        const res = await fetch("/api/graph");
        if (res.ok) {
          const data = await res.json();
          setGraphData(data);
        }
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
      }
    }
    fetchGraphData();
  }, []);

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
      (link) => nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, maturityFilters, searchQuery]);

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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 text-xs flex flex-col gap-1 bg-surface/80 backdrop-blur-sm p-2 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-cyan-400/60" /> <span>Backlink (ссылка)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 border-t-2 border-dashed border-green-400/50" /> <span>Tag (общий тег)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-purple-400/50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(168, 85, 247, 0.5) 2px, rgba(168, 85, 247, 0.5) 4px)' }} /> <span>AI (схожесть)</span>
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
          nodeRelSize={6}
          linkColor={(link: any) => {
            const isHighlighted =
              hoveredNode === link.source || hoveredNode === link.target;
            const baseColor = getLinkColor(link.type);
            return isHighlighted ? baseColor.replace("0.5", "0.9").replace("0.6", "1") : baseColor;
          }}
          linkWidth={(link: any) => {
            const isHighlighted =
              hoveredNode === link.source || hoveredNode === link.target;
            return isHighlighted ? link.weight + 1 : link.weight * 0.5;
          }}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.2}
          onNodeClick={handleNodeClick}
          onNodeRightClick={handleNodeRightClick}
          onNodeHover={handleNodeHover}
          backgroundColor="rgba(8, 15, 30, 0.6)"
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
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
        </div>
      )}
    </div>
  );
}