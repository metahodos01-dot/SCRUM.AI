
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, onSnapshot, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Project, User, Epic, UserStory, TeamMember, Impediment, Risk, DailyStandup, ObeyaChecklist, SprintData } from './types';
import { Layout } from './components/Layout';
import { aiService } from './services/aiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, ReferenceLine, ComposedChart
} from 'recharts';

// --- Helpers ---
const ContextHeader = ({ title, content }: { title: string, content: string | React.ReactNode }) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-sm text-gray-600">
        <strong className="text-gray-800 uppercase text-xs tracking-wider block mb-1">{title}</strong>
        <div className="line-clamp-3">{content || <span className="italic text-gray-400">Not defined yet.</span>}</div>
    </div>
);

// --- Landing & Auth Components (Kept as requested) ---

const LandingPage = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header / Nav */}
      <header className="fixed w-full bg-white/90 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-center relative">
           <div className="text-center">
              <div className="flex justify-center gap-1 mb-1">
                 <div className="w-2 h-2 rounded-full bg-[#FF5A6E]"></div>
                 <div className="w-2 h-2 rounded-full bg-[#FF9B5A]"></div>
                 <div className="w-2 h-2 rounded-full bg-[#2E3340]"></div>
              </div>
              <h1 className="text-sm tracking-[0.3em] font-medium text-gray-800">METÀ HODÒS</h1>
              <p className="text-[0.5rem] tracking-[0.4em] text-gray-400 uppercase mt-1">Persone • Agilità • Risultati</p>
           </div>
           <button 
             onClick={() => user ? navigate('/projects') : navigate('/login')}
             className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-600 hover:text-[#FF9B5A] transition uppercase"
           >
             {user ? 'Dashboard' : 'Login'}
           </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 text-center">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#2E3340] mb-6">
          Agile Academy.AI
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-2">
          L'evoluzione del mindset Agile potenziata dall'AI.
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          Il metodo scientifico applicato alle persone.
        </p>
        
        <div className="flex justify-center gap-4 items-center">
          <button 
            onClick={() => user ? navigate('/projects') : navigate('/login')}
            className="bg-[#FF9B5A] text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest shadow-lg hover:bg-[#FF8A3A] transition transform hover:scale-105 uppercase"
          >
            {user ? 'VAI ALLA DASHBOARD' : 'INIZIA ORA'}
          </button>
        </div>
      </section>

      {/* Vision Section (Dark) */}
      <section className="bg-[#2E3340] text-white py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div>
              <span className="text-[#FF9B5A] text-xs font-bold tracking-[0.2em] uppercase mb-4 block">La Nostra Visione</span>
              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                Rendere l'eccellenza strategica <span className="text-[#FF9B5A]">semplice</span>, umana e immediata.
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#383D4B] p-8 rounded-3xl hover:bg-[#404656] transition border border-gray-700">
                <div className="text-2xl mb-4">🤝</div>
                <h3 className="font-bold text-sm tracking-widest uppercase mb-2">Empatia Operativa</h3>
              </div>
               <div className="bg-[#383D4B] p-8 rounded-3xl hover:bg-[#404656] transition border border-gray-700">
                <div className="text-2xl mb-4">⚡</div>
                <h3 className="font-bold text-sm tracking-widest uppercase mb-2">Semplicità Radicale</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-white text-center">
         <p className="text-xs text-gray-400">© 2025 Meta Hodos. All rights reserved.</p>
      </footer>
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/projects');
    } catch (error) {
      alert((isRegistering ? "Registration failed: " : "Login failed: ") + (error as any).message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-sidebar">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 relative">
        <button onClick={() => navigate('/')} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">← Back</button>
        <h1 className="text-2xl font-extrabold text-sidebar mb-6 text-center mt-4">SCRUM AI MANAGER</h1>
        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-accent focus:border-accent text-gray-900 bg-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-accent focus:border-accent text-gray-900 bg-white" required />
          </div>
          <button type="submit" className="w-full bg-accent text-white py-2 rounded-xl font-bold hover:bg-opacity-90 transition">
            {isRegistering ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-gray-500 hover:text-accent font-medium underline">
                {isRegistering ? "Already have an account? Login" : "No account? Create one"}
            </button>
        </div>
      </div>
    </div>
  );
};

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [language, setLanguage] = useState<'it' | 'en'>('it');
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "projects")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      setProjects(p);
    });
    return () => unsubscribe();
  }, []);

  const createProject = async () => {
    if (!newProjectName) return;
    const newProject: Omit<Project, 'id'> = {
      name: newProjectName,
      description: '',
      language: language,
      createdBy: auth.currentUser!.uid,
      createdAt: Date.now(),
      status: 'draft',
      phases: {}
    };
    const docRef = await addDoc(collection(db, "projects"), newProject);
    setNewProjectName('');
    navigate(`/project/${docRef.id}/mindset`);
  };

  return (
    <div className="min-h-screen bg-bg p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-sidebar">YOUR PROJECTS</h1>
          <div className="flex gap-2 items-center">
             <select value={language} onChange={(e) => setLanguage(e.target.value as 'it' | 'en')} className="border border-gray-300 rounded-lg p-2 bg-white text-gray-800 font-bold">
                <option value="it">🇮🇹 ITA</option>
                <option value="en">🇬🇧 ENG</option>
             </select>
            <input type="text" placeholder="New Project Name" className="border border-gray-300 rounded-lg p-2 text-gray-900 bg-white" value={newProjectName} onChange={e => setNewProjectName(e.target.value)}/>
            <button onClick={createProject} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold">+ Create</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <div key={p.id} onClick={() => navigate(`/project/${p.id}/mindset`)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md cursor-pointer border border-gray-100 transition">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{p.name}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Phases Components ---

const PhaseMindset = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
  const [accepted, setAccepted] = useState(project.phases.mindset?.completed || false);
  const [tab, setTab] = useState<'mindset' | 'scrum' | 'coach'>('mindset');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleAskCoach = async () => {
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setChatHistory([...chatHistory, { role: 'user', text: q }]);
    setIsTyping(true);
    try {
      const answer = await aiService.askAgileCoach(q);
      setChatHistory(prev => [...prev, { role: 'ai', text: answer }]);
    } catch(e) { console.error(e); }
    setIsTyping(false);
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <h2 className="text-3xl font-extrabold text-sidebar">1. AGILE MINDSET & SCRUM FRAMEWORK</h2>
      <div className="flex gap-4 border-b border-gray-200 pb-1">
         <button onClick={() => setTab('mindset')} className={`pb-2 px-4 font-bold ${tab === 'mindset' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}>The Mindset Shift</button>
         <button onClick={() => setTab('scrum')} className={`pb-2 px-4 font-bold ${tab === 'scrum' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}>Scrum Framework</button>
         <button onClick={() => setTab('coach')} className={`pb-2 px-4 font-bold ${tab === 'coach' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}>🤖 AI Agile Coach</button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {tab === 'mindset' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-200 p-8 rounded-2xl opacity-70 grayscale transition hover:grayscale-0 hover:opacity-100">
                      <h3 className="text-xl font-bold text-gray-600 mb-4">🏭 Traditional (Waterfall)</h3>
                      <p className="text-sm text-gray-500 mb-4">Fixed scope, fixed timeline, command & control.</p>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-accent/20">
                      <h3 className="text-xl font-bold text-accent mb-4">🚀 Agile Mindset</h3>
                      <p className="text-sm text-gray-600 mb-4">Iterative, incremental, empirical. Embrace change.</p>
                  </div>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="w-5 h-5 text-accent rounded focus:ring-accent" />
                    <span className="font-medium text-gray-700">I acknowledge and accept the Agile principles</span>
                </label>
                <button onClick={() => onSave({ completed: accepted, comment: 'Accepted Agile Mindset' })} disabled={!accepted} className="bg-accent text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50">Mark as Complete</button>
              </div>
            </div>
          )}
          {tab === 'scrum' && (
              <div className="p-8 bg-white rounded-2xl shadow-sm">
                  <h3 className="text-2xl font-extrabold text-sidebar mb-6">The Scrum Framework</h3>
                  <p className="text-gray-600">Roles, Events, Artifacts explained.</p>
              </div>
          )}
          {tab === 'coach' && (
              <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                      {chatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-sidebar text-white' : 'bg-white border shadow-sm text-gray-800'}`}>{msg.text}</div>
                          </div>
                      ))}
                      {isTyping && <div className="text-xs text-gray-400 ml-2">Coach is typing...</div>}
                  </div>
                  <div className="p-4 bg-white border-t flex gap-2">
                      <input className="flex-1 border border-gray-300 rounded-xl px-4 py-2" placeholder="Type..." value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAskCoach()} />
                      <button onClick={handleAskCoach} className="bg-accent text-white px-4 py-2 rounded-xl font-bold">Send</button>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

