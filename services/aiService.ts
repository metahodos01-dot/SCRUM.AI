import { GoogleGenAI } from "@google/genai";

// Helper to safely get the API KEY avoiding "process is not defined" in Vite
const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    // Vercel/Vite requires VITE_ prefix for client-side env vars
    return import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
  }

  try {
    if (process.env.API_KEY) return process.env.API_KEY;
  } catch (e) {
    // process is not defined
  }
  return '';
};

const API_KEY = getApiKey();

// Initialize AI. If key is missing, it will initialize but calls will fail (better than crashing app on load)
const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_KEY" });

const MODEL_TEXT = 'gemini-3-flash-preview';

export const aiService = {
  async generateVision(inputs: any) {
    const prompt = `
      Act as a Senior Product Owner. Create a Product Vision for a product with:
      Product Name: ${inputs.productName || inputs.name}
      How it works: ${inputs.functionality}
      Target: ${inputs.target}
      Problem: ${inputs.problem}
      Current Solution: ${inputs.currentSolution}
      Differentiation: ${inputs.differentiation}
      Constraints: ${inputs.constraints}

      Output ONLY valid HTML content (no markdown code blocks, no <html> tags, just the inner content).
      Start with the Product Name as <h3> for the Vision Statement, and <p> for the detailed explanation. Use <strong> for emphasis.
      Make sure to prominently feature the product name "${inputs.productName || inputs.name}" in the vision.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  },

  async generateObjectives(visionText: string, deadline: string) {
    const prompt = `
      Based on this vision: "${visionText}"
      And deadline: ${deadline}
      
      Generate 3-5 SMART Objectives in Italian.
      Each objective should have: title, description, specific (cosa), measurable (come misurare), achievable (perché raggiungibile), relevant (perché importante), timeBound (quando).
      
      Output ONLY a valid JSON array:
      [{ "title": "Obiettivo 1", "description": "Descrizione dettagliata", "specific": "...", "measurable": "...", "achievable": "...", "relevant": "...", "timeBound": "..." }]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async generateKPIs(objectivesHtml: string) {
    const prompt = `
      Based on these objectives: ${objectivesHtml}
      
      Generate a JSON array of KPIs.
      Format: [{ "kpi": "Name", "target": "Value", "metric": "Unit", "frequency": "Monthly" }]
      Output ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async generateBacklog(vision: string, objectives: any[], kpis: any[]) {
    // Build context from objectives and KPIs
    const objectivesContext = objectives.map((o, i) =>
      `Obiettivo ${i + 1}: "${o.title}" - ${o.description || ''}`
    ).join('\n');

    const kpisContext = kpis.map(k =>
      `KPI: "${k.kpi}" - Target: ${k.target} ${k.metric}`
    ).join('\n');

    const prompt = `
      Act as an expert Product Owner applying DEEP criteria for Product Backlog management.
      
      Create a prioritized Product Backlog based on:
      
      PRODUCT VISION:
      ${vision}
      
      STRATEGIC OBJECTIVES:
      ${objectivesContext || 'No specific objectives provided'}
      
      KPIs & TARGETS:
      ${kpisContext || 'No KPIs defined yet'}
      
      DEEP CRITERIA TO APPLY:
      1. DETAILED APPROPRIATELY: Top-priority items must have detailed user stories with clear acceptance criteria. Lower-priority epics can be high-level themes.
      2. EMERGENT: Structure the backlog to be easily modified and evolved.
      3. ESTIMATED: Assign T-shirt sizes (XS, S, M, L, XL) to each Epic based on effort.
      4. PRIORITIZED: Strict priority order based on business value, risk mitigation, and technical dependencies.
      
      Generate 5 Epics ordered by priority (1 = highest). For high-priority epics (1-2), generate 3-4 detailed stories. For lower-priority epics (3-5), generate 1-2 less detailed stories.
      
      Output JSON format:
      [
        {
          "title": "Epic Title",
          "description": "High-level description of the epic goal",
          "priority": 1,
          "tshirtSize": "M",
          "objectiveIndex": 0,
          "stories": [
            {
              "title": "As a [user], I want [feature], so that [benefit]",
              "description": "Detailed description of what needs to be done",
              "acceptanceCriteria": ["Given... When... Then...", "Criteria 2"],
              "detailLevel": "high",
              "priority": 1
            }
          ]
        }
      ]
      
      IMPORTANT: 
      - objectiveIndex should be the 0-based index of the related objective, or null if not linked
      - detailLevel should be "high" for top-priority stories (sprint-ready), "medium" for moderately defined, "low" for future work
      - Priority within stories should be unique per epic (1, 2, 3...)
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async generateEstimates(stories: any[]) {
    const prompt = `
      Estimate Story Points (Fibonacci) and Hours for these stories.
      Input: ${JSON.stringify(stories.map(s => s.title))}
      
      Output JSON array matching input order:
      [{ "storyPoints": 5, "estimatedHours": 8 }, ...]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async suggestTeam(vision: string, epics: any[], projectComplexity: 'low' | 'medium' | 'high' = 'medium') {
    const epicsSummary = epics.map(e => `${e.title} (${e.tshirtSize || 'M'})`).join(', ');
    const prompt = `
      Act as an Agile HR Expert. Based on this project context, suggest an ideal Scrum Team.
      
      Vision: "${vision}"
      Epics: ${epicsSummary}
      Project Complexity: ${projectComplexity}
      
      Generate 4-6 team members with realistic Italian names.
      Roles allowed: PO, SM, Dev, Designer, QA, Other
      
      For each member, suggest:
      - name: Full Italian name
      - role: One of PO, SM, Dev, Designer, QA, Other
      - skills: Array of 3-5 relevant skills
      - hoursPerWeek: 20-40 based on role type
      - availability: 70-100 (percentage)
      - aiComfortLevel: 1-5 (self-assessed AI fluency)
      
      Output JSON array:
      [{ 
        "name": "Marco Rossi", 
        "role": "Dev", 
        "skills": ["React", "TypeScript", "Node.js"], 
        "hoursPerWeek": 40, 
        "availability": 100, 
        "aiComfortLevel": 4 
      }]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const members = JSON.parse(response.text || '[]');

    // Add IDs and avatar colors
    const colors = ['#FF5A6E', '#4ADE80', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
    return members.map((m: any, i: number) => ({
      ...m,
      id: `member-${Date.now()}-${i}`,
      avatarColor: colors[i % colors.length]
    }));
  },

  async analyzeTeamHealth(teamData: { members: any[], activities: any[], sprintData: any }) {
    // Simulate health metrics calculation (in real app, this would analyze real data)
    const memberCount = teamData.members?.length || 0;
    const avgAiComfort = memberCount > 0
      ? teamData.members.reduce((sum: number, m: any) => sum + (m.aiComfortLevel || 3), 0) / memberCount
      : 3;

    // Calculate cross-functionality (skill diversity)
    const allSkills = teamData.members?.flatMap((m: any) => m.skills || []) || [];
    const uniqueSkills = new Set(allSkills);
    const skillDiversity = uniqueSkills.size / Math.max(allSkills.length, 1);

    return {
      psychologicalSafety: {
        value: 75 + Math.floor(Math.random() * 20), // Simulated
        trend: 'stable' as const,
        alerts: []
      },
      strategicAlignment: {
        value: 60 + Math.floor(Math.random() * 25),
        trend: 'up' as const,
        alerts: []
      },
      crossFunctionality: {
        value: Math.min(100, Math.floor(skillDiversity * 100 + 30)),
        trend: skillDiversity > 0.3 ? 'stable' as const : 'down' as const,
        alerts: skillDiversity < 0.3 ? [{
          id: `alert-crossfunc-${Date.now()}`,
          severity: 'warning' as const,
          pillar: 'crossFunctionality' as const,
          title: 'Potenziale Collo di Bottiglia',
          description: 'Alcune skill sono concentrate in pochi membri del team.',
          suggestedAction: 'Considera sessioni di pair programming per trasferire competenze.'
        }] : []
      },
      aiFluency: {
        value: Math.floor(avgAiComfort * 20),
        trend: avgAiComfort > 3 ? 'up' as const : 'down' as const,
        alerts: avgAiComfort < 3 ? [{
          id: `alert-ai-${Date.now()}`,
          severity: 'warning' as const,
          pillar: 'aiFluency' as const,
          title: 'Bassa Adozione AI',
          description: 'Il team ha un basso livello di comfort con gli strumenti AI.',
          suggestedAction: 'Organizza un training session sull\'uso degli strumenti AI della piattaforma.'
        }] : []
      },
      lastUpdated: Date.now()
    };
  },

  async generateRoadmap(vision: string, epics: any[]) {
    // Extract titles for context
    const allStories = epics.flatMap((e: any) => e.stories.map((s: any) => s.title));

    const prompt = `
      Act as a Product Manager. Create a release roadmap for the product.
      Vision: ${vision}
      Available User Stories: ${JSON.stringify(allStories)}
      
      Group these EXACT User Stories into 3 Phases: "MVP", "V1.0", "V2.0".
      Ensure the MVP contains the most critical stories.
      
      Output JSON array:
      [
        { 
          "phase": "MVP", 
          "duration": "2 months", 
          "focus": "Core Value Proposition", 
          "features": ["Exact Story Title 1", "Exact Story Title 2"] 
        },
        ...
      ]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async generateSprintGoal(storyTitles: string[]) {
    const prompt = `
      Act as a Scrum Master. Create a concise, inspiring Sprint Goal based on these User Stories selected for the sprint:
      ${JSON.stringify(storyTitles)}
      
      The goal should focus on the value delivered, not just a list of tasks.
      Output ONLY the Goal string. No quotes, no markdown.
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return response.text;
  },

  async splitUserStory(storyTitle: string, storyDescription: string) {
    const prompt = `
      Act as a Technical Product Owner. The following User Story is too big and needs to be split (Refinement) into 2-3 smaller, vertical slices that act as independent functional increments.
      
      Original Story: "${storyTitle}"
      Description: "${storyDescription}"
      
      Output JSON array of new stories:
      [
        {
          "title": "Sub-story Title",
          "description": "Detailed description",
          "acceptanceCriteria": ["AC 1", "AC 2"],
          "storyPoints": 0,
          "estimatedHours": 0
        }
      ]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async askAgileCoach(question: string) {
    const prompt = `
      You are an expert Agile Coach and Scrum Master. Answer the user's question about Scrum, Agile Mindset, or Project Management.
      Keep it educational, encouraging, and concise (max 100 words).
      Question: "${question}"
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
  },

  async analyzeRisks(projectData: any) {
    const prompt = `
      Analyze risks for project: ${projectData.name}.
      Vision: ${projectData.phases.vision?.text}
      Objectives: ${projectData.phases.objectives?.text}
      
      Output JSON array of 4 major risks:
      [{ "risk": "Risk description", "impact": "High", "mitigation": "Mitigation strategy" }]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async generateReleasePlan(backlog: any[], teamMatrix: any[], vision: string) {
    const backlogSummary = backlog.map(item =>
      `${item.title} (SP: ${item.stories.reduce((acc: number, s: any) => acc + (s.storyPoints || 0), 0)})`
    ).join(', ');

    const teamSummary = teamMatrix.map(m => `${m.role} (${m.skills.join(', ')})`).join(', ');

    const prompt = `
      Act as "The Agility Engine". Create a Strategic Release Plan based on:
      
      Vision: "${vision}"
      Team: ${teamSummary}
      Backlog Epics: ${backlogSummary}
      
      APPLY LOGIC:
      1. MVP Identification (The Critical Path): Select high biz value / low effort items.
      2. Skill-Based Scheduling: Map stories to team skills (Senior=1.3x, Junior=0.7x).
      3. Risk-Driven Sequencing: High risk items in early sprints.
      4. Strategic Buffer: Assume 20% buffer.
      
      Output JSON format:
      {
        "phases": [
          {
            "name": "MVP (The Foundation)",
            "objective": "Objective of this phase",
            "sprints": [1, 2, 3],
            "stories": ["Epic Title 1", "Epic Title 2"],
            "totalSP": 45,
            "riskLevel": "high"
          },
          {
            "name": "Release 1.1 (Growth)",
            "objective": "Objective of this phase",
            "sprints": [4, 5, 6],
            "stories": ["Epic Title 3"],
            "totalSP": 30,
            "riskLevel": "medium"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  },

  async analyzeSkillGaps(backlog: any[], teamMatrix: any[]) {
    // Collect all skills needed from backlog context (simulated for now based on titles)
    // In a real scenario, stories would have 'requiredSkills' tags.
    // Here we ask AI to infer skills and compare with team.

    const backlogContext = backlog.map(e => e.title).join(', ');
    const teamContext = teamMatrix.map(m => `${m.role} with skills: ${m.skills.join(', ')}`).join('; ');

    const prompt = `
      Analyze Skill Gaps for this project.
      Backlog items require implementation.
      Team available: ${teamContext}
      Backlog Context: ${backlogContext}
      
      Identify bottlenecks.
      Output JSON array:
      [
        {
          "skill": "AI Model Training",
          "required": 45,
          "available": 20,
          "status": "critical",
          "bottleneckSprints": 3,
          "suggestion": "Hire external consultant or upskill"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async runMonteCarloSimulation(totalSP: number, teamVelocity: number) {
    // Monte Carlo Simulation Logic (Client-side calculation for speed, no API call needed strictly, but structured here)
    const iterations = 1000;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      let accumulatedDays = 0;
      let remainingSP = totalSP;

      while (remainingSP > 0) {
        // Velocity fluctuation between 0.7x (bad sprint) and 1.3x (great sprint)
        const fluctuation = 0.7 + Math.random() * 0.6;
        const sprintVelocity = teamVelocity * fluctuation;
        remainingSP -= sprintVelocity;
        accumulatedDays += 14; // 2 weeks sprint
      }

      // Add random buffer 0-20%
      accumulatedDays += accumulatedDays * (Math.random() * 0.2);
      results.push(accumulatedDays);
    }

    results.sort((a, b) => a - b);
    const today = new Date();
    const addDays = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString('it-IT');
    };

    return {
      p50Date: addDays(results[Math.floor(iterations * 0.5)]),
      p80Date: addDays(results[Math.floor(iterations * 0.8)]),
      p95Date: addDays(results[Math.floor(iterations * 0.95)]),
      iterations: iterations,
      confidenceFactors: [
        "Team Velocity fluctuation ±30%",
        "Buffer 0-20% applied",
        "Historical data variance"
      ]
    };
  }
};