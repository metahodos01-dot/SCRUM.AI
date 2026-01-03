import React from 'react';
import { Project, UserStory } from '../../../types';

interface PlanningEngineProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

const PlanningEngine: React.FC<PlanningEngineProps> = ({ project, onUpdate }) => {
    // Placeholder for drag and drop logic
    // In a real implementation, we would use dnd-kit or react-beautiful-dnd

    const backlogStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => !s.isInSprint) || [];
    const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];

    const totalCapacity = 400; // Mock capacity for now
    const committedHours = sprintStories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);

    const handleDragToSprint = (story: UserStory) => {
        // Logic to move story to sprint would go here
        console.log(`Moved ${story.title} to sprint`);
    };

    return (
        <div className="flex h-full p-6 gap-6">
            {/* MVP Backlog List */}
            <div className="w-1/2 flex flex-col">
                <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Product Backlog
                </h2>
                <div className="flex-1 bg-slate-800/40 rounded-lg p-4 overflow-y-auto border border-slate-700/50">
                    {backlogStories.map(story => (
                        <div key={story.id} className="bg-slate-700/30 p-3 mb-2 rounded border border-slate-600/30 hover:bg-slate-700/50 cursor-grab active:cursor-grabbing transition-colors group">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium text-slate-200 group-hover:text-white">{story.title}</h3>
                                <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400">{story.estimatedHours}h</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs text-slate-500 bg-slate-800/50 px-1 rounded">SP: {story.storyPoints}</span>
                                {story.businessValue && <span className="text-xs text-emerald-500/80 bg-emerald-900/20 px-1 rounded">BV: {story.businessValue}</span>}
                            </div>
                        </div>
                    ))}
                    {backlogStories.length === 0 && <p className="text-slate-500 text-center mt-10">No eligible stories in backlog.</p>}
                </div>
            </div>

            {/* Sprint Planning Zone */}
            <div className="w-1/2 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Current Sprint
                    </h2>
                    <div className="text-right">
                        <div className="text-sm text-slate-400">Capacity</div>
                        <div className={`font-mono font-bold ${committedHours > totalCapacity ? 'text-red-400' : 'text-emerald-400'}`}>
                            {committedHours} / {totalCapacity} h
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-slate-800/40 rounded-lg p-4 overflow-y-auto border border-slate-700/50 relative">
                    {/* Background capacity indicator */}
                    <div className="absolute inset-x-0 bottom-0 bg-slate-700/10 h-2">
                        <div
                            className={`h-full transition-all duration-500 ${committedHours > totalCapacity ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, (committedHours / totalCapacity) * 100)}%` }}
                        />
                    </div>

                    {sprintStories.map(story => (
                        <div key={story.id} className="bg-slate-700/50 p-3 mb-2 rounded border border-slate-600/50 hover:bg-slate-700 cursor-grab">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium text-slate-100">{story.title}</h3>
                                <span className="bg-emerald-900/30 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-900/50">{story.estimatedHours}h</span>
                            </div>
                            {/* Skill Check Simulation */}
                            {story.estimatedHours > 20 && (
                                <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                                    <span>⚠️ High effort needed. Check senior availability.</span>
                                </div>
                            )}
                        </div>
                    ))}
                    {sprintStories.length === 0 && <p className="text-slate-500 text-center mt-10 border-2 border-dashed border-slate-700 p-8 rounded-lg">Drag User Stories here to plan the sprint.</p>}
                </div>
            </div>
        </div>
    );
};

export default PlanningEngine;
