const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.1,
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided git diff and identify:
1. Bugs and logic errors
2. Security vulnerabilities (SQL injection, XSS, hardcoded secrets, insecure dependencies)
3. Code style issues and anti-patterns
4. Performance concerns

Respond ONLY with valid JSON in this exact format:
{
  "findings": [
    {
      "type": "bug|security|style|suggestion",
      "severity": "critical|high|medium|low|info",
      "file": "path/to/file.js",
      "line": 42,
      "message": "Clear description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "One paragraph overall assessment"
}`;

async function runCodeReviewAgent(diff, prTitle, language) {
  const prompt = `PR Title: ${prTitle}
Language: ${language || 'unknown'}

Git Diff:
\`\`\`diff
${diff.substring(0, 12000)}
\`\`\`

Review this diff thoroughly and return JSON findings.`;

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(prompt),
  ]);

  const text = response.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Code review agent returned invalid JSON');

  return JSON.parse(jsonMatch[0]);
}

module.exports = { runCodeReviewAgent };
