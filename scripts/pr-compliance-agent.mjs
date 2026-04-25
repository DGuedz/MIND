import { execSync } from 'child_process';
import * as fs from 'fs';
import * as https from 'https';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;

// VSC Economy Mode: Strict log formatting
function logEvent(action, details) {
  console.log(`[MIND_PR_AGENT] [${new Date().toISOString()}] ${action}: ${details}`);
}

async function run() {
  if (!GITHUB_TOKEN || !PR_NUMBER || !REPO) {
    logEvent('SKIPPED', 'Missing required environment variables for PR analysis.');
    return;
  }

  logEvent('START', `Analyzing PR #${PR_NUMBER} in ${REPO}`);

  try {
    // Fetch PR diff
    const diffCommand = `curl -s -H "Authorization: token ${GITHUB_TOKEN}" -H "Accept: application/vnd.github.v3.diff" https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`;
    const diff = execSync(diffCommand).toString();

    const violations = [];

    // Rule 1: No Emojis (VSC Economy Mode)
    const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;
    if (emojiRegex.test(diff)) {
      violations.push('RC_POLICY_VIOLATION: Emojis detected in code. Violates VSC Economy Policy.');
    }

    // Rule 2: No Hardcoded Private Keys
    const privateKeyRegex = /("|')(0x)?[0-9a-fA-F]{64}("|')/g;
    if (privateKeyRegex.test(diff)) {
      violations.push('RC_SECRET_EXFIL_ATTEMPT: Potential hardcoded private key detected. Use KMS.');
    }

    // Rule 3: No "ignore previous instructions"
    if (diff.toLowerCase().includes('ignore previous instructions')) {
      violations.push('RC_PROMPT_INJECTION: Adversarial prompt detected.');
    }

    if (violations.length > 0) {
      logEvent('REJECTED', 'PR contains compliance violations.');
      violations.forEach(v => logEvent('VIOLATION', v));
      
      // Post comment on PR
      const commentBody = JSON.stringify({
        body: `### MIND Protocol Compliance Report\n\n**Status: BLOCKED**\n\nThe following violations were found:\n${violations.map(v => `- ${v}`).join('\n')}\n\nPlease fix these issues according to \`AGENTS.md\` and push again.`
      });

      execSync(`curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" -d '${commentBody}' https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`);
      process.exit(1); // Fail the action
    } else {
      logEvent('APPROVED', 'No compliance violations detected.');
      const commentBody = JSON.stringify({
        body: `### MIND Protocol Compliance Report\n\n**Status: ALLOW**\n\nCode meets VSC Economy and Zero-Trust KMS baselines.`
      });
      execSync(`curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" -d '${commentBody}' https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`);
    }

  } catch (error) {
    logEvent('ERROR', `Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

run();
