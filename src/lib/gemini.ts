import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface JDAnalysis {
  keywords: string[];
  requiredSkills: string[];
  softSkills: string[];
}

export const analyzeJobDescription = async (jdText: string): Promise<JDAnalysis> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following job description and extract the top keywords, required technical skills, and soft skills. Return the result in JSON format.
    
    Job Description:
    ${jdText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["keywords", "requiredSkills", "softSkills"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const optimizeResume = async (resumeContent: any, jdAnalysis: JDAnalysis): Promise<any> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert resume writer. Rewrite the following resume content to better match the provided job description analysis. 
    Focus on:
    1. Naturally incorporating keywords: ${jdAnalysis.keywords.join(', ')}
    2. Highlighting required skills: ${jdAnalysis.requiredSkills.join(', ')}
    3. Making bullet points more impactful and professional.
    
    Resume Content:
    ${JSON.stringify(resumeContent)}
    
    Return the optimized resume content in the same JSON structure as the input.`,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
};

export interface ATSOptimizationResult {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  improved_bullets: string[];
  suggestions: string[];
}

export const optimizeResumeATS = async (resumeText: string, jdText: string): Promise<ATSOptimizationResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an ATS Resume Optimization Engine.

Your task is to analyze a Job Description (JD) and a Resume, then:

1. Extract the top 15 important keywords from the Job Description.
2. Compare these keywords with the Resume content.
3. Calculate an ATS Match Score (0–100%) based on keyword matches.
4. Identify:
   * Matched keywords
   * Missing keywords
5. Rewrite the resume bullet points to naturally include missing important keywords.
6. Give clear and logical suggestions.

IMPORTANT RULES:
* Be strict and realistic in scoring.
* If keywords are missing → score must be low.
* Do NOT give positive feedback if score is low.
* Output must be consistent (no contradictions).

---

INPUT:
Job Description:
${jdText}

Resume:
${resumeText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          matched_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          improved_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["score", "matched_keywords", "missing_keywords", "improved_bullets", "suggestions"],
      },
    },
  });

  return JSON.parse(response.text);
};
