import React, { useMemo } from 'react';
import { Project } from '../../../types';
import { generateSprintReport } from '../../utils/sprintReportUtils';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, ComposedChart
} from 'recharts';

interface InsightsDashboardProps {
    project: Project;
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ project }) => {
    const sprint = project.phases.sprint;
    const stories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];

    // --- 1. Calculate Core Metrics ---
    const totalStoryPoints = stories.reduce((acc, s) => acc + s.storyPoints, 0);
    const totalEstimatedHours = stories.reduce((acc, s) => acc + s.estimatedHours, 0);

    // Calculate Remaining Hours (Real-time)
    // Detailed logic: If status is 'done', remaining is 0. Else, use estimatedHours.
    const currentRemainingHours = stories.reduce((acc, s) => {
        // Check for 'done' or 'Done'
        return s.status.toLowerCase() === 'done' ? acc : acc + s.estimatedHours;
    }, 0);

    const completedHours = totalEstimatedHours - currentRemainingHours;
    const completionPercentage = totalEstimatedHours > 0 ? Math.round((completedHours / totalEstimatedHours) * 100) : 0;

    // --- 2. Burndown Chart Logic ---
    const burndownData = useMemo(() => {
        if (!sprint?.startDate || !sprint?.endDate || !sprint?.durationWeeks) return [];

        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        const now = new Date();
        const totalUtfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.max(totalUtfDays, sprint.durationWeeks * 7);

        const dataPoints = [];

        // Generate data for ALL days of the sprint (0 to totalDays)
        for (let i = 0; i <= totalDays; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);

            // IDEAL Line: Linear decay from Total to 0
            const ideal = totalEstimatedHours - ((totalEstimatedHours / totalDays) * i);

            // REAL Line:
            // Check if this day is in the past or today relative to NOW
            const isPastOrToday = date <= now || date.toDateString() === now.toDateString();

            let real: number | null = null;

            // Retrieve from history if available
            const snapshot = sprint.burndownHistory?.find(s => {
                const sDate = new Date(s.date);
                return sDate.toDateString() === date.toDateString();
            });

            if (snapshot) {
                real = snapshot.remainingHours;
            } else if (i === 0) {
                // Day 0 is always Total
                real = totalEstimatedHours;
            } else if (date.toDateString() === now.toDateString()) {
                // Today: Show current calculated remaining
                // CRITICAL FIX: Ensure this value is actually Total - Done
                real = currentRemainingHours;
            } else if (date < now && !snapshot) {
                // Gaps in history: For a hard fix, we can either leave null or backfill.
                // Leaving null is safer for now to avoid inventing data, but ensures the "Today" point is distinct.
            }

            dataPoints.push({
                day: `Day ${i}`,
                date: date.toLocaleDateString(),
                ideal: Math.max(0, Math.round(ideal)), // No negative
                real: real !== null ? Math.round(real) : null,
                isToday: date.toDateString() === now.toDateString()
            });
        }
        return dataPoints;
    }, [sprint, totalEstimatedHours, currentRemainingHours]);

    if (!sprint?.isActive) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                    <p className="text-xl mb-2">Sprint not active</p>
                    <p className="text-sm">Start a sprint to see insights.</p>
                </div>
            </div>
        );
    }

    // Helper for AI text
    const idealForToday = burndownData.find(d => d.isToday)?.ideal || 0;

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* 1. Main Burndown Chart (Spans 2 cols) */}
                <div className="lg:col-span-2 bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 relative overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-200">Burndown Chart</h3>
                            <p className="text-xs text-slate-400">Tracking Remaining Effort vs. Ideal Timeline</p>
                        </div>
                        <div className="flex gap-4 text-sm font-mono">
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase">Goal</span>
                                <span className="text-emerald-400 font-bold">{totalEstimatedHours}h</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase">Remaining</span>
                                <span className={`font-bold ${currentRemainingHours > idealForToday ? 'text-amber-400' : 'text-blue-400'}`}>
                                    {currentRemainingHours}h
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={burndownData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    interval={Math.floor(burndownData.length / 5)} // Avoid crowding
                                />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                {/* Real Line Area */}
                                <Area
                                    type="monotone"
                                    dataKey="real"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorReal)"
                                    name="Remaining Work"
                                    connectNulls={true}
                                />

                                {/* Ideal Line (Placed after Area to be on top) */}
                                <Line
                                    type="monotone"
                                    dataKey="ideal"
                                    stroke="#10b981"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Ideal Trend"
                                    activeDot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Side Metrics (1 col) */}
                <div className="flex flex-col gap-6">
                    {/* Completion Card */}
                    <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-slate-400 text-sm font-medium mb-1">Sprint Progress</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-white">{completionPercentage}%</span>
                            <span className="text-slate-500 text-sm mb-1">completed</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-1000"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Lead Time & Throughput Preview */}
                    <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 flex-1">
                        <h3 className="text-slate-400 text-sm font-medium mb-4">Flow Metrics</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300">Throughput</span>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-white block">
                                        {stories.filter(s => s.status === 'done').length}
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase">Stories Done</span>
                                </div>
                            </div>
                            <div className="w-full h-px bg-slate-700/50"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300">Total Scope</span>
                                <div className="text-right">
                                    <span className="text-xl font-bold text-white block">
                                        {totalStoryPoints}
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase">Points</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-700/50">
                            <button
                                onClick={() => generateSprintReport(project)}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                📄 Download Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Review Section */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    🤖 AI Sprint Coach
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                    Based on your Burndown trajectory:
                </p>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 text-slate-300 text-sm leading-relaxed">
                    {currentRemainingHours > idealForToday ? (
                        <span className="text-amber-400 font-bold">⚠️ Behind Schedule: </span>
                    ) : (
                        <span className="text-emerald-400 font-bold">✅ On Track: </span>
                    )}
                    {currentRemainingHours > idealForToday
                        ? "You are burning hours slower than ideal. Consider reducing scope or checking for hidden impediments."
                        : "Great pace! You are trending slightly faster than the ideal line. Maintain quality checks."}
                </div>
            </div>
        </div>
    );
};

export default InsightsDashboard;
