import { NextResponse } from 'next/server';
import axios from 'axios';

function getISOTimeFiveMinutesAgo(): string {
  const fiveMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
  return fiveMinutesAgo.toISOString();
}
//dddddddd
interface CommitFile {
  filename: string;
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
  files: CommitFile[];
}

export async function GET() {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const githubToken = process.env.GITHUB_TOKEN;
  const notionUpdateApiUrl = `${process.env.BASE_URL}/api/updatenotioncalendar`;

  if (!owner || !repo || !githubToken || !notionUpdateApiUrl) {
    return NextResponse.json({ error: 'Environment variables not set correctly.' }, { status: 500 });
  }

  try {
    const since = getISOTimeFiveMinutesAgo();
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;

    const commitListResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
      params: { since },
    });

    const commits = commitListResponse.data;

    // 2. 각 커밋의 SHA를 사용해 상세 정보와 포함된 브랜치 가져오기
    const commitDetails = await Promise.all(
      commits.map(async (commit: { sha: string }) => {
        const commitDetailUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`;
        const commitDetailResponse = await axios.get<CommitDetail>(commitDetailUrl, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });
        const { sha, commit: { author, message } } = commitDetailResponse.data;

        // 모든 브랜치를 확인하고, 커밋을 포함하는 브랜치 찾기
        const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
        const branchesResponse = await axios.get(branchesUrl, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });
        
        // 해당 커밋을 포함하는 브랜치 찾기
        const branches = branchesResponse.data.filter(async (branch: { name: string; commit: { sha: string } }) => {
          const branchCommitUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${branch.commit.sha}`;
          const branchCommitResponse = await axios.get(branchCommitUrl, {
            headers: {
              Authorization: `Bearer ${githubToken}`,
            },
          });
          return branchCommitResponse.data.parents.some((parent: { sha: string }) => parent.sha === commit.sha);
        }).map((branch: { name: string }) => branch.name);

        // 파일별 patch 데이터 포함
        return { sha, author: author.name, date: author.date, message, branches };
      })
    );

    console.log(commitDetails);

    // 3. Notion 업데이트 API에 데이터 전송
    const notionResponse = await axios.post(
      notionUpdateApiUrl,
      commitDetails,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // 4. 최종 응답
    return NextResponse.json({ message: 'Commits processed and sent to Notion API', notionResponse: notionResponse.data, commits: commitDetails }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ error: error.response.statusText }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
