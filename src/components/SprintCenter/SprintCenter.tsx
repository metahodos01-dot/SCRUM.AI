import React, { useState } from 'react';
import { Project } from '../../../types';
import PlanningEngine from './PlanningEngine';
import ObeyaBoard from './ObeyaBoard';
import MonitoringHub from './MonitoringHub';
import InsightsDashboard from './InsightsDashboard';

interface SprintCenterProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

type Tab = 'planning' | 'obeya' | 'monitoring' | 'insights';

const SprintCenter: React.FC<SprintCenterProps> = ({ project, onUpdateProject }) => {
    const [activeTab, setActiveTab] = useState<Tab>('obeya');

    const renderContent = () => {
        switch (activeTab) {
            case 'planning':
                return <PlanningEngine project={project} onUpdate={onUpdateProject} />;
            case 'obeya':
                return <ObeyaBoard project={project} onUpdate={onUpdateProject} />;
            case 'monitoring':
                return <MonitoringHub project={project} />;
            case 'insights':
                return <InsightsDashboard project={project} />;
            default:
                return <ObeyaBoard project={project} onUpdate={onUpdateProject} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-hidden">
            {/* Header & Navigation */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Sprint Center</h1>
                    <p className="text-slate-400 text-sm">Manage the heartbeat of your agile process.</p>
                </div>

                <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                    {(['planning', 'obeya', 'monitoring', 'insights'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto rounded-xl bg-slate-800/20 border border-slate-700/30 backdrop-blur-md relative">
                {renderContent()}
            </div>
        </div>
    );
};

export default SprintCenter;
