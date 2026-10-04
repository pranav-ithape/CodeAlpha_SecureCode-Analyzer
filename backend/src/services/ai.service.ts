import { GoogleGenAI, Type } from '@google/genai';
import { IFinding } from '../models/Finding';
import { AIAnalysis } from '../models/AIAnalysis';
import dotenv from 'dotenv';

dotenv.config();

// Use configured model or fallback to target gemini-3.8-flash
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export const generateRecommendation = async (finding: IFinding) => {
  console.log(`GEMINI_API_KEY configured: ${!!process.env.GEMINI_API_KEY}`);
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Construct the prompt context securely without exposing unnecessary parts
  const prompt = `You are a professional Application Security Engineer and Expert Developer.
Analyze the following security finding and provide a detailed, structured response.

IMPORTANT RULES:
1. Do not invent CWE numbers.
2. Do not invent OWASP categories.
3. Do not invent CVEs.
4. Do not claim a vulnerability exists if the supplied finding does not support it.
5. Do not fabricate code.
6. Do not fabricate references.
7. Clearly state when information is unavailable.
8. Recommendations must be relevant to the actual programming language.
9. Secure code examples must match the language (${finding.language}).
10. Do not recommend disabling security controls merely to remove a finding.

FINDING CONTEXT:
- Title: ${finding.title}
- Rule ID: ${finding.ruleId || 'N/A'}
- Severity: ${finding.severity}
- CWE: ${finding.cwe || finding.category || 'N/A'}
- OWASP Category: ${finding.owasp || 'N/A'}
- Language: ${finding.language}
- File: ${finding.file}
- Line: ${finding.line || 'N/A'}
- Description: ${finding.description || 'N/A'}
- Existing scanner recommendation: ${finding.recommendation || 'N/A'}
- Vulnerable Code Snippet:
${finding.snippet || 'No code snippet provided.'}
`;

  // Define the expected structured schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "Short explanation of the vulnerability understandable by a developer"
      },
      technicalExplanation: {
        type: Type.STRING,
        description: "Explain what is vulnerable, why it is vulnerable, how the pattern works, and what boundary is affected"
      },
      impact: {
        type: Type.STRING,
        description: "Explain realistic consequences (e.g. Data exposure, RCE, SQLi)"
      },
      rootCause: {
        type: Type.STRING,
        description: "Explain the insecure coding practice causing the vulnerability"
      },
      recommendation: {
        type: Type.STRING,
        description: "Concrete, actionable remediation steps"
      },
      secureCodeExample: {
        type: Type.STRING,
        description: "Corrected secure code example matching the finding's language"
      },
      references: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Trustworthy references (do not fabricate)"
      },
      confidence: {
        type: Type.NUMBER,
        description: "Reasonable confidence value between 0 and 1"
      }
    },
    required: [
      "summary", 
      "technicalExplanation", 
      "impact", 
      "rootCause",
      "recommendation", 
      "secureCodeExample", 
      "references",
      "confidence"
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2 // Lower temperature for more deterministic, factual output
      }
    });

    if (!response.text) {
      throw new Error("AI returned empty response");
    }

    const jsonResponse = JSON.parse(response.text);

    // Save or update AIAnalysis in database
    const aiAnalysis = await AIAnalysis.findOneAndUpdate(
      { findingId: finding._id },
      {
        findingId: finding._id,
        summary: jsonResponse.summary,
        whyVulnerable: jsonResponse.technicalExplanation,
        securityImpact: jsonResponse.impact,
        rootCause: jsonResponse.rootCause,
        recommendation: jsonResponse.recommendation,
        secureCodeExample: jsonResponse.secureCodeExample,
        references: jsonResponse.references,
        confidence: jsonResponse.confidence,
        aiModel: GEMINI_MODEL
      },
      { upsert: true, new: true }
    );

    return aiAnalysis;

  } catch (error: any) {
    console.error('Error generating AI recommendation:', error);
    throw new Error('AI analysis failed: ' + error.message);
  }
};
