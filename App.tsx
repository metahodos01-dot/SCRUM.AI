import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Project, User, Epic, UserStory, TeamMember, Impediment, ReleasePlan, MonteCarloResult } from './types';
import { Layout } from './components/Layout';
import SprintCenter from './src/components/SprintCenter/SprintCenter';
import ExecutiveObeya from './src/components/ExecutiveObeya/ExecutiveObeya';
import { aiService } from './services/aiService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

// --- Components for specific pages/phases ---

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/projects');
        } catch (error) {
            alert("Login failed: " + (error as any).message);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-sidebar">
            <div className="bg-white p-8 rounded-[16px] shadow-card w-96">
                <h1 className="text-2xl font-extrabold text-sidebar mb-6 text-center uppercase tracking-tight">SCRUM AI MANAGER</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wide mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-border-light rounded-btn p-3 focus:ring-2 focus:ring-btn-primary focus:border-btn-primary text-text-primary bg-white transition-all" required />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wide mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border border-border-light rounded-btn p-3 focus:ring-2 focus:ring-btn-primary focus:border-btn-primary text-text-primary bg-white transition-all" required />
                    </div>
                    <button type="submit" className="w-full bg-btn-primary hover:bg-btn-primary-hover text-white py-3 rounded-btn font-bold transition-all duration-200 hover:shadow-lg">Login</button>
                </form>
                <div className="mt-4 text-xs text-text-secondary text-center">
                    Use admin credentials provided in documentation.
                </div>
            </div>
        </div>
    );
};

// --- Homepage Component ---

