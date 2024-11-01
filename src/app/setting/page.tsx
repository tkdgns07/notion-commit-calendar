'use client'
import { useEffect, useState } from "react";
import axios from "axios";

async function getBranches(): Promise<string[]> {
  try {
    const response = await axios.post(
      '/api/getgitcommit',
      {}, // 요청 본문을 비워서 전송
      {
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'getBranch', // 커스텀 이벤트명 설정
        //   Authorization: `Bearer YOUR_ACCESS_TOKEN`, // 필요한 경우 인증 헤더 포함
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return [];
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
  }, []); // 의존성 배열을 빈 배열로 설정하여 한 번만 실행

  return (
    <div>
      <h1>Branches</h1>
      <ul>
        {branches.map((branch, index) => (
          <li key={index}>{branch}</li>
        ))}
      </ul>
    </div>
  );
}
