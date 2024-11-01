'use client'
import { useEffect, useState } from "react";
import axios from "axios";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

async function getBranches(): Promise<string[]> {
  try {
    const response = await axios.post(
      '/api/getgitcommit',
      {}, // 요청 본문을 비워서 전송
      {
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'getBranch',
        },
      }
    );
    return response.data.branches;
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return []; // 오류 발생 시 빈 배열 반환
  }
}

export default function Page() {
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    async function fetchBranches() {
      const branches = await getBranches();
      setBranches(branches);
    }
    fetchBranches();
  }, []);

  return (
    <div>
        <div>
            {branches.map((branch, index) => (
                <div className="flex" key={index}>
                    <p className="text-3xl">{branch}</p>
                    <Picker data={data} onEmojiSelect={console.log} />
                </div>
            ))}
        </div>
    </div>
  );
}