const PhaseVision = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
  const [inputs, setInputs] = useState(project.phases.vision?.inputs || { name: project.name, target: '', problem: '', currentSolution: '', differentiation: '' });
  const [generatedVision, setGeneratedVision] = useState(project.phases.vision?.text || '');
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const text = await aiService.generateVision(inputs);
      setGeneratedVision(text);
    } catch (e) { alert("AI Error"); }
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-sidebar">2. PRODUCT VISION</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <input className="w-full border p-3 rounded-xl text-gray-800 bg-white" placeholder="Product Name" value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} />
          <input className="w-full border p-3 rounded-xl text-gray-800 bg-white" placeholder="Target Audience" value={inputs.target} onChange={e => setInputs({...inputs, target: e.target.value})} />
          <input className="w-full border p-3 rounded-xl text-gray-800 bg-white" placeholder="Problem to Solve" value={inputs.problem} onChange={e => setInputs({...inputs, problem: e.target.value})} />
          <input className="w-full border p-3 rounded-xl text-gray-800 bg-white" placeholder="Current Solution" value={inputs.currentSolution} onChange={e => setInputs({...inputs, currentSolution: e.target.value})} />
           <input className="w-full border p-3 rounded-xl text-gray-800 bg-white" placeholder="Differentiation" value={inputs.differentiation} onChange={e => setInputs({...inputs, differentiation: e.target.value})} />
          <button onClick={handleGenerate} disabled={loading} className="w-full bg-sidebar text-white py-3 rounded-xl font-bold">{loading ? 'Generating...' : '✨ Generate Vision'}</button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <textarea className="flex-1 border rounded-xl p-4 bg-gray-50 text-gray-800 min-h-[300px] font-sans" value={generatedVision} onChange={e => setGeneratedVision(e.target.value)} />
          <button onClick={() => onSave({ inputs, text: generatedVision })} className="mt-4 bg-accent text-white py-3 rounded-xl font-bold">Save & Continue</button>
        </div>
      </div>
    </div>
  );
};

