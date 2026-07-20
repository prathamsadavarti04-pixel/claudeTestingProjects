import { App } from "@octokit/app";

let _app: App | null = null;

/**
 * Lazily constructed so importing this module doesn't throw in
 * environments where the GitHub App isn't configured yet (e.g. the rest
 * of the product working before someone's set up GITHUB_APP_*). Call
 * `isGithubAppConfigured()` before calling this if you need to branch on it.
 */
export function getGithubApp(): App {
  if (_app) return _app;

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

  if (!appId || !privateKey || !webhookSecret) {
    throw new Error(
      "GitHub App isn't configured. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_WEBHOOK_SECRET — see .env.example."
    );
  }

  _app = new App({
    appId,
    // .env files can't hold real newlines cleanly; store the PEM with
    // literal "\n" and unescape it here.
    privateKey: privateKey.replace(/\\n/g, "\n"),
    webhooks: { secret: webhookSecret },
  });

  return _app;
}

export function isGithubAppConfigured(): boolean {
  return !!process.env.GITHUB_APP_ID && !!process.env.GITHUB_APP_PRIVATE_KEY;
}

/** Scoped Octokit for a single installation — this is what you use for all repo/PR calls. */
export async function getInstallationOctokit(installationId: string | number) {
  const app = getGithubApp();
  return app.getInstallationOctokit(Number(installationId));
}

export interface PrDiffFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

/** Fetches the file-level diff for a PR — this is the input to the review loop's chunker. */
export async function fetchPullRequestDiff(
  installationId: string | number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<PrDiffFile[]> {
  const octokit = await getInstallationOctokit(installationId);
  const files: PrDiffFile[] = [];
  let page = 1;

  // GitHub paginates PR files at 100/page and this endpoint doesn't support
  // the `octokit.paginate` iterator cleanly with `patch` intact in every
  // version, so we page manually and stop when a page comes back short.
  for (;;) {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
      { owner, repo, pull_number: pullNumber, per_page: 100, page }
    );
    files.push(
      ...data.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      }))
    );
    if (data.length < 100) break;
    page += 1;
  }

  return files;
}

export async function postPullRequestComment(
  installationId: string | number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string
) {
  const octokit = await getInstallationOctokit(installationId);
  return octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}


