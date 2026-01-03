import React, { useState } from 'react';
import { Project, UserStory } from '../../../types';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

interface PlanningEngineProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

// --- Draggable Story Component ---
const DraggableStory: React.FC<{ story: UserStory }> = ({ story }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: story.id,
        data: { story }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`bg-slate-700/30 p-3 mb-2 rounded border border-slate-600/30 hover:bg-slate-700/50 cursor-grab active:cursor-grabbing transition-colors group ${isDragging ? 'opacity-50 ring-2 ring-indigo-500' : ''}`}
        >
            <div className="flex justify-between items-start pointer-events-none"> {/* Disable events on children to ensure drag handle works smoothly on card */}
                <h3 className="font-medium text-slate-200 group-hover:text-white text-sm">{story.title}</h3>
                <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400 shrink-0 ml-2">{story.estimatedHours}h</span>
            </div>
            <div className="flex gap-2 mt-2 pointer-events-none">
                <span className="text-xs text-slate-500 bg-slate-800/50 px-1 rounded">SP: {story.storyPoints}</span>
                {story.businessValue && <span className="text-xs text-emerald-500/80 bg-emerald-900/20 px-1 rounded">BV: {story.businessValue}</span>}
            </div>
            {story.estimatedHours > 20 && (
                <div className="mt-2 text-xs text-amber-400 flex items-center gap-1 pointer-events-none">
                    <span>⚠️ High effort</span>
                </div>
            )}
        </div>
    );
};

// --- Droppable Container Component ---
const DroppableContainer = ({ id, children, className, title, iconClass, count, capacityInfo }: any) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${iconClass}`}></span>
                    {title} <span className="text-sm text-slate-500 ml-2">({count})</span>
                </span>
                {capacityInfo}
            </h2>
            <div
                ref={setNodeRef}
                className={`flex-1 bg-slate-800/40 rounded-lg p-4 overflow-y-auto border transition-colors ${isOver ? 'border-accent bg-slate-800/60' : 'border-slate-700/50'}`}
            >
                {children}
            </div>
        </div>
    );
};

const PlanningEngine: React.FC<PlanningEngineProps> = ({ project, onUpdate }) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeStory, setActiveStory] = useState<UserStory | null>(null);

    const backlogStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => !s.isInSprint) || [];
    const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];

    const totalCapacity = 400; // Mock capacity for now
    const committedHours = sprintStories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    const handleDragStart = (event: any) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveStory(active.data.current?.story);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveStory(null);

        if (!over) return;

        const storyId = active.id as string;
        const containerId = over.id as string;

        // Find the story in the epics structure
        const epics = [...(project.phases.backlog?.epics || [])];
        let found = false;

        // Optimized update: We strictly check if the container implies a state change
        // If dropped in 'sprint' container -> isInSprint = true
        // If dropped in 'backlog' container -> isInSprint = false
        // If dropped within same container, we do nothing for now (no reordering implemented yet)

        let targetState: boolean | null = null;
        if (containerId === 'sprint' && !sprintStories.find(s => s.id === storyId)) targetState = true;
        if (containerId === 'backlog' && !backlogStories.find(s => s.id === storyId)) targetState = false;

        if (targetState === null) return; // No change needed

        const newEpics = epics.map(epic => ({
            ...epic,
            stories: epic.stories.map(story => {
                if (story.id === storyId) {
                    found = true;
                    return { ...story, isInSprint: targetState! };
                }
                return story;
            })
        }));

        if (found) {
            onUpdate({
                ...project,
                phases: {
                    ...project.phases,
                    backlog: { ...project.phases.backlog, epics: newEpics }
                }
            });
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full p-6 gap-6">
                {/* Backlog Zone */}
                <div className="w-1/2">
                    <DroppableContainer
                        id="backlog"
                        title="Product Backlog"
                        iconClass="bg-indigo-500"
                        count={backlogStories.length}
                    >
                        {backlogStories.map(story => (
                            <DraggableStory key={story.id} story={story} />
                        ))}
                        {backlogStories.length === 0 && (
                            <p className="text-slate-500 text-center mt-10">No eligible stories in backlog.</p>
                        )}
                    </DroppableContainer>
                </div>

                {/* Sprint Zone */}
                <div className="w-1/2">
                    <DroppableContainer
                        id="sprint"
                        title="Current Sprint"
                        iconClass="bg-emerald-500"
                        count={sprintStories.length}
                        capacityInfo={(
                            <div className="text-right">
                                <div className="text-sm text-slate-400">Capacity</div>
                                <div className={`font-mono font-bold ${committedHours > totalCapacity ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {committedHours} / {totalCapacity} h
                                </div>
                            </div>
                        )}
                    >
                        <div className="mb-4 bg-slate-700/10 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${committedHours > totalCapacity ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (committedHours / totalCapacity) * 100)}%` }}
                            />
                        </div>

                        {sprintStories.map(story => (
                            <DraggableStory key={story.id} story={story} />
                        ))}
                        {sprintStories.length === 0 && (
                            <p className="text-slate-500 text-center mt-10 border-2 border-dashed border-slate-700 p-8 rounded-lg">
                                Drag User Stories here to plan the sprint.
                            </p>
                        )}
                    </DroppableContainer>
                </div>

                <DragOverlay>
                    {activeStory ? (
                        <div className="bg-slate-700 p-3 rounded border border-accent shadow-2xl opacity-90 w-[400px]">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium text-white text-sm">{activeStory.title}</h3>
                                <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-400 shrink-0 ml-2">{activeStory.estimatedHours}h</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default PlanningEngine;
