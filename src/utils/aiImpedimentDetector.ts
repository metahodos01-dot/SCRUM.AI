import { Project, UserStory } from '../../types';

export interface ImpedimentAlert {
    id: string;
    type: 'stagnation' | 'bottleneck' | 'divergence';
    title: string;
    description: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
}

export const detectImpediments = (project: Project): ImpedimentAlert[] => {
    const alerts: ImpedimentAlert[] = [];
    const stories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];

    // 1. STAGNATION DETECTION
    // Logic: Identify stories in 'doing' (or 'In Progress') that have high remaining effort but low recent activity? 
    // Since we don't have 'lastUpdated' on story, we'll use a heuristic:
    // If 'In Progress' for > 3 days (simulated by random or just flag high effort items in progress)
    // BETTER HEURISTIC: Stories in 'In Progress' with > 8h remaining.
    const stagnantStories = stories.filter(s =>
        (s.status === 'doing' || s.status === 'In Progress') &&
        s.estimatedHours > 8
    );

    if (stagnantStories.length > 0) {
        alerts.push({
            id: 'stagnation-1',
            type: 'stagnation',
            title: 'Stagnation Risk',
            description: `${stagnantStories.length} stories are In Progress with high remaining effort (>8h).`,
            suggestion: "🗣️ Fail Safe Culture: Start a Swarming session to unblock these items.",
            severity: 'medium'
        });
    }

    // 2. BOTTLENECK DETECTION (WIP Saturation)
    // We need column definitions. Simulating typical WIPs: In Progress (3), Testing (2).
    const inProgressCount = stories.filter(s => s.status === 'In Progress' || s.status === 'doing').length;
    const testingCount = stories.filter(s => s.status === 'Testing' || s.status === 'testing').length;

    if (inProgressCount >= 3) {
        alerts.push({
            id: 'bottleneck-doing',
            type: 'bottleneck',
            title: 'WIP Saturated (In Progress)',
            description: `The development column is full (${inProgressCount}/3).`,
            suggestion: "🛑 Stop Starting, Start Finishing! Help testing or pair program.",
            severity: 'high'
        });
    }

    if (testingCount >= 2) {
        alerts.push({
            id: 'bottleneck-testing',
            type: 'bottleneck',
            title: 'WIP Saturated (Testing)',
            description: `Testing bottleneck detected (${testingCount}/2).`,
            suggestion: "🤝 Developers should assist QA to clear the queue.",
            severity: 'high'
        });
    }

    // 3. DIVERGENCE (Burndown)
    // Check if Real Remaining is significantly higher than Ideal
    const history = project.phases.sprint?.burndownHistory || [];
    if (history.length > 2) {
        const lastSnapshot = history[history.length - 1];
        const divergence = lastSnapshot.remainingHours - lastSnapshot.idealHours;
        const totalEstimate = project.phases.sprint?.totalEstimatedHours || 100; // avoid div by 0

        if (divergence > (totalEstimate * 0.15)) { // > 15% deviation
            alerts.push({
                id: 'divergence-1',
                type: 'divergence',
                title: 'Burndown Divergence',
                description: `We are ${Math.round(divergence)}h behind schedule.`,
                suggestion: "📉 Scale Scope: Discuss descoping low-value stories with PO.",
                severity: 'high'
            });
        }
    }

    return alerts;
};
