import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

//test용 주석 : ddddddd

interface CommitFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

interface CommitDetail {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
  author: {
    avatar_url: string; // 유저의 프로필 이미지 URL
  };
  branches: string[]; // 브랜치 정보 추가
  files: CommitFile[];
}

interface BranchOnlyResult {
  branches: string[];
}

const owner = process.env.GITHUB_REPO_OWNER;
const repo = process.env.GITHUB_REPO_NAME;
const githubToken = process.env.GITHUB_TOKEN;
const notionUpdateApiUrl = `${process.env.BASE_URL}/api/updatenotioncalendar`;

function getISOTimeOneSecondsAgo(): string {
  const fiveMinutesAgo = new Date(Date.now() - 1 * 1000);
  return fiveMinutesAgo.toISOString();
}

async function getCommit(includeDetails = true): Promise<CommitDetail[] | BranchOnlyResult> {
  try {
    const since = getISOTimeOneSecondsAgo();
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;

    const commitListResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
      params: { since },
    });

    const commits = commitListResponse.data;

    if (!includeDetails) {
      const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
      const branchesResponse = await axios.get(branchesUrl, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      });

      const branches = branchesResponse.data.map((branch: { name: string }) => branch.name);
      return { branches };
    }

    const commitDetails = await Promise.all(
      commits.map(async (commit: { sha: string }) => {
        const commitDetailUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`;
        const commitDetailResponse = await axios.get<CommitDetail>(commitDetailUrl, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });

        const { sha, commit: { author, message }, author : commitAuthor, files } = commitDetailResponse.data;

        const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
        const branchesResponse = await axios.get(branchesUrl, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });

        const branches = branchesResponse.data
          .filter((branch: { commit: { sha: string } }) => branch.commit.sha === sha)
          .map((branch: { name: string }) => branch.name);

        const formattedFiles = files.map(file => ({
          filename: file.filename,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch,
        }));

        return {
          sha,
          author: author.name,
          date: author.date,
          message,
          files: formattedFiles,
          branches, // 브랜치 정보 추가
          avatarUrl: commitAuthor?.avatar_url || '', // 커밋 유저의 프로필 이미지 URL 추가
        };
      })
    );

    return commitDetails;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function updateCommit(commitDetails: CommitDetail[]) {
  console.log(commitDetails)
  try {
    const notionResponse = await axios.post(
      notionUpdateApiUrl,
      commitDetails,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: notionResponse.data,
      commits: commitDetails,
    };
  } catch (error) {
    console.error('Error updating commit:', error);
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, error: error.response.statusText };
    }
    return { success: false, error: 'Internal Server Error' };
  }
}

export async function POST(req: NextRequest) {
  if (!owner || !repo || !githubToken || !notionUpdateApiUrl) {
    return NextResponse.json({ error: 'Environment variables not set correctly.' }, { status: 500 });
  }

  const eventType = req.headers.get('X-GitHub-Event');

  if (eventType === 'push') {
    const commitDetails = await getCommit(true);
    const result = await updateCommit(commitDetails as CommitDetail[]);
    if (result.success) {
      return NextResponse.json({ message: 'Commits processed and sent to Notion API', data: result.data, commits: result.commits }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } else if (eventType === 'getBranch') {
    const branchDetails = await getCommit(false);
    return NextResponse.json(branchDetails, { status: 200 });
  } else {
    return NextResponse.json({ message: 'Event not supported' }, { status: 400 });
  }
}
