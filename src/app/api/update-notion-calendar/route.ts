import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface CommitData {
  sha: string;
  author: string;
  date: string;
  message: string;
}

export async function POST(req: NextRequest) {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    return NextResponse.json({ error: 'Notion API token or database ID not set in environment variables.' }, { status: 500 });
  }

  const commitDataArray: CommitData[] = await req.json();

  try {
    const responses = await Promise.all(
      commitDataArray.map(async (commit) => {
        const notionUrl = `https://api.notion.com/v1/pages`;
        const response = await axios.post(
          notionUrl,
          {
            parent: { database_id: databaseId },
            properties: {
              Title: {
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
          },
          {
            headers: {
              Authorization: `Bearer ${notionToken}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28',
            },
          }
        );
        return response.data;
      })
    );

    return NextResponse.json({ message: 'Commits added to Notion database', data: responses }, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error)) {
        // AxiosError 타입일 경우
        return NextResponse.json({ error: error.response?.statusText || 'Axios request failed' }, { status: error.response?.status || 500 });
      } else if (error instanceof Error) {
        // 일반 Error 타입일 경우
        return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        // 예상치 못한 타입일 경우
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
      }
  }
}
