
// MonitoringHub.tsx - V3 (Problem Solving & Retrospective)
import React, { useMemo, useState, useEffect } from 'react';
import { Project } from '../../../types';
import { detectImpediments } from '../../utils/aiImpedimentDetector';

interface MonitoringHubProps {
    project: Project;
    onUpdate: (project: Project) => void;
}

const CLASSIC_IMPEDIMENTS = [
    { id: 'imp-stakeholder', label: 'Mancanza Stakeholder' },
    { id: 'imp-tech-debt', label: 'Debito Tecnico Eccessivo' },
    { id: 'imp-ambiguous', label: 'Requisiti Ambigui' },
    { id: 'imp-wip', label: 'Sovraccarico / WIP Alto' },
    { id: 'imp-env', label: 'Problemi Ambiente/Tools' },
    { id: 'imp-skills', label: 'Skill Gap / Knowledge' }
];

const MonitoringHub: React.FC<MonitoringHubProps> = ({ project, onUpdate }) => {
    // State for Retro Inputs (Local state before saving)
    const [retroInput, setRetroInput] = useState<{ good: string, bad: string, action: string }>({ good: '', bad: '', action: '' });

    // AI Detection
    const alerts = useMemo(() => detectImpediments(project), [project]);
    const sprint = project.phases.sprint;

    // Manual Impediments
    const activeManualIds = sprint?.activeManualImpediments || [];

    // Auto-persist logic (kept from previous phase)
    useEffect(() => {
        if (!project.phases.sprint?.isActive) return;
        const currentAlerts = project.phases.sprint.aiAlerts || [];
        const newAlerts = alerts.filter(a => !currentAlerts.find(ca => ca.id === a.id));
        if (newAlerts.length > 0) {
            const updatedProject = JSON.parse(JSON.stringify(project));
            if (!updatedProject.phases.sprint.aiAlerts) updatedProject.phases.sprint.aiAlerts = [];
            newAlerts.forEach(na => updatedProject.phases.sprint.aiAlerts.push(na));
            onUpdate(updatedProject);
        }
    }, [alerts, project.phases.sprint?.aiAlerts]);

    // --- HANDLERS ---

    const toggleManualImpediment = (id: string) => {
        const newProject = JSON.parse(JSON.stringify(project));
        const current = newProject.phases.sprint.activeManualImpediments || [];
        if (current.includes(id)) {
            newProject.phases.sprint.activeManualImpediments = current.filter((i: string) => i !== id);
        } else {
            if (!newProject.phases.sprint.activeManualImpediments) newProject.phases.sprint.activeManualImpediments = [];
            newProject.phases.sprint.activeManualImpediments.push(id);
        }
        onUpdate(newProject);
    };

    const addRetroItem = (type: 'good' | 'bad' | 'actions') => {
        const text = type === 'good' ? retroInput.good : type === 'bad' ? retroInput.bad : retroInput.action;
        if (!text.trim()) return;

        const newProject = JSON.parse(JSON.stringify(project));
        if (!newProject.phases.sprint.retrospective) {
            newProject.phases.sprint.retrospective = { good: [], bad: [], actions: [] };
        }
        newProject.phases.sprint.retrospective[type].push(text);
        onUpdate(newProject);
        setRetroInput({ ...retroInput, [type === 'good' ? 'good' : type === 'bad' ? 'bad' : 'action']: '' });
    };

    const removeRetroItem = (type: 'good' | 'bad' | 'actions', index: number) => {
        const newProject = JSON.parse(JSON.stringify(project));
        newProject.phases.sprint.retrospective[type].splice(index, 1);
        onUpdate(newProject);
    };

    return (
        <div className="h-full p-6 flex gap-6 overflow-hidden">
            {/* MAIN AREA: Impediment Library & Retrospective */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">

                {/* 1. Impediment Tracker */}
                <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50">
                    <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                        <span>🛑</span> Impediment Library
                    </h2>

                    {/* Library Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {CLASSIC_IMPEDIMENTS.map(imp => {
                            const isActive = activeManualIds.includes(imp.id);
                            return (
                                <button
                                    key={imp.id}
                                    onClick={() => toggleManualImpediment(imp.id)}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-between ${isActive
                                        ? 'bg-red-900/40 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    <span>{imp.label}</span>
                                    {isActive && <span>✓</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Tracker */}
                    {activeManualIds.length > 0 && (
                        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-4">
                            <h3 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Active Tracker</h3>
                            <ul className="list-disc list-inside text-sm text-slate-300">
                                {activeManualIds.map(id => (
                                    <li key={id}>{CLASSIC_IMPEDIMENTS.find(i => i.id === id)?.label}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 2. Retrospective Board */}
                <div className="flex-1 bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 min-h-[400px]">
                    <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                        <span>🔄</span> Agile Retrospective
                    </h2>

                    <div className="grid grid-cols-3 gap-4 h-full">
                        {/* Good Column */}
                        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4 flex flex-col">
                            <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">🚀 What went well?</h3>
                            <div className="flex-1 space-y-2 mb-3">
                                {project.phases.sprint?.retrospective?.good?.map((item: string, i: number) => (
                                    <div key={i} className="bg-emerald-900/30 p-2 rounded text-sm text-emerald-100 flex justify-between group">
                                        {item}
                                        <button onClick={() => removeRetroItem('good', i)} className="opacity-0 group-hover:opacity-100 text-emerald-500 hover:text-emerald-300">×</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={retroInput.good}
                                    onChange={e => setRetroInput({ ...retroInput, good: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && addRetroItem('good')}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                    placeholder="Add item..."
                                />
                                <button onClick={() => addRetroItem('good')} className="bg-emerald-600 text-white px-3 rounded text-lg">+</button>
                            </div>
                        </div>

                        {/* Bad Column */}
                        <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 flex flex-col">
                            <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">⚓ What didn't go well?</h3>
                            <div className="flex-1 space-y-2 mb-3">
                                {project.phases.sprint?.retrospective?.bad?.map((item: string, i: number) => (
                                    <div key={i} className="bg-red-900/30 p-2 rounded text-sm text-red-100 flex justify-between group">
                                        {item}
                                        <button onClick={() => removeRetroItem('bad', i)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-300">×</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={retroInput.bad}
                                    onChange={e => setRetroInput({ ...retroInput, bad: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && addRetroItem('bad')}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                    placeholder="Add item..."
                                />
                                <button onClick={() => addRetroItem('bad')} className="bg-red-600 text-white px-3 rounded text-lg">+</button>
                            </div>
                        </div>

                        {/* Actions Column */}
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 flex flex-col">
                            <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">⚡ Action Items</h3>
                            <div className="flex-1 space-y-2 mb-3">
                                {project.phases.sprint?.retrospective?.actions?.map((item: string, i: number) => (
                                    <div key={i} className="bg-blue-900/30 p-2 rounded text-sm text-blue-100 flex justify-between group">
                                        {item}
                                        <button onClick={() => removeRetroItem('actions', i)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-300">×</button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={retroInput.action}
                                    onChange={e => setRetroInput({ ...retroInput, action: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && addRetroItem('actions')}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                                    placeholder="Add item..."
                                />
                                <button onClick={() => addRetroItem('actions')} className="bg-blue-600 text-white px-3 rounded text-lg">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI SIDEBAR (Existing Logic) */}
            <div className="w-80 flex flex-col gap-4">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 h-full overflow-y-auto">
                    <h3 className="font-semibold text-indigo-400 mb-4 flex items-center justify-between sticky top-0 bg-slate-900/80 backdrop-blur py-2 z-10">
                        <span className="flex items-center gap-2"><span className="animate-pulse">🤖</span> AI Pulse</span>
                        <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">
                            {alerts.filter(a => a.status !== 'resolved').length} Active
                        </span>
                    </h3>

                    <div className="space-y-3">
                        {alerts.filter(a => a.status !== 'resolved').length === 0 && (
                            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-6 text-center">
                                <div className="text-4xl mb-3 opacity-80">🛡️</div>
                                <p className="text-emerald-400 text-sm font-bold">Flow Healthy</p>
                            </div>
                        )}
                        {alerts.map(alert => {
                            if (alert.status === 'resolved') return null;
                            const durationHrs = Math.round((Date.now() - alert.detectedAt) / (1000 * 60 * 60));
                            return (
                                <div key={alert.id} className={`rounded-lg p-3 border ${alert.severity === 'high' ? 'bg-red-900/10 border-red-500/50' : 'bg-amber-900/10 border-amber-500/50'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-xs ${alert.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{alert.message}</h4>
                                        <span className="text-[9px] text-slate-500">{durationHrs}h</span>
                                    </div>
                                    <p className="text-slate-300 text-[10px] mb-2">{alert.description}</p>
                                    <button
                                        onClick={() => {
                                            const newProject = JSON.parse(JSON.stringify(project));
                                            if (!newProject.phases.sprint.aiAlerts) newProject.phases.sprint.aiAlerts = [];
                                            const idx = newProject.phases.sprint.aiAlerts.findIndex((a: any) => a.id === alert.id);
                                            if (idx >= 0) newProject.phases.sprint.aiAlerts[idx].status = 'resolved';
                                            else newProject.phases.sprint.aiAlerts.push({ ...alert, status: 'resolved' });
                                            onUpdate(newProject);
                                        }}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] py-1 rounded border border-slate-700 transition-colors"
                                    >
                                        Mark Resolved
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringHub;
