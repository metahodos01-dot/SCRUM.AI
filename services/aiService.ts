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
      Name: ${inputs.name}
      Target: ${inputs.target}
      Problem: ${inputs.problem}
      Current Solution: ${inputs.currentSolution}
      Differentiation: ${inputs.differentiation}

      Output ONLY valid HTML content (no markdown code blocks, no <html> tags, just the inner content).
      Use <h3> for the Vision Statement, and <p> for the detailed explanation. Use <strong> for emphasis.
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
      
      Generate 3-5 SMART Objectives.
      Output ONLY valid HTML <ul> list with <li> items. Use <b> for the objective title.
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
    });
    return response.text;
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

  async generateBacklog(vision: string, objectives: string) {
     const prompt = `
      Act as a Product Owner. Create a Backlog based on Vision: ${vision} and Objectives: ${objectives}.
      Generate exactly 5 Epics. For each Epic, generate 3 User Stories.
      
      Output JSON format:
      [
        {
          "title": "Epic Title",
          "stories": [
            {
              "title": "As a... I want... So that...",
              "description": "Detailed description...",
              "acceptanceCriteria": ["Criteria 1", "Criteria 2"]
            }
          ]
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

  async generateTeamRecommendations(vision: string) {
    const prompt = `
      Based on this vision: "${vision}", recommend a Scrum Team structure.
      Generate 3-5 roles needed.
      Output JSON array:
      [{ "role": "Senior Frontend", "skills": ["React", "Typescript"] }]
    `;
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  },

  async generateRoadmap(vision: string, epics: any[]) {
    // Extract titles for context
    const allStories = epics.flatMap((e:any) => e.stories.map((s:any) => s.title));
    
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
  }
};