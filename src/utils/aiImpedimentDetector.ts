import { Project, SprintAiAlert } from '../../types';

export const detectImpediments = (project: Project): SprintAiAlert[] => {
    const alerts: SprintAiAlert[] = [];
    const stories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];
    const activeAlerts = project.phases.sprint?.aiAlerts || [];

    // Helper to check if alert already exists (and preserve its status)
    const getExistingAlert = (id: string) => activeAlerts.find(a => a.id === id);

    // 1. STAGNATION DETECTION
    // Improved Logic: 'In Progress' for > 3 days (Simulated via updated vs Date.now)
    // Fallback: Stories with high remaining effort (>8h) late in sprint
    const stagnantStories = stories.filter(s =>
        (s.status === 'doing' || s.status === 'In Progress') &&
        s.estimatedHours > 8
    );

    if (stagnantStories.length > 0) {
        const id = 'stagnation-high-effort';
        const existing = getExistingAlert(id);

        // Only trigger if not already resolved
        if (!existing || existing.status !== 'resolved') {
            alerts.push({
                id,
                type: 'stagnation',
                message: 'Stagnation Risk',
                description: `${stagnantStories.length} stories are In Progress with high remaining effort (>8h).`,
                suggestion: "🗣️ Fail Safe Culture: Start a Swarming session to unblock these items.",
                severity: 'medium',
                detectedAt: existing?.detectedAt || Date.now(),
                status: existing?.status || 'open',
                relatedEntityId: stagnantStories[0].id
            });
        }
    }

    // 2. BOTTLENECK DETECTION (WIP Saturation)
    const inProgressCount = stories.filter(s => s.status === 'In Progress' || s.status === 'doing').length;
    const testingCount = stories.filter(s => s.status === 'Testing' || s.status === 'testing').length;

    if (inProgressCount >= 3) {
        const id = 'bottleneck-doing';
        const existing = getExistingAlert(id);
        if (!existing || existing.status !== 'resolved') {
            alerts.push({
                id,
                type: 'bottleneck',
                message: 'WIP Saturated (In Progress)',
                description: `The development column is full (${inProgressCount}/3).`,
                suggestion: "🛑 Stop Starting, Start Finishing! Help testing or pair program.",
                severity: 'high',
                detectedAt: existing?.detectedAt || Date.now(),
                status: existing?.status || 'open'
            });
        }
    }

    if (testingCount >= 2) {
        const id = 'bottleneck-testing';
        const existing = getExistingAlert(id);
        if (!existing || existing.status !== 'resolved') {
            alerts.push({
                id,
                type: 'bottleneck',
                message: 'WIP Saturated (Testing)',
                description: `Testing bottleneck detected (${testingCount}/2).`,
                suggestion: "🤝 Developers should assist QA to clear the queue.",
                severity: 'high',
                detectedAt: existing?.detectedAt || Date.now(),
                status: existing?.status || 'open'
            });
        }
    }

    // 3. DIVERGENCE (Burndown)
    const history = project.phases.sprint?.burndownHistory || [];
    if (history.length > 2) {
        const lastSnapshot = history[history.length - 1];
        const divergence = lastSnapshot.remainingHours - lastSnapshot.idealHours;
        const totalEstimate = project.phases.sprint?.totalEstimatedHours || 100;

        if (divergence > (totalEstimate * 0.15)) {
            const id = 'divergence-burndown';
            const existing = getExistingAlert(id);
            if (!existing || existing.status !== 'resolved') {
                alerts.push({
                    id,
                    type: 'divergence',
                    message: 'Burndown Divergence',
                    description: `We are ${Math.round(divergence)}h behind schedule.`,
                    suggestion: "📉 Scale Scope: Discuss descoping low-value stories with PO.",
                    severity: 'high',
                    detectedAt: existing?.detectedAt || Date.now(),
                    status: existing?.status || 'open'
                });
            }
        }
    }

    return alerts;
};
