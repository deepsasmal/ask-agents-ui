import React, { useEffect, useState } from 'react';
import { Settings, Moon, Sun, X } from 'lucide-react';
import { authApi } from '../../services/api';

interface SettingsModuleProps {
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    onLogout: () => void;
    onClose: () => void;
}

const navItems = ['Profile'];

export const SettingsModule: React.FC<SettingsModuleProps> = ({ isDarkMode, onToggleDarkMode, onLogout, onClose }) => {
    const [activeItem, setActiveItem] = useState<string>('Profile');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        const first = localStorage.getItem('user_first_name') || '';
        const last = localStorage.getItem('user_last_name') || '';
        const displayName = `${first} ${last}`.trim() || authApi.getUserDisplayName();
        const storedUsername = localStorage.getItem('user_username') || authApi.getCurrentUser() || '';
        const storedEmail = localStorage.getItem('user_email') || '';

        setName(displayName);
        setUsername(storedUsername);
        setEmail(storedEmail);
    }, []);

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6 bg-black/35 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ring-1 ring-black/5">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-12">
                    {/* Sidebar */}
                    <div className="col-span-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 flex items-center justify-center font-bold">
                                D
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white">Deep</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Owner</span>
                            </div>
                        </div>

                        <div className="space-y-1 px-2 pb-4">
                            {navItems.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setActiveItem(item)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl transition-all duration-150 flex items-center gap-3 relative ${
                                        activeItem === item
                                            ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-600 hover:bg-white/80 dark:text-slate-400 dark:hover:bg-slate-800/70'
                                    }`}
                                >
                                    <span className="text-sm font-semibold">{item}</span>
                                    {activeItem === item && (
                                        <span className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-span-9 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Profile</p>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">Profile</h2>
                            </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm p-6 max-w-xl">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">User Name</label>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</label>
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-500 text-sm font-semibold cursor-not-allowed">
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModule;

