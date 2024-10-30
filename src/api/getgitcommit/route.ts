import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Helper function to calculate the time 5 minutes ago
function getISOTimeFiveMinutesAgo(): string {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return fiveMinutesAgo.toISOString();
}

// Type definitions for the GitHub Commit response
interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
}

interface ApiResponse {
  commitNames: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!owner || !repo) {
    return res.status(500).json({ error: 'Repository owner and name must be set in environment variables' });
  }

  try {
    const since = getISOTimeFiveMinutesAgo();
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;

    // GitHub API 호출
    const response = await axios.get<Commit[]>(url, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      params: {
        since,
      },
    });

    const commits = response.data;
    const commitNames = commits.map(commit => commit.commit.author.name);

    return res.status(200).json({ commitNames });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({ error: error.response.statusText });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
