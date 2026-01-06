import React, { useState, useEffect } from 'react';
import { Project, SprintData, SprintStats } from '../../../types';
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../../firebase';

interface SprintControlPanelProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

const SprintControlPanel: React.FC<SprintControlPanelProps> = ({ project, onUpdate }) => {
    const sprint = project.phases.sprint;
    const [customDuration, setCustomDuration] = useState<number>(sprint?.durationWeeks || 2);
    const [isEditingDuration, setIsEditingDuration] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (sprint?.isActive && sprint.endDate) {
            const now = new Date();
            const end = new Date(sprint.endDate);
            const diffTime = end.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays);
        }
    }, [sprint]);

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

        const history = newProject.phases.sprint.sprintHistory || [];
        const lastNumber = history.length > 0 ? history[history.length - 1].number : (newProject.phases.sprint.number || 0);
        const nextNumber = lastNumber + 1;

        newProject.phases.sprint = {
            ...newProject.phases.sprint,
            isActive: true,
            status: 'active',
            number: nextNumber,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            durationWeeks: customDuration,
            burndownHistory: [], // Reset history
            sprintHistory: history,
            lastUpdated: serverTimestamp() as any
        };
        onUpdate(newProject);
    };

    const handleEndSprint = async () => {
        if (!confirm("Are you sure you want to end the Sprint? This will archive DONE items and reset others.")) return;

        try {
            const batch = writeBatch(db);
            const projectRef = doc(db, 'projects', project.id);
            const metaRef = doc(db, 'projects', project.id, 'metadata', 'sprint_config');

            const newProject = JSON.parse(JSON.stringify(project)) as Project;

            // 1. Process Stories (Clean Sync)
            if (newProject.phases.backlog?.epics) {
                newProject.phases.backlog.epics.forEach(epic => {
                    epic.stories.forEach(story => {
                        if (story.isInSprint) {
                            if (story.status.toLowerCase() === 'done') {
                                // Archive: Remove from sprint view, keep as Done
                                story.isInSprint = false;
                                story.archived = true;
                                story.sprintId = null; // Disconnect from sprint
                                story.completedAt = serverTimestamp() as any;
                            } else {
                                // Return to Backlog: Remove from sprint, reset status
                                story.isInSprint = false;
                                story.status = 'todo';
                                story.sprintId = null;
                            }
                        }
                    });
                });
            }

            const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];
            const completedStories = sprintStories.filter(s => s.status.toLowerCase() === 'done');

            // 2. Metrics Capture
            const velocity = completedStories.reduce((acc, s) => acc + s.storyPoints, 0);
            const throughput = completedStories.length;
            const leadTime = 0;

            // 3. Save History & Reset
            const history = newProject.phases.sprint.sprintHistory || [];
            history.push({
                number: project.phases.sprint.number,
                velocity,
                throughput,
                startDate: project.phases.sprint.startDate,
                endDate: new Date().toISOString(),
                goal: project.phases.sprint.goal
            });

            newProject.phases.sprint = {
                ...newProject.phases.sprint,
                isActive: false,
                status: 'completed',
                velocity,
                throughput,
                leadTime,
                aiAlerts: [],
                activeManualImpediments: [],
                endDate: new Date().toISOString(),
                sprintHistory: history,
                lastUpdated: serverTimestamp() as any
            };

            // BATCH UPDATE: Project + Metadata
            batch.set(projectRef, newProject, { merge: true });

            // Increment Sprint Counter in Metadata (Source of Truth)
            const nextSprintNumber = (project.phases.sprint.number || 0) + 1;
            batch.set(metaRef, {
                current_sprint_number: nextSprintNumber,
                last_updated: serverTimestamp()
            }, { merge: true });

            await batch.commit();

            // Local fallback update for immediate UI feedback (optional, assuming onSnapshot picks it up)
            onUpdate(newProject);

        } catch (error) {
            console.error("Batch Sprint End Failed:", error);
            alert("Crisis: Failed to end sprint. Check console.");
        }
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
                    <div className="flex gap-4 items-center">
                        <div className="flex flex-col items-center bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        const newProject = JSON.parse(JSON.stringify(project));
                                        const s = newProject.phases.sprint;
                                        // Specific Time Travel: Shift window +1 day (Go BACK in time relative to sprint start)
                                        const start = new Date(s.startDate);
                                        const end = new Date(s.endDate);
                                        start.setDate(start.getDate() + 1);
                                        end.setDate(end.getDate() + 1);
                                        s.startDate = start.toISOString();
                                        s.endDate = end.toISOString();
                                        s.lastUpdated = serverTimestamp() as any;
                                        onUpdate(newProject);
                                    }}
                                    className="text-xs bg-slate-700 hover:bg-slate-600 px-1 rounded text-slate-300"
                                    title="Rewind 1 Day"
                                >
                                    ⏪
                                </button>
                                <span className="text-[9px] text-slate-500 uppercase font-mono">TIME</span>
                                <button
                                    onClick={() => {
                                        const newProject = JSON.parse(JSON.stringify(project));
                                        const s = newProject.phases.sprint;
                                        // Forward 1 day (Advance sprint progress)
                                        const start = new Date(s.startDate);
                                        const end = new Date(s.endDate);
                                        start.setDate(start.getDate() - 1);
                                        end.setDate(end.getDate() - 1);
                                        s.startDate = start.toISOString();
                                        s.endDate = end.toISOString();
                                        s.lastUpdated = serverTimestamp() as any;
                                        onUpdate(newProject);
                                    }}
                                    className="text-xs bg-slate-700 hover:bg-slate-600 px-1 rounded text-slate-300"
                                    title="Advance 1 Day"
                                >
                                    ⏩
                                </button>
                            </div>
                        </div>

                        <div className="px-3 py-1 bg-slate-700 rounded text-xs text-slate-300">
                            Ends: {new Date(sprint.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex flex-col items-center bg-slate-900/50 px-3 py-1 rounded border border-slate-700/50">
                            <span className="text-xl font-mono font-bold text-white leading-none">{daysRemaining}</span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider">Days Left</span>
                        </div>
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
