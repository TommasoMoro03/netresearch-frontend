import { useState, useEffect, useRef } from "react";
import { Upload, Search, Zap, Database, Brain, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogEntry {
  id: number;
  step: string;
  message: string;
  sources: { name: string; url: string; }[];
  timestamp: Date;
}

interface SearchState {
  isSearching: boolean;
  isComplete: boolean;
}

const simulatedSteps = [
  {
    step: "Parsing Intent",
    message: "Analyzing query structure and extracting key parameters...",
    sources: [
      { name: "NLP Engine", url: "https://nlp.stanford.edu" },
      { name: "Query Parser", url: "https://spacy.io" }
    ],
  },
  {
    step: "Querying OpenAlex",
    message: "Identified topic: AI Research. Filtering by region: Europe",
    sources: [
      { name: "OpenAlex API", url: "https://openalex.org" },
      { name: "Semantic Scholar", url: "https://semanticscholar.org" }
    ],
  },
  {
    step: "Entity Recognition",
    message: "Extracting researchers and institutions from corpus",
    sources: [
      { name: "Dr. Geoffrey Hinton", url: "https://scholar.google.com/citations?user=JicYPdAAAAAJ" },
      { name: "Prof. Yann LeCun", url: "https://scholar.google.com/citations?user=WLN3QrAAAAAJ" },
      { name: "DeepMind Lab", url: "https://deepmind.com" }
    ],
  },
  {
    step: "Graph Construction",
    message: "Building collaboration network with 47 nodes and 156 edges",
    sources: [
      { name: "Graph Database", url: "https://neo4j.com" },
      { name: "NetworkX Engine", url: "https://networkx.org" }
    ],
  },
  {
    step: "Citation Analysis",
    message: "Computing H-index and impact factors for discovered entities",
    sources: [
      { name: "Paper: Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
      { name: "Paper: ImageNet Classification", url: "https://arxiv.org/abs/1409.0575" }
    ],
  },
  {
    step: "Similarity Clustering",
    message: "Grouping researchers by research themes using embeddings",
    sources: [
      { name: "BERT Embeddings", url: "https://huggingface.co/bert-base-uncased" },
      { name: "Cluster Algorithm", url: "https://scikit-learn.org" }
    ],
  },
  {
    step: "Finalizing Results",
    message: "Preparing 3D visualization with interactive controls",
    sources: [
      { name: "Three.js Renderer", url: "https://threejs.org" },
      { name: "D3 Layout Engine", url: "https://d3js.org" }
    ],
    isLast: true,
  },
];

const Index = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [maxNodes, setMaxNodes] = useState("20");
  const [isSearching, setIsSearching] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchStarted, setSearchStarted] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const stepIndexRef = useRef(0);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Simulate backend polling
  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      if (stepIndexRef.current >= simulatedSteps.length) {
        setIsSearching(false);
        // Wait a bit before showing the graph
        setTimeout(() => {
          setIsComplete(true);
        }, 1000);
        clearInterval(interval);
        return;
      }

      const currentStep = simulatedSteps[stepIndexRef.current];
      const newLog: LogEntry = {
        id: Date.now(),
        step: currentStep.step,
        message: currentStep.message,
        sources: currentStep.sources,
        timestamp: new Date(),
      };

      setLogs((prev) => [...prev, newLog]);
      stepIndexRef.current += 1;
    }, 1500);

    return () => clearInterval(interval);
  }, [isSearching]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleStartDiscovery = () => {
    if (!query.trim()) return;
    setSearchStarted(true);
    setIsSearching(true);
    setIsComplete(false);
    setLogs([]);
    stepIndexRef.current = 0;
  };

  const handleReset = () => {
    setSearchStarted(false);
    setIsSearching(false);
    setIsComplete(false);
    setLogs([]);
    setQuery("");
    stepIndexRef.current = 0;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center neon-glow">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold neon-text">
                DeepScience Agent
              </h1>
            </div>

            {/* Context Panel - CV Upload */}
            <label className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] cursor-pointer hover:border-primary/50 transition-all">
              <Upload className="w-5 h-5 text-primary" />
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {cvFile ? cvFile.name : "Upload CV Context"}
                </span>
                {cvFile && (
                  <span className="text-xs text-accent">✓ Loaded</span>
                )}
              </div>
            </label>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {!searchStarted ? (
            // Initial Search Screen
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-slide-up">
              <div className="text-center space-y-4 max-w-3xl">
                <h2 className="text-5xl font-display font-bold tracking-tight">
                  Explore the Research Graph
                </h2>
                <p className="text-xl text-muted-foreground">
                  Ask questions about researchers, papers, and discover hidden connections
                  in the academic world
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full max-w-4xl space-y-6">
                <div className="glass-panel rounded-2xl p-8 neon-glow space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStartDiscovery()}
                      placeholder="Ask a research question (e.g., 'Who works on Diffusion Models in Europe?')"
                      className="pl-12 pr-4 py-6 text-lg bg-input/50 border-border/50 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Max Nodes:</span>
                      <Select value={maxNodes} onValueChange={setMaxNodes}>
                        <SelectTrigger className="w-24 bg-input/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleStartDiscovery}
                      disabled={!query.trim()}
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 neon-glow font-semibold"
                    >
                      <Zap className="w-5 h-5" />
                      Start Discovery
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : isComplete ? (
            // Full-Screen Graph View
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
              {/* Minimal Header */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center neon-glow">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-primary">Research Graph</h2>
                    <p className="text-xs text-muted-foreground">{query}</p>
                  </div>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="border-border/50 hover:border-primary"
                >
                  New Search
                </Button>
              </div>

              {/* Full-Screen Graph */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto neon-glow">
                      <Network className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-display font-bold text-primary">
                        3D Graph Visualization
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Interactive network with {maxNodes} nodes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Reasoning View
            <div className="max-w-4xl mx-auto space-y-8 py-8 animate-slide-up">
              {/* Minimal reasoning display */}
              <div className="space-y-6">
                {logs.map((log, index) => {
                  const isCurrentStep = index === logs.length - 1;
                  const isCollapsed = !isCurrentStep;

                  return (
                    <div key={log.id} className="space-y-3">
                      {/* Step header */}
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCurrentStep ? 'bg-primary/20 neon-glow' : 'bg-muted/20'
                        }`}>
                          <Search className={`w-5 h-5 ${isCurrentStep ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className={`font-medium ${isCurrentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {log.message}
                          </h3>
                          
                          {/* Sources - only show for current step */}
                          {isCurrentStep && log.sources.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {log.sources.map((source, idx) => (
                                <div
                                  key={idx}
                                  className="group relative"
                                >
                                  <button
                                    onClick={() => setExpandedSource(expandedSource === `${log.id}-${idx}` ? null : `${log.id}-${idx}`)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 transition-all text-sm"
                                  >
                                    <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
                                      <span className="text-[10px] text-primary">🔗</span>
                                    </div>
                                    <span className="text-foreground">{source.name}</span>
                                  </button>
                                  
                                  {/* Expanded URL */}
                                  {expandedSource === `${log.id}-${idx}` && (
                                    <div className="absolute top-full left-0 mt-2 p-3 rounded-lg bg-background border border-border shadow-lg z-10 min-w-[300px] animate-fade-in">
                                      <p className="text-xs text-muted-foreground break-all">{source.url}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Connector line */}
                      {index < logs.length - 1 && (
                        <div className="ml-5 w-px h-4 bg-border/50" />
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator for next step */}
                {isSearching && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Processing...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
