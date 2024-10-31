import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// Notion 클라이언트 초기화
const notion = new Client({ auth: process.env.NOTION_TOKEN });

interface CommitData {
  sha: string;
  author: string;
  date: string;
  message: string;
}

export async function POST(req: NextRequest) {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    return NextResponse.json({ error: 'Notion database ID is not set in environment variables.' }, { status: 500 });
  }

  // 요청에서 커밋 데이터를 추출
  const commitDataArray: CommitData[] = await req.json();

  try {
    // 각 커밋을 Notion 데이터베이스에 추가
    const responses = await Promise.all(
      commitDataArray.map(async (commit) => {
        return await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: commit.message,
                  },
                },
              ],
            },
            Date: {
              date: {
                start: commit.date,
              },
            },
            User: {
              rich_text: [
                {
                  text: {
                    content: commit.author,
                  },
                },
              ],
            },
            SHA: {
              rich_text: [
                {
                  text: {
                    content: commit.sha,
                  },
                },
              ],
            },
          },
        });
      })
    );

    // 성공적으로 추가되면 응답 반환
    return NextResponse.json({ message: 'Commits added to Notion database', data: responses }, { status: 200 });
  } catch (error) {
    // 오류 처리
    if (error instanceof Error) {
      console.error('Error adding commits to Notion:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('Unknown error adding commits to Notion');
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}
