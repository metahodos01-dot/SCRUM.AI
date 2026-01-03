import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, onSnapshot, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Project, User, Epic, UserStory, TeamMember, Impediment, Risk, DailyStandup } from './types';
import { Layout } from './components/Layout';
import { aiService } from './services/aiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, ReferenceLine, ComposedChart
} from 'recharts';

// --- Components for specific pages/phases ---

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
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h1 className="text-2xl font-extrabold text-sidebar mb-6 text-center">SCRUM AI MANAGER</h1>
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
            <button 
                type="button" 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-gray-500 hover:text-accent font-medium underline"
            >
                {isRegistering ? "Already have an account? Login" : "No account? Create one"}
            </button>
        </div>

        {!isRegistering && (
            <div className="mt-4 text-xs text-gray-400 text-center">
            Use admin credentials provided in documentation or create a new account.
            </div>
        )}
      </div>
    </div>
  );
};

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [language, setLanguage] = useState<'it' | 'en'>('it'); // Default IT as requested
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
             <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as 'it' | 'en')}
                className="border border-gray-300 rounded-lg p-2 bg-white text-gray-800 font-bold"
             >
                <option value="it">🇮🇹 ITA</option>
                <option value="en">🇬🇧 ENG</option>
             </select>
            <input 
              type="text" 
              placeholder="New Project Name" 
              className="border border-gray-300 rounded-lg p-2 text-gray-900 bg-white"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
            />
            <button onClick={createProject} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold">
              + Create
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <div key={p.id} onClick={() => navigate(`/project/${p.id}/mindset`)} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md cursor-pointer border border-gray-100 transition">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{p.name}</h3>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs">{p.language === 'it' ? '🇮🇹' : '🇬🇧'}</span>
                    <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase">{p.status}</span>
                </div>
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
                      <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                          <li>Detailed upfront planning</li>
                          <li>Strict phase gates</li>
                          <li>Value delivered only at the end</li>
                      </ul>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-accent/20 transform hover:scale-105 transition duration-300">
                      <h3 className="text-xl font-bold text-accent mb-4">🚀 Agile Mindset</h3>
                      <p className="text-sm text-gray-600 mb-4">Iterative, incremental, empirical. Embrace change.</p>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                          <li><strong className="text-sidebar">Empiricism:</strong> Transparency, Inspection, Adaptation.</li>
                          <li>Working software over docs.</li>
                          <li>Responding to change.</li>
                      </ul>
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
              <div className="space-y-6">
                  <div className="relative bg-white rounded-2xl shadow-sm p-8 overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-accent"></div>
                      <h3 className="text-2xl font-extrabold text-sidebar mb-6">The Scrum Framework</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100"><div className="text-2xl mb-2">👑</div><h4 className="font-bold text-indigo-900">Product Owner</h4></div>
                          <div className="bg-pink-50 p-4 rounded-xl border border-pink-100"><div className="text-2xl mb-2">🛡️</div><h4 className="font-bold text-pink-900">Scrum Master</h4></div>
                          <div className="bg-green-50 p-4 rounded-xl border border-green-100"><div className="text-2xl mb-2">🛠️</div><h4 className="font-bold text-green-900">Developers</h4></div>
                      </div>
                  </div>
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
          <input className="w-full border p-3 rounded-xl text-gray-800 bg-white" placeholder="Target Audience" value={inputs.target} onChange={e => setInputs({...inputs, target: e.target.value})} />
          <input className="w-full border p-3 rounded-xl text-gray-800 bg-white" placeholder="Problem to Solve" value={inputs.problem} onChange={e => setInputs({...inputs, problem: e.target.value})} />
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
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
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
            <div className="flex justify-between items-center"><h2 className="text-3xl font-extrabold text-sidebar">4. KEY PERFORMANCE INDICATORS</h2><button onClick={handleGenerate} disabled={loading} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm">{loading ? 'Generating...' : '✨ Generate KPIs'}</button></div>
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
      <div className="space-y-4">{epics.map((epic, i) => (<div key={epic.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center"><span className="font-bold text-lg text-sidebar">{epic.title}</span><span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border">{epic.stories.length} Stories</span></div><div className="divide-y divide-gray-100">{epic.stories.map((story) => (<div key={story.id} className="p-6 hover:bg-gray-50 transition"><div className="flex justify-between items-start mb-2"><span className="font-bold text-gray-800">{story.title}</span><span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded shrink-0">SP: {story.storyPoints}</span></div><p className="text-sm text-gray-600 mb-3">{story.description}</p></div>))}</div></div>))}</div>
      {epics.length > 0 && <button onClick={() => onSave({ epics })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:bg-opacity-90">Save Backlog</button>}
    </div>
  );
};

const PhaseTeam = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [members, setMembers] = useState<TeamMember[]>(project.phases.team?.members || []);
    const [loading, setLoading] = useState(false);
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await aiService.generateTeamRecommendations(project.phases.vision?.text || '');
            const newMembers = result.map((r: any, i: number) => ({ id: `member-${Date.now()}-${i}`, name: `Candidate ${i+1}`, role: r.role, skills: r.skills }));
            setMembers([...members, ...newMembers]);
        } catch (e) { alert("AI Error"); }
        setLoading(false);
    };
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-extrabold text-sidebar">6. AGILE TEAM</h2><button onClick={handleGenerate} disabled={loading} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm">{loading ? 'Analyzing...' : '✨ Suggest Roles'}</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{members.map(member => (<div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center"><div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-2xl bg-sidebar text-white">{member.name[0]}</div><h3 className="font-bold text-gray-800">{member.name}</h3><p className="text-sm text-accent font-bold uppercase mb-2">{member.role}</p></div>))}</div>
            <button onClick={() => onSave({ members })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Team</button>
        </div>
    );
};

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
          <div className="flex gap-4"><button onClick={handleEstimate} disabled={loading} className="flex-1 bg-sidebar text-white py-4 rounded-xl font-bold">{loading ? 'AI Estimating...' : '✨ Generate Estimations'}</button><button onClick={saveEstimates} className="flex-1 bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Estimates</button></div>
      </div>
  )
}

const PhaseRoadmap = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [roadmap, setRoadmap] = useState<any[]>(project.phases.roadmap?.items || []);
    const [loading, setLoading] = useState(false);
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const epics = project.phases.backlog?.epics || [];
            if(epics.length === 0) { alert("Backlog empty."); return; }
            const result = await aiService.generateRoadmap(project.phases.vision?.text || '', epics);
            setRoadmap(result);
        } catch(e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-extrabold text-sidebar">8. PRODUCT ROADMAP</h2><button onClick={handleGenerate} disabled={loading} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm">{loading ? 'Planning...' : '✨ Generate Roadmap'}</button></div>
            <div className="space-y-4">{roadmap.map((phase, idx) => (<div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-accent"><h3 className="text-xl font-bold text-gray-800">{phase.phase}</h3><p className="text-sm text-gray-500 font-medium">Duration: {phase.duration}</p></div>))}</div>
            {roadmap.length > 0 && <button onClick={() => onSave({ items: roadmap })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Roadmap</button>}
        </div>
    );
};

const PhaseSprint = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    // Tabs state
    const [view, setView] = useState<'planning' | 'board' | 'refinement' | 'review' | 'retrospective'>('board');
    // Local Epics state (for drag/drop and editing before save)
    const [localEpics, setLocalEpics] = useState<Epic[]>(project.phases.backlog?.epics || []);
    // Sprint Configuration
    const [duration, setDuration] = useState<number>(project.phases.sprint?.durationWeeks || 2);
    const [sprintGoal, setSprintGoal] = useState<string>(project.phases.sprint?.goal || '');
    const [reviewNotes, setReviewNotes] = useState<string>(project.phases.sprint?.review || '');
    const [retroNotes, setRetroNotes] = useState<string>(project.phases.sprint?.retrospective || '');
    
    // Capacity Planning State
    const [memberCapacity, setMemberCapacity] = useState<Record<string, number>>(project.phases.sprint?.memberCapacity || {});
    // Impediments State
    const [impediments, setImpediments] = useState<Impediment[]>(project.phases.sprint?.impediments || []);
    const [newImpediment, setNewImpediment] = useState('');

    // Daily Standup Timer State
    const [dailyDurationMinutes, setDailyDurationMinutes] = useState(project.phases.sprint?.dailyMeetingDuration || 15);
    const [dailySeconds, setDailySeconds] = useState(dailyDurationMinutes * 60);
    const [isDailyActive, setIsDailyActive] = useState(false);
    const dailyIntervalRef = useRef<any>(null);
    
    // Modifiable Sprint Time
    const [isEditingEndDate, setIsEditingEndDate] = useState(false);
    const [newEndDate, setNewEndDate] = useState(project.phases.sprint?.endDate || '');
    
    const [aiLoading, setAiLoading] = useState(false);

    // Team Members for assignment
    const teamMembers = project.phases.team?.members || [];
    
    // Timer state
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number}>({ days: 0, hours: 0 });

    useEffect(() => {
        if (project.phases.sprint?.startDate && project.phases.sprint?.endDate && project.phases.sprint?.isActive) {
            const calculateTime = () => {
                const now = new Date().getTime();
                const end = new Date(project.phases.sprint!.endDate).getTime();
                const diff = end - now;
                
                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    setTimeLeft({ days, hours });
                } else {
                    setTimeLeft({ days: 0, hours: 0 });
                }
            };
            calculateTime();
            const interval = setInterval(calculateTime, 1000 * 60); // Update every minute
            return () => clearInterval(interval);
        }
    }, [project.phases.sprint]);

    // Daily Timer Effect
    useEffect(() => {
        if (isDailyActive) {
            dailyIntervalRef.current = setInterval(() => {
                setDailySeconds(prev => {
                    if (prev <= 0) {
                        setIsDailyActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (dailyIntervalRef.current) {
            clearInterval(dailyIntervalRef.current);
        }
        return () => {
            if (dailyIntervalRef.current) clearInterval(dailyIntervalRef.current);
        };
    }, [isDailyActive]);

    // Helpers
    const getSprintStories = () => localEpics.flatMap(e => e.stories).filter(s => s.isInSprint);
    const getBacklogStories = () => localEpics.flatMap(e => e.stories).filter(s => !s.isInSprint);

    // Calculations
    const totalSprintSP = getSprintStories().reduce((acc, s) => acc + (s.storyPoints || 0), 0);
    const totalSprintHours = getSprintStories().reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
    const totalTeamCapacity = (Object.values(memberCapacity) as number[]).reduce((a, b) => a + b, 0);
    const isOverloaded = totalTeamCapacity > 0 && totalSprintHours > totalTeamCapacity;

    const toggleSprintStatus = (storyId: string) => {
        setLocalEpics(prev => prev.map(epic => ({
            ...epic,
            stories: epic.stories.map(s => s.id === storyId ? { ...s, isInSprint: !s.isInSprint } : s)
        })));
    };

    const updateStoryStatus = (storyId: string, status: 'todo' | 'doing' | 'done') => {
        setLocalEpics(prev => prev.map(epic => ({
            ...epic,
            stories: epic.stories.map(s => {
                if (s.id !== storyId) return s;
                
                const updatedStory = { ...s, status };
                
                if (status === 'done') {
                    updatedStory.completedAt = Date.now();
                } else {
                    // Prevent saving undefined to Firestore which causes crashes
                    delete updatedStory.completedAt;
                }
                
                return updatedStory;
            })
        })));
    };

    const toggleAssignee = (storyId: string, memberId: string) => {
        setLocalEpics(prev => prev.map(epic => ({
            ...epic,
            stories: epic.stories.map(s => {
                if (s.id !== storyId) return s;
                const currentAssignees = s.assigneeIds || [];
                const newAssignees = currentAssignees.includes(memberId) 
                    ? currentAssignees.filter(id => id !== memberId)
                    : [...currentAssignees, memberId];
                return { ...s, assigneeIds: newAssignees };
            })
        })));
    };

    const handleCapacityChange = (memberId: string, hours: string) => {
        setMemberCapacity(prev => ({
            ...prev,
            [memberId]: parseInt(hours) || 0
        }));
    };

    // --- Impediments Logic ---
    const addImpediment = () => {
        if (!newImpediment) return;
        const imp: Impediment = {
            id: `imp-${Date.now()}`,
            description: newImpediment,
            memberId: auth.currentUser?.uid || 'unknown',
            createdAt: Date.now(),
            status: 'open'
        };
        setImpediments([...impediments, imp]);
        setNewImpediment('');
    }

    const resolveImpediment = (id: string) => {
        setImpediments(prev => prev.map(imp => imp.id === id ? { ...imp, status: 'resolved' } : imp));
    }

    // --- Refinement Logic ---
    const refineStory = async (storyId: string) => {
        const story = getSprintStories().find(s => s.id === storyId) || getBacklogStories().find(s => s.id === storyId);
        if(!story) return;

        setAiLoading(true);
        try {
            const splitStories = await aiService.splitUserStory(story.title, story.description);
            const newStories: UserStory[] = splitStories.map((s: any, idx: number) => ({
                id: `split-${story.id}-${idx}`,
                title: s.title,
                description: s.description,
                acceptanceCriteria: s.acceptanceCriteria,
                // AI service now returns estimates, if available use them, otherwise default to 0
                storyPoints: s.storyPoints || 0,
                estimatedHours: s.estimatedHours || 0,
                status: 'todo',
                // IMPORTANT: Inherit sprint status so it appears on board if parent was there.
                // DEFAULT TO FALSE IF UNDEFINED to avoid Firestore crashes.
                isInSprint: story.isInSprint || false,
                assigneeIds: story.assigneeIds || [] // Default to empty array to avoid undefined
            }));

            // Replace original story with new ones in the same epic
            setLocalEpics(prev => prev.map(epic => ({
                ...epic,
                stories: epic.stories.flatMap(s => s.id === storyId ? newStories : s)
            })));
            alert(`Story refined! ${newStories.length} new stories created.`);
        } catch(e) { console.error(e); alert("Failed to refine story."); }
        setAiLoading(false);
    }


    const generateGoal = async () => {
        const stories = getSprintStories();
        if (stories.length === 0) {
            alert("Select stories first");
            return;
        }
        setAiLoading(true);
        try {
            const goal = await aiService.generateSprintGoal(stories.map(s => s.title));
            setSprintGoal(goal);
        } catch(e) { console.error(e); }
        setAiLoading(false);
    };

    const startSprint = async () => {
        if (!sprintGoal) { alert("Please set a Sprint Goal"); return; }
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (duration * 7));

        const sprintData = {
            isActive: true,
            number: (project.phases.sprint?.number || 0) + 1,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            durationWeeks: duration,
            goal: sprintGoal,
            memberCapacity,
            moods: {},
            impediments: [],
            dailyMeetingDuration: dailyDurationMinutes,
            dailyStandups: [], // Initialize empty
            review: '',
            retrospective: ''
        };
        
        // Save to DB
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, { 
             "phases.backlog.epics": localEpics,
             "phases.sprint": sprintData
        });
        alert(`Sprint ${sprintData.number} Started!`);
        setView('board');
    };

    const completeSprint = async () => {
        if (!confirm("Are you sure you want to complete the sprint? Unfinished stories will be moved to the backlog.")) return;

        // Move incomplete stories back to backlog
        const updatedEpics = localEpics.map(epic => ({
            ...epic,
            stories: epic.stories.map(s => {
                if (s.isInSprint && s.status !== 'done') {
                    return { ...s, isInSprint: false, status: 'todo' as const };
                }
                return s;
            })
        }));

        // Archive Sprint (in a real app, we would push to a sprints collection)
        const sprintData = {
            ...project.phases.sprint,
            isActive: false,
            completedAt: new Date().toISOString()
        };

        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, { 
             "phases.backlog.epics": updatedEpics,
             "phases.sprint": sprintData
        });
        setLocalEpics(updatedEpics);
        alert("Sprint Completed! Incomplete stories moved to Backlog.");
        setView('planning');
    };

    const saveChanges = async () => {
         const projectRef = doc(db, 'projects', project.id);
         // Guard against undefined values which crash Firestore
         let updatedSprintData: any = { 
             review: reviewNotes || "",
             retrospective: retroNotes || "",
             goal: sprintGoal || "",
             memberCapacity: memberCapacity || {},
             impediments: impediments || [],
             dailyMeetingDuration: dailyDurationMinutes || 15
         };

         // If user edited the end date
         if (newEndDate && new Date(newEndDate).getTime() !== new Date(project.phases.sprint?.endDate || '').getTime()) {
             updatedSprintData.endDate = newEndDate;
         }

         // Update specific nested fields map
         const updates: any = {
             "phases.backlog.epics": localEpics
         };
         
         // Dynamically add sprint fields to update map
         Object.keys(updatedSprintData).forEach(key => {
             updates[`phases.sprint.${key}`] = updatedSprintData[key];
         });

         await updateDoc(projectRef, updates);
         setIsEditingEndDate(false);
         alert("Sprint data saved!");
    };

    // --- Daily Standup Logic ---
    const handleSaveDaily = async () => {
        if (!project.phases.sprint?.isActive) return;

        const stories = getSprintStories();
        const totalHours = stories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
        const doneStories = stories.filter(s => s.status === 'done');
        const doneHours = doneStories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
        const remainingHours = Math.max(0, totalHours - doneHours);

        const currentStandups = project.phases.sprint.dailyStandups || [];
        const dayNumber = currentStandups.length + 1;
        
        const newDaily: DailyStandup = {
            day: dayNumber,
            date: new Date().toISOString(),
            oreCompletate: doneHours - (currentStandups.length > 0 ? (totalHours - currentStandups[currentStandups.length - 1].oreRimanenti) : 0), // Delta from last recorded state
            oreRimanenti: remainingHours,
            taskCompletati: doneStories.map(s => s.id)
        };

        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
            "phases.sprint.dailyStandups": arrayUnion(newDaily)
        });
        
        alert(`Daily Standup Day ${dayNumber} Saved! Remaining: ${remainingHours}h`);
    };

    // --- Sub-components for Sprint ---

    const DailyTimer = () => {
        const formatTime = (secs: number) => {
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <h4 className="font-bold text-gray-500 uppercase text-xs mb-2">Daily Standup</h4>
                <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
                    {formatTime(dailySeconds)}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsDailyActive(!isDailyActive)}
                        className={`px-3 py-1 rounded text-xs font-bold text-white ${isDailyActive ? 'bg-yellow-500' : 'bg-green-500'}`}
                    >
                        {isDailyActive ? 'Pause' : 'Start'}
                    </button>
                    <button 
                        onClick={() => { setIsDailyActive(false); setDailySeconds(dailyDurationMinutes * 60); }}
                        className="px-3 py-1 rounded text-xs font-bold bg-gray-200 text-gray-600"
                    >
                        Reset
                    </button>
                </div>
                <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Duration:</span>
                    <input 
                        type="number" 
                        className="w-10 text-[10px] border rounded text-center"
                        value={dailyDurationMinutes}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 15;
                            setDailyDurationMinutes(val);
                            setDailySeconds(val * 60);
                        }}
                    />
                    <span className="text-[10px] text-gray-400">min</span>
                </div>
                
                <button 
                    onClick={handleSaveDaily}
                    className="mt-4 w-full bg-accent text-white px-3 py-2 rounded font-bold text-xs shadow-md hover:bg-opacity-90"
                >
                    💾 End Daily & Save Progress
                </button>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const actualData = payload.find((p: any) => p.dataKey === 'actual');
            const idealData = payload.find((p: any) => p.dataKey === 'ideal');
            
            // If actual is null (future day), don't show specific diff
            if (!actualData || actualData.value === null) {
                 return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-xs">
                        <p className="font-bold text-gray-700 mb-2">Day {label}</p>
                        <p className="text-gray-400">Ideal: {idealData?.value?.toFixed(1)}h</p>
                        <p className="text-gray-400 italic">Not yet reached</p>
                    </div>
                );
            }

            const diff = actualData.value - idealData.value;
            const diffFormatted = diff ? Math.abs(diff).toFixed(1) : '0';

            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-gray-700 mb-2">Day {label}</p>
                    <p className="text-[#EF4444] font-bold">Actual: {actualData.value}h</p>
                    <p className="text-gray-400">Ideal: {idealData?.value?.toFixed(1)}h</p>
                    {diff !== undefined && (
                        <div className={`mt-2 pt-2 border-t font-bold ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {diff > 0 ? `+${diffFormatted}h (Behind)` : `-${diffFormatted}h (Ahead)`}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const BurndownChart = () => {
        if (!project.phases.sprint?.startDate) return <div className="p-10 text-center text-gray-400">Start Sprint to view Burndown</div>;

        const stories = getSprintStories();
        const totalHours = stories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
        // Using provided duration in weeks to calculate days. Assuming 7 days a week for simplicity in chart x-axis.
        const sprintDays = duration * 7;
        
        // --- Ideal Trend Construction (Full Sprint) ---
        const idealData = Array.from({ length: sprintDays + 1 }, (_, day) => ({
            day,
            ideal: Math.max(0, totalHours - (totalHours / sprintDays * day))
        }));

        // --- Actual Remaining Construction (Historical + Today) ---
        // Always start with Day 0 = Total Hours
        const actualData: {day: number, actual: number}[] = [{ day: 0, actual: totalHours }];
        
        const standups = project.phases.sprint.dailyStandups || [];
        
        standups.forEach(daily => {
            // Ensure we don't duplicate days if data is weird
            if (!actualData.find(d => d.day === daily.day)) {
                actualData.push({
                    day: daily.day,
                    actual: daily.oreRimanenti
                });
            }
        });

        // Merge for Chart
        const chartData = idealData.map(item => {
            const actualPoint = actualData.find(a => a.day === item.day);
            return {
                day: item.day,
                ideal: item.ideal,
                actual: actualPoint ? actualPoint.actual : null // null for future days ensures line stops
            };
        });

        // Determine sprint status based on latest actual data point
        const lastPoint = [...chartData].reverse().find(d => d.actual !== null);
        let diff = 0;
        let status = 'ontrack'; // ahead, behind, ontrack
        if (lastPoint && lastPoint.ideal !== undefined) {
            diff = lastPoint.actual! - lastPoint.ideal;
            if (diff < -5) status = 'ahead';
            else if (diff > 5) status = 'behind';
        }

        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-96">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase">Sprint Burndown (Hours)</h4>
                    {lastPoint && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 
                            ${status === 'behind' ? 'bg-red-50 text-red-600 border-red-200' : 
                              status === 'ahead' ? 'bg-green-50 text-green-700 border-green-200' : 
                              'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {status === 'behind' && `⚠️ ${diff.toFixed(0)}h Behind`}
                            {status === 'ahead' && `⚡ ${Math.abs(diff).toFixed(0)}h Ahead`}
                            {status === 'ontrack' && `✓ On Track`}
                        </div>
                    )}
                </div>
                
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#6B7280'}} 
                            label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#9CA3AF' }}
                            domain={[0, sprintDays]}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#6B7280'}} 
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9CA3AF' }}
                            domain={[0, 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                        
                        {/* Ideal Trend - Gray Dashed (#9CA3AF) */}
                        <Line 
                            type="linear" 
                            dataKey="ideal" 
                            stroke="#9CA3AF" 
                            strokeDasharray="5 5" 
                            name="Ideal Trend" 
                            dot={false} 
                            strokeWidth={2}
                            connectNulls={false}
                        />
                        
                        {/* Actual Remaining - Red Solid (#EF4444) with Area */}
                        <Area 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#EF4444" 
                            fill="url(#colorActual)" 
                            name="Actual Remaining" 
                            strokeWidth={3} 
                            dot={{ fill: '#EF4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            connectNulls={false} // Don't connect if null (future)
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const ImpedimentsTracker = () => {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-[200px]">
                <h4 className="font-bold text-red-500 uppercase text-xs mb-3">Impediments</h4>
                <div className="flex gap-2 mb-3">
                    <input 
                        className="w-full text-sm border rounded p-1" 
                        placeholder="Add blocker..." 
                        value={newImpediment} 
                        onChange={e => setNewImpediment(e.target.value)}
                    />
                    <button onClick={addImpediment} className="bg-red-500 text-white px-3 rounded font-bold text-xs">+</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {impediments.filter(i => i.status === 'open').map(imp => (
                        <div key={imp.id} className="bg-red-50 border border-red-100 p-2 rounded text-xs flex justify-between items-center">
                            <span className="text-red-800">{imp.description}</span>
                            <button onClick={() => resolveImpediment(imp.id)} className="text-green-600 font-bold hover:underline">Solve</button>
                        </div>
                    ))}
                    {impediments.filter(i => i.status === 'open').length === 0 && <p className="text-xs text-gray-400">No active blocks.</p>}
                </div>
            </div>
        )
    }

    const Column = ({ status, label, color }: any) => {
        const stories = getSprintStories().filter(s => s.status === status);
        return (
            <div 
                className="flex-1 bg-gray-100 rounded-xl p-4 flex flex-col overflow-hidden h-full"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    const id = e.dataTransfer.getData("storyId");
                    updateStoryStatus(id, status);
                }}
            >
                <h3 className={`font-bold text-sm uppercase mb-4 text-${color}-600`}>{label} ({stories.length})</h3>
                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar pb-20">
                    {stories.map(story => (
                        <div 
                            key={story.id} 
                            draggable 
                            onDragStart={e => e.dataTransfer.setData("storyId", story.id)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-move hover:shadow-md transition relative group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-gray-800 text-sm">{story.title}</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-mono">
                                    {story.storyPoints} SP
                                </span>
                                <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-mono">
                                    {story.estimatedHours}h
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                                <div className="flex -space-x-2 overflow-hidden">
                                    {story.assigneeIds && story.assigneeIds.length > 0 ? (
                                        story.assigneeIds.map(uid => {
                                            const member = teamMembers.find(m => m.id === uid);
                                            return (
                                                <div key={uid} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-sidebar text-white flex items-center justify-center text-[10px] font-bold" title={member?.name}>
                                                    {member?.name?.[0] || '?'}
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
             {/* Sprint Header */}
             <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
                 <div>
                    <h2 className="text-2xl font-extrabold text-sidebar">
                        {project.phases.sprint?.isActive ? `SPRINT ${project.phases.sprint.number}` : 'SPRINT PLANNING'}
                    </h2>
                    {project.phases.sprint?.isActive && (
                        <p className="text-xs text-gray-500 font-bold uppercase mt-1">Goal: {project.phases.sprint.goal}</p>
                    )}
                 </div>
                 
                 {project.phases.sprint?.isActive && (
                     <div className="flex flex-col items-center bg-gray-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition" onClick={() => setIsEditingEndDate(true)} title="Click to Edit End Date">
                         <span className="text-[10px] uppercase font-bold text-accent">Time Remaining</span>
                         <span className="font-mono text-xl font-bold">{timeLeft.days}d {timeLeft.hours}h</span>
                     </div>
                 )}

                 {isEditingEndDate && (
                     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                         <div className="bg-white p-6 rounded-xl shadow-xl">
                             <h4 className="font-bold mb-4">Edit Sprint End Date</h4>
                             <input 
                                type="datetime-local" 
                                className="border p-2 rounded mb-4"
                                value={newEndDate ? newEndDate.slice(0, 16) : ''}
                                onChange={e => setNewEndDate(e.target.value)}
                             />
                             <div className="flex gap-2">
                                 <button onClick={saveChanges} className="bg-accent text-white px-4 py-2 rounded font-bold">Save New Date</button>
                                 <button onClick={() => setIsEditingEndDate(false)} className="bg-gray-200 px-4 py-2 rounded font-bold">Cancel</button>
                             </div>
                         </div>
                     </div>
                 )}

                 <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                     {['planning', 'board', 'refinement', 'review', 'retrospective'].map((t) => (
                         <button 
                            key={t}
                            onClick={() => setView(t as any)} 
                            className={`px-4 py-2 rounded-md font-bold text-sm capitalize transition-all ${view === t ? 'bg-white text-sidebar shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                            {t}
                         </button>
                     ))}
                 </div>
                 <button onClick={saveChanges} className="bg-sidebar text-white px-4 py-2 rounded-lg font-bold text-sm">Save</button>
             </div>
             
             {/* Content Area */}
             <div className="flex-1 overflow-hidden">
                 {view === 'planning' && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pb-4">
                         {/* Backlog Column */}
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]">
                             <h4 className="font-bold text-gray-500 uppercase text-xs mb-4">Product Backlog</h4>
                             <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                 {getBacklogStories().map(s => (
                                     <div key={s.id} className="p-4 border rounded-xl hover:bg-gray-50 group relative transition bg-white">
                                         <div className="flex justify-between items-start">
                                             <span className="text-sm font-medium text-gray-800">{s.title}</span>
                                             <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{s.storyPoints} SP</span>
                                         </div>
                                         <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                             <button onClick={() => toggleSprintStatus(s.id)} className="text-xs bg-sidebar text-white px-3 py-1.5 rounded-lg font-bold">Add to Sprint →</button>
                                         </div>
                                     </div>
                                 ))}
                                 {getBacklogStories().length === 0 && <p className="text-sm text-gray-400 text-center py-10">Backlog empty.</p>}
                             </div>
                         </div>

                         {/* Sprint Composition Column */}
                         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border-2 border-accent/20 flex flex-col h-full overflow-y-auto">
                             {/* Capacity Planning Section */}
                             <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                 <h4 className="font-bold text-gray-700 uppercase text-xs mb-3">Capacity Planning (Hours)</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     {teamMembers.map(m => (
                                         <div key={m.id}>
                                             <label className="text-[10px] font-bold text-gray-500 block mb-1">{m.name}</label>
                                             <input 
                                                type="number"
                                                className="w-full text-sm font-bold text-gray-800 p-2 border rounded bg-white"
                                                placeholder="Hours"
                                                value={memberCapacity[m.id] || 0}
                                                onChange={e => handleCapacityChange(m.id, e.target.value)}
                                             />
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                 <h4 className="font-bold text-accent uppercase text-xs">Sprint Candidate</h4>
                                 <div className="flex flex-wrap items-center gap-4">
                                     <div className="flex items-center gap-2">
                                         <span className="text-xs font-bold text-gray-600">Weeks:</span>
                                         <select 
                                            value={duration} 
                                            onChange={e => setDuration(Number(e.target.value))}
                                            className="bg-white border border-gray-200 rounded px-2 py-1 text-sm font-bold text-gray-800"
                                         >
                                             {[1, 2, 3, 4].map(w => <option key={w} value={w}>{w}</option>)}
                                         </select>
                                     </div>
                                     <div className="flex gap-2">
                                          <div className="text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100">
                                             {totalSprintSP} SP
                                         </div>
                                         <div className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-2 ${isOverloaded ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                             {totalSprintHours} / {totalTeamCapacity} h
                                             {isOverloaded && <span title="Over Capacity!">⚠️</span>}
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {isOverloaded && (
                                 <div className="mb-4 bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                                     <span>⚠️ Warning: Sprint load ({totalSprintHours}h) exceeds Team Capacity ({totalTeamCapacity}h). Consider removing stories.</span>
                                 </div>
                             )}

                             <div className="flex gap-2 mb-4">
                                <input 
                                    placeholder="Enter Sprint Goal..."
                                    className="flex-1 text-lg font-bold text-gray-800 border-none border-b-2 border-gray-100 focus:border-accent focus:ring-0 px-0 placeholder-gray-300 bg-transparent"
                                    value={sprintGoal}
                                    onChange={e => setSprintGoal(e.target.value)}
                                />
                                <button onClick={generateGoal} disabled={aiLoading} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-1 rounded">
                                    {aiLoading ? '...' : '✨ AI Goal'}
                                </button>
                             </div>

                             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-6 min-h-[200px]">
                                 {getSprintStories().map(s => (
                                     <div key={s.id} className="p-4 border border-accent/20 bg-accent/5 rounded-xl">
                                         <div className="flex justify-between items-start mb-2">
                                             <div>
                                                 <span className="text-sm font-bold text-gray-800">{s.title}</span>
                                                 <div className="flex gap-3 mt-1 text-xs text-gray-600">
                                                     <span className="bg-white/50 px-1 rounded">{s.storyPoints} SP</span>
                                                     <span className="bg-white/50 px-1 rounded">{s.estimatedHours}h</span>
                                                 </div>
                                             </div>
                                             <button onClick={() => toggleSprintStatus(s.id)} className="text-gray-400 hover:text-red-500">×</button>
                                         </div>
                                         
                                         {/* Assignees */}
                                         <div className="mt-3 flex flex-wrap gap-2 items-center">
                                             <span className="text-[10px] uppercase font-bold text-gray-500 mr-2">Assign to:</span>
                                             {teamMembers.map(m => (
                                                 <button 
                                                    key={m.id}
                                                    onClick={() => toggleAssignee(s.id, m.id)}
                                                    className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                                        s.assigneeIds?.includes(m.id) 
                                                            ? 'bg-sidebar text-white border-sidebar' 
                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                                    }`}
                                                 >
                                                     {m.name}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 ))}
                                 {getSprintStories().length === 0 && <p className="text-sm text-gray-400 text-center py-10">Select stories from the backlog.</p>}
                             </div>

                             <button 
                                onClick={startSprint}
                                disabled={getSprintStories().length === 0 || !sprintGoal}
                                className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 🚀 Start Sprint
                             </button>
                         </div>
                     </div>
                 )}

                 {view === 'board' && (
                     <div className="flex flex-col h-full gap-4 pb-2">
                         <div className="flex-1 flex gap-4 min-w-0 overflow-x-auto h-1/2">
                             <Column status="todo" label="To Do" color="gray" />
                             <Column status="doing" label="Doing" color="blue" />
                             <Column status="done" label="Done" color="green" />
                             
                             <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                <DailyTimer />
                                <ImpedimentsTracker />
                             </div>
                         </div>
                         {/* Inserted New Burndown Chart Here */}
                         <BurndownChart />
                     </div>
                 )}
                 
                 {view === 'refinement' && (
                     <div className="max-w-4xl mx-auto space-y-6 h-full overflow-y-auto pb-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-sidebar mb-2">Backlog Refinement</h3>
                                    <p className="text-gray-500">Select user stories from the sprint (or backlog) to split into smaller increments.</p>
                                </div>
                             </div>
                             
                             <div className="space-y-4">
                                {localEpics.flatMap(e => e.stories).map(story => (
                                    <div key={story.id} className={`border p-4 rounded-xl flex flex-col gap-4 hover:bg-gray-50 transition ${story.isInSprint ? 'border-l-4 border-l-accent' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {story.isInSprint && <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-bold">IN SPRINT</span>}
                                                    <p className="font-bold text-gray-800">{story.title}</p>
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-1">{story.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">SP: {story.storyPoints}</span>
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Hours: {story.estimatedHours}h</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => refineStory(story.id)}
                                                disabled={aiLoading}
                                                className="bg-sidebar text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 disabled:opacity-50 whitespace-nowrap"
                                            >
                                                {aiLoading ? 'Splitting...' : '✂️ Split with AI'}
                                            </button>
                                        </div>
                                        
                                        {/* Action Bar for New Stories */}
                                        <div className="flex gap-2 justify-end border-t pt-2 mt-2">
                                            <button 
                                                onClick={() => toggleSprintStatus(story.id)} 
                                                className={`text-xs font-bold px-3 py-1 rounded border transition ${story.isInSprint ? 'text-red-500 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                                            >
                                                {story.isInSprint ? 'Remove from Sprint' : 'Add to Sprint'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                     </div>
                 )}

                 {view === 'review' && (
                     <div className="max-w-4xl mx-auto space-y-6 h-full overflow-y-auto pb-6">
                         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                             <h3 className="text-2xl font-bold text-sidebar mb-2">Sprint Review</h3>
                             <p className="text-gray-500 mb-6">Demonstrate the hard work of the entire team to stakeholders.</p>
                             
                             <div className="space-y-4">
                                 <label className="block text-sm font-bold text-gray-700">Meeting Notes & Feedback</label>
                                 <textarea 
                                    className="w-full h-96 p-4 border rounded-xl focus:ring-accent focus:border-accent text-gray-800 bg-gray-50"
                                    placeholder="• Stakeholder feedback on feature X...&#10;• Proposed changes for next sprint...&#10;• Accepted stories..."
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                 />
                             </div>
                         </div>
                     </div>
                 )}

                 {view === 'retrospective' && (
                     <div className="max-w-4xl mx-auto space-y-6 h-full overflow-y-auto pb-6">
                         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-sidebar mb-2">Sprint Retrospective</h3>
                                    <p className="text-gray-500">Inspect and adapt. How can we improve our process?</p>
                                </div>
                                <button onClick={completeSprint} className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-red-600 transition">
                                    🏁 Complete Sprint
                                </button>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                                 <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col">
                                     <h4 className="font-bold text-green-800 mb-2">What went well?</h4>
                                     <textarea 
                                        className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-gray-700 text-sm"
                                        placeholder="Type here..."
                                        value={retroNotes.split('---')[0] || ''}
                                        onChange={e => setRetroNotes(`${e.target.value}---${retroNotes.split('---')[1] || ''}`)}
                                     />
                                 </div>
                                 <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col">
                                     <h4 className="font-bold text-red-800 mb-2">What can be improved?</h4>
                                      <textarea 
                                        className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-gray-700 text-sm"
                                        placeholder="Type here..."
                                        value={retroNotes.split('---')[1] || ''}
                                        onChange={e => setRetroNotes(`${retroNotes.split('---')[0] || ''}---${e.target.value}`)}
                                     />
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}
             </div>
        </div>
    );
}

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
        case 'estimates': Component = PhaseEstimates; break;
        case 'roadmap': Component = PhaseRoadmap; break;
        case 'sprint': Component = PhaseSprint; break;
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
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/projects" />} />
                <Route path="/projects" element={user ? <ProjectList /> : <Navigate to="/login" />} />
                <Route path="/project/:projectId/:phaseId" element={user ? <ProjectDetail /> : <Navigate to="/login" />} />
                <Route path="/" element={<Navigate to={user ? "/projects" : "/login"} />} />
            </Routes>
        </HashRouter>
    );
};

export default App;