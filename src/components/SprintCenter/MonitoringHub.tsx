import React, { useMemo } from 'react';
import { Project, BurndownSnapshot } from '../../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generateSprintReport } from '../../utils/reportGenerator';
import { detectImpediments } from '../../utils/aiImpedimentDetector';

interface MonitoringHubProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

const MonitoringHub: React.FC<MonitoringHubProps> = ({ project, onUpdate }) => {
    // Advanced Burndown Logic
    const sprint = project.phases.sprint;
    const history = sprint?.burndownHistory || [];

    // 1. Define Time Horizon (Adaptive)
    const startDate = new Date(sprint?.startDate || Date.now());
    const endDate = new Date(sprint?.endDate || Date.now() + 14 * 24 * 60 * 60 * 1000); // Default 14 days if missing

    // Calculate total days difference (inclusive of start day)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 14;

    const totalPoints = sprint?.totalEstimatedHours || 0;
    const now = new Date();

    // AI Detection
    const alerts = useMemo(() => detectImpediments(project), [project]);

    // 2. Generate Full Axis (Day 0 to Day N)
    const chartData = Array.from({ length: totalDays + 1 }, (_, i) => {
        // Ideal: Start at Total, End at 0
        // Linear formula: y = Total - (Total/Duration * x)
        const ideal = Math.max(0, totalPoints - (totalPoints / totalDays) * i);

        // Real: 
        // Logic: Stop plotting "Real" if the day is in the future relative to "Now"
        // Exception: Always show Day 0 (Start)

        const currentPlotDate = new Date(startDate);
        currentPlotDate.setDate(startDate.getDate() + i);

        const isFuture = currentPlotDate > now && currentPlotDate.toDateString() !== now.toDateString();
        const isToday = currentPlotDate.toDateString() === now.toDateString();

        let real: number | null = null;

        // Check history first
        if (i < history.length) {
            real = history[i].remainingHours;
        } else if (i === 0) {
            // Day 0 assumption
            real = totalPoints;
        } else if (isToday) {
            // Real-time calculation for today if no snapshot yet
            const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];
            real = sprintStories.reduce((acc, story) => {
                // If done, 0 remaining. Else use estimatedHours (which is reduced by logging)
                return acc + (story.status.toLowerCase() === 'done' ? 0 : (story.estimatedHours || 0));
            }, 0);
        }

        // If no history but it is NOT future, we could technically infer or leave null.
        // For strict "Stop at Today", we return null if isFuture is true (unless it's day 0).
        if (isFuture && i !== 0) {
            real = null;
        }

        return {
            day: `Day ${i}`,
            ideal: Math.round(ideal),
            real: real,
        };
    });

    // Snapshot Logic
    const handleUpdateBurndown = () => {
        if (!sprint) return;

        // Calculate current remaining
        const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];
        const currentRemaining = sprintStories.reduce((acc, story) => {
            return acc + (story.status.toLowerCase() === 'done' ? 0 : (story.estimatedHours || 0));
        }, 0);

        // Calculate Ideal (just for reference in snapshot)
        const dayIndex = history.length;
        const idealAtCheck = Math.max(0, totalPoints - (totalPoints / totalDays) * dayIndex);

        const newSnapshot: BurndownSnapshot = {
            date: new Date().toLocaleDateString(),
            remainingHours: currentRemaining,
            idealHours: Math.round(idealAtCheck),
            completedStoryPoints: sprintStories.filter(s => s.status.toLowerCase() === 'done').reduce((acc, s) => acc + s.storyPoints, 0)
        };

        const newProject = JSON.parse(JSON.stringify(project));
        if (!newProject.phases.sprint.burndownHistory) {
            newProject.phases.sprint.burndownHistory = [];
        }
        newProject.phases.sprint.burndownHistory.push(newSnapshot);

        onUpdate(newProject);
    };

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
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />
                            <Line type="linear" dataKey="ideal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Ideal Trend" isAnimationActive={false} />
                            <Line type="monotone" dataKey="real" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 8 }} name="Real Remaining" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Alert Sidebar (Problem Solving) */}
            <div className="w-80 flex flex-col gap-4">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 h-full overflow-y-auto">
                    <h3 className="font-semibold text-indigo-400 mb-4 flex items-center gap-2 sticky top-0 bg-slate-900/80 backdrop-blur py-2 z-10">
                        <span className="animate-pulse">🤖</span> Problem Solving AI
                    </h3>

                    {alerts.length > 0 ? (
                        <div className="space-y-3">
                            {alerts.map(alert => (
                                <div key={alert.id} className={`rounded-lg p-4 border ${alert.severity === 'high' ? 'bg-red-900/20 border-red-500/50' :
                                        alert.severity === 'medium' ? 'bg-amber-900/20 border-amber-500/50' :
                                            'bg-blue-900/20 border-blue-500/50'
                                    }`}>
                                    <h4 className={`font-bold text-sm mb-1 flex items-center gap-2 ${alert.severity === 'high' ? 'text-red-400' :
                                            alert.severity === 'medium' ? 'text-amber-400' :
                                                'text-blue-400'
                                        }`}>
                                        {alert.severity === 'high' && <span className="text-lg">⚠️</span>}
                                        {alert.title}
                                    </h4>
                                    <p className="text-slate-300 text-xs leading-relaxed mb-3">
                                        {alert.description}
                                    </p>
                                    <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                                        <p className="text-xs text-slate-400 italic">
                                            <span className="font-bold not-italic text-indigo-300">Suggestion:</span> {alert.suggestion}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4 text-center py-8">
                            <div className="text-4xl mb-3">✅</div>
                            <p className="text-emerald-400 text-sm font-medium">System Clear</p>
                            <p className="text-slate-500 text-xs mt-1">No major impediments detected.</p>
                        </div>
                    )}

                    <div className="mt-6 border-t border-slate-700 pt-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Live Metrics</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Remaining</span>
                                <span className="text-white font-mono">
                                    {project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint)
                                        .reduce((acc, s) => acc + (s.status === 'DONE' ? 0 : s.estimatedHours), 0)}h
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringHub;
