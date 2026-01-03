
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
// Using generic image model for obeya rendering placeholder
const MODEL_IMAGE = 'gemini-2.5-flash-image'; 

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

  async generateRoadmap(vision: string, epics: any[], mvpDesc: string, duration: number, availability: any) {
    // Extract titles for context
    const allStories = epics.flatMap((e:any) => e.stories.map((s:any) => s.title));
    
    const prompt = `
      Act as a Product Manager. Create a release roadmap.
      Vision: ${vision}
      MVP Focus: ${mvpDesc}
      Sprint Duration: ${duration} weeks
      Team Availability: ${JSON.stringify(availability)}
      Available Stories: ${JSON.stringify(allStories)}
      
      Group User Stories into 3 Phases: "MVP", "V1.0", "V2.0" considering the MVP focus and capacity.
      
      Output JSON array:
      [
        { 
          "phase": "MVP", 
          "duration": "X sprints", 
          "focus": "Core Value Proposition", 
          "features": ["Story 1", "Story 2"] 
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
      
      You MUST estimate the Story Points and Estimated Hours for each new slice.
      
      Output JSON array of new stories:
      [
        {
          "title": "Sub-story Title",
          "description": "Detailed description",
          "acceptanceCriteria": ["AC 1", "AC 2"],
          "storyPoints": 3,
          "estimatedHours": 5
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

  async generateObeyaRendering(imageBase64: string, checklist: any) {
      // NOTE: For 'gemini-2.5-flash-image', we typically use generateContent with image parts for EDITING/ANALYSIS,
      // but strictly speaking, text-to-image generation (creating a new rendering) requires specific Imagen models.
      // Since specific Imagen models require distinct setup, here we simulate the prompt logic
      // and return a description of what the rendering WOULD be, or use the flash model to analyze where to put things.
      
      // For this demo, we will use text generation to "Describe" the placement layout effectively
      // or return a placeholder URL if we can't do actual pixel generation in this specific restricted env.
      
      // However, if we want to "Edit" the image to add sticky notes (annotating), we can try:
      
      const prompt = `
        You are an Agile Coach setting up an Obeya Room.
        The user has uploaded a photo of their room.
        Active elements to place: ${JSON.stringify(checklist)}.
        
        Analyze the image and describe exactly where to place each board (Vision, Roadmap, etc.) on the walls visible in the image.
        Return a JSON object with "layoutDescription".
      `;
      
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      };
      
      const response = await ai.models.generateContent({
        model: MODEL_TEXT, // Using text model to describe layout as image generation/edit is complex in this snippet context
        contents: {
            parts: [imagePart, { text: prompt }]
        },
        config: { responseMimeType: 'application/json' }
      });
      
      return JSON.parse(response.text || '{}');
  }
};
