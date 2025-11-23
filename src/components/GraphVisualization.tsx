import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import ForceGraph3D from 'react-force-graph-3d';
import { GraphData, GraphNode, GraphLink, generateEmail, sendEmail, sendMessage } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ExternalLink, Mail, Building, User, FileText, Network, Loader2, Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import SpriteText from 'three-spritetext';

interface GraphVisualizationProps {
    data: GraphData;
    userName?: string;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data, userName }) => {
    const fgRef = useRef<any>();
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [sheetWidth, setSheetWidth] = useState(540);
    const [isResizing, setIsResizing] = useState(false);
    const [selectedAbstract, setSelectedAbstract] = useState<{ title: string; content: string; link?: string } | null>(null);

    // Email Dialog State
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [emailStep, setEmailStep] = useState<'selection' | 'generating' | 'editing'>('selection');
    const [generatedEmail, setGeneratedEmail] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // Chat State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatHeight, setChatHeight] = useState(80); // Default height collapsed
    const [isChatResizing, setIsChatResizing] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages, chatHeight]);

    // Reset chat when node changes
    useEffect(() => {
        setChatMessages([]);
        setChatInput("");
        setChatHeight(80);
    }, [selectedNode]);

    const hasChatResized = useRef(false);

    const startChatResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsChatResizing(true);
        hasChatResized.current = false;
    }, []);

    const stopChatResizing = useCallback(() => {
        setIsChatResizing(false);
        if (!hasChatResized.current) {
            setChatHeight(prev => prev > 150 ? 80 : 400);
        }
    }, []);

    const resizeChat = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isChatResizing) {
                const newHeight = window.innerHeight - mouseMoveEvent.clientY;
                // Constraints: Min 80px, Max 80% of screen
                if (newHeight > 80 && newHeight < window.innerHeight * 0.8) {
                    setChatHeight(newHeight);
                    hasChatResized.current = true;
                }
            }
        },
        [isChatResizing]
    );

    useEffect(() => {
        if (isChatResizing) {
            window.addEventListener("mousemove", resizeChat);
            window.addEventListener("mouseup", stopChatResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resizeChat);
            window.removeEventListener("mouseup", stopChatResizing);
        };
    }, [isChatResizing, resizeChat, stopChatResizing]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !selectedNode) return;

        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput("");
        setIsChatLoading(true);

        // Auto-expand on first message
        if (chatMessages.length === 0) {
            setChatHeight(400);
        }

        try {
            const response = await sendMessage(userMsg, selectedNode.name);
            setChatMessages(prev => [...prev, { role: 'bot', content: response.content }]);
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleGenerateEmail = async (type: 'reach_out' | 'colab') => {
        if (!selectedNode) return;
        setEmailStep('generating');
        try {
            const response = await generateEmail(type, selectedNode.name);
            setGeneratedEmail(response.content);
            setEmailStep('editing');
        } catch (error) {
            console.error("Failed to generate email", error);
            setEmailStep('selection'); // Go back on error
        }
    };

    const handleSendEmail = async () => {
        setIsSendingEmail(true);
        try {
            await sendEmail(generatedEmail);
            setIsEmailDialogOpen(false);
            // Reset state after closing
            setTimeout(() => {
                setEmailStep('selection');
                setGeneratedEmail("");
                setIsSendingEmail(false);
            }, 300);
        } catch (error) {
            console.error("Failed to send email", error);
            setIsSendingEmail(false);
        }
    };

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = window.innerWidth - mouseMoveEvent.clientX;
                if (newWidth > 300 && newWidth < window.innerWidth * 0.9) {
                    setSheetWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    // Auto-rotate and Zoom sensitivity
    useEffect(() => {
        if (fgRef.current) {
            const controls = fgRef.current.controls();
            if (controls) {
                controls.zoomSpeed = 3; // Adjusted zoom sensitivity
                controls.enableDamping = true;
                controls.dampingFactor = 0.1;
            }

            // Apply distance metric to link forces
            fgRef.current.d3Force('link').distance((link: any) => {
                // Map distance (0-1) to visual range (10-100) - Shorter edges
                const dist = link.distance !== undefined ? link.distance : 0.5;
                return 10 + dist * 90;
            });
        }
    }, []);

    // Center user node
    useEffect(() => {
        // Find user node and fix it to center
        const userNode = data.nodes.find(n => n.name === 'user');
        if (userNode) {
            const node = userNode as any;
            node.fx = 0;
            node.fy = 0;
            node.fz = 0;
        }
    }, [data]);

    const handleNodeDrag = (node: any) => {
        // Prevent dragging the user node
        if (node.name === 'user') {
            node.fx = 0;
            node.fy = 0;
            node.fz = 0;
            node.x = 0;
            node.y = 0;
            node.z = 0;
        }
    };

    const handleLinkClick = (link: any) => {
        setSelectedLink(link as GraphLink);
        setIsLinkDialogOpen(true);
    };

    const handleNodeClick = (node: any) => {
        // Prevent clicking the user node
        if (node.id === 'user') return;

        setSelectedNode(node as GraphNode);
        setIsSheetOpen(true);

        // Aim at node from outside it
        const distance = 40;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

        fgRef.current.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
            node, // lookAt ({ x, y, z })
            3000  // ms transition duration
        );
    };

    // Reset view when sheet is closed
    useEffect(() => {
        if (!isSheetOpen && fgRef.current) {
            // Reset to initial view
            fgRef.current.cameraPosition(
                { x: 0, y: 0, z: 200 }, // Initial position (approximate)
                { x: 0, y: 0, z: 0 },   // Look at center
                2000                    // Transition duration
            );
        }
    }, [isSheetOpen]);

    const getNodeColor = (node: GraphNode) => {
        if (node.level === 0) return '#808080'; // Gray for user

        const level = node.level || 1;
        const lightness = 40 + (level - 1) * 10; // Base 40%, +10% per level
        const l = Math.min(lightness, 90); // Cap at 90%

        if (node.type === 'professor' || node.type === 'person') {
            return `hsl(210, 40%, ${l}%)`; // Sober Blue
        } else if (node.type === 'laboratory' || node.type === 'lab') {
            return `hsl(160, 40%, ${l}%)`; // Sober Teal
        }
        return node.color || '#ffffff';
    };

    const getNodeIcon = (type: string) => {
        switch (type) {
            case 'professor':
            case 'person': return <User className="w-4 h-4" />;
            case 'laboratory':
            case 'lab': return <Building className="w-4 h-4" />;
            case 'paper': return <FileText className="w-4 h-4" />;
            default: return <Network className="w-4 h-4" />;
        }
    };

    return (
        <div className="w-full h-full relative">
            <ForceGraph3D
                ref={fgRef}
                graphData={data}
                nodeLabel="name"
                nodeColor={node => getNodeColor(node as GraphNode)}
                onNodeClick={handleNodeClick}
                onNodeDrag={handleNodeDrag}
                onLinkClick={handleLinkClick}
                backgroundColor="#00000000" // Transparent background to let the parent gradient show
                showNavInfo={false}
                nodeThreeObjectExtend={false}
                nodeThreeObject={(node: any) => {
                    const group = new THREE.Group();

                    // Determine size based on type
                    const size = node.type === 'professor' || node.type === 'person' ? 4 : 8;
                    const color = getNodeColor(node as GraphNode);

                    // Outer glass sphere with enhanced realism
                    const geometry = new THREE.SphereGeometry(size, 128, 128);
                    const material = new THREE.MeshPhysicalMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.85,
                        transmission: 0.4,      // More glass transmission
                        roughness: 0.05,        // Very smooth for glass
                        metalness: 0.0,         // No metalness for pure glass
                        clearcoat: 1.0,         // Strong clear coat
                        clearcoatRoughness: 0.05,
                        ior: 1.5,               // Index of refraction for glass
                        thickness: 0.5,         // Glass thickness
                        envMapIntensity: 1.5,   // Environment reflection
                        emissive: color,        // Subtle inner glow
                        emissiveIntensity: 0.15 // Low intensity glow
                    });
                    const sphere = new THREE.Mesh(geometry, material);
                    group.add(sphere);

                    // Inner core for depth and realism
                    const coreGeometry = new THREE.SphereGeometry(size * 0.5, 32, 32);
                    const coreMaterial = new THREE.MeshPhysicalMaterial({
                        color: color,
                        emissive: color,
                        emissiveIntensity: 0.6,
                        transparent: true,
                        opacity: 0.4,
                        roughness: 0.2,
                        metalness: 0.3
                    });
                    const core = new THREE.Mesh(coreGeometry, coreMaterial);
                    group.add(core);

                    // Label
                    const displayName = node.id === 'user' && userName ? userName : node.name;
                    const sprite = new SpriteText(displayName);
                    sprite.color = '#ffffff';
                    sprite.textHeight = 2;
                    sprite.position.y = size + 2;

                    // Add stroke for visibility without background box
                    sprite.strokeColor = '#000000';
                    sprite.strokeWidth = 1;

                    // Ensure text is always visible on top
                    sprite.renderOrder = 999;
                    sprite.material.depthTest = false;
                    sprite.material.depthWrite = false;

                    group.add(sprite);

                    return group;
                }}
                linkColor={() => '#ffffff50'}
                linkWidth={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent
                    side="right"
                    style={{ width: `${sheetWidth}px`, maxWidth: '90vw' }}
                    className={`bg-background/95 backdrop-blur-xl border-l border-primary/20 overflow-visible sm:max-w-none ${isResizing ? 'transition-none duration-0' : 'transition-all duration-300 ease-in-out'}`}
                >
                    {/* Drag Handle */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/50 active:bg-primary transition-colors z-50 -ml-0.5"
                        onMouseDown={startResizing}
                    />

                    <div className="flex flex-col h-full overflow-hidden">
                        <div className={`flex-1 overflow-y-auto pr-2 ${chatHeight > 100 ? 'black-scroll' : ''}`}>
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2 text-xl font-display text-primary">
                                    {selectedNode && getNodeIcon(selectedNode.type)}
                                    {selectedNode?.name}
                                </SheetTitle>
                                <SheetDescription className="text-muted-foreground">
                                    {selectedNode?.type === 'professor' ? 'Professor' : selectedNode?.type === 'laboratory' ? 'Laboratory' : 'Person'}
                                    {selectedNode?.institution && ` • ${selectedNode.institution}`}
                                </SheetDescription>
                            </SheetHeader>

                            {selectedNode && (
                                <div className="mt-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-foreground">Description</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {selectedNode.description}
                                            </p>
                                        </div>

                                        {/* Stats Section */}
                                        {(selectedNode.works_count !== undefined || selectedNode.cited_by_count !== undefined || selectedNode.h_index !== undefined) && (
                                            <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                                                {selectedNode.works_count !== undefined && (
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-primary">{selectedNode.works_count}</div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Works</div>
                                                    </div>
                                                )}
                                                {selectedNode.cited_by_count !== undefined && (
                                                    <div className="text-center border-l border-border/50">
                                                        <div className="text-2xl font-bold text-primary">{selectedNode.cited_by_count}</div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Citations</div>
                                                    </div>
                                                )}
                                                {selectedNode.h_index !== undefined && (
                                                    <div className="text-center border-l border-border/50">
                                                        <div className="text-2xl font-bold text-primary">{selectedNode.h_index}</div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">H-Index</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Contacts */}
                                        {(selectedNode.contacts?.email || selectedNode.contacts?.website || selectedNode.link_orcid) && (
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-foreground">Contact & Links</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedNode.contacts?.email && (
                                                        <a href={`mailto:${selectedNode.contacts.email}`} className="no-underline">
                                                            <Badge variant="outline" className="gap-1 hover:bg-primary/10 transition-colors cursor-pointer">
                                                                <Mail className="w-3 h-3" />
                                                                {selectedNode.contacts.email}
                                                            </Badge>
                                                        </a>
                                                    )}
                                                    {selectedNode.contacts?.website && (
                                                        <a href={selectedNode.contacts.website} target="_blank" rel="noopener noreferrer" className="no-underline">
                                                            <Badge variant="outline" className="gap-1 hover:bg-primary/10 transition-colors cursor-pointer">
                                                                <ExternalLink className="w-3 h-3" />
                                                                Website
                                                            </Badge>
                                                        </a>
                                                    )}
                                                    {selectedNode.link_orcid && (
                                                        <a href={selectedNode.link_orcid} target="_blank" rel="noopener noreferrer" className="no-underline">
                                                            <Badge variant="outline" className="gap-1 hover:bg-primary/10 transition-colors cursor-pointer">
                                                                <span className="font-bold text-[10px]">iD</span>
                                                                ORCID
                                                            </Badge>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Papers */}
                                        {selectedNode.papers && selectedNode.papers.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium text-foreground">Papers & Publications</h4>
                                                <div className="flex flex-col gap-2">
                                                    {selectedNode.papers.map((paper, idx) => (
                                                        <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <h5 className="text-sm font-medium text-foreground leading-snug">{paper.title}</h5>
                                                                    {paper.topic && (
                                                                        <span className="text-xs text-muted-foreground font-medium">{paper.topic}</span>
                                                                    )}
                                                                </div>
                                                                {paper.publication_year && (
                                                                    <span className="text-xs text-muted-foreground whitespace-nowrap px-1.5 py-0.5 rounded bg-background border border-border/50">
                                                                        {paper.publication_year}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-4 mt-3">
                                                                {paper.link && (
                                                                    <a
                                                                        href={paper.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                                    >
                                                                        View Paper <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                )}
                                                                {paper.abstract && (
                                                                    <button
                                                                        onClick={() => setSelectedAbstract({ title: paper.title, content: paper.abstract!, link: paper.link })}
                                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                                                                    >
                                                                        Read Abstract <FileText className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        )}

                                        {/* Email Action */}
                                        <div className="pt-4 border-t border-border/50">
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors"
                                                onClick={() => setIsEmailDialogOpen(true)}
                                            >
                                                <Mail className="w-4 h-4" />
                                                Drop an email
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Interface */}
                        <div
                            className="bg-background/95 backdrop-blur-xl border-t border-primary/20 shrink-0 relative flex flex-col transition-all duration-75 ease-out"
                            style={{ height: `${chatHeight}px`, pointerEvents: 'auto' }}
                        >
                            {/* Resize Handle */}
                            <div
                                className="absolute top-0 left-0 right-0 h-3 -mt-1.5 cursor-ns-resize flex items-center justify-center hover:bg-primary/10 transition-colors group z-50"
                                onMouseDown={startChatResizing}
                            >
                                <div className="w-12 h-1 bg-muted rounded-full group-hover:bg-primary/50 transition-colors" />
                            </div>

                            <div className="flex flex-col h-full p-4 pt-2">
                                <div
                                    ref={chatScrollRef}
                                    className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2"
                                >
                                    {chatMessages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                            <MessageSquare className="w-8 h-8 mb-2" />
                                            <p className="text-sm">Ask anything about {selectedNode?.name}...</p>
                                        </div>
                                    )}
                                    {chatMessages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                                    : 'bg-muted text-foreground rounded-bl-none'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted p-3 rounded-lg rounded-bl-none">
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto flex gap-2 items-center shrink-0">
                                    <Input
                                        type="text"
                                        name="chat-query"
                                        autoComplete="off"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="What do you want to know about this researcher...?"
                                        className="flex-1 bg-background/50 border-primary/20 focus:border-primary"
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isChatLoading}
                                        className="shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-xl border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-display text-primary">
                            <Network className="w-5 h-5" />
                            Relationship
                        </DialogTitle>
                    </DialogHeader>
                    {selectedLink && (
                        <div className="py-4">
                            <p className="text-lg font-medium text-foreground leading-relaxed">
                                {selectedLink.label || 'Unknown relationship'}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedAbstract} onOpenChange={(open) => !open && setSelectedAbstract(null)}>
                <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-display text-primary">
                            <FileText className="w-5 h-5" />
                            Abstract
                        </DialogTitle>
                        <DialogDescription>
                            {selectedAbstract?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] w-full rounded-md border p-4 mt-2">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {selectedAbstract?.content}
                        </p>
                    </ScrollArea>
                    {selectedAbstract?.link && (
                        <div className="flex justify-end mt-4 pt-2 border-t border-border/50">
                            <a
                                href={selectedAbstract.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                View Paper <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Email Generation Dialog */}
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-display text-primary">
                            <Mail className="w-5 h-5" />
                            {emailStep === 'selection' && "Draft an Email"}
                            {emailStep === 'generating' && "Generating Draft"}
                            {emailStep === 'editing' && "Edit & Send"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6">
                        {emailStep === 'selection' && (
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5 hover:text-white transition-all"
                                    onClick={() => handleGenerateEmail('reach_out')}
                                >
                                    <User className="w-6 h-6 text-primary" />
                                    <span>Reach out</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5 hover:text-white transition-all"
                                    onClick={() => handleGenerateEmail('colab')}
                                >
                                    <Network className="w-6 h-6 text-primary" />
                                    <span>Ask for collaboration</span>
                                </Button>
                            </div>
                        )}

                        {emailStep === 'generating' && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground animate-pulse">
                                    Your email is being generated...
                                </p>
                            </div>
                        )}

                        {emailStep === 'editing' && (
                            <div className="space-y-4">
                                <Textarea
                                    value={generatedEmail}
                                    onChange={(e) => setGeneratedEmail(e.target.value)}
                                    className="min-h-[200px] bg-background/50 border-primary/20 focus:border-primary resize-none font-mono text-sm"
                                    placeholder="Email content..."
                                />
                            </div>
                        )}
                    </div>

                    {emailStep === 'editing' && (
                        <DialogFooter>
                            <Button
                                onClick={handleSendEmail}
                                disabled={isSendingEmail}
                                className="gap-2"
                            >
                                {isSendingEmail ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Email
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default GraphVisualization;
