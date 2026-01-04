import React, { useState } from 'react';
import { Project, SprintData } from '../../../types';

interface SprintControlPanelProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

const SprintControlPanel: React.FC<SprintControlPanelProps> = ({ project, onUpdate }) => {
    const sprint = project.phases.sprint;
    const [customDuration, setCustomDuration] = useState<number>(sprint?.durationWeeks || 2);
    const [isEditingDuration, setIsEditingDuration] = useState(false);

    // FIX: Handle missing sprint data by offering initialization
    if (!sprint) {
        return (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Sprint Status</span>
                    <span className="text-lg font-bold text-slate-100">NOT STARTED</span>
                </div>
                <button
                    onClick={() => {
                        const newProject = JSON.parse(JSON.stringify(project));
                        newProject.phases.sprint = {
                            isActive: false,
                            status: 'planning',
                            durationWeeks: 2,
                            burndownHistory: []
                        };
                        onUpdate(newProject);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg"
                >
                    ⚙️ Initialize Sprint Phase
                </button>
            </div>
        );
    }

    const handleStartSprint = () => {
        const newProject = JSON.parse(JSON.stringify(project));
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + (customDuration * 7)); // Simple weeks calculation

        newProject.phases.sprint = {
            ...newProject.phases.sprint,
            isActive: true,
            status: 'active',
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            durationWeeks: customDuration,
            burndownHistory: [] // Reset history
        };
        onUpdate(newProject);
    };

    const handleEndSprint = () => {
        if (!confirm("Are you sure you want to end the Sprint? This will calculate final metrics.")) return;

        const newProject = JSON.parse(JSON.stringify(project)) as Project;
        const sprintStories = newProject.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];

        // Calculate Metrics
        const completedStories = sprintStories.filter(s => s.status === 'done');
        const velocity = completedStories.reduce((acc, s) => acc + s.storyPoints, 0);
        const throughput = completedStories.length;

        // Simple Lead Time Calc (Mock: assume random 2-5 days for now if no timestamps, or 0)
        // In real app, we'd use story.createdAt vs story.completedAt
        const leadTime = completedStories.length > 0 ? 3.5 : 0;

        newProject.phases.sprint = {
            ...newProject.phases.sprint,
            isActive: false,
            status: 'completed',
            velocity,
            throughput,
            leadTime
        };

        onUpdate(newProject);
    };

    const handleReset = () => {
        if (!confirm("RESET SPRINT? All progress and history will be wiped.")) return;
        const newProject = JSON.parse(JSON.stringify(project));
        newProject.phases.sprint = {
            ...newProject.phases.sprint,
            isActive: false,
            status: 'planning',
            burndownHistory: [],
            startDate: '',
            endDate: ''
        };
        onUpdate(newProject);
    };

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Sprint Status</span>
                    <span className={`text-lg font-bold ${sprint.status === 'active' ? 'text-green-400 animate-pulse' : 'text-slate-100'}`}>
                        {sprint.status?.toUpperCase() || 'PLANNING'}
                    </span>
                </div>

                {sprint.status === 'active' && (
                    <div className="px-3 py-1 bg-slate-700 rounded text-xs text-slate-300">
                        Ends: {new Date(sprint.endDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* Configuration (Only in Planning) */}
                {(sprint.status === 'planning' || !sprint.status) && (
                    <div className="flex items-center gap-2 mr-4 bg-slate-900/50 p-2 rounded-lg">
                        <span className="text-xs text-slate-400">Duration (Weeks):</span>
                        <input
                            type="number"
                            min="1"
                            max="6"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                            className="w-12 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-center text-white"
                        />
                    </div>
                )}

                {/* Actions */}
                {(sprint.status === 'planning' || !sprint.status) && (
                    <button
                        onClick={handleStartSprint}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-emerald-900/20 flex items-center gap-2"
                    >
                        🚀 Start Sprint
                    </button>
                )}

                {sprint.status === 'active' && (
                    <button
                        onClick={handleEndSprint}
                        className="bg-red-600/80 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg flex items-center gap-2"
                    >
                        🏁 End Sprint
                    </button>
                )}

                {sprint.status === 'completed' && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg font-bold transition-all border border-slate-600"
                        >
                            🔄 Reset / New Sprint
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SprintControlPanel;
