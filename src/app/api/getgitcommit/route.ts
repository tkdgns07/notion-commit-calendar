import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

function getISOTimeFiveMinutesAgo(): string {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return fiveMinutesAgo.toISOString();
}

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

export async function GET(req: NextRequest) {
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

    // 1. 최근 5분 내 커밋 목록 가져오기
    const commitListResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
      params: { since },
    });

    const commits = commitListResponse.data;

    // 2. 각 커밋의 SHA를 사용해 상세 정보와 변경사항(patch) 가져오기
    const commitDetails = await Promise.all(
      commits.map(async (commit: { sha: string }) => {
        const commitDetailUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`;
        const commitDetailResponse = await axios.get<CommitDetail>(commitDetailUrl, {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });
        const { sha, commit: { author, message }, files } = commitDetailResponse.data;

        // 파일별 patch 데이터 포함
        return { sha, author: author.name, date: author.date, message };
      })
    );

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
    return NextResponse.json({ message: 'Commits processed and sent to Notion API', notionResponse: notionResponse.data, commits : commits }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ error: error.response.statusText }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
