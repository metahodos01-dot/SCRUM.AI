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
    objectives?: { text: string; deadline: string };
    kpis?: { table: any[] };
    backlog?: { epics: Epic[] };
    team?: { members: TeamMember[] };
    estimates?: { processed: boolean };
    roadmap?: { items: RoadmapItem[] };
    obeya?: { risks: Risk[] };
    sprint?: SprintData;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
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
  stories: UserStory[];
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  estimatedHours: number;
  status: 'todo' | 'doing' | 'done';
  assigneeIds?: string[];
  isInSprint?: boolean;
  completedAt?: number; // Timestamp for Burndown calculation
}

export interface Impediment {
  id: string;
  description: string;
  memberId: string;
  createdAt: number;
  status: 'open' | 'resolved';
}

export interface DailyStandup {
  day: number;
  date: string;
  oreCompletate: number;
  oreRimanenti: number;
  taskCompletati: string[]; // IDs of stories completed this day
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
  dailyStandups?: DailyStandup[]; // Historic data for burndown
  review?: string;
  retrospective?: string;
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

export interface Task {
  id: string;
  storyId: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  assigneeId?: string;
  hoursRemaining: number;
}