import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Loader2, ExternalLink, FileText, User, Building2 } from "lucide-react";
import { getAgentStatus, StepLog, GraphData } from "@/services/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ReasoningConsoleProps {
    runId: string;
    onComplete: (graphData: GraphData, steps: StepLog[]) => void;
}

export const ReasoningConsole = ({ runId, onComplete }: ReasoningConsoleProps) => {
    const [steps, setSteps] = useState<StepLog[]>([]);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);
    const pollingInterval = useRef<NodeJS.Timeout>();

    const lastActiveStepId = useRef<string | null>(null);
    const isAutoExpanded = useRef<boolean>(false);

    // Poll for updates
    useEffect(() => {
        const poll = async () => {
            try {
                const response = await getAgentStatus(runId);
                console.log('Poll response:', response);
                console.log('Steps received:', response.steps);

                setSteps(response.steps);

                // Auto-expand logic: Only expand the currently in_progress step
                const activeStep = response.steps.find(s => s.status === "in_progress");

                if (activeStep) {
                    // New active step detected - auto-expand it and collapse all others
                    if (activeStep.step_id !== lastActiveStepId.current) {
                        lastActiveStepId.current = activeStep.step_id;
                        isAutoExpanded.current = true;
                        setExpandedSteps(new Set([activeStep.step_id]));
                    }
                } else if (isAutoExpanded.current) {
                    // No active step and it was auto-expanded - collapse it
                    isAutoExpanded.current = false;
                    setExpandedSteps(new Set());
                }

                if (response.status === "completed" && response.graph_data) {
                    if (pollingInterval.current) clearInterval(pollingInterval.current);
                    // Small delay to let the user see the final step
                    setTimeout(() => {
                        onComplete(response.graph_data!, response.steps);
                    }, 1000);
                }
            } catch (error) {
                console.error("Polling failed:", error);
            }
        };

        // Initial poll
        poll();

        // Set up interval
        pollingInterval.current = setInterval(poll, 1000);

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [runId, onComplete]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [steps]);

    const toggleExpand = (stepId: string) => {
        // Mark that this is a manual expansion, not auto
        isAutoExpanded.current = false;
        setExpandedSteps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stepId)) {
                newSet.delete(stepId);
            } else {
                newSet.add(stepId);
            }
            return newSet;
        });
    };

    const getSourceIcon = (type: string) => {
        switch (type) {
            case "paper": return <FileText className="w-3 h-3" />;
            case "author": return <User className="w-3 h-3" />;
            case "institution": return <Building2 className="w-3 h-3" />;
            default: return <ExternalLink className="w-3 h-3" />;
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-4 p-4">
            {steps.map((step, index) => {
                const isExpanded = expandedSteps.has(step.step_id);
                const isLast = index === steps.length - 1;

                try {
                    return (
                        <div key={step.step_id} className="relative">
                        {/* Connector Line */}
                        {!isLast && (
                            <div className="absolute left-[19px] top-10 bottom-[-16px] w-px bg-border/50" />
                        )}

                        <div className="flex gap-4">
                            {/* Status Icon */}
                            <div className="relative z-10">
                                {step.status === "in_progress" ? (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    </div>
                                ) : step.status === "done" ? (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-1">
                                <div
                                    className={cn(
                                        "flex items-center gap-2",
                                        step.status === "done" && "cursor-pointer group"
                                    )}
                                    onClick={() => step.status === "done" && toggleExpand(step.step_id)}
                                >
                                    <h3 className={cn(
                                        "font-medium text-sm",
                                        step.status === "in_progress" ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {step.message}
                                    </h3>
                                    {step.status === "done" && (
                                        <div className="text-muted-foreground/50 group-hover:text-foreground transition-colors">
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </div>
                                    )}
                                </div>

                                {/* Details & Content (Collapsible) */}
                                {(isExpanded || step.status === "in_progress") && (
                                    <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        {/* Details Badges (Legacy) */}
                                        {step.details && Object.keys(step.details).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(step.details).map(([key, value]) => (
                                                    <Badge key={key} variant="secondary" className="text-xs font-normal bg-secondary/50">
                                                        <span className="opacity-70 mr-1">{key}:</span>
                                                        {value}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Filters */}
                                        {step.filters && Object.keys(step.filters).length > 0 && (
                                            <div className="grid gap-2">
                                                {Object.entries(step.filters).map(([key, values]) => (
                                                    <div key={key} className="text-sm">
                                                        <span className="text-muted-foreground mr-2">{key}:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {values.map((val, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {val}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Papers (Search Step) */}
                                        {step.papers && step.papers.length > 0 && (
                                            <div className="space-y-2">
                                                {step.papers.map((paper, idx) => (
                                                    <Card
                                                        key={idx}
                                                        className="p-3 hover:bg-muted/50 transition-colors border-border/50 group animate-in fade-in slide-in-from-left-3 duration-300"
                                                        style={{ animationDelay: `${idx * 50}ms` }}
                                                    >
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div>
                                                                <h4 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                                                                    {paper.title}
                                                                </h4>
                                                                {paper.topic && (
                                                                    <p className="text-xs text-muted-foreground mt-0.5">{paper.topic}</p>
                                                                )}
                                                            </div>
                                                            {paper.publication_year && (
                                                                <Badge variant="secondary" className="text-[10px] h-5">
                                                                    {paper.publication_year}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {paper.link && (
                                                            <a
                                                                href={paper.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                                                            >
                                                                View Source <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                        {/* Professors (Extraction Step) */}
                                        {step.professors && step.professors.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {step.professors.map((prof, idx) => {
                                                    // Defensive: Log the professor object to help debug
                                                    console.log('Rendering professor:', prof);

                                                    // Defensive: Get institution name safely
                                                    const institutionName = prof.institution
                                                        ? (typeof prof.institution === 'string'
                                                            ? prof.institution
                                                            : prof.institution?.name || 'Unknown')
                                                        : null;

                                                    return (
                                                        <Card
                                                            key={`prof-${idx}-${prof.name}`}
                                                            className="p-3 hover:bg-muted/50 transition-colors border-border/50 animate-in fade-in slide-in-from-left-3 duration-300"
                                                            style={{ animationDelay: `${idx * 50}ms` }}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 text-primary">
                                                                    <User className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">{prof.name || 'Unknown Professor'}</p>
                                                                    {institutionName && (
                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                            <Building2 className="w-3 h-3" />
                                                                            {institutionName}
                                                                        </p>
                                                                    )}
                                                                    {prof.description && (
                                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                            {prof.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Legacy Sources Grid */}
                                        {step.sources && step.sources.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {step.sources.map((source, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={source.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <Card className="p-3 hover:bg-muted/50 transition-colors border-border/50 flex items-start gap-3 group">
                                                            <div className="mt-0.5 p-1.5 rounded-md bg-background border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                                                {getSourceIcon(source.type)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                                                                    {source.title}
                                                                </p>
                                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                                    {new URL(source.url).hostname}
                                                                </p>
                                                            </div>
                                                        </Card>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
                } catch (error) {
                    console.error('Error rendering step:', step.step_id, error);
                    return (
                        <div key={step.step_id} className="p-4 bg-red-50 border border-red-200 rounded">
                            <p className="text-red-600 text-sm">Error rendering step: {step.step_id}</p>
                            <p className="text-xs text-red-500">{String(error)}</p>
                        </div>
                    );
                }
            })}
            <div ref={scrollRef} />
        </div>
    );
};
