const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');

function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });
}

async function getInstallationOctokit(installationId) {
  const appOctokit = getAppOctokit();
  const { token } = await appOctokit.auth({
    type: 'installation',
    installationId,
  });
  return new Octokit({ auth: token });
}

async function getPRDiff(installationId, owner, repo, pullNumber) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: 'diff' },
  });
  return data;
}

async function getPRFiles(installationId, owner, repo, pullNumber) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}

async function postReviewComment(installationId, owner, repo, pullNumber, body) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
  return data;
}

async function postInlineComment(installationId, owner, repo, pullNumber, commitId, path, line, body) {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.pulls.createReviewComment({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitId,
    path,
    line,
    body,
  });
  return data;
}

module.exports = {
  getInstallationOctokit,
  getPRDiff,
  getPRFiles,
  postReviewComment,
  postInlineComment,
};
