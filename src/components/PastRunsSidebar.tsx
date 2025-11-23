import { useState, useEffect } from "react";
import { History, ChevronRight, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { getAllRuns, resetDatabase } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface PastRun {
  id: string;
  query: string;
  has_graph: boolean;
}

interface PastRunsSidebarProps {
  onRunClick: (runId: string, query: string) => void;
}

export const PastRunsSidebar = ({ onRunClick }: PastRunsSidebarProps) => {
  const [pastRuns, setPastRuns] = useState<PastRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const fetchPastRuns = async () => {
    try {
      const runs = await getAllRuns();
      setPastRuns(runs);
    } catch (error) {
      console.error("Failed to fetch past runs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPastRuns();
  }, []);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to delete all data? This will remove your user info and all past searches.")) {
      return;
    }

    setIsResetting(true);
    try {
      await resetDatabase();
      setPastRuns([]);
      toast({
        title: "Database Reset",
        description: "All data has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to reset database:", error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-80 glass-panel border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">Past Searches</h2>
            <p className="text-xs text-muted-foreground">
              {pastRuns.length} {pastRuns.length === 1 ? "search" : "searches"}
            </p>
          </div>
        </div>
      </div>

      {/* Past Runs List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">
            Loading past searches...
          </div>
        ) : pastRuns.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No past searches yet
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {pastRuns.map((run) => (
              <button
                key={run.id}
                onClick={() => onRunClick(run.id, run.query)}
                className="w-full text-left p-4 rounded-lg glass-panel border border-border/30 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {run.query.length > 36 ? `${run.query.substring(0, 36)}...` : run.query}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to view graph
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Reset Button */}
      <div className="p-4 border-t border-border/50">
        <Button
          onClick={handleReset}
          disabled={isResetting}
          variant="outline"
          size="sm"
          className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isResetting ? "Resetting..." : "Clean History"}
        </Button>
      </div>
    </div>
  );
};
