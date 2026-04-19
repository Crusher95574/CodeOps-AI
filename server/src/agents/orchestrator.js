const { runCodeReviewAgent } = require('./codeReviewAgent');
const { runComplexityAgent } = require('./complexityAgent');
const { runTestGapAgent } = require('./testGapAgent');
const { runSynthesisAgent } = require('./synthesisAgent');

async function orchestrateReview({ diff, prTitle, language }) {
  console.log(`[Orchestrator] Starting parallel agent execution for: "${prTitle}"`);
  const start = Date.now();

  const [codeReviewResult, complexityResult, testGapResult] = await Promise.allSettled([
    runCodeReviewAgent(diff, prTitle, language),
    runComplexityAgent(diff, prTitle),
    runTestGapAgent(diff, prTitle),
  ]);

  const codeReview = codeReviewResult.status === 'fulfilled' ? codeReviewResult.value : null;
  const complexity = complexityResult.status === 'fulfilled' ? complexityResult.value : null;
  const testGap = testGapResult.status === 'fulfilled' ? testGapResult.value : null;

  if (codeReviewResult.status === 'rejected') console.error('[Orchestrator] Code review agent failed:', codeReviewResult.reason);
  if (complexityResult.status === 'rejected') console.error('[Orchestrator] Complexity agent failed:', complexityResult.reason);
  if (testGapResult.status === 'rejected') console.error('[Orchestrator] Test gap agent failed:', testGapResult.reason);

  const synthesis = await runSynthesisAgent(codeReview, complexity, testGap, prTitle);

  const processingTimeMs = Date.now() - start;
  console.log(`[Orchestrator] Completed in ${processingTimeMs}ms. Found ${synthesis.allFindings.length} issues.`);

  return {
    agentResults: { codeReview, complexity, testGap },
    findings: synthesis.allFindings,
    severityScore: synthesis.severityScore,
    comment: synthesis.comment,
    summary: synthesis.summaries.codeReview || 'Review complete.',
    processingTimeMs,
  };
}

module.exports = { orchestrateReview };
