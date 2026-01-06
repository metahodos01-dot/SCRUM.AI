import React, { useState, useEffect } from 'react';
import { Project, UserStory } from '../../../types';
import { auth, db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ObeyaBoardProps {
    project: Project;
    onUpdate: (project: Project) => Promise<void> | void;
}

const ObeyaBoard: React.FC<ObeyaBoardProps> = ({ project, onUpdate }) => {
    // VISIBILITY FIX: Real-time Sprint Number
    const [sprintNumber, setSprintNumber] = useState<number | string>('...');

    useEffect(() => {
        const metaRef = doc(db, 'projects', project.id, 'metadata', 'sprint_config');
        const unsubscribe = onSnapshot(metaRef, (snapshot) => {
            if (snapshot.exists()) {
                setSprintNumber(snapshot.data().current_sprint_number);
            } else {
                // If doc doesn't exist yet, fallback to props but indicate uncertainty? 
                // Or just show 1 as fallback default
                setSprintNumber(project.phases.sprint?.number || 1);
            }
        });
        return () => unsubscribe();
    }, [project.id]);

    const current_sprint_number = sprintNumber;

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
                        if (newStatus.toLowerCase() === 'done' && !story.completedAt) {
                            story.completedAt = Date.now();
                        } else if (newStatus.toLowerCase() !== 'done') {
                            // FIREBASE FIX: Do not set to undefined, delete the key
                            delete story.completedAt;
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
        <div className="h-full flex flex-col pt-6 relative">
            <div className="text-2xl font-bold text-blue-500 mb-4 px-6 flex items-center justify-between">
                <h1>Sprint Attuale: #{current_sprint_number}</h1>
            </div>
            <div className="flex-1 overflow-x-auto px-6 pb-6 relative">
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

                                        {/* Footer with Avatar & Time */}
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                            {/* Member Selector */}
                                            <div className="flex items-center gap-1">
                                                <div className="flex -space-x-2 mr-2">
                                                    {(story.assignedTo || story.assigneeIds || []).map(mid => {
                                                        const member = project.phases.team?.members.find(m => m.id === mid);
                                                        return (
                                                            <div key={mid} className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-[8px] font-bold text-white shadow-sm" style={{ backgroundColor: member?.avatarColor || '#ccc' }} title={member?.name}>
                                                                {member?.name.charAt(0)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="relative group">
                                                    <button className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs transition-colors border border-gray-200">
                                                        +
                                                    </button>
                                                    {/* Simple Dropdown for Assignment */}
                                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-xl rounded-xl border border-gray-100 p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-2">Assign To:</p>
                                                        {project.phases.team?.members.map(m => (
                                                            <button
                                                                key={m.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const current = story.assignedTo || story.assigneeIds || [];
                                                                    const newAssigned = current.includes(m.id)
                                                                        ? current.filter(id => id !== m.id)
                                                                        : [...current, m.id];

                                                                    // Update Logic
                                                                    const updatedStories = project.phases.backlog!.epics.flatMap(e => e.stories).map(s => {
                                                                        if (s.id === story.id) return { ...s, assignedTo: newAssigned };
                                                                        return s;
                                                                    });

                                                                    // Deep Update Project
                                                                    const newProject = { ...project };
                                                                    newProject.phases.backlog!.epics.forEach(e => {
                                                                        e.stories = e.stories.map(s => {
                                                                            if (s.id === story.id) return { ...s, assignedTo: newAssigned };
                                                                            return s;
                                                                        });
                                                                    });
                                                                    onUpdate(newProject);
                                                                }}
                                                                className={`flex items-center gap-2 w-full p-2 rounded-lg text-xs hover:bg-gray-50 ${(story.assignedTo || []).includes(m.id) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
                                                            >
                                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: m.avatarColor }}></div>
                                                                {m.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Effort & Log Work */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                    {story.estimatedHours}h
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const hours = prompt("Log work hours (e.g., 2 or 4.5):");
                                                        if (hours && !isNaN(parseFloat(hours))) {
                                                            const h = parseFloat(hours);
                                                            const log = {
                                                                id: Date.now().toString(),
                                                                memberId: 'unknown', // TODO: Replace with actual auth.currentUser?.uid
                                                                hours: h,
                                                                date: Date.now(),
                                                                description: 'Logged via Kanban'
                                                            };

                                                            // Update Math
                                                            const newRemaining = Math.max(0, (story.estimatedHours || 0) - h);
                                                            const newLogs = [...(story.timeLogs || []), log];

                                                            // Apply Update
                                                            const newProject = { ...project };
                                                            newProject.phases.backlog!.epics.forEach(e => {
                                                                e.stories = e.stories.map(s => {
                                                                    if (s.id === story.id) {
                                                                        // Capture original estimate if missing
                                                                        const original = s.originalEstimate || s.estimatedHours + h; // simple fallback attempt
                                                                        return {
                                                                            ...s,
                                                                            estimatedHours: newRemaining,
                                                                            timeLogs: newLogs,
                                                                            originalEstimate: s.originalEstimate || ((s.estimatedHours + h) > s.estimatedHours ? (s.estimatedHours + h) : s.estimatedHours) // Ensure we don't shrink scope unintentionally if this is first log
                                                                        };
                                                                    }
                                                                    return s;
                                                                });
                                                            });
                                                            onUpdate(newProject);
                                                        }
                                                    }}
                                                    className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                    title="Log Work"
                                                >
                                                    ⏱️
                                                </button>
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
        </div>
    );
};

export default ObeyaBoard;