const Homepage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* Hero Section */}
            <section className="min-h-screen flex flex-col items-center justify-center px-8 py-20 text-center">
                {/* META HODOS Logo */}
                <div className="flex flex-col items-center gap-4 mb-16">
                    <div className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-accent"></span>
                        <span className="w-5 h-5 rounded-full bg-btn-primary"></span>
                        <span className="w-5 h-5 rounded-full bg-badge"></span>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-3xl font-light tracking-[0.3em] text-sidebar">METÀ</p>
                        <p className="text-3xl font-bold tracking-[0.3em] text-sidebar">HODÓS</p>
                    </div>
                    <p className="text-[11px] text-text-secondary uppercase tracking-[0.35em] mt-2">
                        Persone • Agilità • Risultati
                    </p>
                </div>

                {/* Main Title */}
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-extrabold text-sidebar mb-6 tracking-tight">
                    SCRUM.AI
                </h1>

                {/* Subtitle */}
                <p className="text-base md:text-lg text-text-secondary max-w-2xl mb-2">
                    L'evoluzione del Project Management Agile potenziata dall'AI.
                </p>
                <p className="text-base text-text-secondary max-w-xl mb-10">
                    Il metodo scientifico applicato alla gestione dei progetti.
                </p>

                {/* CTA Buttons */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-badge hover:bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-sm transition-all duration-200 hover:shadow-lg uppercase tracking-wider"
                    >
                        Inizia Ora
                    </button>
                    <button
                        onClick={() => document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-text-secondary hover:text-sidebar font-medium text-sm transition-colors flex items-center gap-2 uppercase tracking-wider"
                    >
                        Scopri il Metodo <span className="text-base">→</span>
                    </button>
                </div>
            </section>

            {/* Vision Section - Dark Background */}
            <section id="vision" className="bg-sidebar py-24 px-8">
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-start">
                        {/* Left - Vision Statement */}
                        <div>
                            <p className="text-[10px] font-bold text-badge uppercase tracking-[0.3em] mb-8">
                                LA NOSTRA VISIONE
                            </p>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                                Rendere l'eccellenza strategica <span className="text-badge">semplice</span>, umana e immediata.
                            </h2>
                            <p className="text-gray-400 text-base leading-relaxed">
                                Trasformiamo la complessità in risultati pratici stando<br />
                                "<span className="text-badge font-semibold">nel fango</span>" con i leader, parlando un linguaggio diretto<br />
                                e usando un approccio empatico.
                            </p>
                        </div>

                        {/* Right - Feature Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Empatia Operativa */}
                            <div className="bg-[#3B4252] p-5 rounded-[12px]">
                                <div className="text-xl mb-3">🎯</div>
                                <h3 className="text-white font-bold text-xs mb-2 uppercase tracking-wide">EMPATIA OPERATIVA</h3>
                                <p className="text-gray-500 text-[10px] leading-relaxed uppercase tracking-wide">
                                    Sentiamo le sfide del team<br />come le nostre sfide.
                                </p>
                            </div>

                            {/* Semplicità Radicale */}
                            <div className="bg-[#3B4252] p-5 rounded-[12px]">
                                <div className="text-xl mb-3">💡</div>
                                <h3 className="text-white font-bold text-xs mb-2 uppercase tracking-wide">SEMPLICITÀ RADICALE</h3>
                                <p className="text-gray-500 text-[10px] leading-relaxed uppercase tracking-wide">
                                    Togliamo il superfluo per<br />arrivare al nocciolo.
                                </p>
                            </div>

                            {/* Toolbox Infinita */}
                            <div className="bg-[#3B4252] p-5 rounded-[12px]">
                                <div className="text-xl mb-3">🛠️</div>
                                <h3 className="text-white font-bold text-xs mb-2 uppercase tracking-wide">TOOLBOX INFINITA</h3>
                                <p className="text-gray-500 text-[10px] leading-relaxed uppercase tracking-wide">
                                    Intere aziendali agile,<br />mai un approccio fisso.
                                </p>
                            </div>

                            {/* Zero Ego */}
                            <div className="bg-[#3B4252] p-5 rounded-[12px]">
                                <div className="w-5 h-5 rounded-full border-2 border-accent mb-3"></div>
                                <h3 className="text-white font-bold text-xs mb-2 uppercase tracking-wide">ZERO EGO</h3>
                                <p className="text-gray-500 text-[10px] leading-relaxed uppercase tracking-wide">
                                    Il successo è il vostro, preferiamo stare<br />dietro le quinte.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            {/* Training Path Section - Light Background */}
            <section className="py-24 px-8 bg-white">
                <div className="max-w-[1200px] mx-auto">


                    {/* 3 Cards */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 01 */}
                        <div className="bg-white rounded-[20px] p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                            <span className="text-7xl font-extrabold text-gray-100 block mb-2">01</span>
                            <h3 className="text-lg font-extrabold text-sidebar mb-4 uppercase tracking-wide">AGILE MINDSET</h3>
                            <p className="text-text-secondary text-sm leading-relaxed mb-8">
                                Fase 1: Comprensione del mindset Agile, cultura Fail-Safe e introduzione al framework Scrum con simulazioni interattive.
                            </p>
                            <p className="text-accent text-[10px] font-bold uppercase tracking-[0.2em]">
                                MINDSET & FRAMEWORK
                            </p>
                        </div>

                        {/* Card 02 */}
                        <div className="bg-white rounded-[20px] p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                            <span className="text-7xl font-extrabold text-gray-100 block mb-2">02</span>
                            <h3 className="text-lg font-extrabold text-sidebar mb-4 uppercase tracking-wide">VISION & STRATEGY</h3>
                            <p className="text-text-secondary text-sm leading-relaxed mb-8">
                                Fase 2: Definizione della Product Vision, obiettivi SMART, KPI e creazione del Product Backlog con AI assistance.
                            </p>
                            <p className="text-btn-primary text-[10px] font-bold uppercase tracking-[0.2em]">
                                PIANIFICAZIONE AI-DRIVEN
                            </p>
                        </div>

                        {/* Card 03 */}
                        <div className="bg-white rounded-[20px] p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                            <span className="text-7xl font-extrabold text-gray-100 block mb-2">03</span>
                            <h3 className="text-lg font-extrabold text-sidebar mb-4 uppercase tracking-wide">SPRINT EXECUTION</h3>
                            <p className="text-text-secondary text-sm leading-relaxed mb-8">
                                Fase 3: Gestione Sprint, Obeya Room virtuale, metriche in tempo reale e retrospettive guidate per il miglioramento continuo.
                            </p>
                            <p className="text-badge text-[10px] font-bold uppercase tracking-[0.2em]">
                                DELIVERY & MONITORING
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-8 bg-white border-t border-border-light">
                <div className="max-w-[1200px] mx-auto text-center">
                    {/* META HODOS Logo */}
                    <div className="flex flex-col items-center gap-2 mb-4">
                        <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-btn-primary"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-badge"></span>
                        </div>
                        <div className="text-center mt-1">
                            <p className="text-base font-light tracking-[0.2em] text-sidebar">METÀ</p>
                            <p className="text-base font-bold tracking-[0.2em] text-sidebar">HODÓS</p>
                        </div>
                    </div>
                    <p className="text-[9px] text-text-secondary uppercase tracking-[0.25em]">
                        Persone • Agilità • Risultati
                    </p>
                </div>
            </footer>
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
        <div className="min-h-screen bg-white p-10">
            <div className="max-w-[1200px] mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-extrabold text-sidebar uppercase tracking-tight">YOUR PROJECTS</h1>
                    <div className="flex gap-3 items-center">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'it' | 'en')}
                            className="border border-border-light rounded-btn px-4 py-2 bg-white text-text-primary font-bold transition-all focus:ring-2 focus:ring-btn-primary"
                        >
                            <option value="it">🇮🇹 ITA</option>
                            <option value="en">🇬🇧 ENG</option>
                        </select>
                        <input
                            type="text"
                            placeholder="New Project Name"
                            className="border border-border-light rounded-btn px-4 py-2 text-text-primary bg-white focus:ring-2 focus:ring-btn-primary transition-all"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                        />
                        <button onClick={createProject} className="bg-btn-primary hover:bg-btn-primary-hover text-white px-6 py-2 rounded-btn font-bold transition-all duration-200 hover:shadow-lg">
                            + Create
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => (
                        <div key={p.id} onClick={() => navigate(`/project/${p.id}/mindset`)} className="bg-white p-6 rounded-[16px] shadow-card hover:shadow-card-hover cursor-pointer border border-border-light transition-all duration-200 hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-text-primary mb-2">{p.name}</h3>
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-sm text-text-secondary">{new Date(p.createdAt).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">{p.language === 'it' ? '🇮🇹' : '🇬🇧'}</span>
                                    <span className="bg-accent/10 text-accent px-3 py-1 rounded-pill text-[11px] font-bold uppercase tracking-wide">{p.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Scrum Framework Interactive Component ---

const ScrumFrameworkInteractive = () => {
    // XP and Progress State
    const [xp, setXp] = useState(0);
    const [showXpGain, setShowXpGain] = useState<{ amount: number; id: number } | null>(null);
    const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
    const [showCelebration, setShowCelebration] = useState(false);

    // Role Matching State
    const [roleMatches, setRoleMatches] = useState<{ [key: string]: string[] }>({
        'po': [], 'sm': [], 'dev': []
    });
    const [roleAnimations, setRoleAnimations] = useState<{ [key: string]: string }>({});

    // Sprint Cycle State
    const [sprintOrder, setSprintOrder] = useState<string[]>([]);
    const [sprintAnimations, setSprintAnimations] = useState<{ [key: string]: string }>({});

    // Values Quiz State
    const [valuesAnswers, setValuesAnswers] = useState<{ [key: number]: string }>({});
    const [valuesChecked, setValuesChecked] = useState(false);

    // Data
    const responsibilities = [
        { id: 'resp1', text: 'Gestisce il Product Backlog', correctRole: 'po' },
        { id: 'resp2', text: 'Rimuove gli impedimenti', correctRole: 'sm' },
        { id: 'resp3', text: 'Crea l\'Increment', correctRole: 'dev' },
        { id: 'resp4', text: 'Massimizza il valore', correctRole: 'po' },
        { id: 'resp5', text: 'Facilita gli eventi Scrum', correctRole: 'sm' },
        { id: 'resp6', text: 'È auto-organizzato', correctRole: 'dev' },
    ];

    const sprintEvents = [
        { id: 'planning', name: 'Sprint Planning', icon: '📋' },
        { id: 'daily', name: 'Daily Scrum', icon: '☀️' },
        { id: 'review', name: 'Sprint Review', icon: '🔍' },
        { id: 'retro', name: 'Retrospective', icon: '🔄' },
    ];
    const correctSprintOrder = ['planning', 'daily', 'review', 'retro'];

    const valuesQuiz = [
        { id: 0, text: 'Il team si impegna a raggiungere gli obiettivi dello Sprint.', answer: 'Commitment', options: ['Focus', 'Commitment', 'Courage'] },
        { id: 1, text: 'Tutti nel team sono trasparenti sul proprio lavoro.', answer: 'Openness', options: ['Openness', 'Respect', 'Focus'] },
        { id: 2, text: 'Il team ha il coraggio di affrontare problemi difficili.', answer: 'Courage', options: ['Commitment', 'Openness', 'Courage'] },
        { id: 3, text: 'I membri del team rispettano le competenze reciproche.', answer: 'Respect', options: ['Respect', 'Focus', 'Commitment'] },
    ];

    // Helper: Add XP with animation
    const addXp = (amount: number) => {
        setXp(prev => prev + amount);
        setShowXpGain({ amount, id: Date.now() });
        setTimeout(() => setShowXpGain(null), 1000);
    };

    // Helper: Check completion
    const checkAllComplete = () => {
        if (completedSections.size === 3) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
        }
    };

    // Role Matching Logic
    const handleRoleDrop = (roleId: string, respId: string) => {
        const resp = responsibilities.find(r => r.id === respId);
        if (!resp) return;

        // Check if already placed somewhere
        for (const key of Object.keys(roleMatches)) {
            if (roleMatches[key].includes(respId)) return;
        }

        const isCorrect = resp.correctRole === roleId;

        setRoleMatches(prev => ({
            ...prev,
            [roleId]: [...prev[roleId], respId]
        }));

        setRoleAnimations(prev => ({ ...prev, [respId]: isCorrect ? 'animate-pulse-success' : 'animate-shake-error' }));
        setTimeout(() => setRoleAnimations(prev => ({ ...prev, [respId]: '' })), 600);

        if (isCorrect) {
            addXp(10);
        }

        // Check if all placed
        const totalPlaced = Object.values(roleMatches).flat().length + 1;
        if (totalPlaced === responsibilities.length) {
            setCompletedSections(prev => new Set([...prev, 'roles']));
            addXp(20);
            setTimeout(checkAllComplete, 500);
        }
    };

    // Sprint Cycle Logic
    const handleSprintDrop = (eventId: string) => {
        if (sprintOrder.includes(eventId)) return;

        const newOrder = [...sprintOrder, eventId];
        setSprintOrder(newOrder);

        const expectedIndex = newOrder.length - 1;
        const isCorrect = correctSprintOrder[expectedIndex] === eventId;

        setSprintAnimations(prev => ({ ...prev, [eventId]: isCorrect ? 'animate-pulse-success' : 'animate-shake-error' }));
        setTimeout(() => setSprintAnimations(prev => ({ ...prev, [eventId]: '' })), 600);

        if (isCorrect) addXp(15);

        if (newOrder.length === 4) {
            const allCorrect = newOrder.every((id, i) => correctSprintOrder[i] === id);
            if (allCorrect) {
                setCompletedSections(prev => new Set([...prev, 'sprint']));
                addXp(30);
                setTimeout(checkAllComplete, 500);
            }
        }
    };

    // Values Quiz Logic
    const handleValueSelect = (questionId: number, value: string) => {
        setValuesAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const checkValuesQuiz = () => {
        setValuesChecked(true);
        let correct = 0;
        valuesQuiz.forEach(q => {
            if (valuesAnswers[q.id] === q.answer) correct++;
        });
        addXp(correct * 5);
        if (correct === valuesQuiz.length) {
            setCompletedSections(prev => new Set([...prev, 'values']));
            addXp(25);
            setTimeout(checkAllComplete, 500);
        }
    };

    const progress = Math.round((completedSections.size / 3) * 100);
    const availableResponsibilities = responsibilities.filter(
        r => !Object.values(roleMatches).flat().includes(r.id)
    );
    const availableEvents = sprintEvents.filter(e => !sprintOrder.includes(e.id));

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-none">
                    <div className="text-center animate-bounce">
                        <div className="text-8xl mb-4">🎉</div>
                        <h2 className="text-4xl font-extrabold text-white">SCRUM MASTER!</h2>
                        <p className="text-xl text-accent font-bold mt-2">+100 XP Bonus</p>
                    </div>
                </div>
            )}

            {/* XP Float Animation */}
            {showXpGain && (
                <div className="fixed top-20 right-10 text-2xl font-bold text-accent animate-float-up z-50">
                    +{showXpGain.amount} XP
                </div>
            )}

            {/* Header with Progress */}
            <div className="bg-gradient-to-r from-sidebar to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-extrabold mb-1">🎮 Scrum Framework Challenge</h3>
                        <p className="text-gray-300 text-sm">Completa le sfide per padroneggiare Scrum!</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-extrabold text-accent">{xp} XP</div>
                        <div className="text-xs text-gray-400 uppercase font-bold">Punti Esperienza</div>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-accent font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-green-500 animate-glow' : 'bg-accent'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Challenge 1: Role Matching */}
            <div className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition-all ${completedSections.has('roles') ? 'border-green-400 bg-green-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{completedSections.has('roles') ? '✅' : '🎯'}</span>
                    <h4 className="font-extrabold text-lg text-sidebar">Sfida 1: Chi fa cosa?</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">+10 XP per match</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">Trascina ogni responsabilità sul ruolo corretto.</p>

                {/* Draggable Chips */}
                <div className="flex flex-wrap gap-2 mb-6 min-h-[50px] p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    {availableResponsibilities.map(resp => (
                        <div
                            key={resp.id}
                            draggable
                            onDragStart={e => e.dataTransfer.setData('respId', resp.id)}
                            className="px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-accent transition text-sm font-medium text-gray-700"
                        >
                            {resp.text}
                        </div>
                    ))}
                    {availableResponsibilities.length === 0 && (
                        <span className="text-gray-400 text-sm italic">Tutte le responsabilità assegnate! 🎉</span>
                    )}
                </div>

                {/* Role Drop Zones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'po', icon: '👑', name: 'Product Owner', color: 'indigo' },
                        { id: 'sm', icon: '🛡️', name: 'Scrum Master', color: 'pink' },
                        { id: 'dev', icon: '🛠️', name: 'Developers', color: 'green' },
                    ].map(role => (
                        <div
                            key={role.id}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                const respId = e.dataTransfer.getData('respId');
                                handleRoleDrop(role.id, respId);
                            }}
                            className={`bg-${role.color}-50 p-4 rounded-xl border-2 border-dashed border-${role.color}-200 min-h-[140px] transition-all hover:border-${role.color}-400`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{role.icon}</span>
                                <span className={`font-bold text-${role.color}-900`}>{role.name}</span>
                            </div>
                            <div className="space-y-2">
                                {roleMatches[role.id].map(respId => {
                                    const resp = responsibilities.find(r => r.id === respId);
                                    const isCorrect = resp?.correctRole === role.id;
                                    return (
                                        <div
                                            key={respId}
                                            className={`px-2 py-1 rounded text-xs font-medium ${roleAnimations[respId] || ''} ${isCorrect ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}
                                        >
                                            {isCorrect ? '✓' : '✗'} {resp?.text}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Challenge 2: Sprint Cycle Builder */}
            <div className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition-all ${completedSections.has('sprint') ? 'border-green-400 bg-green-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{completedSections.has('sprint') ? '✅' : '🔄'}</span>
                    <h4 className="font-extrabold text-lg text-sidebar">Sfida 2: Costruisci lo Sprint</h4>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">+15 XP per evento</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">Trascina gli eventi nell'ordine corretto per costruire uno Sprint.</p>

                {/* Available Events */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {availableEvents.map(event => (
                        <div
                            key={event.id}
                            draggable
                            onDragStart={e => e.dataTransfer.setData('eventId', event.id)}
                            className="px-4 py-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border-2 border-accent/30 cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-accent transition flex items-center gap-2"
                        >
                            <span className="text-2xl">{event.icon}</span>
                            <span className="font-bold text-gray-800">{event.name}</span>
                        </div>
                    ))}
                </div>

                {/* Timeline Drop Zone */}
                <div className="relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2"></div>
                    <div
                        className="flex justify-between relative z-10"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                            e.preventDefault();
                            const eventId = e.dataTransfer.getData('eventId');
                            handleSprintDrop(eventId);
                        }}
                    >
                        {[0, 1, 2, 3].map(i => {
                            const placedEvent = sprintOrder[i] ? sprintEvents.find(e => e.id === sprintOrder[i]) : null;
                            const isCorrect = sprintOrder[i] === correctSprintOrder[i];
                            return (
                                <div
                                    key={i}
                                    className={`w-36 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${placedEvent
                                        ? (isCorrect ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400')
                                        : 'bg-gray-50 border-gray-300 hover:border-accent'
                                        } ${placedEvent ? sprintAnimations[placedEvent.id] || '' : ''}`}
                                >
                                    {placedEvent ? (
                                        <>
                                            <span className="text-2xl">{placedEvent.icon}</span>
                                            <span className="text-xs font-bold mt-1">{placedEvent.name}</span>
                                            <span className="text-xs">{isCorrect ? '✅' : '❌'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-gray-400 text-2xl">?</span>
                                            <span className="text-xs text-gray-400">Step {i + 1}</span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Challenge 3: Values Quiz */}
            <div className={`bg-white rounded-2xl shadow-sm border-2 p-6 transition-all ${completedSections.has('values') ? 'border-green-400 bg-green-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{completedSections.has('values') ? '✅' : '💎'}</span>
                    <h4 className="font-extrabold text-lg text-sidebar">Sfida 3: I Valori Scrum</h4>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">+5 XP per risposta</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">Completa ogni frase scegliendo il valore Scrum corretto.</p>

                <div className="space-y-4">
                    {valuesQuiz.map(q => {
                        const isAnswered = valuesAnswers[q.id] !== undefined;
                        const isCorrect = valuesChecked && valuesAnswers[q.id] === q.answer;
                        const isWrong = valuesChecked && valuesAnswers[q.id] !== q.answer;
                        return (
                            <div
                                key={q.id}
                                className={`p-4 rounded-xl border transition-all ${isCorrect ? 'bg-green-50 border-green-300' :
                                    isWrong ? 'bg-red-50 border-red-300' :
                                        'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <p className="text-gray-700 mb-3">
                                    <span className="font-bold text-accent mr-2">#{q.id + 1}</span>
                                    {q.text}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    {q.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => !valuesChecked && handleValueSelect(q.id, opt)}
                                            disabled={valuesChecked}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${valuesAnswers[q.id] === opt
                                                ? (valuesChecked
                                                    ? (opt === q.answer ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                                                    : 'bg-accent text-white')
                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                                                } ${valuesChecked ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {isWrong && (
                                    <p className="text-xs text-red-600 mt-2">Risposta corretta: <strong>{q.answer}</strong></p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!valuesChecked && Object.keys(valuesAnswers).length === valuesQuiz.length && (
                    <button
                        onClick={checkValuesQuiz}
                        className="mt-6 w-full bg-gradient-to-r from-accent to-pink-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        ✨ Verifica Risposte
                    </button>
                )}
            </div>

            {/* Completion Message */}
            {progress === 100 && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white text-center animate-pulse-success">
                    <div className="text-5xl mb-4">🏆</div>
                    <h3 className="text-2xl font-extrabold mb-2">Congratulazioni!</h3>
                    <p className="text-green-100">Hai completato tutte le sfide del Framework Scrum!</p>
                    <div className="mt-4 text-4xl font-extrabold">{xp} XP Totali</div>
                </div>
            )}
        </div>
    );
};

// --- Phases Components ---

const PhaseMindset = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [accepted, setAccepted] = useState(project.phases.mindset?.completed || false);
    const [tab, setTab] = useState<'mindset' | 'scrum' | 'coach'>('mindset');
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
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
        } catch (e) { console.error(e); }
        setIsTyping(false);
    };

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
            <h2 className="text-3xl font-extrabold text-sidebar uppercase tracking-tight">1. AGILE MINDSET & SCRUM FRAMEWORK</h2>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border-light pb-1">
                <button onClick={() => setTab('mindset')} className={`pb-2 px-4 font-bold transition-all ${tab === 'mindset' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}>The Mindset Shift</button>
                <button onClick={() => setTab('scrum')} className={`pb-2 px-4 font-bold transition-all ${tab === 'scrum' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}>Scrum Framework</button>
                <button onClick={() => setTab('coach')} className={`pb-2 px-4 font-bold transition-all ${tab === 'coach' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}>🤖 AI Agile Coach</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {tab === 'mindset' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Interactive Toggle Header */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-100 p-1 rounded-full flex relative">
                                <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-full shadow-sm transition-all duration-300 ${accepted ? 'left-1/2' : 'left-0'}`}></div>
                                <button
                                    onClick={() => setAccepted(false)}
                                    className={`relative z-10 px-8 py-2 rounded-full text-sm font-bold transition-colors ${!accepted ? 'text-gray-800' : 'text-gray-400'}`}
                                >
                                    🏭 Old World
                                </button>
                                <button
                                    onClick={() => setAccepted(true)}
                                    className={`relative z-10 px-8 py-2 rounded-full text-sm font-bold transition-colors ${accepted ? 'text-accent' : 'text-gray-400'}`}
                                >
                                    🚀 The Quickworks Way
                                </button>
                            </div>
                        </div>

                        {!accepted ? (
                            <div className="bg-gray-200 p-10 rounded-2xl text-center cursor-not-allowed opacity-80 grayscale hover:grayscale-0 transition duration-500">
                                <div className="text-6xl mb-6">🦖</div>
                                <h3 className="text-2xl font-bold text-gray-700 mb-4">The "Waterfall" Era</h3>
                                <div className="max-w-md mx-auto space-y-4 text-left bg-white/50 p-6 rounded-xl">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <span className="text-red-500">❌</span> Big Upfront Planning
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <span className="text-red-500">❌</span> Years to see results
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <span className="text-red-500">❌</span> "It's not my job" silos
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <span className="text-red-500">❌</span> Fear of failure
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAccepted(true)}
                                    className="mt-8 bg-btn-primary hover:bg-btn-primary-hover text-white px-8 py-3 rounded-btn font-bold shadow-lg hover:scale-105 transition-all duration-200"
                                >
                                    ✨ Evolve to Quickworks Agile
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="text-center mb-4">
                                    <h3 className="text-3xl font-extrabold text-sidebar">Welcome to the Future!</h3>
                                    <p className="text-gray-500">Tap the cards to discover our superpowers.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        {
                                            icon: "💎",
                                            title: "Approccio MVP",
                                            desc: "QuickWorks parte dalla creazione di una visione e obiettivi chiari e condivisi. Si procede realizzando una prima versione semplificata del prodotto per raccogliere feedback immediati e ridurre i rischi di mercato."
                                        },
                                        {
                                            icon: "🔄",
                                            title: "Sviluppo Iterativo",
                                            desc: "Cicli brevi (Sprint) per vedere subito i risultati. Questo approccio favorisce un rapido adattamento, aumentando la flessibilità e la velocità di esecuzione."
                                        },
                                        {
                                            icon: "🏢",
                                            title: "Obeya Room",
                                            desc: "Uno spazio fisico o virtuale dedicato alla comunicazione e condivisione. Favorisce la trasparenza, la collaborazione e la rapida risoluzione dei problemi."
                                        },
                                        {
                                            icon: "🤝",
                                            title: "Team Autonomi",
                                            desc: "Membri 'alla pari' con libertà decisionale. Figure come Product Owner e Scrum Master bilanciano il team per massimizzare motivazione e risultati."
                                        },
                                        {
                                            icon: "📢",
                                            title: "Comunicazione Costante",
                                            desc: "Flusso continuo di informazioni tra team operativo e management (Steering Committee) per decisioni strategiche migliori e più informate."
                                        },
                                        {
                                            icon: "🪂",
                                            title: "Fail Safe Culture",
                                            desc: "Il fallimento 'rapido' non è un errore, ma un'opportunità di apprendimento. Usa le retrospettive per migliorare continuamente.",
                                            action: true
                                        }
                                    ].map((card, idx) => (
                                        <FlipCard key={idx} card={card} />
                                    ))}
                                </div>

                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={() => onSave({ completed: true, comment: 'Embraced Quickworks Way' })}
                                        className="bg-btn-primary hover:bg-btn-primary-hover text-white px-10 py-4 rounded-btn font-bold shadow-card hover:shadow-card-hover hover:scale-105 transition-all duration-200 text-lg flex items-center gap-2"
                                    >
                                        🚀 I'm Ready to Start!
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {tab === 'scrum' && (
                    <ScrumFrameworkInteractive />
                )}

                {
                    tab === 'coach' && (
                        <div className="flex flex-col h-full bg-white rounded-[16px] shadow-card border border-border-light overflow-hidden">
                            <div className="bg-white p-4 border-b border-border-light">
                                <h3 className="font-bold text-text-primary">Ask the Agile Coach</h3>
                                <p className="text-xs text-text-secondary">Ask about roles, ceremonies, or how to handle a situation.</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                {chatHistory.length === 0 && (
                                    <div className="text-center text-text-secondary mt-10">
                                        <div className="text-4xl mb-2">🤖</div>
                                        <p>Hi! I'm your AI Agile Coach. Ask me anything about Scrum!</p>
                                    </div>
                                )}
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-btn text-sm ${msg.role === 'user' ? 'bg-sidebar text-white rounded-tr-none' : 'bg-white border border-border-light shadow-card text-text-primary rounded-tl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && <div className="text-xs text-text-secondary ml-2">Coach is typing...</div>}
                            </div>
                            <div className="p-4 bg-white border-t border-border-light flex gap-2">
                                <input
                                    className="flex-1 border border-border-light rounded-btn px-4 py-3 focus:ring-2 focus:ring-btn-primary focus:border-btn-primary text-text-primary transition-all"
                                    placeholder="Type your question..."
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAskCoach()}
                                />
                                <button onClick={handleAskCoach} className="bg-btn-primary hover:bg-btn-primary-hover text-white px-6 py-3 rounded-btn font-bold transition-all duration-200">Send</button>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

const PhaseVision = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [inputs, setInputs] = useState(project.phases.vision?.inputs || {
        name: project.name,
        productName: '',
        functionality: '',
        target: '',
        problem: '',
        currentSolution: '',
        differentiation: '',
        constraints: ''
    });
    const [generatedVision, setGeneratedVision] = useState(project.phases.vision?.text || '');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Risk Analysis State
    const [risks, setRisks] = useState<any[]>(project.phases.vision?.risks || []);
    const [loadingRisks, setLoadingRisks] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const text = await aiService.generateVision(inputs);
            setGeneratedVision(text);
        } catch (e) { alert("AI Error"); }
        setLoading(false);
    };

    const handleAnalyzeRisks = async () => {
        if (!generatedVision) {
            alert("Prima genera la Vision!");
            return;
        }
        setLoadingRisks(true);
        try {
            const prompt = `
                Analizza i rischi per questo prodotto.
                Nome Prodotto: ${inputs.productName}
                Vision: ${generatedVision}
                Target: ${inputs.target}
                Problema: ${inputs.problem}
                Funzionamento: ${inputs.functionality}
                Vincoli: ${inputs.constraints}
                
                Genera un JSON array di 4-6 rischi principali in italiano.
                Per ogni rischio indica: impatto (Alto/Medio/Basso), categoria (Mercato/Tecnico/Risorse/Legale), e strategia di mitigazione.
                
                Rispondi SOLO con un JSON array valido, senza markdown:
                [{ "rischio": "descrizione", "impatto": "Alto", "categoria": "Mercato", "mitigazione": "strategia" }]
            `;

            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + (import.meta as any).env.VITE_API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: 'application/json' }
                })
            });
            const data = await response.json();
            console.log('Risk API Response:', data);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            const parsedRisks = JSON.parse(text);
            setRisks(parsedRisks);
        } catch (e) {
            console.error('Risk Analysis Error:', e);
            alert("Errore nell'analisi rischi. Controlla la console per dettagli.");
        }
        setLoadingRisks(false);
    };

    const impactColors: { [key: string]: string } = {
        'Alto': 'bg-red-100 text-red-800 border-red-200',
        'Medio': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Basso': 'bg-green-100 text-green-800 border-green-200',
    };

    const categoryIcons: { [key: string]: string } = {
        'Mercato': '📈',
        'Tecnico': '⚙️',
        'Risorse': '👥',
        'Legale': '⚖️',
    };

    return (
        <div className="space-y-8 h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-3xl font-extrabold text-sidebar">2. PRODUCT VISION</h2>

            {/* Main Content - Wider Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Inputs Panel - 2 columns */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <span className="text-xl">📝</span> Input Dati
                    </h3>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">🏷️ Nome del Prodotto</label>
                        <input
                            type="text"
                            className="w-full border border-gray-200 p-4 rounded-xl text-gray-800 bg-blue-50 font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Es: ScrumAI Manager, QuickTask, Agile Coach Pro..."
                            value={inputs.productName}
                            onChange={e => setInputs({ ...inputs, productName: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">⚙️ Descrizione Funzionamento</label>
                        <textarea
                            className="w-full border border-gray-200 p-4 rounded-xl text-gray-800 bg-blue-50 min-h-[100px] resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Descrivi come funziona il prodotto: le funzionalità principali, il flusso utente, le tecnologie chiave..."
                            value={inputs.functionality}
                            onChange={e => setInputs({ ...inputs, functionality: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Audience</label>
                        <textarea
                            className="w-full border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 min-h-[80px] resize-y focus:ring-2 focus:ring-accent focus:border-accent transition"
                            placeholder="Chi sono i tuoi utenti target? Descrivi il profilo, i bisogni, le caratteristiche demografiche..."
                            value={inputs.target}
                            onChange={e => setInputs({ ...inputs, target: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Problema da Risolvere</label>
                        <textarea
                            className="w-full border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 min-h-[100px] resize-y focus:ring-2 focus:ring-accent focus:border-accent transition"
                            placeholder="Qual è il problema principale che il tuo prodotto risolve? Descrivi il pain point..."
                            value={inputs.problem}
                            onChange={e => setInputs({ ...inputs, problem: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Soluzione Attuale</label>
                        <textarea
                            className="w-full border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 min-h-[80px] resize-y focus:ring-2 focus:ring-accent focus:border-accent transition"
                            placeholder="Come risolvono attualmente il problema i tuoi utenti? Quali alternative esistono?"
                            value={inputs.currentSolution}
                            onChange={e => setInputs({ ...inputs, currentSolution: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Differenziazione</label>
                        <textarea
                            className="w-full border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 min-h-[80px] resize-y focus:ring-2 focus:ring-accent focus:border-accent transition"
                            placeholder="Cosa rende unico il tuo prodotto? Qual è il vantaggio competitivo?"
                            value={inputs.differentiation}
                            onChange={e => setInputs({ ...inputs, differentiation: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                            <span className="flex items-center gap-2">
                                ⚠️ Vincoli
                                <span className="text-[10px] normal-case font-normal text-gray-400">(Budget, tempo, tecnologie, regolamenti...)</span>
                            </span>
                        </label>
                        <textarea
                            className="w-full border border-gray-200 p-4 rounded-xl text-gray-800 bg-amber-50 min-h-[80px] resize-y focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                            placeholder="Elenca i vincoli del progetto: budget massimo, deadline, tecnologie obbligatorie, requisiti normativi..."
                            value={inputs.constraints}
                            onChange={e => setInputs({ ...inputs, constraints: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-sidebar to-gray-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⏳</span> Generazione in corso...
                            </span>
                        ) : '✨ Genera Vision con AI'}
                    </button>
                </div>

                {/* Vision Output Panel - 3 columns */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="text-xl">🎯</span> Vision Statement
                        </h3>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`text-xs px-3 py-1 rounded-lg font-bold transition ${isEditing ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {isEditing ? '📖 Vista Formattata' : '✏️ Modifica Testo'}
                        </button>
                    </div>

                    {isEditing ? (
                        <textarea
                            className="flex-1 border border-gray-200 rounded-xl p-5 bg-gray-50 text-gray-800 min-h-[400px] font-mono text-sm resize-none focus:ring-2 focus:ring-accent"
                            value={generatedVision}
                            onChange={e => setGeneratedVision(e.target.value)}
                            placeholder="La vision verrà generata qui..."
                        />
                    ) : (
                        <div
                            className="flex-1 border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white text-gray-800 min-h-[400px] overflow-y-auto custom-scrollbar prose prose-lg max-w-none
                                prose-headings:text-sidebar prose-headings:font-extrabold
                                prose-h3:text-2xl prose-h3:border-b prose-h3:border-accent/30 prose-h3:pb-2 prose-h3:mb-4
                                prose-p:text-gray-700 prose-p:leading-relaxed
                                prose-strong:text-accent prose-strong:font-bold
                                prose-ul:my-4 prose-li:text-gray-700
                                prose-em:text-sidebar prose-em:font-medium"
                            dangerouslySetInnerHTML={{
                                __html: generatedVision || '<p class="text-gray-400 italic">La vision verrà generata qui dopo aver inserito i dati e cliccato il pulsante...</p>'
                            }}
                        />
                    )}

                    <button
                        onClick={() => onSave({ inputs, text: generatedVision, risks })}
                        className="mt-4 bg-accent text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        💾 Salva Vision e Continua
                    </button>
                </div>
            </div>

            {/* Risk Analysis Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-xl text-sidebar flex items-center gap-2">
                            <span className="text-2xl">⚠️</span> Analisi Rischi
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Identifica i potenziali rischi del prodotto e le strategie di mitigazione</p>
                    </div>
                    <button
                        onClick={handleAnalyzeRisks}
                        disabled={loadingRisks || !generatedVision}
                        className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loadingRisks ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Analisi...
                            </span>
                        ) : '🔍 Analizza Rischi con AI'}
                    </button>
                </div>

                {risks.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                        <div className="text-4xl mb-3">🛡️</div>
                        <p className="text-gray-500">Clicca sul pulsante per generare un'analisi dei rischi basata sulla tua Vision.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {risks.map((risk, i) => (
                            <div
                                key={i}
                                className={`p-5 rounded-xl border-l-4 ${risk.impatto === 'Alto' ? 'border-l-red-500 bg-red-50' :
                                    risk.impatto === 'Medio' ? 'border-l-yellow-500 bg-yellow-50' :
                                        'border-l-green-500 bg-green-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{categoryIcons[risk.categoria] || '📌'}</span>
                                        <span className="text-xs font-bold uppercase text-gray-500">{risk.categoria}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${impactColors[risk.impatto] || 'bg-gray-100'}`}>
                                        {risk.impatto}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-800 mb-2">{risk.rischio}</h4>
                                <div className="flex items-start gap-2 text-sm text-gray-600 bg-white/50 p-3 rounded-lg">
                                    <span className="text-lg">🛡️</span>
                                    <span><strong>Mitigazione:</strong> {risk.mitigazione}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const PhaseObjectives = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [deadline, setDeadline] = useState(project.phases.objectives?.deadline || '');
    const [objectives, setObjectives] = useState<any[]>(project.phases.objectives?.objectives || []);
    const [loading, setLoading] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!project.phases.vision?.text) {
            alert("Prima completa la Product Vision!");
            return;
        }
        setLoading(true);
        try {
            const result = await aiService.generateObjectives(project.phases.vision.text, deadline);
            setObjectives(result);
        } catch (e) {
            console.error(e);
            alert("AI Error");
        }
        setLoading(false);
    };

    const addObjective = () => {
        setObjectives([...objectives, {
            title: 'Nuovo Obiettivo',
            description: '',
            specific: '',
            measurable: '',
            achievable: '',
            relevant: '',
            timeBound: deadline
        }]);
    };

    const deleteObjective = (idx: number) => {
        setObjectives(objectives.filter((_, i) => i !== idx));
    };

    const updateObjective = (idx: number, field: string, value: string) => {
        const updated = [...objectives];
        updated[idx][field] = value;
        setObjectives(updated);
    };

    // Convert objectives to text for KPIs generation (backwards compatibility)
    const objectivesAsText = objectives.map(o => `<b>${o.title}</b>: ${o.description}`).join('<br/>');

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] overflow-y-auto pr-2">
            <h2 className="text-3xl font-extrabold text-sidebar">3. STRATEGIC OBJECTIVES</h2>

            {/* Vision Summary - Enlarged */}
            <div className="bg-gradient-to-r from-sidebar to-gray-800 rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <span className="text-xl">🎯</span> Vision Statement di Riferimento
                </h3>
                <div
                    className="prose prose-invert prose-sm max-w-none max-h-[300px] overflow-y-auto custom-scrollbar
                        prose-headings:text-white prose-p:text-gray-200 prose-strong:text-accent
                        bg-white/5 rounded-xl p-4"
                    dangerouslySetInnerHTML={{ __html: project.phases.vision?.text || '<p class="text-gray-400 italic">Nessuna vision trovata. Completa la Product Vision.</p>' }}
                />
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📅 Deadline Progetto</label>
                    <input
                        type="date"
                        className="w-full border border-gray-200 p-3 rounded-xl text-gray-800 bg-gray-50 focus:ring-2 focus:ring-accent"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                    />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !deadline}
                        className="bg-gradient-to-r from-sidebar to-gray-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
                    >
                        {loading ? '⏳ Generazione...' : '✨ Genera Obiettivi con AI'}
                    </button>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                    <button
                        onClick={addObjective}
                        className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Aggiungi Obiettivo
                    </button>
                </div>
            </div>

            {/* Objectives List */}
            <div className="space-y-4">
                {objectives.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                        <div className="text-5xl mb-4">🎯</div>
                        <p className="text-gray-500">Nessun obiettivo definito. Genera con AI o aggiungine uno manualmente.</p>
                    </div>
                ) : (
                    objectives.map((obj, idx) => (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div
                                className="p-4 flex justify-between items-start cursor-pointer hover:bg-gray-50 transition"
                                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                                    <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                                        {idx + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={obj.title}
                                        onChange={e => updateObjective(idx, 'title', e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        className="w-full text-lg font-bold text-sidebar bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-accent focus:outline-none rounded-none px-1 py-1"
                                        placeholder="Titolo Obiettivo"
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteObjective(idx); }}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                                        title="Elimina"
                                    >
                                        🗑️
                                    </button>
                                    <span className="text-gray-400 text-xl">
                                        {expandedIdx === idx ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedIdx === idx && (
                                <div className="p-5 pt-0 border-t border-gray-100 space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-2">📝 Descrizione Completa</label>
                                        <textarea
                                            value={obj.description}
                                            onChange={e => updateObjective(idx, 'description', e.target.value)}
                                            className="w-full border border-gray-200 p-4 rounded-xl bg-gray-50 min-h-[100px] resize-y text-gray-800"
                                            placeholder="Descrizione dettagliata dell'obiettivo..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                            <label className="block text-sm font-bold text-blue-800 mb-2">🎯 COSA</label>
                                            <textarea
                                                value={obj.specific}
                                                onChange={e => updateObjective(idx, 'specific', e.target.value)}
                                                className="w-full bg-white border border-blue-300 p-3 rounded-lg text-sm min-h-[120px] resize-y text-gray-800"
                                                placeholder="Cosa vuoi raggiungere esattamente? Descrivi in dettaglio..."
                                            />
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                            <label className="block text-sm font-bold text-green-800 mb-2">📏 COME</label>
                                            <textarea
                                                value={obj.measurable}
                                                onChange={e => updateObjective(idx, 'measurable', e.target.value)}
                                                className="w-full bg-white border border-green-300 p-3 rounded-lg text-sm min-h-[120px] resize-y text-gray-800"
                                                placeholder="Come misurerai il successo? Quali metriche userai?"
                                            />
                                        </div>
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                            <label className="block text-sm font-bold text-yellow-800 mb-2">✅ PERCHÉ</label>
                                            <textarea
                                                value={obj.achievable}
                                                onChange={e => updateObjective(idx, 'achievable', e.target.value)}
                                                className="w-full bg-white border border-yellow-300 p-3 rounded-lg text-sm min-h-[120px] resize-y text-gray-800"
                                                placeholder="Perché è raggiungibile? Quali risorse hai a disposizione?"
                                            />
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                            <label className="block text-sm font-bold text-purple-800 mb-2">💡 IMPORTANZA</label>
                                            <textarea
                                                value={obj.relevant}
                                                onChange={e => updateObjective(idx, 'relevant', e.target.value)}
                                                className="w-full bg-white border border-purple-300 p-3 rounded-lg text-sm min-h-[120px] resize-y text-gray-800"
                                                placeholder="Perché è importante per il progetto? Quale valore aggiunge?"
                                            />
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-200 md:col-span-2">
                                            <label className="block text-sm font-bold text-red-800 mb-2">⏰ QUANDO</label>
                                            <textarea
                                                value={obj.timeBound}
                                                onChange={e => updateObjective(idx, 'timeBound', e.target.value)}
                                                className="w-full bg-white border border-red-300 p-3 rounded-lg text-sm min-h-[80px] resize-y text-gray-800"
                                                placeholder="Entro quando deve essere completato? Data o milestone..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-gradient-to-t from-bg to-transparent pt-4 pb-2">
                <button
                    onClick={() => onSave({ objectives, deadline, text: objectivesAsText })}
                    className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                    💾 Salva Obiettivi e Continua
                </button>
            </div>
        </div>
    );
};

const PhaseKPIs = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [kpis, setKpis] = useState<any[]>(project.phases.kpis?.table || []);
    const [loading, setLoading] = useState(false);

    // Get objectives from previous phase
    const objectives = project.phases.objectives?.objectives || [];

    const handleGenerate = async () => {
        if (!project.phases.objectives?.text && objectives.length === 0) {
            alert("Please complete Objectives first.");
            return;
        }
        setLoading(true);
        try {
            const objectivesText = objectives.map((o: any) => o.title).join(', ') || project.phases.objectives?.text;
            const result = await aiService.generateKPIs(objectivesText);
            // Add objectiveId to each generated KPI (link to first objective by default)
            const kpisWithObjective = result.map((kpi: any, idx: number) => ({
                ...kpi,
                objectiveId: objectives[idx % objectives.length]?.title || ''
            }));
            setKpis(kpisWithObjective);
        } catch (e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };

    const updateKpi = (index: number, field: string, value: string) => {
        const newKpis = [...kpis];
        newKpis[index][field] = value;
        setKpis(newKpis);
    };

    const addKpi = () => {
        setKpis([...kpis, {
            kpi: 'Nuovo KPI',
            target: '',
            metric: '%',
            frequency: 'Mensile',
            objectiveId: objectives[0]?.title || ''
        }]);
    };

    const deleteKpi = (index: number) => {
        setKpis(kpis.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-sidebar">4. KEY PERFORMANCE INDICATORS</h2>
                <div className="flex gap-3">
                    <button
                        onClick={addKpi}
                        className="bg-btn-primary hover:bg-btn-primary-hover text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                    >
                        <span className="text-lg">+</span> Aggiungi KPI
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : '✨ Generate KPIs'}
                    </button>
                </div>
            </div>

            {/* Objectives Reference */}
            {objectives.length > 0 && (
                <div className="bg-gradient-to-r from-sidebar to-gray-800 rounded-2xl p-4 text-white">
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                        <span>🎯</span> Obiettivi di Riferimento
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {objectives.map((obj: any, i: number) => (
                            <span key={i} className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">
                                {obj.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full table-fixed">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="w-[30%] px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">KPI Name</th>
                            <th className="w-[20%] px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Obiettivo</th>
                            <th className="w-[12%] px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Target</th>
                            <th className="w-[12%] px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Metric</th>
                            <th className="w-[14%] px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Frequency</th>
                            <th className="w-[12%] px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {kpis.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    No KPIs generated yet. Click "Aggiungi KPI" or "Generate KPIs" to start.
                                </td>
                            </tr>
                        )}
                        {kpis.map((kpi, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-900 p-2 resize-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary min-h-[60px]"
                                        value={kpi.kpi}
                                        onChange={e => updateKpi(i, 'kpi', e.target.value)}
                                        rows={2}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        className="w-full border border-gray-200 rounded-lg bg-white text-sm text-gray-600 p-2 focus:ring-2 focus:ring-btn-primary"
                                        value={kpi.objectiveId || ''}
                                        onChange={e => updateKpi(i, 'objectiveId', e.target.value)}
                                    >
                                        <option value="">-- Seleziona --</option>
                                        {objectives.map((obj: any, j: number) => (
                                            <option key={j} value={obj.title}>{obj.title}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        className="w-full border border-gray-200 rounded-lg bg-white text-sm text-gray-600 p-2 focus:ring-2 focus:ring-btn-primary"
                                        value={kpi.target}
                                        onChange={e => updateKpi(i, 'target', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        className="w-full border border-gray-200 rounded-lg bg-white text-sm text-gray-600 p-2 focus:ring-2 focus:ring-btn-primary"
                                        value={kpi.metric}
                                        onChange={e => updateKpi(i, 'metric', e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        className="w-full border border-gray-200 rounded-lg bg-white text-sm text-gray-600 p-2 focus:ring-2 focus:ring-btn-primary"
                                        value={kpi.frequency}
                                        onChange={e => updateKpi(i, 'frequency', e.target.value)}
                                    >
                                        <option value="Giornaliero">Giornaliero</option>
                                        <option value="Settimanale">Settimanale</option>
                                        <option value="Mensile">Mensile</option>
                                        <option value="Trimestrale">Trimestrale</option>
                                        <option value="Annuale">Annuale</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => deleteKpi(i)}
                                        className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                                        title="Elimina KPI"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {kpis.length > 0 && (
                <button
                    onClick={() => onSave({ table: kpis })}
                    className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:bg-opacity-90 transition-all"
                >
                    💾 Salva KPIs & Continua
                </button>
            )}
        </div>
    );
}

const PhaseBacklog = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [epics, setEpics] = useState<Epic[]>(project.phases.backlog?.epics || []);
    const [loading, setLoading] = useState(false);
    const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);

    // Get objectives and KPIs for AI context
    const objectives = project.phases.objectives?.objectives || [];
    const kpis = project.phases.kpis?.table || [];

    const handleGenerate = async (isRegenerate: boolean = false) => {
        if (isRegenerate && epics.length > 0) {
            setShowConfirmRegenerate(true);
            return;
        }
        await doGenerate();
    };

    const doGenerate = async () => {
        setLoading(true);
        setShowConfirmRegenerate(false);
        try {
            const result = await aiService.generateBacklog(
                project.phases.vision?.text || '',
                objectives,
                kpis
            );
            // Transform AI result to typed Epics with DEEP fields
            const newEpics: Epic[] = result.map((e: any, i: number) => ({
                id: `epic-${Date.now()}-${i}`,
                title: e.title,
                description: e.description || '',
                priority: e.priority || i + 1,
                tshirtSize: e.tshirtSize || 'M',
                objectiveId: objectives[e.objectiveIndex]?.title ? `obj-${e.objectiveIndex}` : undefined,
                targetKpiIds: [],
                stories: (e.stories || []).map((s: any, j: number) => ({
                    id: `story-${Date.now()}-${i}-${j}`,
                    title: s.title,
                    description: s.description,
                    acceptanceCriteria: s.acceptanceCriteria || [],
                    storyPoints: 0,
                    estimatedHours: 0,
                    status: 'todo' as const,
                    isInSprint: false,
                    assigneeIds: [],
                    priority: s.priority || j + 1,
                    detailLevel: s.detailLevel || 'medium' as const
                }))
            }));
            setEpics(newEpics);
        } catch (e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };

    // CRUD Operations
    const updateEpic = (index: number, field: string, value: any) => {
        const newEpics = [...epics];
        (newEpics[index] as any)[field] = value;
        setEpics(newEpics);
    };

    const deleteEpic = (index: number) => {
        if (confirm('Eliminare questo Epic e tutte le sue User Stories?')) {
            setEpics(epics.filter((_, i) => i !== index));
        }
    };

    const addEpic = () => {
        const newEpic: Epic = {
            id: `epic-${Date.now()}`,
            title: 'Nuovo Epic',
            description: '',
            priority: epics.length + 1,
            tshirtSize: 'M',
            stories: []
        };
        setEpics([...epics, newEpic]);
    };

    const updateStory = (epicIndex: number, storyIndex: number, field: string, val: any) => {
        const newEpics = [...epics];
        (newEpics[epicIndex].stories[storyIndex] as any)[field] = val;
        setEpics(newEpics);
    };

    const deleteStory = (epicIndex: number, storyIndex: number) => {
        const newEpics = [...epics];
        newEpics[epicIndex].stories = newEpics[epicIndex].stories.filter((_, i) => i !== storyIndex);
        setEpics(newEpics);
    };

    const addStory = (epicIndex: number) => {
        const newEpics = [...epics];
        const newStory = {
            id: `story-${Date.now()}`,
            title: 'As a user, I want...',
            description: '',
            acceptanceCriteria: [],
            storyPoints: 0,
            estimatedHours: 0,
            status: 'todo' as const,
            isInSprint: false,
            assigneeIds: [],
            priority: newEpics[epicIndex].stories.length + 1,
            detailLevel: 'medium' as const
        };
        newEpics[epicIndex].stories.push(newStory);
        setEpics(newEpics);
    };

    const addAcceptanceCriteria = (epicIndex: number, storyIndex: number) => {
        const newEpics = [...epics];
        newEpics[epicIndex].stories[storyIndex].acceptanceCriteria.push('Nuovo criterio...');
        setEpics(newEpics);
    };

    const updateAcceptanceCriteria = (epicIndex: number, storyIndex: number, acIndex: number, value: string) => {
        const newEpics = [...epics];
        newEpics[epicIndex].stories[storyIndex].acceptanceCriteria[acIndex] = value;
        setEpics(newEpics);
    };

    const deleteAcceptanceCriteria = (epicIndex: number, storyIndex: number, acIndex: number) => {
        const newEpics = [...epics];
        newEpics[epicIndex].stories[storyIndex].acceptanceCriteria =
            newEpics[epicIndex].stories[storyIndex].acceptanceCriteria.filter((_, i) => i !== acIndex);
        setEpics(newEpics);
    };

    // T-shirt size colors
    const tshirtColors: Record<string, string> = {
        'XS': 'bg-green-100 text-green-700 border-green-200',
        'S': 'bg-blue-100 text-blue-700 border-blue-200',
        'M': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'L': 'bg-orange-100 text-orange-700 border-orange-200',
        'XL': 'bg-red-100 text-red-700 border-red-200'
    };

    // Detail level badges
    const detailLevelBadges: Record<string, { color: string; label: string }> = {
        'high': { color: 'bg-green-500', label: '🎯 Sprint-Ready' },
        'medium': { color: 'bg-yellow-500', label: '📋 In Refinement' },
        'low': { color: 'bg-gray-400', label: '💭 Future Idea' }
    };

    // Sort epics by priority
    const sortedEpics = [...epics].sort((a, b) => a.priority - b.priority);

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] overflow-y-auto pr-2">
            {/* Header */}
            <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-sidebar">5. PRODUCT BACKLOG</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestione backlog con criteri DEEP: Dettagliato, Emergente, Stimato, Prioritizzato
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={addEpic}
                        className="bg-white border-2 border-accent text-accent px-4 py-2 rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-all"
                    >
                        + Aggiungi Epic
                    </button>
                    {epics.length > 0 && (
                        <button
                            onClick={() => handleGenerate(true)}
                            disabled={loading}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                        >
                            🔄 Rigenera
                        </button>
                    )}
                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={loading}
                        className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Generazione...
                            </span>
                        ) : '✨ Genera Backlog AI'}
                    </button>
                </div>
            </div>

            {/* Regenerate Confirmation Modal */}
            {showConfirmRegenerate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md shadow-xl">
                        <h3 className="text-xl font-bold text-sidebar mb-3">⚠️ Rigenerare il Backlog?</h3>
                        <p className="text-gray-600 mb-6">
                            Questa azione sostituirà tutti gli Epic e le User Stories esistenti con una nuova generazione AI.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmRegenerate(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold hover:bg-gray-50"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={doGenerate}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600"
                            >
                                🔄 Sì, Rigenera
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DEEP Legend */}
            <div className="bg-gradient-to-r from-sidebar to-gray-800 rounded-xl p-4 text-white">
                <div className="flex items-center gap-6 text-sm">
                    <span className="font-bold">DEEP:</span>
                    <span className="flex items-center gap-1">📊 <strong>D</strong>etailed Appropriately</span>
                    <span className="flex items-center gap-1">🔄 <strong>E</strong>mergent</span>
                    <span className="flex items-center gap-1">📐 <strong>E</strong>stimated</span>
                    <span className="flex items-center gap-1">🎯 <strong>P</strong>rioritized</span>
                </div>
            </div>

            {/* Empty state */}
            {epics.length === 0 && (
                <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Nessun Backlog Generato</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Clicca "✨ Genera Backlog AI" per creare automaticamente Epic e User Stories basate sulla tua Vision, Obiettivi e KPI.
                    </p>
                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={loading}
                        className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
                    >
                        ✨ Genera il tuo Backlog
                    </button>
                </div>
            )}

            {/* Epics List */}
            <div className="space-y-4">
                {sortedEpics.map((epic, i) => {
                    const originalIndex = epics.findIndex(e => e.id === epic.id);
                    return (
                        <div key={epic.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Epic Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    {/* Priority Badge */}
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${epic.priority <= 2 ? 'bg-red-500 text-white' :
                                        epic.priority <= 4 ? 'bg-yellow-500 text-white' :
                                            'bg-gray-400 text-white'
                                        }`}>
                                        {epic.priority}
                                    </span>

                                    {/* Epic Title */}
                                    <input
                                        className="font-bold text-lg text-sidebar bg-transparent border-b border-transparent hover:border-gray-300 focus:border-accent flex-1 transition-all"
                                        value={epic.title}
                                        onChange={e => updateEpic(originalIndex, 'title', e.target.value)}
                                        placeholder="Titolo Epic..."
                                    />

                                    {/* T-shirt Size Selector */}
                                    <select
                                        value={epic.tshirtSize}
                                        onChange={e => updateEpic(originalIndex, 'tshirtSize', e.target.value)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-full border ${tshirtColors[epic.tshirtSize]} cursor-pointer`}
                                    >
                                        <option value="XS">XS</option>
                                        <option value="S">S</option>
                                        <option value="M">M</option>
                                        <option value="L">L</option>
                                        <option value="XL">XL</option>
                                    </select>

                                    {/* Stories Count */}
                                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        {epic.stories.length} Stories
                                    </span>

                                    {/* Delete Epic */}
                                    <button
                                        onClick={() => deleteEpic(originalIndex)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Elimina Epic"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                {/* Epic Description */}
                                <input
                                    className="w-full text-sm text-gray-500 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-accent transition-all"
                                    value={epic.description || ''}
                                    onChange={e => updateEpic(originalIndex, 'description', e.target.value)}
                                    placeholder="Descrizione dell'Epic (opzionale)..."
                                />
                            </div>

                            {/* Stories */}
                            <div className="divide-y divide-gray-100">
                                {epic.stories.map((story, j) => (
                                    <div key={story.id} className="p-6 hover:bg-gray-50/50 transition group">
                                        <div className="flex items-start gap-3 mb-3">
                                            {/* Story Priority */}
                                            <span className="text-xs font-bold text-gray-400 bg-gray-100 w-6 h-6 rounded flex items-center justify-center shrink-0">
                                                {j + 1}
                                            </span>

                                            {/* Story Title */}
                                            <input
                                                className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-accent flex-1 transition-all"
                                                value={story.title}
                                                onChange={e => updateStory(originalIndex, j, 'title', e.target.value)}
                                                placeholder="As a... I want... So that..."
                                            />

                                            {/* Detail Level Badge */}
                                            <select
                                                value={story.detailLevel || 'medium'}
                                                onChange={e => updateStory(originalIndex, j, 'detailLevel', e.target.value)}
                                                className={`text-[10px] font-bold px-2 py-1 rounded-full ${story.detailLevel === 'high' ? 'bg-green-100 text-green-700' :
                                                    story.detailLevel === 'low' ? 'bg-gray-100 text-gray-500' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}
                                            >
                                                <option value="high">🎯 Sprint-Ready</option>
                                                <option value="medium">📋 In Refinement</option>
                                                <option value="low">💭 Future</option>
                                            </select>

                                            {/* Story Points */}
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded shrink-0">
                                                SP: {story.storyPoints}
                                            </span>

                                            {/* Delete Story */}
                                            <button
                                                onClick={() => deleteStory(originalIndex, j)}
                                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Elimina Story"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Story Description */}
                                        <textarea
                                            className="w-full text-sm text-gray-600 mb-3 bg-transparent border border-transparent hover:border-gray-200 focus:border-accent rounded p-2 resize-none transition-all"
                                            value={story.description}
                                            onChange={e => updateStory(originalIndex, j, 'description', e.target.value)}
                                            placeholder="Descrizione dettagliata..."
                                            rows={2}
                                        />

                                        {/* Acceptance Criteria */}
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs font-bold text-blue-800">Acceptance Criteria:</p>
                                                <button
                                                    onClick={() => addAcceptanceCriteria(originalIndex, j)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                                                >
                                                    + Aggiungi
                                                </button>
                                            </div>
                                            <ul className="space-y-1">
                                                {story.acceptanceCriteria.map((ac, k) => (
                                                    <li key={k} className="flex items-center gap-2 group/ac">
                                                        <span className="text-blue-400">•</span>
                                                        <input
                                                            className="flex-1 text-xs text-blue-700 bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500"
                                                            value={ac}
                                                            onChange={e => updateAcceptanceCriteria(originalIndex, j, k, e.target.value)}
                                                        />
                                                        <button
                                                            onClick={() => deleteAcceptanceCriteria(originalIndex, j, k)}
                                                            className="text-blue-300 hover:text-red-500 opacity-0 group-hover/ac:opacity-100 text-xs"
                                                        >
                                                            ✕
                                                        </button>
                                                    </li>
                                                ))}
                                                {story.acceptanceCriteria.length === 0 && (
                                                    <li className="text-xs text-blue-400 italic">Nessun criterio definito</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Story Button */}
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => addStory(originalIndex)}
                                    className="text-sm text-gray-500 hover:text-accent font-medium transition-colors"
                                >
                                    + Aggiungi User Story
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            {epics.length > 0 && (
                <button
                    onClick={() => onSave({ epics })}
                    className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:bg-opacity-90 transition-all sticky bottom-0"
                >
                    💾 Salva Backlog & Continua
                </button>
            )}
        </div>
    );
};

const PhaseTeam = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [members, setMembers] = useState<TeamMember[]>(project.phases.team?.members || []);
    const [loading, setLoading] = useState(false);
    const [healthMetrics, setHealthMetrics] = useState<any>(null);
    const [expandedMember, setExpandedMember] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Calculate health metrics when members change
    useEffect(() => {
        if (members.length > 0) {
            aiService.analyzeTeamHealth({
                members,
                activities: [],
                sprintData: project.phases.sprint
            }).then(setHealthMetrics);
        }
    }, [members]);

    const handleSuggestTeam = async () => {
        setLoading(true);
        try {
            const epics = project.phases.backlog?.epics || [];
            const suggested = await aiService.suggestTeam(
                project.phases.vision?.text || '',
                epics,
                'medium'
            );
            setMembers([...members, ...suggested]);
        } catch (e) {
            console.error(e);
            alert("AI Error");
        }
        setLoading(false);
    };

    const addMember = () => {
        const colors = ['#FF5A6E', '#4ADE80', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
        const newMember: TeamMember = {
            id: `member-${Date.now()}`,
            name: 'Nuovo Membro',
            role: 'Dev',
            skills: [],
            hoursPerWeek: 40,
            availability: 100,
            aiComfortLevel: 3,
            avatarColor: colors[members.length % colors.length]
        };
        setMembers([...members, newMember]);
        setExpandedMember(newMember.id);
        setShowAddForm(false);
    };

    const updateMember = (id: string, field: string, val: any) => {
        setMembers(members.map(m => m.id === id ? { ...m, [field]: val } : m));
    };

    const deleteMember = (id: string) => {
        if (confirm('Eliminare questo membro del team?')) {
            setMembers(members.filter(m => m.id !== id));
        }
    };

    const roleIcons: Record<string, string> = {
        'PO': '🎯', 'SM': '🛡️', 'Dev': '💻', 'Designer': '🎨', 'QA': '🔍', 'Other': '👤'
    };

    const getHealthColor = (value: number) => {
        if (value >= 75) return 'bg-green-500';
        if (value >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getHealthLabel = (value: number) => {
        if (value >= 75) return 'Ottimo';
        if (value >= 50) return 'Attenzione';
        return 'Critico';
    };

    const healthPillars = healthMetrics ? [
        { key: 'psychologicalSafety', icon: '🛡️', label: 'Sicurezza Psicologica', ...healthMetrics.psychologicalSafety },
        { key: 'strategicAlignment', icon: '🎯', label: 'Allineamento Strategico', ...healthMetrics.strategicAlignment },
        { key: 'crossFunctionality', icon: '👥', label: 'Cross-Funzionalità', ...healthMetrics.crossFunctionality },
        { key: 'aiFluency', icon: '🤖', label: 'AI-Fluency', ...healthMetrics.aiFluency }
    ] : [];

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] overflow-y-auto pr-2">
            {/* Header */}
            <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-sidebar">6. AGILE TEAM</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestione del team con monitoraggio salute in stile Obeya Room
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={addMember}
                        className="bg-white border-2 border-accent text-accent px-4 py-2 rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-all"
                    >
                        + Aggiungi Membro
                    </button>
                    <button
                        onClick={handleSuggestTeam}
                        disabled={loading}
                        className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Analisi...
                            </span>
                        ) : '✨ Suggerisci Team AI'}
                    </button>
                </div>
            </div>

            {/* Health Monitor Dashboard - Obeya Style */}
            {members.length > 0 && healthMetrics && (
                <div className="bg-gradient-to-r from-sidebar to-gray-800 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            🏥 AI TEAM HEALTH MONITOR
                        </h3>
                        <span className="text-xs text-gray-400">
                            Ultimo aggiornamento: {new Date(healthMetrics.lastUpdated).toLocaleString('it-IT')}
                        </span>
                    </div>

                    {/* 4 Pillars */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {healthPillars.map(pillar => (
                            <div key={pillar.key} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{pillar.icon}</span>
                                    <span className="text-xs font-bold uppercase tracking-wide">{pillar.label}</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className={`w-4 h-4 rounded-full ${getHealthColor(pillar.value)}`}></span>
                                    <span className="text-3xl font-extrabold">{pillar.value}%</span>
                                    <span className={`text-xs ${pillar.trend === 'up' ? 'text-green-400' : pillar.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                                        {pillar.trend === 'up' ? '↑' : pillar.trend === 'down' ? '↓' : '→'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{getHealthLabel(pillar.value)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Active Alerts */}
                    {healthPillars.some(p => p.alerts?.length > 0) && (
                        <div className="mt-4 space-y-2">
                            {healthPillars.flatMap(p => p.alerts || []).map((alert: any) => (
                                <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-lg ${alert.severity === 'critical' ? 'bg-red-500/20' :
                                    alert.severity === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                                    }`}>
                                    <span className="text-lg">
                                        {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">{alert.title}</p>
                                        <p className="text-xs text-gray-300">{alert.description}</p>
                                    </div>
                                    <button className="text-xs bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition">
                                        💡 {alert.suggestedAction.split(' ').slice(0, 3).join(' ')}...
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Team Stats Summary */}
            {members.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase">Team Size</p>
                        <p className="text-2xl font-extrabold text-sidebar">{members.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase">Ore Totali/Settimana</p>
                        <p className="text-2xl font-extrabold text-sidebar">
                            {members.reduce((sum, m) => sum + (m.hoursPerWeek * (m.availability / 100)), 0).toFixed(0)}h
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase">Skills Uniche</p>
                        <p className="text-2xl font-extrabold text-sidebar">
                            {new Set(members.flatMap(m => m.skills)).size}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase">AI Comfort Medio</p>
                        <p className="text-2xl font-extrabold text-sidebar">
                            {(members.reduce((sum, m) => sum + m.aiComfortLevel, 0) / members.length).toFixed(1)} ⭐
                        </p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {members.length === 0 && (
                <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Nessun Membro nel Team</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Clicca "✨ Suggerisci Team AI" per generare un team ideale basato sulla Vision e sul Backlog.
                    </p>
                    <button
                        onClick={handleSuggestTeam}
                        disabled={loading}
                        className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
                    >
                        ✨ Suggerisci Team AI
                    </button>
                </div>
            )}

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(member => (
                    <div
                        key={member.id}
                        className={`bg-white rounded-2xl shadow-sm border transition-all ${expandedMember === member.id ? 'border-accent shadow-lg' : 'border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        {/* Header */}
                        <div
                            className="p-4 flex items-center gap-4 cursor-pointer"
                            onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                        >
                            {/* Avatar */}
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                                style={{ backgroundColor: member.avatarColor }}
                            >
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1 min-w-0">
                                <input
                                    className="font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-accent w-full"
                                    value={member.name}
                                    onChange={e => updateMember(member.id, 'name', e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                />
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg">{roleIcons[member.role] || '👤'}</span>
                                    <select
                                        className="text-sm text-accent font-bold uppercase bg-transparent cursor-pointer"
                                        value={member.role}
                                        onChange={e => updateMember(member.id, 'role', e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <option value="PO">Product Owner</option>
                                        <option value="SM">Scrum Master</option>
                                        <option value="Dev">Developer</option>
                                        <option value="Designer">Designer</option>
                                        <option value="QA">QA Engineer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Expand/Delete */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteMember(member.id); }}
                                    className="text-gray-400 hover:text-red-500 p-1 transition"
                                >
                                    🗑️
                                </button>
                                <span className="text-gray-400">
                                    {expandedMember === member.id ? '▲' : '▼'}
                                </span>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedMember === member.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                                {/* Skills */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">🎯 Skills</label>
                                    <div className="flex flex-wrap gap-2">
                                        {member.skills.map((s, i) => (
                                            <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                                                {s}
                                                <button
                                                    onClick={() => updateMember(member.id, 'skills', member.skills.filter((_, idx) => idx !== i))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >×</button>
                                            </span>
                                        ))}
                                        <input
                                            className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-full text-sm w-24"
                                            placeholder="+ Add"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && e.currentTarget.value) {
                                                    updateMember(member.id, 'skills', [...member.skills, e.currentTarget.value]);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Hours & Availability */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">⏰ Ore/Settimana</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            className="w-full border border-gray-200 rounded-lg p-2 text-center font-bold"
                                            value={member.hoursPerWeek}
                                            onChange={e => updateMember(member.id, 'hoursPerWeek', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">📊 Disponibilità</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                className="flex-1"
                                                value={member.availability}
                                                onChange={e => updateMember(member.id, 'availability', parseInt(e.target.value))}
                                            />
                                            <span className="font-bold text-sm w-12 text-right">{member.availability}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Comfort Level */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">🤖 AI Comfort Level</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => updateMember(member.id, 'aiComfortLevel', level)}
                                                className={`w-10 h-10 rounded-lg font-bold transition ${member.aiComfortLevel >= level
                                                    ? 'bg-accent text-white'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {member.aiComfortLevel <= 2 ? 'Principiante AI' : member.aiComfortLevel <= 3 ? 'Intermedio' : 'Esperto AI'}
                                    </p>
                                </div>

                                {/* Effective Hours */}
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">Ore Effettive</p>
                                    <p className="text-2xl font-extrabold text-sidebar">
                                        {(member.hoursPerWeek * member.availability / 100).toFixed(1)}h/settimana
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Save Button */}
            {members.length > 0 && (
                <button
                    onClick={() => onSave({ members })}
                    className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg hover:bg-opacity-90 transition-all sticky bottom-0"
                >
                    💾 Salva Team & Continua
                </button>
            )}
        </div>
    );
};

const PhaseEstimates = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [loading, setLoading] = useState(false);
    // We need local state to allow editing before saving
    const [localEpics, setLocalEpics] = useState<Epic[]>(project.phases.backlog?.epics || []);
    const allStories = localEpics.flatMap(e => e.stories);

    const handleEstimate = async () => {
        setLoading(true);
        try {
            const storiesToEstimate = allStories.filter(s => s.storyPoints === 0);
            if (storiesToEstimate.length === 0) {
                alert("All stories already have points. Reset them to re-estimate.");
                setLoading(false);
                return;
            }

            const estimates = await aiService.generateEstimates(storiesToEstimate);

            let estIndex = 0;
            const newEpics = localEpics.map(epic => ({
                ...epic,
                stories: epic.stories.map(story => {
                    if (story.storyPoints === 0 && estimates[estIndex]) {
                        const est = estimates[estIndex];
                        estIndex++;
                        return { ...story, storyPoints: est.storyPoints, estimatedHours: est.estimatedHours };
                    }
                    return story;
                })
            }));
            setLocalEpics(newEpics);

        } catch (e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };

    const updateStory = (storyId: string, field: 'storyPoints' | 'estimatedHours', value: string) => {
        const numValue = parseInt(value) || 0;
        setLocalEpics(prev => prev.map(epic => ({
            ...epic,
            stories: epic.stories.map(s => s.id === storyId ? { ...s, [field]: numValue } : s)
        })));
    };

    const saveEstimates = async () => {
        // We need to update the Backlog phase with the new estimates
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
            "phases.backlog.epics": localEpics,
            "phases.estimates.processed": true
        });
        onSave({ processed: true });
        alert("Estimates saved successfully!");
    };

    const totalPoints = allStories.reduce((acc, s) => acc + (s.storyPoints || 0), 0);
    const totalHours = allStories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-sidebar">7. ESTIMATIONS</h2>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Points</p>
                        <p className="text-2xl font-bold text-accent">{totalPoints}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Hours</p>
                        <p className="text-2xl font-bold text-sidebar">{totalHours}h</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Story</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase w-32">Story Points</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase w-32">Hours</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allStories.map((story) => (
                            <tr key={story.id}>
                                <td className="px-6 py-4 text-sm text-gray-800">{story.title}</td>
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="number"
                                        className="w-16 p-1 border rounded text-center text-blue-800 font-bold bg-blue-50"
                                        value={story.storyPoints || ''}
                                        onChange={(e) => updateStory(story.id, 'storyPoints', e.target.value)}
                                    />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="number"
                                        className="w-16 p-1 border rounded text-center text-gray-600 font-mono bg-white"
                                        value={story.estimatedHours || ''}
                                        onChange={(e) => updateStory(story.id, 'estimatedHours', e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-4">
                <button onClick={handleEstimate} disabled={loading} className="flex-1 bg-sidebar text-white py-4 rounded-xl font-bold">
                    {loading ? 'AI is analyzing complexity...' : '✨ Generate Estimations with AI'}
                </button>
                <button onClick={saveEstimates} className="flex-1 bg-accent text-white py-4 rounded-xl font-bold shadow-lg">
                    Save All Estimates
                </button>
            </div>
        </div>
    )
}

const PhaseReleasePlanner = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [plan, setPlan] = useState<ReleasePlan | undefined>(project.phases.strategicPlanner);
    const [loading, setLoading] = useState(false);
    const [monteCarlo, setMonteCarlo] = useState<MonteCarloResult | undefined>(plan?.monteCarlo);
    const [showSimulation, setShowSimulation] = useState(false);

    const handleGeneratePlan = async () => {
        setLoading(true);
        try {
            const backlog = project.phases.backlog?.epics || [];
            const team = project.phases.team?.members || [];
            const vision = project.phases.vision?.text || '';

            if (backlog.length === 0 || team.length === 0) {
                alert("Please ensure Backlog and Team phases are completed first.");
                setLoading(false);
                return;
            }

            // Parallel execution for plan and skill gaps
            const [generatedPlan, skillGaps] = await Promise.all([
                aiService.generateReleasePlan(backlog, team, vision),
                aiService.analyzeSkillGaps(backlog, team)
            ]);

            const newPlan: ReleasePlan = {
                id: `plan-${Date.now()}`,
                phases: generatedPlan.phases || [],
                skillGapAnalysis: skillGaps,
                monteCarlo: {
                    p50Date: '-', p80Date: '-', p95Date: '-', iterations: 0, confidenceFactors: []
                },
                createdAt: Date.now()
            };

            setPlan(newPlan);
            onSave({ strategicPlanner: newPlan });

        } catch (e) {
            console.error(e);
            alert("Error generating release plan");
        }
        setLoading(false);
    };

    const runSimulation = async () => {
        if (!plan) return;
        setLoading(true);
        try {
            // Calculate total project SP
            const backlog = project.phases.backlog?.epics || [];
            const totalSP = backlog.reduce((acc, epic) =>
                acc + epic.stories.reduce((sAcc, s) => sAcc + (s.storyPoints || 0), 0), 0
            );

            // Estimate average velocity (naive calculation if no historical data)
            // Assuming 80% availability of total hours / 10 hours per SP (rough conversion)
            // or just estimate 20 SP per sprint per 3 devs -> 60 SP
            const team = project.phases.team?.members || [];
            const devs = team.filter(m => m.role === 'Dev').length || 1;
            const estimatedVelocity = devs * 15; // 15 SP per dev per sprint assumption

            const result = await aiService.runMonteCarloSimulation(totalSP, estimatedVelocity);

            const updatedPlan = { ...plan, monteCarlo: result };
            setPlan(updatedPlan);
            setMonteCarlo(result);
            onSave({ strategicPlanner: updatedPlan });
            setShowSimulation(true);
        } catch (e) {
            console.error(e);
            alert("Simulation failed");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 h-[calc(100vh-140px)] overflow-y-auto pr-2">
            <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-sidebar">8. STRATEGIC PLANNER</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        The Agility Engine: MVP, Skill Matching & Risk-Driven Sequencing
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={runSimulation}
                        disabled={!plan || loading}
                        className="bg-white border-2 border-accent text-accent px-4 py-2 rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-all disabled:opacity-50"
                    >
                        🎲 Run Monte Carlo
                    </button>
                    <button
                        onClick={handleGeneratePlan}
                        disabled={loading}
                        className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all"
                    >
                        {loading ? 'Crunching Data...' : '🚀 Generate Release Plan'}
                    </button>
                </div>
            </div>

            {!plan && (
                <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Strategic Plan Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Use "The Agility Engine" to analyze backlog complexity, team skills, and risks to generate an optimal release schedule.
                    </p>
                    <button
                        onClick={handleGeneratePlan}
                        disabled={loading}
                        className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
                    >
                        🚀 Launch Agility Engine
                    </button>
                </div>
            )}

            {plan && (
                <>
                    {/* Visual Roadmap */}
                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        <div className="space-y-8">
                            {plan.phases.map((phase, index) => (
                                <div key={index} className="relative pl-16">
                                    <div className="absolute left-4 top-0 w-8 h-8 bg-sidebar text-white rounded-full flex items-center justify-center font-bold z-10 border-4 border-white">
                                        {index + 1}
                                    </div>
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="bg-sidebar text-white p-4 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-lg uppercase tracking-wider">{phase.name}</h3>
                                                <p className="text-sm text-gray-300">{phase.objective}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${phase.riskLevel === 'high' ? 'bg-red-500 text-white' :
                                                    phase.riskLevel === 'medium' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                                                    }`}>
                                                    {phase.riskLevel} Risk
                                                </div>
                                                <p className="text-xs text-gray-300 mt-1">Sprints {phase.sprints.join('-')} • {phase.totalSP} SP</p>
                                            </div>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {phase.stories.map((story, i) => (
                                                <div key={i} className="bg-gray-50 p-3 rounded-lg border-l-4 border-accent text-sm">
                                                    <span className="font-bold text-gray-800">{story}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Skill Gap Analysis */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-sidebar uppercase mb-4 flex items-center gap-2">
                                ⚠️ Skill Gap Analysis
                            </h3>
                            <div className="space-y-4">
                                {plan.skillGapAnalysis?.map((gap, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${gap.status === 'critical' ? 'bg-red-50 border-red-100' :
                                        gap.status === 'attention' ? 'bg-yellow-50 border-yellow-100' : 'bg-green-50 border-green-100'
                                        }`}>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-gray-800">{gap.skill}</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${gap.status === 'critical' ? 'bg-red-200 text-red-800' :
                                                gap.status === 'attention' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                                                }`}>{gap.status}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                                            <span>Required: {gap.required} SP</span>
                                            <span>Available: {gap.available} SP/sprint</span>
                                        </div>
                                        {gap.bottleneckSprints > 0 && (
                                            <p className="text-xs font-bold text-red-600 mb-2">⚡ +{gap.bottleneckSprints} sprints delay predicted</p>
                                        )}
                                        <div className="bg-white bg-opacity-50 p-2 rounded text-xs text-gray-700 italic border border-black/5">
                                            💡 {gap.suggestion}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Monte Carlo Simulation */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 bg-gradient-to-br from-white to-blue-50">
                            <h3 className="font-bold text-sidebar uppercase mb-4 flex items-center gap-2">
                                📊 Monte Carlo Delivery Prediction
                            </h3>
                            {monteCarlo?.iterations > 0 ? (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-right font-bold text-gray-500">50% Prob.</div>
                                            <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden relative">
                                                <div className="absolute top-0 left-0 h-full bg-blue-400 w-1/2"></div>
                                                <span className="absolute inset-0 flex items-center pl-3 text-sm font-bold text-gray-700">{monteCarlo.p50Date}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-right font-bold text-gray-500">80% Prob.</div>
                                            <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden relative">
                                                <div className="absolute top-0 left-0 h-full bg-blue-600 w-4/5"></div>
                                                <span className="absolute inset-0 flex items-center pl-3 text-sm font-bold text-white z-10">{monteCarlo.p80Date} ⬅️ Target</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-right font-bold text-gray-500">95% Prob.</div>
                                            <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden relative">
                                                <div className="absolute top-0 left-0 h-full bg-sidebar w-[95%]"></div>
                                                <span className="absolute inset-0 flex items-center pl-3 text-sm font-bold text-white z-10">{monteCarlo.p95Date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                        <h4 className="font-bold text-xs uppercase text-blue-800 mb-2">Confidence Factors</h4>
                                        <ul className="text-xs space-y-1 text-gray-600 list-disc list-inside">
                                            {monteCarlo.confidenceFactors.map((f, i) => <li key={i}>{f}</li>)}
                                            <li>Based on {monteCarlo.iterations} simulations</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <div className="text-4xl mb-2">🎲</div>
                                    <p>Run Monte Carlo simulation to predict delivery dates.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const PhaseRoadmap = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [roadmap, setRoadmap] = useState<any[]>(project.phases.roadmap?.items || []);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const epics = project.phases.backlog?.epics || [];
            if (epics.length === 0) {
                alert("Backlog is empty. Please generate backlog first.");
                return;
            }
            const result = await aiService.generateRoadmap(project.phases.vision?.text || '', epics);
            setRoadmap(result);
        } catch (e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };

    const updateFeature = (phaseIndex: number, featureIndex: number, val: string) => {
        const newRoadmap = [...roadmap];
        newRoadmap[phaseIndex].features[featureIndex] = val;
        setRoadmap(newRoadmap);
    }

    const removeFeature = (phaseIndex: number, featureIndex: number) => {
        const newRoadmap = [...roadmap];
        newRoadmap[phaseIndex].features.splice(featureIndex, 1);
        setRoadmap(newRoadmap);
    }

    const addFeature = (phaseIndex: number) => {
        const newRoadmap = [...roadmap];
        newRoadmap[phaseIndex].features.push("New Feature");
        setRoadmap(newRoadmap);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-sidebar">8. PRODUCT ROADMAP</h2>
                <button onClick={handleGenerate} disabled={loading} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm">
                    {loading ? 'Planning...' : '✨ Generate Roadmap'}
                </button>
            </div>

            <div className="space-y-4">
                {roadmap.map((phase, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-accent">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{phase.phase}</h3>
                                <p className="text-sm text-gray-500 font-medium">Duration: {phase.duration}</p>
                            </div>
                            <span className="bg-accent/10 text-accent px-3 py-1 rounded text-xs font-bold uppercase">{phase.focus}</span>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Associated Stories / Features</h4>
                            {phase.features.map((f: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded group">
                                    <span className="w-2 h-2 rounded-full bg-sidebar shrink-0"></span>
                                    <input
                                        className="w-full bg-transparent border-none text-sm text-gray-700 focus:ring-0"
                                        value={f}
                                        onChange={e => updateFeature(idx, i, e.target.value)}
                                    />
                                    <button onClick={() => removeFeature(idx, i)} className="text-gray-400 hover:text-red-500 px-2 opacity-0 group-hover:opacity-100">×</button>
                                </div>
                            ))}
                            <button onClick={() => addFeature(idx)} className="text-xs text-accent font-bold hover:underline">+ Add Feature</button>
                        </div>
                    </div>
                ))}
            </div>
            {roadmap.length > 0 && (
                <button onClick={() => onSave({ items: roadmap })} className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg">Save Roadmap</button>
            )}
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
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number }>({ days: 0, hours: 0 });

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
        const timestamp = status === 'done' ? Date.now() : undefined;
        setLocalEpics(prev => prev.map(epic => ({
            ...epic,
            stories: epic.stories.map(s => s.id === storyId ? { ...s, status, completedAt: timestamp } : s)
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
        if (!story) return;

        setAiLoading(true);
        try {
            const splitStories = await aiService.splitUserStory(story.title, story.description);
            const newStories: UserStory[] = splitStories.map((s: any, idx: number) => ({
                id: `split-${story.id}-${idx}`,
                title: s.title,
                description: s.description,
                acceptanceCriteria: s.acceptanceCriteria,
                storyPoints: s.storyPoints || 0,
                estimatedHours: s.estimatedHours || 0,
                status: 'todo',
                isInSprint: story.isInSprint,
                assigneeIds: story.assigneeIds
            }));

            // Replace original story with new ones in the same epic
            setLocalEpics(prev => prev.map(epic => ({
                ...epic,
                stories: epic.stories.flatMap(s => s.id === storyId ? newStories : s)
            })));
            alert(`Story split into ${newStories.length} smaller stories!`);
        } catch (e) { console.error(e); alert("Failed to refine story."); }
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
        } catch (e) { console.error(e); }
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

    const saveChanges = async () => {
        const projectRef = doc(db, 'projects', project.id);
        let updatedSprintData: any = {
            review: reviewNotes,
            retrospective: retroNotes,
            goal: sprintGoal,
            memberCapacity: memberCapacity,
            impediments: impediments,
            dailyMeetingDuration: dailyDurationMinutes
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

    // --- Sub-components for Sprint ---

    const saveDaily = async () => {
        const today = new Date();
        const start = new Date(project.phases.sprint?.startDate || '');
        // Calculate day index (0-based)
        const dayIndex = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to start recording from Day 1

        // Calculate completed hours TODAY (or up to now if needed, but per specs: "sum(task.ore where completedAt === today)")
        // Actually, the spec says: oreRimanentiOggi = oreRimanentiIeri - sum(task.ore where completedAt === today)
        // We can look at all completed tasks and see if they were completed today.

        // Let's get the last recorded remaining hours from dailyStandups or totalSprintHours if empty
        const standups = project.phases.sprint?.dailyStandups || [];
        const lastRemaining = standups.length > 0
            ? standups[standups.length - 1].remainingHours
            : totalSprintHours;

        // Tasks completed "today" (since last saved standup basically, or purely by calendar day).
        // To be safe and simple: Calculate remaining hours as Total - Completed.
        // Spec: "oreRimanentiIeri - sum(task.ore where completedAt === today)" -> This implies drift if we just subtract. 
        // Better approach: Calculate Total Remaining = Total Scope - Sum(All Done Stories).
        // Wait, spec says: "Se nessun task chiuso: punto rimane piatto". This implies we strictly track remaining.

        // Let's stick to: Current Remaining = Total Estimated - Total Completed So Far
        const completedStories = getSprintStories().filter(s => s.status === 'done');
        const completedHoursTotal = completedStories.reduce((acc, s) => acc + (s.estimatedHours || 0), 0);
        const currentRemaining = Math.max(0, totalSprintHours - completedHoursTotal);

        const newStandup = {
            dayIndex: dayIndex, // Day 1, 2, 3... (Day 0 is implicit start)
            remainingHours: currentRemaining,
            timestamp: Date.now()
        };

        const projectRef = doc(db, 'projects', project.id);
        const newDailyStandups = [...standups, newStandup];

        // Ensure we don't have multiple entries for the same day? Or just append?
        // Spec says: "Trigger aggiornamento: User clicca Salva Daily... Aggiunge nuovo elemento".
        // Let's just append. UI will render them in order.

        await updateDoc(projectRef, {
            "phases.sprint.dailyStandups": newDailyStandups
        });
        alert("Daily Saved! Burndown updated.");
    };

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
                <div className="flex gap-2 mb-2">
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
                <button
                    onClick={saveDaily}
                    className="w-full bg-sidebar text-white py-1 rounded text-xs font-bold hover:bg-opacity-90 transition"
                >
                    💾 Save Daily Result
                </button>
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
            </div>
        )
    }

    const BurndownChart = () => {
        const sprintDays = duration * 7;
        const standups = project.phases.sprint?.dailyStandups || [];

        // Data prep
        const data = [];
        const idealSlope = totalSprintHours / sprintDays;

        // We build the chart days: 0 to sprintDays
        for (let i = 0; i <= sprintDays; i++) {
            // IDEAL: Always visible from Day 0 to End
            const ideal = Math.max(0, totalSprintHours - (idealSlope * i));

            // ACTUAL:
            // Day 0: Starts at totalSprintHours
            // Day 1+: Uses data from dailyStandups

            let actual: number | null = null;

            if (i === 0) {
                actual = totalSprintHours;
            } else {
                // Find if we have a standup recorded for this day (by index or mapping)
                // The dailyStandups stores { dayIndex: X, remainingHours: Y }
                // We'll find the LAST standup that corresponds to day <= i.
                // Actually, strict rule: "Non mostra punti per giorni futuri"
                // And "User clicca Salva Daily -> Aggiunge nuovo punto"

                // Let's assume dailyStandups are in order of days.
                // If we have 3 standups, we map them to their days.
                // If the user saves multiple times a day, we might take the last one or just show all points?
                // Chart usually expects 1 point per day on X axis.
                // Let's find the standup for exactly day 'i'.
                // If day 'i' has passed but no standup, should it flatline?
                // "Se nessun task chiuso: punto rimane piatto" -> This refers to the value.
                // "Non mostra punti per giorni futuri" -> We limit 'actual' to the days we have data for.

                // Simplified Logic based on array index matching day index roughly, 
                // OR better: Find the standup entry where dayIndex === i
                // If multiple, take latest.

                // If we treat 'dailyStandups' as a history log:
                // Standup 1 (Day 1): 230h
                // Standup 2 (Day 2): 230h

                // We can just iterate through the stored standups.
                // BUT the x-axis is fixed (Day 0, 1, 2...).

                // Let's check if we have a recorded value for this specific day index 'i'.
                const record = standups.find(s => s.dayIndex === i); // Assuming exact match logic for now
                if (record) {
                    actual = record.remainingHours;
                } else if (i < standups.length + 1) {
                    // If we are answering for a day that is 'before' the latest recorded standup but missing a record, 
                    // it implies flatline from previous? 
                    // Or simply: We only show points that exist in dailyStandups.
                    // Spec says: "Esempio... Day 2 dopo Daily: Actual = [240, 232, 232]"
                    // This implies we construct the Actual array from [Total, ...dailyStandups.map(s => s.remaining)]
                    // And we map them to the corresponding days.
                    // If dailyStandups has 2 entries, we show Day 0 (start), Day 1 (entry 1), Day 2 (entry 2).
                    // It assumes entry N corresponds to Day N. 
                    // Let's enforce that visualization:

                    const standupIndex = i - 1; // Day 1 maps to index 0
                    if (standupIndex >= 0 && standupIndex < standups.length) {
                        actual = standups[standupIndex].remainingHours;
                    }
                }
            }

            data.push({
                day: i,
                ideal: ideal,
                actual: actual
            });
        }

        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-72">
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Sprint Burndown (Hours)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF5A6E" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#FF5A6E" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="ideal" stroke="#9CA3AF" strokeDasharray="5 5" name="Ideal Trend" dot={false} strokeWidth={2} />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#FF5A6E"
                            fillOpacity={1}
                            fill="url(#colorActual)"
                            name="Actual Remaining"
                            strokeWidth={3}
                            connectNulls={true} // In case of missing days, connecting them might be better, or false to show gaps
                        />
                    </AreaChart>
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
                                                    className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${s.assigneeIds?.includes(m.id)
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
                        <BurndownChart />
                    </div>
                )}

                {view === 'refinement' && (
                    <div className="max-w-4xl mx-auto space-y-6 h-full overflow-y-auto pb-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-2xl font-bold text-sidebar mb-2">Backlog Refinement</h3>
                            <p className="text-gray-500 mb-6">Use AI to split large stories (vertical slicing) into manageable chunks.</p>

                            <div className="space-y-4">
                                {localEpics.flatMap(e => e.stories).map(story => (
                                    <div key={story.id} className="border p-4 rounded-xl flex justify-between items-center hover:bg-gray-50">
                                        <div>
                                            <p className="font-bold text-gray-800">{story.title}</p>
                                            <p className="text-sm text-gray-500 line-clamp-1">{story.description}</p>
                                        </div>
                                        <button
                                            onClick={() => refineStory(story.id)}
                                            disabled={aiLoading}
                                            className="bg-sidebar text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 disabled:opacity-50"
                                        >
                                            {aiLoading ? 'Splitting...' : '✂️ Split with AI'}
                                        </button>
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
                            <h3 className="text-2xl font-bold text-sidebar mb-2">Sprint Retrospective</h3>
                            <p className="text-gray-500 mb-6">Inspect and adapt. How can we improve our process?</p>

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



const PhaseObeya = ({ project, onSave }: { project: Project, onSave: (data: any) => void }) => {
    const [risks, setRisks] = useState<any[]>(project.phases.obeya?.risks || []);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await aiService.analyzeRisks(project);
            setRisks(result);
        } catch (e) { console.error(e); alert("AI Error"); }
        setLoading(false);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-sidebar">11. DIGITAL OBEYA ROOM</h2>
                <button onClick={handleAnalyze} disabled={loading} className="bg-sidebar text-white px-6 py-2 rounded-xl font-bold text-sm">
                    {loading ? 'Analyzing Risks...' : '🔍 Analyze Risks'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Vision Card */}
                <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Vision & Goals</h3>
                    <div className="prose prose-sm line-clamp-6 text-gray-600" dangerouslySetInnerHTML={{ __html: project.phases.vision?.text || 'No vision defined' }} />
                </div>

                {/* Velocity Card (Reuse Stats data logic in real app) */}
                <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                    <h3 className="font-bold text-gray-500 uppercase text-xs mb-2">Team Velocity</h3>
                    <div className="text-5xl font-extrabold text-accent">24</div>
                    <p className="text-gray-400 text-xs mt-1">Story Points / Sprint</p>
                </div>

                {/* Status Card */}
                <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-500 uppercase text-xs mb-4">Sprint Status</h3>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Completion</span>
                        <span className="text-sm font-bold text-green-600">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                </div>

                {/* Risks Board */}
                <div className="col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">⚠️ Project Risks & Mitigation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {risks.map((risk, i) => (
                            <div key={i} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-red-900">{risk.risk}</h4>
                                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded font-bold">{risk.impact}</span>
                                </div>
                                <p className="text-sm text-red-700">🛡️ {risk.mitigation}</p>
                            </div>
                        ))}
                    </div>
                    {risks.length > 0 && (
                        <button onClick={() => onSave({ risks })} className="mt-4 text-xs text-gray-500 underline hover:text-sidebar">Save Risk Analysis</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const FlipCard = ({ card }: { card: any }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <div
            className="perspective-1000 h-64 cursor-pointer"
            onClick={() => setFlipped(!flipped)}
        >
            <div className={`relative w-full h-full transition-all duration-700 transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''} bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-accent/30`}>
                {/* Front */}
                <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl">
                    <div className="text-5xl mb-4 transition transform hover:scale-110">{card.icon}</div>
                    <h4 className="font-extrabold text-xl text-sidebar">{card.title}</h4>
                    <p className="text-xs text-accent font-bold mt-2 uppercase tracking-wide">Click to flip</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-sidebar text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-sm leading-relaxed">{card.desc}</p>
                    {card.action && (
                        <button
                            onClick={(e) => { e.stopPropagation(); alert("🎉 FAILURE IS LEARNING! +10 XP"); }}
                            className="mt-4 bg-accent px-4 py-1 rounded-full text-xs font-bold shadow hover:bg-white hover:text-accent transition"
                        >
                            Test Fail Safe
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main App Logic ---

const ProjectManager = () => {
    const { projectId, phase } = useParams();
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        if (!projectId) return;
        const unsubscribe = onSnapshot(doc(db, "projects", projectId), (doc) => {
            setProject({ id: doc.id, ...doc.data() } as Project);
        });
        return () => unsubscribe();
    }, [projectId]);

    const handleUpdateProject = async (updatedProject: Project) => {
        if (!project) return;
        const projectRef = doc(db, 'projects', project.id);
        // We can't overwrite everything easily if we just have the project object without clean undefined handling
        // But for now let's assume we just want to save specific phases if modified
        // Or simpler: just update the phases that SprintCenter touches
        // For 'SprintCenter' we might modify 'backlog' and 'sprint' phases.

        await setDoc(projectRef, updatedProject, { merge: true });
    };

    const handleSavePhase = async (phaseName: string, data: any) => {
        if (!project) return;
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
            [`phases.${phaseName}`]: data
        });
        // Optional: Auto-navigate to next phase logic could go here
    };

    if (!project) return <div className="flex items-center justify-center h-screen">Loading...</div>;

    const renderPhase = () => {
        switch (phase) {
            case 'mindset': return <PhaseMindset project={project} onSave={(data) => handleSavePhase('mindset', data)} />;
            case 'vision': return <PhaseVision project={project} onSave={(data) => handleSavePhase('vision', data)} />;
            case 'objectives': return <PhaseObjectives project={project} onSave={(data) => handleSavePhase('objectives', data)} />;
            case 'kpis': return <PhaseKPIs project={project} onSave={(data) => handleSavePhase('kpis', data)} />;
            case 'backlog': return <PhaseBacklog project={project} onSave={(data) => handleSavePhase('backlog', data)} />;
            case 'team': return <PhaseTeam project={project} onSave={(data) => handleSavePhase('team', data)} />;
            case 'estimates': return <PhaseEstimates project={project} onSave={(data) => handleSavePhase('estimates', data)} />;
            case 'strategic-planner': return <PhaseReleasePlanner project={project} onSave={(data) => handleSavePhase('strategicPlanner', data)} />;
            case 'roadmap': return <PhaseRoadmap project={project} onSave={(data) => handleSavePhase('roadmap', data)} />;
            case 'sprint': return <SprintCenter project={project} onUpdateProject={handleUpdateProject} />;
            case 'stats': return <ExecutiveObeya project={project} />;
            case 'obeya': return <PhaseObeya project={project} onSave={(data) => handleSavePhase('obeya', data)} />;
            default: return <div>Phase not implemented in this demo</div>;
        }
    };

    return (
        <Layout currentProject={project}>
            {renderPhase()}
        </Layout>
    );
};

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) setUser({ uid: u.uid, email: u.email, displayName: u.displayName, role: 'admin' }); // Mock admin role
            else setUser(null);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return null;

    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/projects" element={user ? <ProjectList /> : <Navigate to="/login" />} />
                <Route path="/project/:projectId/:phase" element={user ? <ProjectManager /> : <Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </HashRouter>
    );
}