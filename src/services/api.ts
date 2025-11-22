// Type definitions for the Agent Reasoning Console

const API_BASE_URL = "/api";

export interface Contact {
    email?: string;
    website?: string;
}

export interface Paper {
    title: string;
    link?: string;
    abstract?: string;
    publication_year?: number;
    topic?: string;
}

export interface BasicProfessor {
    name: string;
    institution: string | null;
    description?: string;
}

export interface Institution {
    id: string;
    name: string;
}

export interface GraphNode {
    id: string;
    name: string;
    type: string; // "professor", "laboratory", "user"
    institution?: string | Institution;
    description: string;
    contacts: Contact;
    works_count?: number;
    cited_by_count?: number;
    h_index?: number;
    link_orcid?: string;
    papers?: Paper[];
    // Added for force-graph
    color?: string;
    level?: number; // 0 for user, 1 for professor, 2 for laboratory
}

export interface GraphLink {
    source: string;
    target: string;
    label?: string;
    distance?: number; // between 0 and 1
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export interface StepLog {
    step_id: string;
    step_type: "intent" | "filters" | "search" | "extraction" | "relationships" | "graph";
    message: string;
    status: "in_progress" | "done" | "pending";
    timestamp: string;

    // Step-specific fields
    details?: Record<string, string>; // Deprecated, kept for backward compatibility if needed
    filters?: Record<string, string[]>; // For "filters" step
    papers?: Paper[]; // For "search" step
    professors?: BasicProfessor[]; // For "extraction" step
    sources?: Array<{ // Kept for backward compatibility or generic sources
        title: string;
        url: string;
        type: "paper" | "author" | "institution";
    }>;
}

export interface AgentStatusResponse {
    run_id: string;
    status: "running" | "completed" | "failed";
    progress: number; // 0-100
    steps: StepLog[];
    graph_data?: GraphData; // Optional, present when completed
}

// Helper function to normalize institution data
const normalizeInstitution = (institution?: string | Institution): string | undefined => {
    if (!institution) return undefined;
    if (typeof institution === 'string') return institution;
    return institution.name;
};

// Helper function to normalize graph data from backend
const normalizeGraphData = (rawData: any): GraphData => {
    return {
        nodes: rawData.nodes.map((node: any) => ({
            ...node,
            institution: normalizeInstitution(node.institution)
        })),
        links: rawData.links
    };
};

// Upload CV file
export const uploadCV = async (file: File): Promise<{ cv_id: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/cv/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload CV: ${response.statusText}`);
    }

    return await response.json();
};

// Start a new agent run
export const startAgentRun = async (query: string, maxNodes: number, cvId?: string): Promise<{ run_id: string; status: string }> => {
    const response = await fetch(`${API_BASE_URL}/agent/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            max_nodes: maxNodes,
            cv_id: cvId,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to start agent run: ${response.statusText}`);
    }

    return await response.json();
};

// Poll agent status
export const getAgentStatus = async (runId: string): Promise<AgentStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/agent/status/${runId}`);

    if (!response.ok) {
        throw new Error(`Failed to get agent status: ${response.statusText}`);
    }

    const data = await response.json();

    // Calculate progress based on steps
    const totalSteps = data.steps.length;
    const completedSteps = data.steps.filter((s: StepLog) => s.status === "done").length;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Normalize graph data if present
    const graphData = data.graph_data ? normalizeGraphData(data.graph_data) : undefined;

    return {
        run_id: data.run_id,
        status: data.status,
        progress,
        steps: data.steps,
        graph_data: graphData,
    };
};

// Generate email (mock implementation - can be replaced with real backend endpoint if available)
export const generateEmail = async (type: 'reach_out' | 'colab', nodeName: string): Promise<{ content: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const content = type === 'reach_out'
                ? `Dear ${nodeName},\n\nI recently came across your work on [Topic] and found it incredibly inspiring. I would love to connect and learn more about your current research directions.\n\nBest regards,\n[Your Name]`
                : `Dear ${nodeName},\n\nI am writing to propose a potential collaboration regarding [Topic]. Given your expertise in this field, I believe our combined efforts could lead to significant breakthroughs.\n\nBest regards,\n[Your Name]`;

            resolve({ content });
        }, 2000);
    });
};

// Send email (mock implementation - can be replaced with real backend endpoint if available)
export const sendEmail = async (content: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Sending email:", content);
            resolve({ success: true });
        }, 1000);
    });
};

export const sendMessage = async (text: string, nodeName: string): Promise<{ content: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const responses = [
                `Based on my analysis of ${nodeName}'s work, I can tell you that...`,
                `${nodeName} has primarily focused on this area. Specifically...`,
                `That's an interesting question. ${nodeName}'s latest paper addresses this by...`
            ];
            const content = responses[Math.floor(Math.random() * responses.length)];
            resolve({ content });
        }, 1500);
    });
};
