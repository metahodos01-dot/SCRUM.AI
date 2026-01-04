import { Project } from '../../types';

export const generateSprintReport = (project: Project): void => {
    const sprint = project.phases.sprint;
    const stories = project.phases.backlog?.epics.flatMap(e => e.stories).filter(s => s.isInSprint) || [];
    const completedStories = stories.filter(s => s.status === 'done');

    // Metrics Calculation
    const velocity = completedStories.reduce((acc, s) => acc + s.storyPoints, 0);
    const throughput = completedStories.length;

    // Lead Time Calculation (Sprint Cycle Time: Completed Date - Sprint Start Date)
    let avgLeadTime = '0';
    if (completedStories.length > 0 && sprint?.startDate) {
        const sprintStart = new Date(sprint.startDate).getTime();
        const totalLeadTime = completedStories.reduce((acc, s) => {
            const end = s.completedAt || Date.now();
            // Ensure we don't get negative time if data is weird
            const diff = Math.max(0, end - sprintStart);
            return acc + diff;
        }, 0);
        const avgMs = totalLeadTime / completedStories.length;
        avgLeadTime = (avgMs / (1000 * 60 * 60 * 24)).toFixed(1);
    } else if (completedStories.length > 0) {
        // Fallback if no start date
        avgLeadTime = 'N/A';
    }

    const completionRate = Math.round((completedStories.length / Math.max(stories.length, 1)) * 100);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sprint Report - ${project.name}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
            h1, h2, h3 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 30px; rounded-xl; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
            .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
            .metric-label { color: #64748b; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f8fafc; font-weight: 600; color: #475569; }
            .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
            .status-done { background-color: #dcfce7; color: #166534; }
            .status-active { background-color: #dbeafe; color: #1e40af; }
            .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="color: white; border: none; margin: 0;">Sprint Report: ${sprint?.goal || 'General Sprint'}</h1>
            <p style="opacity: 0.8; margin-top: 10px;">Project: ${project.name} | Date: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${velocity}</div>
                <div class="metric-label">Velocity (SP)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${throughput}</div>
                <div class="metric-label">Throughput (Items)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${avgLeadTime} days</div>
                <div class="metric-label">Avg Lead Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${completionRate}%</div>
                <div class="metric-label">Completion Rate</div>
            </div>
        </div>

        <h2>Completed Work Items</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Points</th>
                    <th>Business Value</th>
                </tr>
            </thead>
            <tbody>
                ${completedStories.map(s => `
                    <tr>
                        <td>#${s.id.slice(0, 5)}</td>
                        <td>${s.title}</td>
                        <td>${s.storyPoints}</td>
                        <td>${s.businessValue || '-'}</td>
                    </tr>
                `).join('')}
                ${completedStories.length === 0 ? '<tr><td colspan="4" style="text-align: center; padding: 20px;">No completed stories this sprint.</td></tr>' : ''}
            </tbody>
        </table>

         <h2>Mindset & Retrospective</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3>Retrospective Findings</h3>
            <p>${sprint?.retrospective || 'No retrospective data recorded yet.'}</p>
            
            <h3>Fail-Safe Culture Check</h3>
            <p>Did the team feel safe to fail? <strong>${project.phases.team?.members.every(m => m.aiComfortLevel > 2) ? 'YES - High AI Comfort' : 'ATTENTION REQUIRED'}</strong></p>
        </div>

        <div class="footer">
            Generated by SCRUM.AI Antigravity Engine
        </div>
    </body>
    </html>
    `;

    // Create Blob and Trigger Download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sprint_Report_${project.name}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
