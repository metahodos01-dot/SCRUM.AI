export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'user';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  language: 'it' | 'en'; // Added language selection
  createdBy: string;
  createdAt: number;
  status: 'draft' | 'in-progress' | 'completed';
  phases: {
    mindset?: { completed: boolean; comment: string };
    vision?: { text: string; inputs: any };
    objectives?: { text: string; deadline: string; objectives?: any[] };
    kpis?: { table: any[] };
    backlog?: { epics: Epic[] };
    team?: { members: TeamMember[] };
    estimates?: { processed: boolean };
    roadmap?: { items: RoadmapItem[] };
    obeya?: { risks: Risk[] };
    sprint?: SprintData;
    strategicPlanner?: ReleasePlan;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'PO' | 'SM' | 'Dev' | 'Designer' | 'QA' | 'Other';
  skills: string[];
  hoursPerWeek: number;
  availability: number; // 0-100%
  aiComfortLevel: 1 | 2 | 3 | 4 | 5;
  avatarColor: string;
}

// Team Health Monitor Types
export interface TeamHealthMetrics {
  psychologicalSafety: HealthScore;
  strategicAlignment: HealthScore;
  crossFunctionality: HealthScore;
  aiFluency: HealthScore;
  lastUpdated: number;
}

export interface HealthScore {
  value: number; // 0-100
  trend: 'up' | 'down' | 'stable';
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  pillar: 'psychologicalSafety' | 'strategicAlignment' | 'crossFunctionality' | 'aiFluency';
  title: string;
  description: string;
  suggestedAction: string;
  dismissedUntil?: number;
}

export interface RoadmapItem {
  phase: string;
  duration: string;
  focus: string;
  features: string[];
}

export interface Risk {
  risk: string;
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface Epic {
  id: string;
  title: string;
  description?: string;           // DEEP: macro-description for low-detail epics
  features?: Feature[];           // Added: Intermediate hierarchy level
  stories: UserStory[];
  priority: number;               // DEEP: position priority (1 = highest)
  tshirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL';  // DEEP: rough estimate for epics
  objectiveId?: string;           // Links to strategic objective
  targetKpiIds?: string[];        // Links to related KPIs
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  stories: UserStory[]; // Optional: if we want strict nesting, stories belong here.
  // However, to maintain current compatibility, stories might exist at Epic level too.
  // For this report, we will assume a hierarchy if features are present.
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  estimatedHours: number; // Current remaining effort
  originalEstimate?: number; // Baseline effort (for reference)
  status: 'todo' | 'doing' | 'testing' | 'done' | 'In Progress' | 'Testing';
  assigneeIds?: string[]; // Deprecated in favor of assignedTo but kept for backward compat if needed
  assignedTo?: string[]; // Array of Team Member IDs
  timeLogs?: TimeLog[];
  isInSprint?: boolean;
  completedAt?: number;
  priority: number;
  detailLevel: 'high' | 'medium' | 'low';
  businessValue?: number;
  tasks?: Task[]; // Audit: Added for Hierarchy Report
}

export interface TimeLog {
  id: string;
  memberId: string;
  hours: number;
  date: number;
  description?: string;
}

export interface Impediment {
  id: string;
  description: string;
  memberId: string;
  createdAt: number;
  status: 'open' | 'resolved';
}

export interface SprintData {
  isActive: boolean;
  number: number;
  startDate: string; // ISO String
  endDate: string; // ISO String
  durationWeeks: number;
  goal: string;
  memberCapacity?: Record<string, number>;
  // Moods: key is "memberId_dayIndex" (0-based day of sprint), value is the mood string
  moods?: Record<string, 'happy' | 'neutral' | 'sad' | 'stressed'>;
  impediments?: Impediment[];
  dailyMeetingDuration?: number; // Minutes, defaults to 15
  review?: string;
  dailyMeetingDuration?: number; // Minutes, defaults to 15
  review?: string;
  // Retro Schema Upgrade
  retrospective?: {
    good: string[];
    bad: string[];
    actions: string[];
  };
  dailyStandups?: { dayIndex: number; remainingHours: number; timestamp: number }[];

  // Sprint Center additions
  burndownHistory?: BurndownSnapshot[];
  burndownHistory?: BurndownSnapshot[];
  aiAlerts?: SprintAiAlert[];
  activeManualImpediments?: string[]; // IDs from Impediment Library
  totalCapacity?: number;     // Total adjustable hours for the sprint
  totalEstimatedHours?: number; // Sum of story estimates at start
  businessValueTotal?: number;  // Sum of business value
  status?: 'planning' | 'active' | 'review' | 'completed';

  // Metrics for Report
  velocity?: number;      // Completed SP
  throughput?: number;    // Stories completed per week/sprint
  leadTime?: number;      // Average days from Todo to Done
}

// Deprecated separate interface in favor of nested SprintData
export interface Sprint {
  id: string;
  number: number;
  projectId: string;
  status: 'planning' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  goal: string;
  tasks: Task[];
}

export interface BurndownSnapshot {
  date: string;
  remainingHours: number;
  idealHours: number;
  completedStoryPoints: number;
}

export interface SprintAiAlert {
  id: string;
  type: 'bottleneck' | 'capacity' | 'risk' | 'stagnation' | 'divergence';
  message: string; // Title
  description?: string; // Detailed description
  suggestion: string;
  detectedAt: number;
  relatedEntityId?: string; // Story ID or Member ID
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolving' | 'resolved';
  resolvedAt?: number;
  actionTaken?: string;
}

export interface Task {
  id: string;
  storyId: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  assigneeId?: string;
  hoursRemaining: number;
}

// Strategic Release Planner Types
export interface ReleasePlan {
  id: string;
  phases: ReleasePhase[];
  skillGapAnalysis: SkillGapReport[];
  monteCarlo: MonteCarloResult;
  createdAt: number;
}

export interface ReleasePhase {
  name: string;
  objective: string;
  sprints: number[];
  stories: string[]; // Story IDs
  totalSP: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SkillGapReport {
  skill: string;
  required: number; // SP
  available: number; // SP per sprint
  status: 'ok' | 'attention' | 'critical';
  bottleneckSprints: number;
  suggestion: string;
}

export interface MonteCarloResult {
  p50Date: string;
  p80Date: string;
  p95Date: string;
  iterations: number;
  confidenceFactors: string[];
}