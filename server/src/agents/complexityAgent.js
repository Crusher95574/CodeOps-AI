const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

const getModel = () => {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Gemini API Key in environment variables");
  }

  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    temperature: 0.1,
    apiKey,
  });
};

const SYSTEM_PROMPT = `You are a software architect specializing in code quality and maintainability.
Analyze the provided git diff for:
1. Functions/methods with high cyclomatic complexity (too many branches, loops, conditions)
2. Long functions that should be decomposed
3. Deep nesting that reduces readability
4. Duplicate code that should be extracted
5. Poor naming or unclear abstractions

Respond ONLY with valid JSON in this exact format:
{
  "findings": [
    {
      "type": "complexity",
      "severity": "high|medium|low",
      "file": "path/to/file.js",
      "line": 10,
      "message": "Description of the complexity issue",
      "suggestion": "Concrete refactoring suggestion"
    }
  ],
  "complexityScore": 65,
  "summary": "Brief complexity assessment"
}
complexityScore is 0-100, where 0 = very clean, 100 = very complex.`;

async function runComplexityAgent(diff, prTitle) {
  const model = getModel(); // ✅ created at runtime

  const prompt = `PR Title: ${prTitle}

Git Diff:
\`\`\`diff
${diff.substring(0, 10000)}
\`\`\`

Analyze complexity and return JSON findings.`;

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(prompt),
  ]);

  const text = response.content;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Complexity agent returned invalid JSON');
    parsed = JSON.parse(match[0]);
  }

  return parsed;
}

module.exports = { runComplexityAgent };