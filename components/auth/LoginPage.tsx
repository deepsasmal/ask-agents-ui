import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Network, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Common';
import { authApi, ApiError } from '../../services/api';

interface LoginPageProps {
    onLogin: () => void;
}

// Node type for graph animation
interface GraphNode {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    pulsePhase: number;
    type: 'primary' | 'secondary' | 'tertiary';
    createdAt: number;
    isEphemeral?: boolean;
    opacity: number;
}

// Animated Graph Background Component
const AnimatedGraph: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const nodesRef = useRef<GraphNode[]>([]);
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const lastTimeRef = useRef<number>(0);
    const dimensionsRef = useRef({ width: 0, height: 0 });

    const initNodes = useCallback((width: number, height: number) => {
        const nodes: GraphNode[] = [];
        const area = width * height;
        const nodeCount = Math.floor(area / 8000); // Slightly reduced density for better perf

        for (let i = 0; i < Math.min(nodeCount, 150); i++) {
            const type = i < 6 ? 'primary' : i < 25 ? 'secondary' : 'tertiary';
            let radius;
            if (type === 'primary') radius = 4 + Math.random() * 2;
            else if (type === 'secondary') radius = 2.5 + Math.random() * 1.5;
            else radius = 1.2 + Math.random() * 1.2;

            nodes.push({
                id: i,
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius,
                pulsePhase: Math.random() * Math.PI * 2,
                type,
                createdAt: performance.now(),
                isEphemeral: false,
                opacity: 0, // Fade in
            });
        }
        return nodes;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;

            const { width, height } = entry.contentRect;
            dimensionsRef.current = { width, height };
            canvas.width = width;
            canvas.height = height;

            if (nodesRef.current.length === 0) {
                nodesRef.current = initNodes(width, height);
            } else {
                // Adjust node positions to keep them within bounds after resize
                nodesRef.current.forEach(node => {
                    node.x = (node.x / canvas.width) * width;
                    node.y = (node.y / canvas.height) * height;
                });
            }
        });

        resizeObserver.observe(container);

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const maxNodes = 180;
            const nodes = nodesRef.current;

            if (nodes.length < maxNodes) {
                const id = nodes.length > 0 ? nodes[nodes.length - 1].id + 1 : 0;
                const spawnCount = 3;

                for (let s = 0; s < spawnCount; s++) {
                    if (nodes.length >= maxNodes) break;
                    const type: GraphNode['type'] = Math.random() > 0.8 ? 'secondary' : 'tertiary';
                    nodes.push({
                        id: id + s,
                        x: x + (Math.random() - 0.5) * 20,
                        y: y + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 1.2,
                        vy: (Math.random() - 0.5) * 1.2,
                        radius: type === 'secondary' ? 2.5 + Math.random() : 1.2 + Math.random(),
                        pulsePhase: Math.random() * Math.PI * 2,
                        type,
                        createdAt: performance.now(),
                        isEphemeral: true,
                        opacity: 1,
                    });
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
        };

        const handleMouseLeave = () => { mouseRef.current.active = false; };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        const animate = (time: number) => {
            if (!ctx || !canvas) return;

            // Delta time calculation for consistent speed across refresh rates
            const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 16.67, 2) : 1;
            lastTimeRef.current = time;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const { width, height } = dimensionsRef.current;
            const nodes = nodesRef.current;

            // Filter out dead ephemeral nodes and handle fade-ins
            nodesRef.current = nodes.filter(node => {
                if (node.isEphemeral) {
                    node.opacity -= 0.005 * dt;
                } else if (node.opacity < 1) {
                    node.opacity += 0.02 * dt;
                }
                return node.opacity > 0;
            });

            // Update physics
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                node.x += node.vx * dt;
                node.y += node.vy * dt;

                // Boundary bounce with soft padding
                const pad = 40;
                if (node.x < pad) { node.vx = Math.abs(node.vx); node.x = pad; }
                else if (node.x > width - pad) { node.vx = -Math.abs(node.vx); node.x = width - pad; }
                if (node.y < pad) { node.vy = Math.abs(node.vy); node.y = pad; }
                else if (node.y > height - pad) { node.vy = -Math.abs(node.vy); node.y = height - pad; }

                // Mouse repulsion
                if (mouseRef.current.active) {
                    const dx = node.x - mouseRef.current.x;
                    const dy = node.y - mouseRef.current.y;
                    const d2 = dx * dx + dy * dy;
                    const r2 = 120 * 120;
                    if (d2 < r2 && d2 > 0) {
                        const dist = Math.sqrt(d2);
                        const force = (1 - dist / 120) * 0.08 * dt;
                        node.vx += (dx / dist) * force;
                        node.vy += (dy / dist) * force;
                    }
                }

                // Smooth friction and minimal movement drift
                node.vx *= Math.pow(0.98, dt);
                node.vy *= Math.pow(0.98, dt);

                if (!node.isEphemeral) {
                    const minSpeed = 0.15;
                    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
                    if (speed < minSpeed) {
                        const angle = Math.random() * Math.PI * 2;
                        node.vx += Math.cos(angle) * 0.05 * dt;
                        node.vy += Math.sin(angle) * 0.05 * dt;
                    }
                }
            }

            // Connection distances based on screen size
            const maxConnectDist = Math.max(120, Math.min(width, height) * 0.18);
            const maxConnectDist2 = maxConnectDist * maxConnectDist;

            // Optimized connection loop (One pass, distance squared)
            ctx.lineWidth = 0.6;
            for (let i = 0; i < nodes.length; i++) {
                const n1 = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const n2 = nodes[j];
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    const d2 = dx * dx + dy * dy;

                    if (d2 < maxConnectDist2) {
                        const dist = Math.sqrt(d2);
                        const opacity = (1 - dist / maxConnectDist) * 0.3 * Math.min(n1.opacity, n2.opacity);

                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`;
                        ctx.moveTo(n1.x, n1.y);
                        ctx.lineTo(n2.x, n2.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes in separate pass to minimize state changes
            nodes.forEach(node => {
                const pulse = Math.sin(time / 1000 + node.pulsePhase) * 0.2 + 1;
                const r = node.radius * pulse;

                ctx.save();
                ctx.globalAlpha = node.opacity;

                // Optimized glow: only for primary/secondary
                if (node.type !== 'tertiary') {
                    const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
                    glow.addColorStop(0, node.type === 'primary' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(52, 211, 153, 0.2)');
                    glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Core
                ctx.fillStyle = node.type === 'primary' ? '#10b981' : node.type === 'secondary' ? '#34d399' : '#6ee7b7';
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            });

            // Mouse glow
            if (mouseRef.current.active) {
                const mGlow = ctx.createRadialGradient(mouseRef.current.x, mouseRef.current.y, 0, mouseRef.current.x, mouseRef.current.y, 30);
                mGlow.addColorStop(0, 'rgba(52, 211, 153, 0.15)');
                mGlow.addColorStop(1, 'rgba(52, 211, 153, 0)');
                ctx.fillStyle = mGlow;
                ctx.beginPath();
                ctx.arc(mouseRef.current.x, mouseRef.current.y, 30, 0, Math.PI * 2);
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            resizeObserver.disconnect();
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [initNodes]);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            <canvas ref={canvasRef} className="block w-full h-full" style={{ opacity: 0.9 }} />
        </div>
    );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (activeTab === 'signin') {
                await authApi.login(email, password);
                onLogin();
            } else {
                // Mock signup for now
                setTimeout(() => {
                    setIsLoading(false);
                    localStorage.setItem('auth_token', 'mock-token');
                    localStorage.setItem('user_id', email);
                    onLogin();
                }, 1000);
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to authenticate. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[100svh] w-full bg-white font-sans overflow-hidden lg:overflow-hidden">
            {/* Left Panel - Form */}
            <div className="login-shell w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-6 py-6 sm:px-8 sm:py-8 md:px-12 lg:px-16 xl:px-20 h-full overflow-hidden relative bg-white z-10">

                {/* Developer Bypass Button */}
                <button
                    onClick={() => {
                        const devEmail = 'developer@example.com';
                        localStorage.setItem('auth_token', 'dev-bypass-token');
                        localStorage.setItem('user_id', devEmail);
                        onLogin();
                    }}
                    className="absolute top-4 left-4 text-[10px] font-mono text-slate-300 hover:text-red-500 border border-transparent hover:border-red-100 px-2 py-1 rounded transition-colors"
                    title="Developer Bypass"
                >
                    [DEV: BYPASS AUTH]
                </button>

                <div className="login-content w-full max-w-md mx-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-[clamp(0.75rem,3vh,2rem)]">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200/50">
                            <Network className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">Ask<span className="text-brand-600">Agents</span></span>
                    </div>

                    <div className="animate-fade-in-up">
                        <h1 className="text-[clamp(1.5rem,4.2vw,2.25rem)] font-bold text-slate-900 mb-1.5 leading-tight">Welcome Back!</h1>
                        <p className="text-[clamp(0.875rem,2.4vw,1rem)] text-slate-500 mb-[clamp(0.75rem,2.8vh,2rem)] leading-relaxed">
                            Sign in to access your knowledge graphs and AI agents.
                        </p>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                            <button
                                onClick={() => { setActiveTab('signin'); setError(null); }}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === 'signin' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setActiveTab('signup'); setError(null); }}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === 'signup' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 animate-fade-in">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address / Username</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter your email"
                                        className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500 hover:border-slate-300'}`}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter your password"
                                        className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500 hover:border-slate-300'}`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0" />
                                    <span className="text-sm font-medium text-slate-600">Remember me</span>
                                </label>
                                <a href="#" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">Forgot Password?</a>
                            </div>

                            <Button
                                type="submit"
                                size="md"
                                isLoading={isLoading}
                                className="w-full py-4 shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-0.5 text-sm font-bold transition-all duration-200"
                            >
                                {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                            </Button>
                        </form>

                        <div className="login-alt relative my-[clamp(0.75rem,2.5vh,2rem)]">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-slate-400 font-medium">OR</span>
                            </div>
                        </div>

                        <div className="login-alt space-y-3">
                            <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 text-sm">
                                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.90098 20.165 8.86598 21.49C8.98939 21.5298 9.12053 21.5284 9.24328 21.4861C9.36603 21.4437 9.4753 21.3621 9.55798 21.251C9.64065 21.1399 9.69335 21.0039 9.70998 20.859C9.72661 20.7141 9.70648 20.5663 9.65198 20.433C9.40098 19.809 9.17698 18.286 9.17698 16.711C9.17698 14.155 10.632 12.35 12.001 12.35C13.369 12.35 14.825 14.155 14.825 16.711C14.825 18.286 14.601 19.809 14.35 20.433C14.2955 20.5663 14.2754 20.7141 14.292 20.859C14.3086 21.0039 14.3613 21.1399 14.444 21.251C14.5267 21.3621 14.6359 21.4437 14.7587 21.4861C14.8814 21.5284 15.0126 21.5298 15.136 21.49C19.101 20.165 22.001 16.425 22.001 12C22.001 6.475 17.526 2 12.001 2Z"></path></svg>
                                Log in with Apple
                            </button>
                            <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 text-sm">
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                Log in with Google
                            </button>
                        </div>

                        <div className="login-footer mt-[clamp(0.75rem,2.5vh,2rem)] text-center text-xs text-slate-400">
                            &copy; 2025 AskAgents. All rights reserved. <br className="sm:hidden" />
                            <span className="hidden sm:inline">&bull; </span>
                            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a> &bull; <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Animated Graph */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
                {/* Soft vignette to add depth (no hard-edged overlays) */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(1200px 900px at 50% 35%, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.00) 55%)' }} />

                {/* Animated Graph Canvas */}
                <AnimatedGraph />


            </div>

            {/* Custom styles */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float 4s ease-in-out infinite;
                    animation-delay: 1s;
                }
                .animate-float-slow {
                    animation: float-slow 5s ease-in-out infinite;
                }
                .animate-float-delayed-slow {
                    animation: float-slow 5s ease-in-out infinite;
                    animation-delay: 1.5s;
                }
                .bg-gradient-radial {
                    background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
                }

                /* Height-responsive: guarantee NO SCROLL on small/short viewports */
                @media (max-height: 740px) {
                    .login-shell {
                        padding-top: 1rem;
                        padding-bottom: 1rem;
                    }
                    .login-content {
                        transform: scale(0.96);
                        transform-origin: top center;
                    }
                }
                @media (max-height: 680px) {
                    .login-content {
                        transform: scale(0.92);
                    }
                }
                @media (max-height: 620px) {
                    .login-content {
                        transform: scale(0.88);
                    }
                    .login-alt {
                        display: none;
                    }
                    .login-footer {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};
