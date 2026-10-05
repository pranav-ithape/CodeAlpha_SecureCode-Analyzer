import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';
import { IFinding } from '../models/Finding';
import { AIAnalysis } from '../models/AIAnalysis';
import dotenv from 'dotenv';

dotenv.config();

const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';

interface AIProvider {
  generate(finding: IFinding, prompt: string, systemInstruction: string): Promise<{ responseText: string, modelName: string }>;
}

class GeminiProvider implements AIProvider {
  async generate(finding: IFinding, prompt: string, systemInstruction: string): Promise<{ responseText: string, modelName: string }> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        technicalExplanation: { type: Type.STRING },
        impact: { type: Type.STRING },
        rootCause: { type: Type.STRING },
        recommendation: { type: Type.STRING },
        secureCodeExample: { type: Type.STRING },
        secureCodingPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
        verificationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        references: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidence: { type: Type.NUMBER }
      },
      required: [
        "summary", "technicalExplanation", "impact", "rootCause",
        "recommendation", "secureCodeExample", "secureCodingPractices",
        "verificationSteps", "references", "confidence"
      ]
    };

    let response;
    let retries = 5;
    let delay = 1000;
    
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: model,
          contents: `${systemInstruction}\n\n${prompt}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.2
          }
        });
        break;
      } catch (err: any) {
        if (err.status === 429 || err.status >= 500) {
          console.log(`Gemini API transient error (${err.status}): ${err.message}. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          retries--;
          if (retries === 0) throw new Error(`Gemini analysis failed after retries: ${err.message}`);
        } else {
          throw err;
        }
      }
    }

    if (!response || !response.text) {
      throw new Error("Gemini returned empty response");
    }

    return { responseText: response.text, modelName: model };
  }
}

class GroqProvider implements AIProvider {
  async generate(finding: IFinding, prompt: string, systemInstruction: string): Promise<{ responseText: string, modelName: string }> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured on the server.');
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

    let response;
    let retries = 5;
    let delay = 1000;

    while (retries > 0) {
      try {
        response = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          model: model,
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        break;
      } catch (err: any) {
        if (err.status === 429 || err.status >= 500) {
          console.log(`Groq API transient error (${err.status}): ${err.message}. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
          retries--;
          if (retries === 0) throw new Error(`Groq analysis failed after retries: ${err.message}`);
        } else {
          throw err;
        }
      }
    }

    const responseText = response?.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("Groq returned empty response");
    }

    return { responseText, modelName: model };
  }
}

export const generateRecommendation = async (finding: IFinding) => {
  const systemInstruction = `You are an application security analyst specializing in secure code review, SAST findings, OWASP vulnerabilities, CWE classifications, and secure remediation.
Analyze only the vulnerability information provided.
Do not invent CVEs, CWEs, OWASP categories, affected technologies, exploitability claims, or references.
If information is unavailable, explicitly state that it is unavailable.
Provide practical remediation guidance appropriate for the programming language.
Provide a secure code example when appropriate.

You MUST respond with a valid JSON object matching this exact schema:
{
  "summary": "Short explanation of the vulnerability understandable by a developer",
  "technicalExplanation": "Explain what is vulnerable, why it is vulnerable, how the pattern works, and what boundary is affected",
  "impact": "Explain realistic consequences (e.g. Data exposure, RCE, SQLi)",
  "rootCause": "Explain the insecure coding practice causing the vulnerability",
  "recommendation": "Concrete, actionable remediation steps",
  "secureCodeExample": "Corrected secure code example matching the finding's language",
  "secureCodingPractices": ["List of secure coding practices to prevent this vulnerability"],
  "verificationSteps": ["List of steps to verify the vulnerability is fixed"],
  "references": ["Trustworthy references (do not fabricate)"],
  "confidence": 0.95
}`;

  const prompt = `FINDING CONTEXT:
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
${finding.snippet || 'No code snippet provided.'}`;

  try {
    let provider: AIProvider;
    if (AI_PROVIDER.toLowerCase() === 'gemini') {
      provider = new GeminiProvider();
    } else {
      provider = new GroqProvider();
    }

    const { responseText, modelName } = await provider.generate(finding, prompt, systemInstruction);
    const jsonResponse = JSON.parse(responseText);

    const aiAnalysis = await AIAnalysis.findOneAndUpdate(
      { findingId: finding._id },
      {
        findingId: finding._id,
        summary: jsonResponse.summary || "Summary not provided.",
        whyVulnerable: jsonResponse.technicalExplanation || "Explanation not provided.",
        securityImpact: jsonResponse.impact || "Impact not provided.",
        rootCause: jsonResponse.rootCause || "Root cause not provided.",
        recommendation: jsonResponse.recommendation || "Recommendation not provided.",
        secureCodeExample: jsonResponse.secureCodeExample || "No example provided.",
        secureCodingPractices: jsonResponse.secureCodingPractices || [],
        verificationSteps: jsonResponse.verificationSteps || [],
        references: jsonResponse.references || [],
        confidence: jsonResponse.confidence || 0.8,
        aiModel: modelName
      },
      { upsert: true, new: true }
    );

    return aiAnalysis;
  } catch (error: any) {
    console.error('Error generating AI recommendation:', error);
    throw new Error('AI analysis failed: ' + error.message);
  }
};
