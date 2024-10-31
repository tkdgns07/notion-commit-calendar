import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

function getISOTimeFiveMinutesAgo(): string {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return fiveMinutesAgo.toISOString();
}

interface CommitDetail {
  sha: string;
  files: {
    filename: string;
    patch?: string;
  }[];
}

export async function GET(req: NextRequest) {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    return NextResponse.json({ error: 'epository owner, name, and token must be set in environment variables' }, { status: 500 });
  }

  try {
    const since = getISOTimeFiveMinutesAgo();
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;

    // 1. 최근 5분 내 커밋 목록 가져오기
    const commitListResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
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
            Authorization: `Bearer ${token}`,
          },
        });
        const { sha, files } = commitDetailResponse.data;

        // 각 파일별 patch 데이터 포함
        const fileChanges = files.map(file => ({
          filename: file.filename,
          patch: file.patch || '',  // patch 정보가 없는 경우 빈 문자열
        }));

        return { sha, files: fileChanges };
      })
    );

    // 3. 각 커밋의 변경 사항을 반환
    return NextResponse.json({ commitDetails }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json({ error: error.response.statusText }, { status: error.response.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
