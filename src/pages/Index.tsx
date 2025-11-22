import { useState, useEffect, useRef } from "react";
import { Upload, Search, Zap, Database, Brain, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogEntry {
  id: number;
  step: string;
  message: string;
  sources: string[];
  timestamp: Date;
}

const simulatedSteps = [
  {
    step: "Parsing Intent",
    message: "Analyzing query structure and extracting key parameters...",
    sources: ["NLP Engine", "Query Parser"],
  },
  {
    step: "Querying OpenAlex",
    message: "Identified topic: AI Research. Filtering by region: Europe",
    sources: ["OpenAlex API", "Semantic Scholar"],
  },
  {
    step: "Entity Recognition",
    message: "Extracting researchers and institutions from corpus",
    sources: ["Dr. Geoffrey Hinton", "Prof. Yann LeCun", "DeepMind Lab"],
  },
  {
    step: "Graph Construction",
    message: "Building collaboration network with 47 nodes and 156 edges",
    sources: ["Graph Database", "NetworkX Engine"],
  },
  {
    step: "Citation Analysis",
    message: "Computing H-index and impact factors for discovered entities",
    sources: ["Paper: Attention Is All You Need", "Paper: ImageNet Classification"],
  },
  {
    step: "Similarity Clustering",
    message: "Grouping researchers by research themes using embeddings",
    sources: ["BERT Embeddings", "Cluster Algorithm"],
  },
  {
    step: "Finalizing Results",
    message: "Preparing 3D visualization with interactive controls",
    sources: ["Three.js Renderer", "D3 Layout Engine"],
  },
];

const Index = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [maxNodes, setMaxNodes] = useState("20");
  const [isSearching, setIsSearching] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchStarted, setSearchStarted] = useState(false);
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
    setLogs([]);
    stepIndexRef.current = 0;
  };

  const handleReset = () => {
    setSearchStarted(false);
    setIsSearching(false);
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
            <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px]">
              <Upload className="w-5 h-5 text-primary" />
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {cvFile ? cvFile.name : "Upload CV Context (PDF)"}
                </span>
              </label>
              {cvFile && (
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
              )}
            </div>
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

                {/* Feature Cards */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {[
                    { icon: Brain, label: "AI-Powered Analysis", color: "text-primary" },
                    { icon: Network, label: "Network Mapping", color: "text-accent" },
                    { icon: Database, label: "Real-Time Data", color: "text-primary" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div
                      key={label}
                      className="glass-panel rounded-xl p-4 text-center hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <Icon className={`w-8 h-8 ${color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Search Results View
            <div className="space-y-6 animate-slide-up">
              {/* Compact Search Bar */}
              <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
                <Search className="w-5 h-5 text-primary flex-shrink-0" />
                <Input
                  type="text"
                  value={query}
                  readOnly
                  className="flex-1 bg-transparent border-none text-foreground"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Max: {maxNodes}</span>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Agent Logs - Reasoning Console */}
                <div className="glass-panel rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                    <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                    <h3 className="text-lg font-display font-semibold">
                      Live Agent Logs
                    </h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {isSearching ? "Executing..." : "Completed"}
                    </span>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 h-[500px] overflow-y-auto terminal-scroll space-y-3">
                    {logs.length === 0 && isSearching && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm">Initializing agent...</span>
                      </div>
                    )}

                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="space-y-2 border-l-2 border-primary/50 pl-4 animate-slide-up"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-mono text-sm font-semibold">
                            [{log.timestamp.toLocaleTimeString()}]
                          </span>
                          <span className="text-accent text-sm font-medium">
                            {log.step}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                        {log.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {log.sources.map((source, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-xs text-primary"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Graph Placeholder */}
                <div className="glass-panel rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                    <Network className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-display font-semibold">
                      Research Graph
                    </h3>
                  </div>

                  <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg h-[500px] flex flex-col items-center justify-center">
                    {isSearching ? (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
                        <p className="text-muted-foreground">
                          Waiting for agent execution...
                        </p>
                        <div className="flex gap-2 justify-center">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-primary animate-pulse-glow"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto neon-glow">
                          <Network className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-primary">
                            Graph Ready!
                          </p>
                          <p className="text-sm text-muted-foreground">
                            3D visualization will render here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
