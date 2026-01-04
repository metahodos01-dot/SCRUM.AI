import React from 'react';
import { Project, BurndownSnapshot } from '../../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generateSprintReport } from '../../utils/reportGenerator';

interface MonitoringHubProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

const MonitoringHub: React.FC<MonitoringHubProps> = ({ project, onUpdate }) => {
    // Calculate Real Data
    const sprint = project.phases.sprint;
    const history = sprint?.burndownHistory || [];

    // Mock data fallback if no history exists
    const mockData = [
        { day: 'Day 1', ideal: 400, real: 400 },
        { day: 'Day 2', ideal: 360, real: 380 },
        { day: 'Day 3', ideal: 320, real: 350 },
        { day: 'Day 4', ideal: 280, real: 340 },
        { day: 'Day 5', ideal: 240, real: 340 },
        { day: 'Day 6', ideal: 200, real: 310 },
        { day: 'Day 7', ideal: 160, real: null },
        { day: 'Day 8', ideal: 120, real: null },
        { day: 'Day 9', ideal: 80, real: null },
        { day: 'Day 10', ideal: 0, real: null },
    ];

    const data = history.length > 0 ? history.map((h, i) => ({
        day: h.date || `Day ${i + 1}`,
        ideal: h.idealHours,
        real: h.remainingHours
    })) : mockData;

    // Snapshot Logic
    const handleUpdateBurndown = () => {
        if (!sprint) return;

        // 1. Calculate current remaining hours
        // Get all stories in sprint
        const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];

        // Sum remaining estimates (todo/doing/testing)
        // For done, it is 0.
        const currentRemaining = sprintStories.reduce((acc, story) => {
            return acc + (story.status === 'done' ? 0 : (story.estimatedHours || 0));
        }, 0);

        // 2. Calculate ideal hours
        // Linear drop from totalEstimatedHours at start to 0 at end
        // Simplification: Ideal = TotalStart * (1 - (daysPassed / totalDays))
        // For now, let's just take the last ideal and subtract daily capacity or just use a simple linear formula based on snapshots count.
        const totalStart = sprint.totalEstimatedHours || 400; // Fallback
        const totalDays = sprint.durationWeeks * 5; // Assuming 5 day weeks
        const step = totalStart / totalDays;
        const nextIdeal = Math.max(0, totalStart - ((history.length) * step));

        const newSnapshot: BurndownSnapshot = {
            date: new Date().toLocaleDateString(),
            remainingHours: currentRemaining,
            idealHours: Math.round(nextIdeal),
            completedStoryPoints: sprintStories.filter(s => s.status === 'done').reduce((acc, s) => acc + s.storyPoints, 0)
        };

        const newProject = JSON.parse(JSON.stringify(project));
        if (!newProject.phases.sprint.burndownHistory) {
            newProject.phases.sprint.burndownHistory = [];
        }
        newProject.phases.sprint.burndownHistory.push(newSnapshot);

        onUpdate(newProject);
    };

    // AI Logic Simulation (using data)
    const isFlatlining = data.length >= 2 && data[data.length - 1].real === data[data.length - 2].real;

    return (
        <div className="h-full p-6 flex gap-6">
            {/* Chart Section */}
            <div className="flex-1 flex flex-col bg-slate-800/20 rounded-xl p-6 border border-slate-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-4">
                        <span>Sprint Burndown</span>
                        <span className="text-sm font-normal text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Sprint Goal: {project.phases.sprint?.goal || 'Maximize Value'}</span>
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => generateSprintReport(project)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-600"
                        >
                            📄 Export Report
                        </button>
                        <button
                            onClick={handleUpdateBurndown}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                            📸 Capture Daily Snapshot
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Line type="monotone" dataKey="ideal" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Ideal Trend" />
                            <Line type="monotone" dataKey="real" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 8 }} name="Real Remaining" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Alert Sidebar */}
            <div className="w-80 flex flex-col gap-4">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 h-full">
                    <h3 className="font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                        <span className="animate-pulse">✨</span> AI Pulse
                    </h3>

                    {isFlatlining ? (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
                            <h4 className="text-red-400 font-bold text-sm mb-1 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Bottleneck Detected
                            </h4>
                            <p className="text-slate-300 text-xs leading-relaxed mb-3">
                                The burndown has been flat recently. Consider swarming on blocked stories.
                            </p>
                            <button className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs py-2 rounded border border-red-500/30 transition-colors">
                                Suggest Swarming
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4">
                            <p className="text-emerald-400 text-xs">Sprint is healthy. Pace is sustainable.</p>
                        </div>
                    )}

                    <div className="mt-6">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Predictions</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Completion Probability</span>
                                <span className="text-emerald-400 font-mono">87%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Forecast End</span>
                                <span className="text-slate-200 font-mono">Friday 14:00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringHub;