const PhaseObjectives = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
  const [deadline, setDeadline] = useState(project.phases.objectives?.deadline || '');
  const [generatedObjectives, setGeneratedObjectives] = useState(project.phases.objectives?.text || '');
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    if (!project.phases.vision?.text) { alert("Complete Vision first."); return; }
    setLoading(true);
    try { const text = await aiService.generateObjectives(project.phases.vision.text, deadline); setGeneratedObjectives(text); } catch (e) { alert("AI Error"); }
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-sidebar">3. STRATEGIC OBJECTIVES</h2>
      <ContextHeader title="Product Vision Reference" content={<div dangerouslySetInnerHTML={{ __html: project.phases.vision?.text || '' }} />} />
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <label className="block text-sm font-bold text-gray-700">Project Deadline</label>
            <input type="date" className="w-full border p-3 rounded-xl text-gray-800 bg-white" value={deadline} onChange={e => setDeadline(e.target.value)} />
            <button onClick={handleGenerate} disabled={loading || !deadline} className="w-full bg-sidebar text-white py-3 rounded-xl font-bold disabled:opacity-50">{loading ? 'Generating...' : '✨ Generate Objectives'}</button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <textarea className="flex-1 border rounded-xl p-4 bg-gray-50 text-gray-800 min-h-[300px] font-sans" value={generatedObjectives} onChange={e => setGeneratedObjectives(e.target.value)} />
          <button onClick={() => onSave({ text: generatedObjectives, deadline })} className="mt-4 bg-accent text-white py-3 rounded-xl font-bold">Save & Continue</button>
        </div>
      </div>
    </div>
  );
};

const PhaseKPIs = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [kpis, setKpis] = useState<any[]>(project.phases.kpis?.table || []);
    const [loading, setLoading] = useState(false);
    const handleGenerate = async () => {
        if (!project.phases.objectives?.text) { alert("Complete Objectives first."); return; }
        setLoading(true);
        try { const result = await aiService.generateKPIs(project.phases.objectives.text); setKpis(result); } catch (e) { alert("AI Error"); }
        setLoading(false);
    };
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-sidebar">4. KEY PERFORMANCE INDICATORS</h2>
            <ContextHeader title="Strategic Objectives Reference" content={<div dangerouslySetInnerHTML={{ __html: project.phases.objectives?.text || '' }} />} />
            <div className="flex justify-end"><button onClick={handleGenerate} disabled={loading} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm">{loading ? 'Generating...' : '✨ Generate KPIs'}</button></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">KPI Name</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Target</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Metric</th></tr></thead><tbody className="divide-y divide-gray-100">{kpis.map((kpi, i) => (<tr key={i}><td className="px-6 py-4 text-gray-800">{kpi.kpi}</td><td className="px-6 py-4 text-gray-600">{kpi.target}</td><td className="px-6 py-4 text-gray-600">{kpi.metric}</td></tr>))}</tbody></table></div>
            {kpis.length > 0 && <button onClick={() => onSave({ table: kpis })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save KPIs</button>}
        </div>
    );
};

