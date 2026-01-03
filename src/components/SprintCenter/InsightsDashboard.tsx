import React from 'react';
import { Project } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface InsightsDashboardProps {
    project: Project;
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ project }) => {
    // Mock Metrics
    const sprintCompletion = 65;
    const businessValueDelivered = 420;
    const teamHealth = 8.5;

    const data = [
        { name: 'Completed', value: sprintCompletion },
        { name: 'Remaining', value: 100 - sprintCompletion },
    ];
    const COLORS = ['#10b981', '#1e293b'];

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* Goal Completion Card */}
                <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Sprint Goal Progress</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{sprintCompletion}%</span>
                        <span className="text-emerald-400 text-sm mb-1">On Track</span>
                    </div>
                    <div className="h-32 mt-4 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Centered Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-500">TARGET</span>
                        </div>
                    </div>
                </div>

                {/* Business Value Card */}
                <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Business Value (Score)</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{businessValueDelivered}</span>
                        <span className="text-blue-400 text-sm mb-1">+12% vs last Sprint</span>
                    </div>
                    <div className="mt-6 flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Feature A</span>
                            <span className="text-white">120 pts</span>
                        </div>
                        <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[60%]"></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Optimization B</span>
                            <span className="text-white">80 pts</span>
                        </div>
                        <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400/70 w-[30%]"></div>
                        </div>
                    </div>
                </div>

                {/* Team Health Card */}
                <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Team Health</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white">{teamHealth}</span>
                        <span className="text-slate-500 text-lg">/10</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">"High collaboration, but energy is dipping."</p>

                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Positivity</span>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full"><div className="w-[80%] h-full bg-emerald-500 rounded-full"></div></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Workload</span>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full"><div className="w-[95%] h-full bg-amber-500 rounded-full"></div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Automated Review / Insights Text */}
            <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">🤖 Automated Sprint Review</h3>
                <div className="space-y-4 text-sm text-slate-300">
                    <p className="leading-relaxed">
                        <strong className="text-emerald-400">Highlights:</strong> The team successfully pivoted on the "Search" epic, delivering key value early. Velocity is consistent.
                    </p>
                    <p className="leading-relaxed">
                        <strong className="text-amber-400">Attention:</strong> There was a significant bottleneck in QA during Day 4-5. Consider increasing detailed acceptance criteria in the next Planning.
                    </p>
                    <p className="leading-relaxed">
                        <strong className="text-blue-400">Client Impact:</strong> The new "Fast Checkout" feature is estimated to reduce drop-off by 15%.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InsightsDashboard;
