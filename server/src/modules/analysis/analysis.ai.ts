/**
 * AI-Powered Resume Analysis using Claude
 * Deep intelligent analysis of resume content
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client with API key
const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('CRITICAL: ANTHROPIC_API_KEY is not set in environment variables');
    throw new Error('AI service not configured. Please contact administrator.');
  }
  return new Anthropic({ apiKey });
};

let client: any = null;
const initializeClient = () => {
  if (!client) {
    client = getClient();
  }
  return client;
};

export interface AIAnalysisResult {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  detailedRecommendations: {
    summary?: string;
    experience?: string;
    skills?: string;
    education?: string;
    projects?: string;
    format?: string;
  };
  atsScore: number;
  careerAdvice: string;
  nextSteps: string[];
  improvementPriority: "critical" | "high" | "medium" | "low";
}

export async function analyzeResumeWithAI(
  resumeContent: string
): Promise<AIAnalysisResult> {
  if (!resumeContent || resumeContent.trim().length < 50) {
    throw new Error("Resume content too short for analysis");
  }

  const prompt = `You are an expert recruiter and career coach with 20+ years of experience. Analyze the following resume deeply and provide actionable, personalized feedback.

RESUME:
${resumeContent}

Please provide a COMPREHENSIVE analysis in JSON format with these exact fields:

{
  "overallAssessment": "A 2-3 sentence summary of the resume quality and career trajectory",
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "detailedRecommendations": {
    "summary": "Specific advice on improving the professional summary",
    "experience": "Specific improvements needed in work experience section with examples",
    "skills": "How to better showcase technical and soft skills",
    "education": "Recommendations for education section",
    "projects": "How to highlight projects better or add missing ones",
    "format": "Specific formatting and ATS optimization suggestions"
  },
  "atsScore": <number 0-100>,
  "careerAdvice": "Personalized advice for career growth based on their background",
  "nextSteps": ["action 1", "action 2", "action 3"],
  "improvementPriority": "critical|high|medium|low"
}

Be specific, actionable, and reference actual content from the resume when making suggestions.`;

  try {
    const aiClient = initializeClient();
    const message = await aiClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
    return analysis;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function generateResumeImprovementPlan(
  resumeContent: string,
  currentRole: string
): Promise<string> {
  const prompt = `Based on this resume and the person's current role (${currentRole}), create a detailed 30-60-90 day improvement plan to make their resume job-ready.

RESUME:
${resumeContent}

Provide specific, actionable steps they can take to improve their resume and career prospects.`;

  try {
    const aiClient = initializeClient();
    const message = await aiClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Improvement Plan Error:", error);
    throw error;
  }
}

export async function generateEnhancedResume(
  resumeContent: string
): Promise<string> {
  if (!resumeContent || resumeContent.trim().length < 50) {
    throw new Error("Resume content too short for enhancement");
  }

  const prompt = `You are an expert resume writer and career coach. Your task is to rewrite and enhance the following resume to make it ATS-optimized, impactful, and professional.

ORIGINAL RESUME:
${resumeContent}

Please rewrite this resume with these improvements:
1. Expand each section with more details and impact
2. Use strong action verbs and quantifiable achievements
3. Optimize for ATS (Applicant Tracking Systems)
4. Improve formatting and readability
5. Add relevant keywords naturally
6. Make it compelling and professional
7. Keep it to 1-2 pages maximum

Return ONLY the improved resume text, no explanations or meta-commentary. Format it professionally with clear sections.`;

  try {
    const aiClient = initializeClient();
    const message = await aiClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const enhancedResume = message.content[0].type === "text" ? message.content[0].text : "";

    if (!enhancedResume || enhancedResume.trim().length < 50) {
      throw new Error("Failed to generate enhanced resume");
    }

    return enhancedResume;
  } catch (error) {
    console.error("Enhanced Resume Generation Error:", error);
    throw error;
  }
}
