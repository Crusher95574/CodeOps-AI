const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.3,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const SEVERITY_EMOJI = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: '⚪',
};

const SEVERITY_WEIGHT = { critical: 40, high: 20, medium: 8, low: 3, info: 1 };

function computeSeverityScore(findings) {
  if (!findings.length) return 0;
  const raw = findings.reduce((sum, f) => sum + (SEVERITY_WEIGHT[f.severity] || 0), 0);
  return Math.min(100, Math.round(raw));
}

function formatGitHubComment(prTitle, allFindings, summaries, severityScore) {
  const critical = allFindings.filter(f => f.severity === 'critical');
  const high = allFindings.filter(f => f.severity === 'high');
  const medium = allFindings.filter(f => f.severity === 'medium');
  const low = allFindings.filter(f => ['low', 'info'].includes(f.severity));

  const scoreEmoji = severityScore > 60 ? '🔴' : severityScore > 30 ? '🟡' : '🟢';

  let comment = `## 🤖 CodeOps AI Review\n\n`;
  comment += `> **Severity Score:** ${scoreEmoji} ${severityScore}/100 &nbsp;|&nbsp; `;
  comment += `**Issues:** ${allFindings.length} total `;
  comment += `(${critical.length} critical, ${high.length} high, ${medium.length} medium, ${low.length} low)\n\n`;
  comment += `---\n\n`;

  if (summaries.codeReview) {
    comment += `### Summary\n${summaries.codeReview}\n\n`;
  }

  const grouped = {};
  for (const f of allFindings) {
    const key = f.file || 'General';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  if (allFindings.length > 0) {
    comment += `### Findings\n\n`;
    for (const [file, findings] of Object.entries(grouped)) {
      comment += `**\`${file}\`**\n\n`;
      for (const f of findings) {
        const emoji = SEVERITY_EMOJI[f.severity] || '⚪';
        const line = f.line ? ` (line ${f.line})` : '';
        comment += `- ${emoji} **[${f.severity.toUpperCase()}]**${line} — ${f.message}\n`;
        if (f.suggestion) comment += `  > 💡 ${f.suggestion}\n`;
        if (f.testStub) comment += `  <details><summary>Test stub</summary>\n\n  \`\`\`js\n  ${f.testStub}\n  \`\`\`\n  </details>\n`;
      }
      comment += '\n';
    }
  } else {
    comment += `### ✅ No significant issues found\n\nThis PR looks clean. Nice work!\n\n`;
  }

  if (summaries.testGap) {
    comment += `---\n### Test Coverage\n${summaries.testGap}\n\n`;
  }

  comment += `---\n*Powered by [CodeOps AI](https://github.com/your-repo) · ${new Date().toUTCString()}*`;
  return comment;
}

async function runSynthesisAgent(codeReviewResult, complexityResult, testGapResult, prTitle) {
  const allFindings = [
    ...(codeReviewResult?.findings || []).map(f => ({ ...f, agent: 'code_review' })),
    ...(complexityResult?.findings || []).map(f => ({ ...f, agent: 'complexity' })),
    ...(testGapResult?.findings || []).map(f => ({ ...f, agent: 'test_gap' })),
  ];

  const severityScore = computeSeverityScore(allFindings);

  const summaries = {
    codeReview: codeReviewResult?.summary,
    complexity: complexityResult?.summary,
    testGap: testGapResult?.summary,
  };

  const comment = formatGitHubComment(prTitle, allFindings, summaries, severityScore);

  return {
    allFindings,
    severityScore,
    comment,
    summaries,
  };
}

module.exports = { runSynthesisAgent };
