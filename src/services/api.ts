// Type definitions for the Agent Reasoning Console

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

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

export interface Institution {
    id: string;
    name: string;
}

export interface BasicProfessor {
    name: string;
    institution: Institution | null;
    description?: string;
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
    if (!rawData || !rawData.nodes || !rawData.links) {
        console.warn("Invalid graph data received:", rawData);
        return { nodes: [], links: [] };
    }

    const nodes = rawData.nodes.map((node: any) => ({
        ...node,
        institution: normalizeInstitution(node.institution)
    }));

    // Clone links to avoid mutating rawData
    const links = rawData.links.map((link: any) => ({ ...link }));

    // Debug: Log first few links to understand structure
    if (links.length > 0) {
        console.log('Sample links:', links.slice(0, 3));
        console.log('User node ID check:', nodes.find((n: any) => n.id === 'user') ? 'Found' : 'Not Found');
    }

    // Logic to create secondary level connections
    const professorNodes = nodes.filter((n: any) => n.id !== 'user');
    console.log('Total professor nodes:', professorNodes.length);

    if (professorNodes.length > 3) { // Only if we have enough nodes
        const numOrphans = Math.floor(Math.random() * 3) + 1; // 1 to 3
        console.log('Attempting to create orphans:', numOrphans);

        // Shuffle and pick orphans
        const shuffled = [...professorNodes].sort(() => 0.5 - Math.random());
        const orphans = shuffled.slice(0, numOrphans);
        const potentialParents = shuffled.slice(numOrphans);

        orphans.forEach((orphan: any) => {
            if (potentialParents.length > 0) {
                const parent = potentialParents[Math.floor(Math.random() * potentialParents.length)];

                // Find link from user to orphan
                // Check both directions just in case
                const linkIndex = links.findIndex((l: any) =>
                    (l.target === orphan.id && l.source === 'user') ||
                    (l.source === orphan.id && l.target === 'user')
                );

                console.log(`Orphan: ${orphan.name} (${orphan.id}), Link Index: ${linkIndex}`);

                if (linkIndex !== -1) {
                    console.log(`Re-routing link for ${orphan.name} to parent ${parent.name}`);
                    // Re-route link
                    // Ensure source is parent and target is orphan for consistency
                    links[linkIndex].source = parent.id;
                    links[linkIndex].target = orphan.id;

                    // Update orphan node
                    orphan.level = 2;
                }
            }
        });
    }

    return {
        nodes,
        links
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

// Get user data from database
export const getUserData = async (): Promise<{ name: string; has_cv: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/user`);

    if (!response.ok) {
        throw new Error(`Failed to get user data: ${response.statusText}`);
    }

    return await response.json();
};

// Send user name to backend
export const sendUserName = async (name: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/name`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send user name: ${response.statusText}`);
    }
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

// Generate email with context from backend
export const generateEmail = async (
    type: 'reach_out' | 'colab',
    nodeName: string,
    runId: string,
    nodeId?: string
): Promise<{ content: string }> => {
    const requestBody = {
        type,
        run_id: runId,
        node_id: nodeId
    };

    const response = await fetch(`${API_BASE_URL}/email/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`Failed to generate email: ${response.statusText}`);
    }

    return await response.json();
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

export const sendMessage = async (text: string, nodeName: string, runId: string, nodeId?: string): Promise<{ content: string }> => {
    const requestBody = {
        message: text,
        run_id: runId,
        node_id: nodeId
    };

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return await response.json();
};

// Get all past runs from database
export const getAllRuns = async (): Promise<{ id: string; query: string; has_graph: boolean }[]> => {
    const response = await fetch(`${API_BASE_URL}/agent/runs`);

    if (!response.ok) {
        throw new Error(`Failed to fetch runs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.runs;
};

// Get a specific run by ID from database
export const getRunById = async (runId: string): Promise<{ id: string; query: string; graph_data: GraphData }> => {
    const response = await fetch(`${API_BASE_URL}/agent/run/${runId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch run: ${response.statusText}`);
    }

    const data = await response.json();

    // Normalize graph data
    const graphData = data.graph_data ? normalizeGraphData(data.graph_data) : null;

    return {
        id: data.id,
        query: data.query,
        graph_data: graphData
    };
};

// Reset all database data
export const resetDatabase = async (): Promise<{ message: string; status: string }> => {
    const response = await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`Failed to reset database: ${response.statusText}`);
    }

    return await response.json();
};
