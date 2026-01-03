import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { Project } from '../types';
import { VoiceAssistant } from './VoiceAssistant';

interface LayoutProps {
  children: React.ReactNode;
  currentProject: Project | null;
}

const PHASES = [
  { id: 'mindset', label: '1. Mindset Agile', icon: '🧠' },
  { id: 'vision', label: '2. Product Vision', icon: '👁️' },
  { id: 'objectives', label: '3. Objectives', icon: '🎯' },
  { id: 'kpis', label: '4. KPI & Target', icon: '📊' },
  { id: 'backlog', label: '5. Backlog', icon: '📋' },
  { id: 'team', label: '6. Team', icon: '👥' },
  { id: 'estimates', label: '7. Estimates', icon: '🔢' },
  { id: 'roadmap', label: '8. Roadmap', icon: '🗺️' },
  { id: 'sprint', label: '9. Sprint', icon: '🏃' },
  { id: 'stats', label: '10. Statistics', icon: '📈' },
  { id: 'obeya', label: '11. Obeya Room', icon: '🏛️' },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentProject }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const currentPhaseId = location.pathname.split('/').pop();

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-white flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-accent uppercase">Scrum AI</h1>
          <p className="text-xs text-gray-400 mt-1">Copilot Manager</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {currentProject ? (
             <ul className="space-y-1">
             {PHASES.map((phase) => {
               const isActive = currentPhaseId === phase.id;
               return (
                 <li key={phase.id}>
                   <button
                     onClick={() => navigate(`/project/${currentProject.id}/${phase.id}`)}
                     className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                       isActive 
                         ? 'bg-accent/10 text-accent border-r-4 border-accent' 
                         : 'text-gray-300 hover:bg-white/5 hover:text-white'
                     }`}
                   >
                     <span className="mr-3">{phase.icon}</span>
                     {phase.label}
                   </button>
                 </li>
               );
             })}
           </ul>
          ) : (
            <div className="px-6 text-sm text-gray-500">Select a project to view phases.</div>
          )}
        </nav>

        <div className="p-4 bg-[#252933]">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                {auth.currentUser?.email?.[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate text-white">{auth.currentUser?.email}</p>
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white">Sign Out</button>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center">
             <button onClick={() => navigate('/projects')} className="mr-4 text-gray-500 hover:text-sidebar">
               ← Projects
             </button>
             {currentProject && (
               <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-gray-800">{currentProject.name}</h2>
                 <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                   currentProject.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                 }`}>
                   {currentProject.status}
                 </span>
               </div>
             )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sprint Timer Placeholder */}
             {location.pathname.includes('sprint') && (
               <div className="font-mono text-xl font-bold text-accent bg-accent/10 px-3 py-1 rounded-lg">
                 12:00:00
               </div>
             )}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto pb-20">
             {children}
          </div>
        </div>

        {/* Voice Assistant Overlay */}
        <VoiceAssistant />
      </main>
    </div>
  );
};