const PhaseBacklog = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
  const [epics, setEpics] = useState<Epic[]>(project.phases.backlog?.epics || []);
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await aiService.generateBacklog(project.phases.vision?.text || '', project.phases.objectives?.text || '');
      const newEpics = result.map((e: any, i: number) => ({ id: `epic-${Date.now()}-${i}`, title: e.title, stories: e.stories.map((s: any, j: number) => ({ id: `story-${Date.now()}-${i}-${j}`, title: s.title, description: s.description, acceptanceCriteria: s.acceptanceCriteria, storyPoints: 0, estimatedHours: 0, status: 'todo', isInSprint: false, assigneeIds: [] })) }));
      setEpics(newEpics);
    } catch (e) { alert("AI Error"); }
    setLoading(false);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-extrabold text-sidebar">5. PRODUCT BACKLOG</h2><button onClick={handleGenerate} disabled={loading} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm">{loading ? 'Generating...' : '✨ Generate Backlog'}</button></div>
      <ContextHeader title="KPIs & Objectives Reference" content={project.phases.kpis?.table?.map(k => `${k.kpi}: ${k.target}`).join(', ')} />
      <div className="space-y-4">{epics.map((epic, i) => (<div key={epic.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center"><span className="font-bold text-lg text-sidebar">{epic.title}</span><span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border">{epic.stories.length} Stories</span></div><div className="divide-y divide-gray-100">{epic.stories.map((story) => (<div key={story.id} className="p-6 hover:bg-gray-50 transition"><div className="flex justify-between items-start mb-2"><span className="font-bold text-gray-800">{story.title}</span><span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded shrink-0">SP: {story.storyPoints}</span></div><p className="text-sm text-gray-600 mb-3">{story.description}</p></div>))}</div></div>))}</div>
      {epics.length > 0 && <button onClick={() => onSave({ epics })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:bg-opacity-90">Save Backlog</button>}
    </div>
  );
};

const PhaseTeam = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [members, setMembers] = useState<TeamMember[]>(project.phases.team?.members || []);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: '', skills: '' });
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await aiService.generateTeamRecommendations(project.phases.vision?.text || '');
            const newMembers = result.map((r: any, i: number) => ({ id: `member-${Date.now()}-${i}`, name: `Candidate ${i+1}`, email: 'placeholder@email.com', role: r.role, skills: r.skills }));
            setMembers(prev => [...prev, ...newMembers]);
        } catch (e) { alert("AI Error"); }
        setLoading(false);
    };

    const addMember = () => {
        if (!newMember.name) return;
        const member: TeamMember = {
            id: `member-${Date.now()}`,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            skills: newMember.skills.split(',').map(s => s.trim())
        };
        setMembers([...members, member]);
        setNewMember({ name: '', email: '', role: '', skills: '' });
    };

    const removeMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-extrabold text-sidebar">6. AGILE TEAM</h2></div>
            <ContextHeader title="Backlog Summary" content={`${project.phases.backlog?.epics?.length || 0} Epics, ${project.phases.backlog?.epics?.reduce((acc, e) => acc + e.stories.length, 0) || 0} User Stories defined.`} />
            
            {/* Manual ADD Form */}
            <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-4">Add Team Member</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <input className="p-2 rounded border" placeholder="Name" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                    <input className="p-2 rounded border" placeholder="Email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                    <input className="p-2 rounded border" placeholder="Role (e.g. Developer)" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} />
                    <input className="p-2 rounded border" placeholder="Skills (comma separated)" value={newMember.skills} onChange={e => setNewMember({...newMember, skills: e.target.value})} />
                </div>
                <div className="flex justify-between">
                     <button onClick={addMember} className="bg-sidebar text-white px-4 py-2 rounded-lg font-bold">Add Member</button>
                     <button onClick={handleGenerate} disabled={loading} className="text-accent text-sm font-bold underline">{loading ? 'Thinking...' : '✨ Suggest Roles with AI'}</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{members.map(member => (
                <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative group">
                    <button onClick={() => removeMember(member.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold hidden group-hover:block">×</button>
                    <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-2xl bg-sidebar text-white">{member.name[0]}</div>
                    <h3 className="font-bold text-gray-800">{member.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{member.email}</p>
                    <p className="text-sm text-accent font-bold uppercase mb-2">{member.role}</p>
                    <div className="flex flex-wrap gap-1 justify-center">{member.skills.map(s => <span key={s} className="text-[10px] bg-gray-100 px-2 py-1 rounded">{s}</span>)}</div>
                </div>
            ))}</div>
            {members.length > 0 && <button onClick={() => onSave({ members })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Team</button>}
        </div>
    );
};

// --- PHASE 11: OBEYA ROOM (Moved before estimates in UI flow logic or accessed directly) ---
const PhaseObeya = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [checklist, setChecklist] = useState<ObeyaChecklist>(project.phases.obeya?.checklist || { visionBoard: false, roadmap: false, burndown: false, teamBoard: false, kpiDashboard: false, impediments: false });
    const [image, setImage] = useState<string | null>(project.phases.obeya?.roomImageUrl || null);
    const [layoutAnalysis, setLayoutAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const generateRendering = async () => {
        if (!image) return alert("Upload an image first");
        setLoading(true);
        try {
            // NOTE: Currently using text model to describe layout as image generation requires specific Imagen model setup not fully mocked here.
            // In a full prod env, this would return a new image URL.
            const result = await aiService.generateObeyaRendering(image.split(',')[1], checklist);
            setLayoutAnalysis(result);
            alert("AI Analysis Complete: See layout suggestions below.");
        } catch(e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
             <h2 className="text-3xl font-extrabold text-sidebar">11. OBEYA ROOM SETUP</h2>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-gray-700 mb-4">1. Checklist: Elements to Visualize</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {Object.keys(checklist).map(key => (
                         <label key={key} className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                             <input type="checkbox" checked={(checklist as any)[key]} onChange={e => setChecklist({...checklist, [key]: e.target.checked})} className="w-5 h-5 text-accent rounded focus:ring-accent" />
                             <span className="capitalize text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                         </label>
                     ))}
                 </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-gray-700 mb-4">2. Room Layout</h3>
                 {!image ? (
                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
                         <p className="text-gray-500 mb-4">Upload a photo of your physical room</p>
                         <input type="file" accept="image/*" onChange={handleImageUpload} />
                     </div>
                 ) : (
                     <div className="relative">
                         <img src={image} alt="Room" className="rounded-xl w-full max-h-96 object-cover" />
                         <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-white text-red-500 px-2 rounded shadow text-xs">Change</button>
                     </div>
                 )}
                 
                 <button onClick={generateRendering} disabled={loading || !image} className="mt-4 w-full bg-sidebar text-white py-3 rounded-xl font-bold">
                     {loading ? 'AI analyzing room layout...' : '✨ Generate Rendering / AI Layout Suggestion'}
                 </button>

                 {layoutAnalysis && (
                     <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                         <h4 className="font-bold text-yellow-800 mb-2">AI Layout Suggestion:</h4>
                         <p className="text-sm text-yellow-900">{layoutAnalysis.layoutDescription || JSON.stringify(layoutAnalysis)}</p>
                     </div>
                 )}
             </div>

             <button onClick={() => onSave({ checklist, roomImageUrl: image })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Obeya Setup</button>
        </div>
    )
}

const PhaseEstimates = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [localEpics, setLocalEpics] = useState<Epic[]>(project.phases.backlog?.epics || []);
  const allStories = localEpics.flatMap(e => e.stories);
  const handleEstimate = async () => {
    setLoading(true);
    try {
        const storiesToEstimate = allStories.filter(s => s.storyPoints === 0);
        if(storiesToEstimate.length === 0) { alert("No stories to estimate."); setLoading(false); return; }
        const estimates = await aiService.generateEstimates(storiesToEstimate);
        let estIndex = 0;
        const newEpics = localEpics.map(epic => ({ ...epic, stories: epic.stories.map(story => { if (story.storyPoints === 0 && estimates[estIndex]) { const est = estimates[estIndex]; estIndex++; return { ...story, storyPoints: est.storyPoints, estimatedHours: est.estimatedHours }; } return story; }) }));
        setLocalEpics(newEpics);
    } catch(e) { console.error(e); alert("AI Error"); }
    setLoading(false);
  };
  const saveEstimates = async () => {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, { "phases.backlog.epics": localEpics, "phases.estimates.processed": true });
      onSave({ processed: true });
      alert("Estimates saved!");
  };
  const totalPoints = allStories.reduce((acc, s) => acc + (s.storyPoints || 0), 0);
  const totalHours = allStories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
  return (
      <div className="space-y-6">
          <div className="flex justify-between items-center"><h2 className="text-3xl font-extrabold text-sidebar">7. ESTIMATIONS</h2><div className="text-right"><p className="text-2xl font-bold text-accent">{totalPoints} SP</p><p className="text-xs text-gray-500 font-bold uppercase">Total Hours: {totalHours}h</p></div></div>
          <ContextHeader title="Backlog to Estimate" content={`${allStories.length} User Stories loaded.`} />
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-h-96 overflow-y-auto mb-4">
             {allStories.map(s => (
                 <div key={s.id} className="p-4 border-b flex justify-between">
                     <span className="text-sm font-medium">{s.title}</span>
                     <span className="text-xs bg-gray-100 px-2 py-1 rounded">{s.storyPoints > 0 ? `${s.storyPoints} SP` : 'Not est.'}</span>
                 </div>
             ))}
          </div>

          <div className="flex gap-4"><button onClick={handleEstimate} disabled={loading} className="flex-1 bg-sidebar text-white py-4 rounded-xl font-bold">{loading ? 'AI Estimating...' : '✨ Generate Estimations'}</button><button onClick={saveEstimates} className="flex-1 bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Estimates</button></div>
      </div>
  )
}

const PhaseRoadmap = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [roadmap, setRoadmap] = useState<any[]>(project.phases.roadmap?.items || []);
    const [mvpDesc, setMvpDesc] = useState(project.phases.roadmap?.mvpDescription || '');
    const [sprintDuration, setSprintDuration] = useState(project.phases.roadmap?.sprintDuration || 2);
    const [availability, setAvailability] = useState<Record<string, number>>(project.phases.roadmap?.memberAvailability || {});
    const [loading, setLoading] = useState(false);
    
    const teamMembers = project.phases.team?.members || [];

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const epics = project.phases.backlog?.epics || [];
            if(epics.length === 0) { alert("Backlog empty."); return; }
            // Now passing MVP description, duration and availability to AI
            const result = await aiService.generateRoadmap(project.phases.vision?.text || '', epics, mvpDesc, sprintDuration, availability);
            setRoadmap(result);
        } catch(e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-extrabold text-sidebar">8. PRODUCT ROADMAP</h2></div>
            <ContextHeader title="Estimates Summary" content="Based on estimated Backlog from Phase 7." />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-700">Roadmap Configuration</h3>
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">MVP Definition (What is crucial?)</label>
                    <textarea 
                        className="w-full border p-3 rounded-xl text-sm" 
                        rows={3} 
                        placeholder="Describe the minimum feature set..." 
                        value={mvpDesc}
                        onChange={e => setMvpDesc(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sprint Duration</label>
                    <div className="flex gap-4">
                        {[1, 2, 4].map(w => (
                            <label key={w} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="sprintDuration" 
                                    checked={sprintDuration === w} 
                                    onChange={() => setSprintDuration(w)}
                                    className="text-accent focus:ring-accent"
                                />
                                <span className="text-sm">{w} Week{w > 1 ? 's' : ''}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Team Capacity (Hours/Sprint)</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {teamMembers.map(m => (
                             <div key={m.id}>
                                 <span className="text-xs text-gray-500 block">{m.name}</span>
                                 <input 
                                    type="number" 
                                    className="border p-2 rounded w-full text-sm" 
                                    placeholder="Hours" 
                                    value={availability[m.id] || ''}
                                    onChange={e => setAvailability({...availability, [m.id]: parseInt(e.target.value) || 0})}
                                 />
                             </div>
                         ))}
                     </div>
                </div>

                <button onClick={handleGenerate} disabled={loading} className="w-full bg-sidebar text-white py-3 rounded-xl font-bold text-sm">
                    {loading ? 'Planning...' : '✨ Generate Roadmap with Capacity Checks'}
                </button>
            </div>

            <div className="space-y-4">{roadmap.map((phase, idx) => (<div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-accent"><h3 className="text-xl font-bold text-gray-800">{phase.phase}</h3><p className="text-sm text-gray-500 font-medium">Duration: {phase.duration}</p><p className="text-xs text-gray-400 mt-1">Focus: {phase.focus}</p></div>))}</div>
            {roadmap.length > 0 && <button onClick={() => onSave({ items: roadmap, mvpDescription: mvpDesc, sprintDuration, memberAvailability: availability })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Roadmap</button>}
        </div>
    );
};

const PhaseSprint = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
  const [sprint, setSprint] = useState<SprintData>(project.phases.sprint || {
    isActive: false,
    number: 1,
    startDate: '',
    endDate: '',
    durationWeeks: project.phases.roadmap?.sprintDuration || 2,
    goal: '',
    impediments: [],
    dailyStandups: []
  });

  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(
    (project.phases.backlog?.epics || [])
      .flatMap(e => e.stories)
      .filter(s => s.isInSprint)
      .map(s => s.id)
  );

  const [loading, setLoading] = useState(false);
  const [newImpediment, setNewImpediment] = useState('');

  // Helpers
  const allStories = (project.phases.backlog?.epics || []).flatMap(e => e.stories);
  const availableStories = allStories.filter(s => !s.isInSprint && s.status === 'todo');
  const activeStories = allStories.filter(s => s.isInSprint);

  const handleStartSprint = async () => {
      if (selectedStoryIds.length === 0) return alert("Select stories first");
      if (!sprint.goal) return alert("Define a Sprint Goal");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (sprint.durationWeeks * 7));

      const newSprintData: SprintData = {
          ...sprint,
          isActive: true,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
      };

      const updatedEpics = (project.phases.backlog?.epics || []).map(epic => ({
          ...epic,
          stories: epic.stories.map(s => selectedStoryIds.includes(s.id) ? { ...s, isInSprint: true, status: 'todo' } : s)
      }));

      try {
          const projectRef = doc(db, 'projects', project.id);
          await updateDoc(projectRef, {
              "phases.backlog.epics": updatedEpics,
              "phases.sprint": newSprintData
          });
          onSave(newSprintData); 
      } catch(e: any) {
          console.error(e);
          alert("Error starting sprint: " + e.message);
      }
  };

  const handleGenerateGoal = async () => {
      setLoading(true);
      const stories = allStories.filter(s => selectedStoryIds.includes(s.id));
      try {
          const goal = await aiService.generateSprintGoal(stories.map(s => s.title));
          setSprint(prev => ({...prev, goal}));
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  const completeSprint = async () => {
       const projectRef = doc(db, 'projects', project.id);
       const completedSprintData: SprintData = {
          ...sprint,
          isActive: false,
          number: sprint.number + 1,
          dailyStandups: [],
          impediments: [],
          goal: '' // clear goal for next
      };
      
      const updatedEpics = (project.phases.backlog?.epics || []).map(epic => ({
          ...epic,
          stories: epic.stories.map(s => {
              if (s.isInSprint) {
                  return { ...s, isInSprint: false, completedAt: s.status === 'done' ? Date.now() : undefined };
              }
              return s;
          })
      }));

      await updateDoc(projectRef, { 
          "phases.sprint": completedSprintData,
          "phases.backlog.epics": updatedEpics
      });
      onSave(completedSprintData);
      setSprint(completedSprintData);
      setSelectedStoryIds([]);
  };

  if (sprint.isActive) {
      return (
          <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                   <div>
                       <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
                           SPRINT {sprint.number} 
                           <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full animate-pulse">● ACTIVE</span>
                       </h2>
                       <p className="text-gray-500 mt-1">🎯 <strong>Goal:</strong> {sprint.goal}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-sm font-bold text-gray-400">Ends: {new Date(sprint.endDate).toLocaleDateString()}</p>
                       <button onClick={completeSprint} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-xl font-bold text-sm mt-2">Complete Sprint</button>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                   {['todo', 'doing', 'done'].map(status => (
                       <div key={status} className="bg-gray-50 p-4 rounded-xl flex flex-col border border-gray-200">
                           <h3 className="font-bold text-gray-500 uppercase text-xs mb-4 tracking-wider flex justify-between">
                               {status}
                               <span className="bg-gray-200 text-gray-600 px-2 rounded">{activeStories.filter(s => s.status === status).length}</span>
                           </h3>
                           <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                               {activeStories.filter(s => s.status === status).map(story => (
                                   <div key={story.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-accent/30 transition group"
                                        onClick={async () => {
                                            const nextStatus = status === 'todo' ? 'doing' : status === 'doing' ? 'done' : 'todo';
                                            const updatedEpics = (project.phases.backlog?.epics || []).map(e => ({
                                                ...e,
                                                stories: e.stories.map(s => s.id === story.id ? { ...s, status: nextStatus as any } : s)
                                            }));
                                            const projectRef = doc(db, 'projects', project.id);
                                            await updateDoc(projectRef, { "phases.backlog.epics": updatedEpics });
                                        }}
                                   >
                                       <p className="font-medium text-gray-800 text-sm mb-2">{story.title}</p>
                                       <div className="flex justify-between items-center">
                                           <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-mono">{story.storyPoints} SP</span>
                                           <span className="text-xs text-gray-300 group-hover:text-accent">Click to move</span>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   ))}
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                   <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">🚫 Impediments</h3>
                   <div className="flex gap-2 mb-6">
                       <input className="flex-1 border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm outline-none focus:border-red-400" placeholder="Describe impediment..." value={newImpediment} onChange={e => setNewImpediment(e.target.value)} />
                       <button onClick={async () => {
                           if (!newImpediment) return;
                           const imp: Impediment = { id: Date.now().toString(), description: newImpediment, memberId: auth.currentUser?.uid || '', createdAt: Date.now(), status: 'open' };
                           const newImpediments = [...(sprint.impediments || []), imp];
                           const projectRef = doc(db, 'projects', project.id);
                           await updateDoc(projectRef, { "phases.sprint.impediments": newImpediments });
                           setSprint(prev => ({...prev, impediments: newImpediments}));
                           setNewImpediment('');
                       }} className="bg-red-500 text-white px-6 rounded-xl font-bold hover:bg-red-600 transition">Add</button>
                   </div>
                   <div className="space-y-2">
                       {sprint.impediments?.map(imp => (
                           <div key={imp.id} className="flex justify-between items-center p-3 rounded-xl bg-red-50 border border-red-100">
                               <span className="text-sm text-red-800 font-medium">{imp.description}</span>
                               <span className="text-xs text-red-400">{new Date(imp.createdAt).toLocaleDateString()}</span>
                           </div>
                       ))}
                       {(!sprint.impediments || sprint.impediments.length === 0) && <p className="text-sm text-gray-400 italic">No impediments reported.</p>}
                   </div>
               </div>
          </div>
      );
  }

  // Planning View
  return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-3xl font-extrabold text-sidebar">9. SPRINT PLANNING</h2>
             <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase">Sprint {sprint.number} Setup</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <span>⚙️ Configuration</span>
                  </h3>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sprint Goal</label>
                          <textarea 
                              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 outline-none transition" 
                              rows={4} 
                              placeholder="Define a clear, inspiring goal for this sprint..."
                              value={sprint.goal}
                              onChange={e => setSprint({...sprint, goal: e.target.value})}
                          />
                          <button onClick={handleGenerateGoal} disabled={loading || selectedStoryIds.length === 0} className="mt-2 text-accent text-xs font-bold flex items-center gap-1 hover:underline disabled:opacity-50">
                              {loading ? 'Thinking...' : '✨ Generate with AI'}
                          </button>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Duration</label>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium">
                              {sprint.durationWeeks} Weeks
                          </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-500">Selected Stories:</span>
                              <span className="font-bold text-gray-800">{selectedStoryIds.length}</span>
                          </div>
                          <div className="flex justify-between items-center mb-6">
                              <span className="text-sm text-gray-500">Total Points:</span>
                              <span className="font-bold text-accent">
                                  {allStories.filter(s => selectedStoryIds.includes(s.id)).reduce((acc, s) => acc + (s.storyPoints || 0), 0)} SP
                              </span>
                          </div>
                          <button onClick={handleStartSprint} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#FF8A3A] transition transform hover:scale-[1.02]">START SPRINT 🚀</button>
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                  <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
                      <span>📋 Product Backlog</span>
                      <span className="text-xs font-normal text-gray-400">Select stories for this sprint</span>
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {availableStories.length === 0 && <p className="text-gray-400 text-center py-10">No stories available in backlog.</p>}
                      {availableStories.map(story => {
                          const isSelected = selectedStoryIds.includes(story.id);
                          return (
                              <div 
                                  key={story.id} 
                                  onClick={() => {
                                      if (isSelected) setSelectedStoryIds(ids => ids.filter(id => id !== story.id));
                                      else setSelectedStoryIds(ids => [...ids, story.id]);
                                  }}
                                  className={`p-4 rounded-xl border cursor-pointer transition flex justify-between items-center ${isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                              >
                                  <div>
                                      <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-accent' : 'text-gray-700'}`}>{story.title}</h4>
                                      <p className="text-xs text-gray-500 line-clamp-1">{story.description}</p>
                                  </div>
                                  <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded text-gray-600 whitespace-nowrap ml-4">{story.storyPoints} SP</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      </div>
  );
};

const ProjectDetail = () => {
    const { projectId, phaseId } = useParams();
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        if (!projectId) return;
        const unsubscribe = onSnapshot(doc(db, "projects", projectId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                setProject({ id: docSnapshot.id, ...docSnapshot.data() } as Project);
            }
        });
        return () => unsubscribe();
    }, [projectId]);

    const handleSave = async (data: any) => {
        if (!project || !phaseId) return;
        const projectRef = doc(db, 'projects', projectId);
        try {
            await updateDoc(projectRef, {
                [`phases.${phaseId}`]: data
            });
        } catch (e: any) {
            console.error("Error saving phase:", e);
            alert(`Error saving: ${e.message}`);
        }
    };

    if (!project) return <div className="flex h-full items-center justify-center">Loading Project...</div>;

    let Component;
    switch (phaseId) {
        case 'mindset': Component = PhaseMindset; break;
        case 'vision': Component = PhaseVision; break;
        case 'objectives': Component = PhaseObjectives; break;
        case 'kpis': Component = PhaseKPIs; break;
        case 'backlog': Component = PhaseBacklog; break;
        case 'team': Component = PhaseTeam; break;
        case 'obeya': Component = PhaseObeya; break; // Added Obeya
        case 'estimates': Component = PhaseEstimates; break;
        case 'roadmap': Component = PhaseRoadmap; break;
        case 'sprint': Component = PhaseSprint; break;
        case 'stats': Component = () => <div className="p-10 text-center text-gray-500">Statistics - Coming Soon</div>; break;
        default: Component = () => <div>Select a phase</div>;
    }

    return (
        <Layout currentProject={project}>
            <Component project={project} onSave={handleSave} />
        </Layout>
    );
};

const App = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u: any) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center text-sidebar font-bold">Loading Scrum AI...</div>;

    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/projects" />} />
                <Route path="/projects" element={user ? <ProjectList /> : <Navigate to="/login" />} />
                <Route path="/project/:projectId/:phaseId" element={user ? <ProjectDetail /> : <Navigate to="/login" />} />
            </Routes>
        </HashRouter>
    );
};

export default App;
