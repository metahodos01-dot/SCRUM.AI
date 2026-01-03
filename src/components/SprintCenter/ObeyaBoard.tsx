import React from 'react';
import { Project, UserStory } from '../../../types';

interface ObeyaBoardProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

const ObeyaBoard: React.FC<ObeyaBoardProps> = ({ project }) => {
    const sprintStories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];

    const columns = [
        { id: 'todo', title: 'To Do', color: 'border-slate-500' },
        { id: 'doing', title: 'In Progress', color: 'border-blue-500' },
        { id: 'testing', title: 'Testing', color: 'border-purple-500' }, // Added Testing column
        { id: 'done', title: 'Done', color: 'border-emerald-500' }
    ];

    const getStoriesByStatus = (status: string) => {
        return sprintStories.filter(s => s.status === status);
    };

    return (
        <div className="h-full overflow-x-auto p-6">
            <div className="flex h-full gap-6 min-w-[1000px]">
                {columns.map(col => (
                    <div key={col.id} className="flex-1 flex flex-col min-w-[250px] bg-slate-800/20 rounded-xl backdrop-blur-sm border border-slate-700/30">
                        {/* Column Header */}
                        <div className={`p-4 border-b-2 ${col.color} bg-slate-800/50 rounded-t-xl`}>
                            <h3 className="font-semibold text-slate-200 flex justify-between items-center">
                                {col.title}
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-400">
                                    {getStoriesByStatus(col.id).length}
                                </span>
                            </h3>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-3">
                            {getStoriesByStatus(col.id).map(story => (
                                <div key={story.id} className="bg-slate-700/80 p-4 rounded-lg shadow-lg border border-slate-600/50 hover:border-slate-500 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-slate-400">#{story.id.slice(0, 4)}</span>
                                        <div className="flex gap-1">
                                            {/* Circle Avatar Placeholders */}
                                            {story.assigneeIds?.map((_, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-indigo-500 border border-slate-600" />
                                            ))}
                                        </div>
                                    </div>

                                    <h4 className="text-slate-100 font-medium text-sm mb-3 leading-snug">{story.title}</h4>

                                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-600/50 pt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300">{story.estimatedHours}h Total</span>
                                        </div>

                                        {/* Remaining Hours (Mock logic for now) */}
                                        <div className="font-mono text-slate-300">
                                            {story.status === 'done' ? '0h' : `${story.estimatedHours}h left`}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {getStoriesByStatus(col.id).length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-20">
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
