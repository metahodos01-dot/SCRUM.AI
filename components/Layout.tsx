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
  { id: 'strategic-planner', label: '8. Strat. Planner', icon: '🏁' },
  { id: 'sprint', label: '9. Sprint', icon: '🏃' },
  { id: 'stats', label: '10. Statistics', icon: '📈' },
];

const SprintTimer = ({ currentProject }: { currentProject: Project | null }) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('--:--:--');

  React.useEffect(() => {
    if (!currentProject?.phases?.sprint?.endDate) return;

    const interval = setInterval(() => {
      const end = new Date(currentProject.phases.sprint!.endDate).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('SPRINT ENDED');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        days > 0
          ? `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [currentProject]);

  return (
    <div className="font-mono text-3xl font-bold text-accent flex flex-col items-end leading-none">
      <span>{timeLeft}</span>
      <span className="text-[10px] text-gray-400 font-sans tracking-wider uppercase">Sprint Remaining</span>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, currentProject }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const currentPhaseId = location.pathname.split('/').pop();

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar - 220px fixed width */}
      <aside className="w-[220px] bg-sidebar text-white flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-6">
          <h1 className="text-xl font-extrabold tracking-tight text-accent uppercase">Scrum AI</h1>
          <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold">Copilot Manager</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {currentProject ? (
            <ul className="space-y-1">
              {PHASES.map((phase) => {
                const isActive = currentPhaseId === phase.id;
                return (
                  <li key={phase.id}>
                    <button
                      onClick={() => navigate(`/project/${currentProject.id}/${phase.id}`)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-[12px] transition-all duration-200 ${isActive
                        ? 'bg-[#3B4252] text-white border-l-[3px] border-accent'
                        : 'text-gray-300 hover:bg-[#383E4D] hover:text-white'
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
            <div className="px-4 text-sm text-gray-500">Select a project to view phases.</div>
          )}
        </nav>

        <div className="p-4 bg-[#252933]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
              {auth.currentUser?.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate text-white">{auth.currentUser?.email}</p>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-accent transition-colors">Sign Out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border-light flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center">
            <button onClick={() => navigate('/projects')} className="mr-4 text-text-secondary hover:text-sidebar transition-colors font-medium">
              ← Projects
            </button>
            {currentProject && (
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-text-primary">{currentProject.name}</h2>
                <span className={`px-3 py-1 rounded-pill text-[11px] font-bold uppercase tracking-wide ${currentProject.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-accent/10 text-accent'
                  }`}>
                  {currentProject.status}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sprint Timer Placeholder */}
            {location.pathname.includes('sprint') && (
              <SprintTimer currentProject={currentProject} />
            )}
          </div>
        </header>

        {/* Scrollable Content Area - Max width 1200px, padding 32px */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1200px] mx-auto pb-20">
            {children}
          </div>
        </div>

        {/* Voice Assistant Overlay */}
        <VoiceAssistant />
      </main>
    </div >
  );
};