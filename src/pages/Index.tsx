import { useState, useEffect } from "react";
import { Upload, Search, Zap, Brain, Network, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import GraphVisualization from "@/components/GraphVisualization";
import { GraphData, StepLog, uploadCV, startAgentRun, sendUserName, getUserData, getRunById } from "@/services/api";
import { ReasoningConsole } from "@/components/ReasoningConsole";
import { PastRunsSidebar } from "@/components/PastRunsSidebar";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvId, setCvId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [maxNodes, setMaxNodes] = useState("20");
  const [isSearching, setIsSearching] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [searchStarted, setSearchStarted] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [reasoningSteps, setReasoningSteps] = useState<StepLog[]>([]);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [userName, setUserName] = useState("");
  const [hasCvLoaded, setHasCvLoaded] = useState(false);
  const { toast } = useToast();

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getUserData();
        if (userData.name) {
          setUserName(userData.name);
        }
        if (userData.has_cv) {
          setHasCvLoaded(true);
          // Set a fake file to indicate CV is loaded
          setCvFile(new File([], "existing_cv.pdf"));
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCvFile(file);

      // Upload CV immediately
      setIsUploadingCV(true);
      try {
        const result = await uploadCV(file);
        setCvId(result.cv_id);
        setHasCvLoaded(true);
        toast({
          title: "CV Uploaded",
          description: `${result.filename} has been uploaded successfully.`,
        });
      } catch (error) {
        console.error("Failed to upload CV:", error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload CV. Please try again.",
          variant: "destructive",
        });
        setCvFile(null);
        setHasCvLoaded(false);
      } finally {
        setIsUploadingCV(false);
      }
    }
  };

  const handleStartDiscovery = async () => {
    if (!query.trim()) return;

    setSearchStarted(true);
    setIsSearching(true);
    setIsComplete(false);
    setGraphData(null);

    try {
      // Send user name to backend if provided
      if (userName.trim()) {
        await sendUserName(userName);
      }

      const result = await startAgentRun(query, parseInt(maxNodes), cvId || undefined);
      setRunId(result.run_id);
    } catch (error) {
      console.error("Failed to start agent run:", error);
      toast({
        title: "Error",
        description: "Failed to start discovery. Please try again.",
        variant: "destructive",
      });
      setSearchStarted(false);
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchStarted(false);
    setIsSearching(false);
    setIsComplete(false);
    setQuery("");
    setGraphData(null);
    setRunId(null);
    setReasoningSteps([]);
  };

  const handleDiscoveryComplete = (data: GraphData, steps: StepLog[]) => {
    setIsSearching(false);
    setGraphData(data);
    setReasoningSteps(steps);
    setIsComplete(true);
  };

  const handlePastRunClick = async (runId: string, query: string) => {
    try {
      const runData = await getRunById(runId);
      setQuery(query);
      setGraphData(runData.graph_data);
      setIsComplete(true);
      setSearchStarted(true);
    } catch (error) {
      console.error("Failed to load past run:", error);
      toast({
        title: "Error",
        description: "Failed to load past search. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sidebar - Only show when not in graph view */}
      {!isComplete && <PastRunsSidebar onRunClick={handlePastRunClick} />}

      <div className={`relative z-10 ${!isComplete ? 'ml-80' : ''}`}>
        {/* Header - Only show on non-graph pages */}
        {!isComplete && (
          <header className="border-b border-border/50 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center neon-glow">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold neon-text">
                  NetResearch
                </h1>
              </div>

              {/* Context Panel - Name and CV Upload - Only show before starting search */}
              {!searchStarted && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Your Full Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && userName.trim()) {
                          await sendUserName(userName);
                          toast({
                            title: "Name Saved",
                            description: "Your name has been saved successfully.",
                          });
                        }
                      }}
                      className="glass-panel rounded-xl px-4 py-3 min-w-[200px] bg-input/50 border-border/50 focus:border-primary"
                    />
                    <Button
                      onClick={async () => {
                        if (userName.trim()) {
                          await sendUserName(userName);
                          toast({
                            title: "Name Saved",
                            description: "Your name has been saved successfully.",
                          });
                        }
                      }}
                      disabled={!userName.trim()}
                      variant="outline"
                      size="sm"
                      className="border-border/50 hover:border-primary"
                    >
                      Save
                    </Button>
                  </div>
                  <label className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] cursor-pointer hover:border-primary/50 transition-all">
                    <Upload className="w-5 h-5 text-primary" />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingCV}
                    />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {isUploadingCV ? "Uploading..." : hasCvLoaded ? "CV Loaded" : "Upload CV Context"}
                      </span>
                      {hasCvLoaded && !isUploadingCV && (
                        <span className="text-xs text-accent">✓ Loaded</span>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {!searchStarted ? (
            // Initial Search Screen
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-slide-up">
              <div className="text-center space-y-4 max-w-3xl">
                <h2 className="text-5xl font-display font-bold tracking-tight">
                  Explore your Research Network
                </h2>
                <p className="text-xl text-muted-foreground">
                  Ask questions about researchers, papers, and discover hidden connections
                  in your research network.
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
                      placeholder="Share your research interests (e.g., 'Who works on Diffusion Models in Europe?')"
                      className="pl-12 pr-4 py-6 text-lg bg-input/50 border-border/50 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">

                      <span className="text-sm text-muted-foreground">Connections:</span>
                      <Select value={maxNodes} onValueChange={setMaxNodes}>
                        <SelectTrigger className="w-24 bg-input/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
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
            <div className="fixed inset-0 z-50 flex flex-col animate-fade-in">
              {/* Minimal Header */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center neon-glow">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-primary">Your NetResearch</h2>
                    <p className="text-xs text-muted-foreground">{query}</p>
                  </div>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="border-border/50 hover:border-primary pointer-events-auto"
                >
                  New Search
                </Button>
              </div>

              {/* Full-Screen Graph */}
              <div className="flex-1 flex items-center justify-center relative">
                {graphData ? (
                  <>
                    <GraphVisualization data={graphData} userName={userName} />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto neon-glow animate-pulse">
                        <Network className="w-12 h-12 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-display font-bold text-primary">
                          Loading Graph...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Reasoning View
            <div className="max-w-4xl mx-auto space-y-8 py-8 animate-slide-up">
              {runId && (
                <ReasoningConsole
                  runId={runId}
                  onComplete={handleDiscoveryComplete}
                  maxNodes={parseInt(maxNodes)}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
