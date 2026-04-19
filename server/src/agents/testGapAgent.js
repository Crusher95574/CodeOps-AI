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
    temperature: 0.2,
    apiKey,
  });
};

const SYSTEM_PROMPT = `You are a senior QA engineer and testing expert.
Analyze the provided git diff and identify:
1. New functions/features added without corresponding tests
2. Edge cases not covered (null inputs, empty arrays, error states, boundary values)
3. Missing integration test scenarios
4. Generate concrete test stub code where tests are missing

Respond ONLY with valid JSON in this exact format:
{
  "findings": [
    {
      "type": "test_gap",
      "severity": "high|medium|low",
      "file": "path/to/file.js",
      "line": 10,
      "message": "What test is missing",
      "suggestion": "Suggested test case description",
      "testStub": "describe('functionName', () => { it('should ...', () => { ... }) })"
    }
  ],
  "coverageAssessment": "Assessment of overall test coverage for this PR",
  "summary": "Brief test gap summary"
}`;

async function runTestGapAgent(diff, prTitle) {
  const model = getModel(); // ✅ FIXED

  const prompt = `PR Title: ${prTitle}

Git Diff:
\`\`\`diff
${diff.substring(0, 10000)}
\`\`\`

Identify missing tests and return JSON findings.`;

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
    if (!match) throw new Error('Test gap agent returned invalid JSON');
    parsed = JSON.parse(match[0]);
  }

  return parsed;
}

module.exports = { runTestGapAgent };