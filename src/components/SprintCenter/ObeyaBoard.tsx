import React, { useState } from 'react';
import { Project, UserStory } from '../../../types';

interface ObeyaBoardProps {
    project: Project;
    onUpdate: (project: Project) => Promise<void> | void;
}

const ObeyaBoard: React.FC<ObeyaBoardProps> = ({ project, onUpdate }) => {
    // Helper to get all stories currently in the sprint
    const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];
    const [isUpdating, setIsUpdating] = useState(false);
    const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null);

    const columns = [
        { id: 'todo', title: 'To Do', color: 'border-slate-500', limit: 10 },
        { id: 'In Progress', title: 'In Progress', color: 'border-blue-500', limit: 3 }, // Fixed ID to match DB
        { id: 'Testing', title: 'Testing', color: 'border-purple-500', limit: 2 }, // Fixed ID to match DB
        { id: 'done', title: 'Done', color: 'border-emerald-500', limit: 0 }
    ];

    const getStoriesByStatus = (status: string) => {
        return sprintStories.filter(s => s.status === status);
    };

    const handleDragStart = (e: React.DragEvent, storyId: string) => {
        e.dataTransfer.setData('storyId', storyId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedStoryId(storyId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        e.stopPropagation();
        const storyId = e.dataTransfer.getData('storyId');
        setDraggedStoryId(null);

        if (!storyId) return;

        // Prevent update if status hasn't changed
        const currentStory = sprintStories.find(s => s.id === storyId);
        if (currentStory && currentStory.status === newStatus) return;

        // CHECK WIP LIMITS
        const targetColumn = columns.find(c => c.id === newStatus);
        const currentStoriesInTarget = getStoriesByStatus(newStatus);

        if (targetColumn && targetColumn.limit && targetColumn.limit > 0) {
            if (currentStoriesInTarget.length >= targetColumn.limit) {
                alert(`✋ WIP Limit Reached for ${targetColumn.title}!\n\nThis column is full (${currentStoriesInTarget.length}/${targetColumn.limit}).\nFinish something before starting new work!`);
                return;
            }
        }

        setIsUpdating(true);

        try {
            // Create a deep copy of the project to update state immutably
            const newProject = JSON.parse(JSON.stringify(project)) as Project;
            let storyFound = false;

            // Find and update the story in the nested structure
            if (newProject.phases.backlog?.epics) {
                for (const epic of newProject.phases.backlog.epics) {
                    const story = epic.stories.find(s => s.id === storyId);
                    if (story) {
                        story.status = newStatus as any;
                        // If moving to done, set completedAt
                        if (newStatus === 'done' && !story.completedAt) {
                            story.completedAt = Date.now();
                        } else if (newStatus !== 'done') {
                            story.completedAt = undefined;
                        }
                        storyFound = true;
                        break; // Stop finding once found
                    }
                }
            }

            if (storyFound) {
                await onUpdate(newProject);
            } else {
                console.error("Story not found in project structure");
            }
        } catch (error) {
            console.error("Failed to update story status:", error);
            alert("❌ Failed to move card. Database update failed. Please try again.");
            // UI will naturally revert since we didn't change local state that overrides props
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="h-full overflow-x-auto p-6 relative">
            {isUpdating && (
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-xl pointer-events-none">
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg border border-slate-700 font-medium animate-pulse">
                        Updating Status...
                    </div>
                </div>
            )}

            <div className="flex h-full gap-6 min-w-[1000px]">
                {columns.map(col => (
                    <div
                        key={col.id}
                        className={`flex-1 flex flex-col min-w-[250px] bg-slate-800/20 rounded-xl backdrop-blur-sm border transition-colors ${draggedStoryId ? 'border-blue-500/30 bg-slate-800/30' : 'border-slate-700/30'
                            }`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        {/* Column Header */}
                        <div className={`p-4 border-b-2 ${col.color} bg-slate-800/50 rounded-t-xl`}>
                            <h3 className="font-semibold text-slate-200 flex justify-between items-center">
                                {col.title}
                                <div className="flex items-center gap-2">
                                    {col.limit > 0 && (
                                        <span className={`text-xs font-mono font-bold ${getStoriesByStatus(col.id).length >= col.limit ? 'text-red-400' : 'text-slate-500'}`}>
                                            MAX {col.limit}
                                        </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${col.limit > 0 && getStoriesByStatus(col.id).length >= col.limit
                                        ? 'bg-red-900/50 text-red-200 border border-red-500/50'
                                        : 'bg-slate-700 text-slate-400'
                                        }`}>
                                        {getStoriesByStatus(col.id).length}
                                    </span>
                                </div>
                            </h3>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-3">
                            {getStoriesByStatus(col.id).map(story => (
                                <div
                                    key={story.id}
                                    className={`bg-slate-700/80 p-4 rounded-lg shadow-lg border border-slate-600/50 hover:border-slate-500 transition-all cursor-grab active:cursor-grabbing group hover:shadow-xl hover:-translate-y-1 ${isUpdating ? 'opacity-50 pointer-events-none' : ''
                                        }`}
                                    draggable={!isUpdating}
                                    onDragStart={(e) => handleDragStart(e, story.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-slate-400">#{story.id.slice(0, 4)}</span>
                                        <div className="flex gap-1">
                                            {/* Circle Avatar Placeholders */}
                                            {story.assigneeIds?.map((_, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-indigo-500 border border-slate-600 flex items-center justify-center text-[8px] text-white">
                                                    {_?.[0]?.toUpperCase()}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <h4 className="text-slate-100 font-medium text-sm mb-3 leading-snug select-none">{story.title}</h4>

                                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-600/50 pt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300">{story.estimatedHours}h Total</span>
                                            {story.businessValue && (
                                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300">BV: {story.businessValue}</span>
                                            )}
                                        </div>

                                        <div className="font-mono text-slate-300">
                                            {story.status === 'done' ? '0h' : `${story.estimatedHours}h left`}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {getStoriesByStatus(col.id).length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-20 pointer-events-none">
                                    <div className="text-4xl font-bold text-slate-600 rotate-90 transform">EMPTY</div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ObeyaBoard;
