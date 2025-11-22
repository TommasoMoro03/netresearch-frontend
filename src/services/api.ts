// Type definitions for the Agent Reasoning Console

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

export interface GraphNode {
    id: string;
    name: string;
    type: string; // "professor", "laboratory"
    institution?: string;
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

export const mockGraphData: GraphData = {
    nodes: [
        {
            id: "user",
            name: "user",
            type: "person",
            description: "The central user node.",
            contacts: {},
            color: "#e0f2f1",
            level: 0
        },
        {
            id: "n1",
            name: "Prof. Sarah Connor",
            type: "professor",
            institution: "Cyberdyne Systems",
            description: "Leading researcher in Neural Networks.",
            contacts: { email: "sarah.connor@cyberdyne.ai", website: "https://scholar.google.com/sarah_connor" },
            works_count: 42,
            cited_by_count: 1337,
            h_index: 25,
            papers: [
                {
                    title: "Neural Networks for Time Travel",
                    publication_year: 2029,
                    link: "https://arxiv.org/abs/time-travel",
                    topic: "Temporal Mechanics",
                    abstract: "This paper explores the theoretical possibility of using advanced neural networks to calculate temporal displacement vectors. We propose a novel architecture capable of predicting and compensating for the chaotic nature of time travel, ensuring safe arrival at the target destination."
                },
                {
                    title: "twinsnvfs",
                    publication_year: 2029,
                    link: "https://arxiv.org/abs/time-travel",
                    topic: "Quantum Computing",
                    abstract: "A study on the effects of quantum entanglement on twin paradox scenarios in non-volatile file systems."
                }
            ],
            color: "#14b8a6",
            level: 1
        },
        {
            id: "n2",
            name: "Cyberdyne Systems",
            type: "laboratory",
            description: "Advanced AI research laboratory.",
            contacts: { email: "contact@cyberdyne.ai", website: "https://cyberdyne.ai" },
            color: "#0ea5e9",
            level: 2
        },
        {
            id: "n3",
            name: "Skynet Architecture",
            type: "laboratory",
            description: "Seminal paper on distributed autonomous defense networks.",
            contacts: {},
            color: "#06b6d4",
            level: 2
        },
        {
            id: "n4",
            name: "T-800 Prototype",
            type: "laboratory",
            description: "Experimental humanoid robotics platform.",
            contacts: {},
            color: "#22d3ee",
            level: 3
        },
        {
            id: "n5",
            name: "Tech Noir Lab",
            type: "laboratory",
            description: "Research into night-time urban surveillance.",
            contacts: {},
            color: "#38bdf8",
            level: 1
        },
        {
            id: "n6",
            name: "Dr. Miles Dyson",
            type: "professor",
            institution: "Cyberdyne Systems",
            description: "Director of Special Projects.",
            contacts: { email: "miles@cyberdyne.ai" },
            works_count: 15,
            cited_by_count: 500,
            h_index: 12,
            color: "#0ea5e9",
            level: 2
        },
        {
            id: "n7",
            name: "Project 2501",
            type: "laboratory",
            description: "Top secret government project.",
            contacts: {},
            color: "#f43f5e",
            level: 3
        },
        {
            id: "n8",
            name: "Major Motoko",
            type: "professor",
            institution: "Section 9",
            description: "Field commander.",
            contacts: {},
            color: "#14b8a6",
            level: 3
        },
        {
            id: "n9",
            name: "Puppet Master",
            type: "professor",
            description: "Elusive hacker entity.",
            contacts: {},
            color: "#0f172a",
            level: 4
        },
        {
            id: "n10",
            name: "Section 9",
            type: "laboratory",
            description: "Public Security Section 9.",
            contacts: {},
            color: "#e0f2f1",
            level: 2
        }
    ],
    links: [
        { source: "user", target: "n1", label: "The user is interested in the research of Prof. Sarah Connor.", distance: 0.2 },
        { source: "n1", target: "n2", label: "Prof. Sarah Connor works at Cyberdyne Systems as a leading researcher.", distance: 0.5 },
        { source: "n1", target: "n3", label: "Prof. Sarah Connor authored the seminal paper on Skynet Architecture.", distance: 0.3 },
        { source: "n2", target: "n4", label: "Cyberdyne Systems developed the T-800 Prototype.", distance: 0.8 },
        { source: "n3", target: "n4", label: "The Skynet Architecture paper describes the design of the T-800 Prototype.", distance: 0.4 },
        { source: "n5", target: "n1", label: "Tech Noir Lab collaborates with Prof. Sarah Connor on surveillance research.", distance: 0.6 },
        { source: "n2", target: "n6", label: "Dr. Miles Dyson is the Director at Cyberdyne Systems.", distance: 0.3 },
        { source: "n6", target: "n4", label: "Dr. Miles Dyson oversees the T-800 Prototype development.", distance: 0.4 },
        { source: "n1", target: "n10", label: "Prof. Sarah Connor consults for Section 9.", distance: 0.7 },
        { source: "n10", target: "n8", label: "Major Motoko leads the field operations for Section 9.", distance: 0.3 },
        { source: "n8", target: "n7", label: "Major Motoko is investigating Project 2501.", distance: 0.5 },
        { source: "n7", target: "n9", label: "Project 2501 is linked to the Puppet Master entity.", distance: 0.2 },
        { source: "n9", target: "n4", label: "The Puppet Master attempted to hack the T-800 Prototype.", distance: 0.9 }
    ]
};

// Mock data for simulation
const baseSteps: StepLog[] = [
    {
        step_id: "1",
        step_type: "intent",
        message: "Analyzing user intent...",
        status: "pending",
        timestamp: new Date().toISOString(),
        details: { "Confidence": "0.98", "Intent": "Research Discovery" }
    },
    {
        step_id: "2",
        step_type: "filters",
        message: "Applying search filters...",
        status: "pending",
        timestamp: new Date().toISOString(),
        filters: {
            "Topics": ["Artificial Intelligence", "Neural Networks", "Robotics"],
            "Year Range": ["2020", "2030"],
            "Region": ["Global"]
        }
    },
    {
        step_id: "3",
        step_type: "search",
        message: "Searching for relevant papers...",
        status: "pending",
        timestamp: new Date().toISOString(),
        papers: [
            { title: "Neural Networks for Time Travel", publication_year: 2029, link: "https://arxiv.org/abs/time-travel", topic: "Temporal Mechanics" },
            { title: "Skynet Architecture: A Distributed Approach", publication_year: 2024, link: "https://arxiv.org/abs/skynet", topic: "Distributed Systems" },
            { title: "Ethical Implications of Autonomous Defense", publication_year: 2025, link: "https://arxiv.org/abs/ethics-ai", topic: "AI Ethics" }
        ]
    },
    {
        step_id: "4",
        step_type: "extraction",
        message: "Extracting key researchers...",
        status: "pending",
        timestamp: new Date().toISOString(),
        professors: [
            { name: "Prof. Sarah Connor", institution: "Cyberdyne Systems", description: "Expert in temporal mechanics and neural networks." },
            { name: "Dr. Miles Dyson", institution: "Cyberdyne Systems", description: "Director of Special Projects." },
            { name: "Major Motoko", institution: "Section 9", description: "Specialist in cyber-warfare." }
        ]
    },
    {
        step_id: "5",
        step_type: "relationships",
        message: "Analyzing collaboration networks...",
        status: "pending",
        timestamp: new Date().toISOString(),
        details: { "Nodes Identified": "12", "Connections Found": "24" }
    },
    {
        step_id: "6",
        step_type: "graph",
        message: "Finalizing graph visualization...",
        status: "pending",
        timestamp: new Date().toISOString()
    }
];

// Simple in-memory store for mock runs
const mockRuns: Record<string, { startTime: number }> = {};

export const getAgentStatus = async (runId: string): Promise<AgentStatusResponse> => {
    // Initialize run if not exists
    if (!mockRuns[runId]) {
        mockRuns[runId] = { startTime: Date.now() };
    }

    const elapsed = Date.now() - mockRuns[runId].startTime;

    // Simulate progression based on time
    let currentSteps = [...baseSteps];
    let status: "running" | "completed" | "failed" = "running";
    let progress = 0;

    if (elapsed < 2000) {
        // Step 1 in progress
        currentSteps = currentSteps.map(s => {
            if (s.step_id === "1") return { ...s, status: "in_progress" };
            return s;
        });
        progress = 10;
    } else if (elapsed < 3000) {
        // Step 1 done, Step 2 done (fast), Step 3 in progress
        currentSteps = currentSteps.map(s => {
            if (s.step_id === "1" || s.step_id === "2") return { ...s, status: "done" };
            if (s.step_id === "3") return { ...s, status: "in_progress" };
            return s;
        });
        progress = 30;
    } else if (elapsed < 5000) {
        // Step 3 done, Step 4 in progress
        currentSteps = currentSteps.map(s => {
            if (s.step_id === "1" || s.step_id === "2" || s.step_id === "3") return { ...s, status: "done" };
            if (s.step_id === "4") return { ...s, status: "in_progress" };
            return s;
        });
        progress = 50;
    } else if (elapsed < 7000) {
        // Step 4 done, Step 5 in progress
        currentSteps = currentSteps.map(s => {
            if (s.step_id === "1" || s.step_id === "2" || s.step_id === "3" || s.step_id === "4") return { ...s, status: "done" };
            if (s.step_id === "5") return { ...s, status: "in_progress" };
            return s;
        });
        progress = 70;
    } else if (elapsed < 9000) {
        // Step 5 done, Step 6 in progress
        currentSteps = currentSteps.map(s => {
            if (s.step_id === "1" || s.step_id === "2" || s.step_id === "3" || s.step_id === "4" || s.step_id === "5") return { ...s, status: "done" };
            if (s.step_id === "6") return { ...s, status: "in_progress" };
            return s;
        });
        progress = 90;
    } else {
        // Complete
        currentSteps = currentSteps.map(s => ({ ...s, status: "done" }));
        status = "completed";
        progress = 100;
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                run_id: runId,
                status: status,
                progress: progress,
                steps: currentSteps,
                graph_data: status === "completed" ? mockGraphData : undefined
            });
        }, 300); // Fast response
    });
};

export const getMockStatus = (runId: string): Promise<AgentStatusResponse> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                run_id: runId,
                status: "completed",
                progress: 100,
                steps: baseSteps.map(s => ({ ...s, status: "done" })),
                graph_data: mockGraphData
            });
        }, 500);
    });
};

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
