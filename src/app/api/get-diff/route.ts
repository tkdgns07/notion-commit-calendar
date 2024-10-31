import { NextRequest, NextResponse } from 'next/server';

interface CommitFile {
  filename: string;
  patch: string;
}

interface CommitDetail {
  sha: string;
  files: CommitFile[];
}

interface ProcessedDiff {
  filename: string;
  additions: string[];
  deletions: string[];
}

export async function POST(req: NextRequest) {
  const { commitDetails }: { commitDetails: CommitDetail[] } = await req.json();

  if (!commitDetails) {
    return NextResponse.json({ error: 'Invalid data format.' }, { status: 400 });
  }

  const processedDiffs = commitDetails.map((commit) => {
    return commit.files.map((file) => {
      const additions: string[] = [];
      const deletions: string[] = [];

      if (file.patch) {
        const lines = file.patch.split('\n');
        for (const line of lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            additions.push(line.slice(1).trim());
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            deletions.push(line.slice(1).trim());
          }
        }
      }

      return {
        filename: file.filename,
        additions,
        deletions,
      };
    });
  });

  return NextResponse.json({ processedDiffs }, { status: 200 });
}
