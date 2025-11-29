
import React, { useState } from 'react';
import { Network, Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Common';
import { authApi, ApiError } from '../../services/api';

interface LoginPageProps {
  onLogin: () => void;
}

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
             // Mock signup for now as no endpoint was provided for signup in this context
            setTimeout(() => {
                setIsLoading(false);
                // For demo purposes, we can pretend signup also logs them in, 
                // or redirect to signin.
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
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-center p-8 md:p-12 lg:p-16 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden relative bg-white z-10">
        
        {/* Developer Bypass Button */}
        <button 
            onClick={() => {
                localStorage.setItem('auth_token', 'dev-bypass-token');
                onLogin();
            }}
            className="absolute top-4 left-4 text-[10px] font-mono text-slate-300 hover:text-red-500 border border-transparent hover:border-red-100 px-2 py-1 rounded transition-colors"
            title="Developer Bypass: Skip Authentication"
        >
            [DEV: BYPASS AUTH]
        </button>

        <div className="max-w-md w-full mx-auto flex flex-col h-full justify-center">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Network className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">Ask<span className="text-brand-600">Agents</span></span>
            </div>

            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back!</h1>
                <p className="text-slate-500 mb-8">We are happy to see you again. Sign in to access your knowledge graphs.</p>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                    <button
                        onClick={() => { setActiveTab('signin'); setError(null); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setActiveTab('signup'); setError(null); }}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 animate-fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Email Address / Username</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                required
                                placeholder="Enter your email"
                                className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500 hover:border-brand-300'}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Enter your password"
                                className={`w-full pl-11 pr-11 py-3 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-brand-500 hover:border-brand-300'}`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                            <span className="text-sm font-medium text-slate-500">Remember me</span>
                        </label>
                        <a href="#" className="text-sm font-bold text-brand-600 hover:text-brand-700">Forgot Password?</a>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        isLoading={isLoading}
                        className="w-full py-3.5 shadow-brand-600/30 hover:shadow-brand-600/50 hover:-translate-y-0.5 text-base"
                    >
                        {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                    </Button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-slate-400 font-medium">OR</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:-translate-y-0.5 text-sm">
                        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.90098 20.165 8.86598 21.49C8.98939 21.5298 9.12053 21.5284 9.24328 21.4861C9.36603 21.4437 9.4753 21.3621 9.55798 21.251C9.64065 21.1399 9.69335 21.0039 9.70998 20.859C9.72661 20.7141 9.70648 20.5663 9.65198 20.433C9.40098 19.809 9.17698 18.286 9.17698 16.711C9.17698 14.155 10.632 12.35 12.001 12.35C13.369 12.35 14.825 14.155 14.825 16.711C14.825 18.286 14.601 19.809 14.35 20.433C14.2955 20.5663 14.2754 20.7141 14.292 20.859C14.3086 21.0039 14.3613 21.1399 14.444 21.251C14.5267 21.3621 14.6359 21.4437 14.7587 21.4861C14.8814 21.5284 15.0126 21.5298 15.136 21.49C19.101 20.165 22.001 16.425 22.001 12C22.001 6.475 17.526 2 12.001 2Z"></path></svg>
                        Log in with Apple
                    </button>
                    <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm hover:border-slate-300 hover:-translate-y-0.5 text-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Log in with Google
                    </button>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400">
                    &copy; 2025 AskAgents. All rights reserved. <br/>
                    <span className="hover:text-slate-600 cursor-pointer transition-colors">Privacy Policy</span> &bull; <span className="hover:text-slate-600 cursor-pointer transition-colors">Terms of Service</span>
                </div>
            </div>
        </div>
      </div>

      {/* Right Panel - Pure Green Gradient */}
      <div className="hidden lg:flex w-[55%] xl:w-[60%] relative bg-brand-950 overflow-hidden items-center justify-center">
         {/* Smooth Green Gradient Background */}
         <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800"></div>

         {/* Minimal Deep Aurora Effect */}
         <div className="absolute top-[-20%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-emerald-600/5 blur-[120px] animate-pulse-slow"></div>
         
         {/* Subtle Texture */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

         {/* Content */}
         <div className="relative z-10 p-16 max-w-3xl flex flex-col gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
             <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl">
                <Sparkles className="w-8 h-8 text-brand-300" />
             </div>
             
             <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                    Transform your data into <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-emerald-200">intelligent insights.</span>
                </h2>
                <p className="text-brand-100/70 text-lg leading-relaxed max-w-xl font-light">
                    Unified platform to build knowledge graphs and interact with AI agents securely. Join 500+ data teams already building the future.
                </p>
             </div>

             <div className="flex items-center gap-4 mt-4 pt-8 border-t border-white/5">
                 <div className="flex -space-x-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border-[3px] border-brand-900 flex items-center justify-center text-[10px] font-bold text-emerald-800">JD</div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 border-[3px] border-brand-900 flex items-center justify-center text-[10px] font-bold text-blue-800">AS</div>
                    <div className="w-10 h-10 rounded-full bg-purple-100 border-[3px] border-brand-900 flex items-center justify-center text-[10px] font-bold text-purple-800">MK</div>
                    <div className="w-10 h-10 rounded-full bg-brand-800 border-[3px] border-brand-900 flex items-center justify-center text-[10px] font-bold text-white">+2k</div>
                 </div>
                 <div className="flex flex-col">
                    <div className="flex text-emerald-400">
                        {[1,2,3,4,5].map(i => (
                            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        ))}
                    </div>
                    <span className="text-xs text-brand-200/50 font-medium">Trusted by Enterprise Teams</span>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};
