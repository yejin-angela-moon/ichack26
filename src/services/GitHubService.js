const axios = require("axios");

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Fetch the past commits for a specific file in a GitHub repository
 * @param {string} owner - GitHub repository owner
 * @param {string} repo - GitHub repository name
 * @param {string} filePath - Path to the file in the repository
 * @param {number} count - Number of commits to fetch (default: 5)
 * @returns {Promise<Array>} Array of commit objects with metadata
 */
async function getFileCommitHistory(owner, repo, filePath, count = 5) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits`;

  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(url, {
      params: {
        path: filePath,
        per_page: count,
      },
      headers,
    });

    return response.data.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: commit.commit.author.name,
      email: commit.commit.author.email,
      date: commit.commit.author.date,
      url: commit.html_url,
      filesChanged: commit.files ? commit.files.length : null,
    }));
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        `Repository or file not found: ${owner}/${repo}/${filePath}`
      );
    }
    if (error.response?.status === 422) {
      throw new Error(`Invalid commit SHA or path: ${filePath}`);
    }
    throw new Error(`Failed to fetch commits: ${error.message}`);
  }
}

/**
 * Fetch a specific commit with detailed changes
 * @param {string} owner - GitHub repository owner
 * @param {string} repo - GitHub repository name
 * @param {string} sha - Commit SHA
 * @returns {Promise<Object>} Commit object with detailed changes
 */
async function getCommitDetails(owner, repo, sha) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`;

  try {
    const headers = {
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(url, {
      headers,
    });

    const commit = response.data;
    return {
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: commit.commit.author.name,
      email: commit.commit.author.email,
      date: commit.commit.author.date,
      url: commit.html_url,
      filesChanged: commit.files.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch || null,
      })),
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Commit not found: ${sha}`);
    }
    throw new Error(`Failed to fetch commit details: ${error.message}`);
  }
}

/**
 * Fetch raw diff for a specific commit
 * @param {string} owner - GitHub repository owner
 * @param {string} repo - GitHub repository name
 * @param {string} sha - Commit SHA
 * @returns {Promise<string>} Raw diff content
 */
async function getCommitDiff(owner, repo, sha) {
  const url = `https://github.com/${owner}/${repo}/commit/${sha}.diff`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch diff for commit ${sha}: ${error.message}`);
  }
}

/**
 * Fetch diff changes for past commits, organized per file
 * @param {string} owner - GitHub repository owner
 * @param {string} repo - GitHub repository name
 * @param {string} filePath - Path to the file in the repository
 * @param {number} commitCount - Number of past commits to fetch (default: 5)
 * @returns {Promise<Object>} Diff changes organized by commit with raw diffs per file
 */
async function getFileDiffHistory(owner, repo, filePath, commitCount = 5) {
  try {
    const commits = await getFileCommitHistory(owner, repo, filePath, commitCount);
    const diffsByCommit = {};

    for (const commit of commits) {
      const rawDiff = await getCommitDiff(owner, repo, commit.sha);

      // Parse the diff to extract changes per file
      const filesInDiff = parseRawDiff(rawDiff);

      diffsByCommit[commit.sha] = {
        shortSha: commit.shortSha,
        message: commit.message,
        author: commit.author,
        date: commit.date,
        filesChanged: filesInDiff,
        rawDiff: rawDiff,
      };
    }

    return diffsByCommit;
  } catch (error) {
    throw new Error(`Failed to fetch diff history: ${error.message}`);
  }
}

/**
 * Parse raw diff string to extract per-file changes
 * @param {string} rawDiff - Raw diff content
 * @returns {Array} Array of files with their changes
 */
function parseRawDiff(rawDiff) {
  const files = [];
  const lines = rawDiff.split('\n');
  let currentFile = null;
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    // Match "diff --git" lines to identify files
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        files.push({
          ...currentFile,
          additions,
          deletions,
        });
      }
      // Extract filename from "diff --git a/path b/path"
      const match = line.match(/b\/(.*?)$/);
      if (match) {
        currentFile = {
          filename: match[1],
          status: 'modified',
        };
        additions = 0;
        deletions = 0;
      }
    }
    // Count additions and deletions
    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  // Don't forget the last file
  if (currentFile) {
    files.push({
      ...currentFile,
      additions,
      deletions,
    });
  }

  return files;
}

module.exports = {
  getFileCommitHistory,
  getCommitDetails,
  getCommitDiff,
  getFileDiffHistory,
};
