import React from 'react';
import { Project } from '../../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface ExecutiveObeyaProps {
    project: Project;
}

const ExecutiveObeya: React.FC<ExecutiveObeyaProps> = ({ project }) => {
    const navigate = useNavigate();

    // --- MOCK DATA FOR EXECUTIVE VIEW ---

    // 1. Strategic Alignment Data
    const alignmentData = [
        { name: 'Aligned', value: 92 },
        { name: 'Drift', value: 8 },
    ];
    const ALIGNMENT_COLORS = ['#f97316', '#334155']; // Orange for focus, Slate for background

    // 2. Business Value Delivery Data (Cumulative)
    const roiData = [
        { month: 'Jan', value: 120, cost: 100 },
        { month: 'Feb', value: 250, cost: 200 },
        { month: 'Mar', value: 450, cost: 300 },
        { month: 'Apr', value: 680, cost: 400 },
        { month: 'May', value: 980, cost: 500 },
    ];

    // 3. Trust Score Data
    const trustScore = 88; // %

    // 4. AI Efficiency Data
    const aiHoursSaved = 340;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            {/* HEADER */}
            <div className="flex justify-between items-end mb-12 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase text-white">
                        Executive Obeya
                    </h1>
                    <p className="text-slate-400 text-sm tracking-widest uppercase">
                        Strategic Command Center • {project.name.toUpperCase()}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-1">Last Update</p>
                    <p className="text-slate-300 font-mono text-sm">
                        {project.phases.sprint?.lastUpdated
                            ? new Date(project.phases.sprint.lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : 'Syncing...'}
                    </p>
                </div>
            </div>

            {/* PILLARS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

                {/* PILLAR 1: STRATEGIC ALIGNMENT (Drill-down to Objectives) */}
                <div
                    onClick={() => navigate(`/project/${project.id}/objectives`)}
                    className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all cursor-pointer group"
                >
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 group-hover:text-orange-400 transition-colors">Strategic Alignment</h3>
                    <div className="h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={alignmentData}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {alignmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ALIGNMENT_COLORS[index % ALIGNMENT_COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
                            <span className="text-3xl font-bold text-white">92%</span>
                        </div>
                    </div>
                    <p className="text-xs text-center text-slate-500 mt-2">Team focus on Strategic Goals</p>
                    <p className="text-[10px] text-center text-emerald-500 mt-1 font-mono">Run Operations: 8%</p>
                </div>

                {/* PILLAR 2: BUSINESS VALUE (Drill-down to Monitoring) */}
                <div
                    onClick={() => navigate(`/project/${project.id}/sprint`)}
                    className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all cursor-pointer group"
                >
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 group-hover:text-orange-400 transition-colors">Value Delivery Trend</h3>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={roiData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} itemStyle={{ color: 'white' }} />
                                <Area type="monotone" dataKey="value" stroke="#f97316" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <div>
                            <p className="text-2xl font-bold text-white">$980k</p>
                            <p className="text-[10px] text-slate-500 uppercase">Cumulative Value</p>
                        </div>
                        <div className="text-right">
                            <span className="text-emerald-500 text-xs font-bold">+24%</span>
                            <p className="text-[10px] text-slate-500">vs Prev Month</p>
                        </div>
                    </div>
                </div>

                {/* PILLAR 3: PREDICTABILITY (Trust Score) */}
                <div
                    onClick={() => navigate(`/project/${project.id}/obeya`)}
                    className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all cursor-pointer group"
                >
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 group-hover:text-orange-400 transition-colors">Trust Score</h3>
                    <div className="flex items-center justify-center h-32 relative">
                        <div className="text-center">
                            <div className="text-5xl font-extrabold text-white mb-2">{trustScore}%</div>
                            <div className="inline-flex items-center gap-1 bg-emerald-900/30 px-2 py-1 rounded text-emerald-400 text-xs border border-emerald-900">
                                <span>▲ Stable</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-slate-500 mt-2">Commitment Reliability</p>
                </div>

                {/* PILLAR 4: AI EFFICIENCY */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">AI Efficiency</h3>

                    <div className="flex flex-col h-32 justify-center">
                        <span className="text-5xl font-mono text-orange-500 font-bold">{aiHoursSaved}h</span>
                        <span className="text-sm text-slate-300 mt-2 border-l-2 border-orange-500 pl-3">
                            Operational Hours Saved
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Equiv. to <strong className="text-white">2.5 FTE</strong> on High-Value Tasks
                    </p>
                </div>

            </div>

            {/* AI STRATEGIC BRIEFING */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <span className="text-6xl">🧠</span>
                </div>

                <h2 className="text-orange-500 text-sm font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    AI Strategic Briefing
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <h4 className="text-white font-bold text-lg">Current Status</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            We are aligned at <strong>92%</strong> with the "Amanda Project" objective. Velocity has stabilized, ensuring predictable delivery for the upcoming release window.
                        </p>
                    </div>

                    <div className="space-y-2 border-l border-slate-700 pl-6">
                        <h4 className="text-amber-400 font-bold text-lg flex items-center gap-2">
                            ⚠️ Risk Detected
                        </h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Slowdown detected on <span className="text-white bg-slate-700 px-1 rounded">DevOps Skills</span>. Deployment frequency has dropped by 15%, potentially risking the Release 1.2 timeline.
                        </p>
                    </div>

                    <div className="space-y-2 border-l border-slate-700 pl-6">
                        <h4 className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                            ⚡ Suggested Action
                        </h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Reallocate 1 Mid-Senior resource from Project X (Low Priority) to support the pipeline automation. <strong>Est. Impact: +20% Velocity.</strong>
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ExecutiveObeya;
