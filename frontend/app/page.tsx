"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<string>("checking...");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Your Podcast</h1>
      <p className="text-lg text-gray-500">
        每天自动生成的中文科技播客
      </p>
      <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
        <span
          className={`h-3 w-3 rounded-full ${
            status === "ok" ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm">
          后端状态: {status}
        </span>
      </div>
    </main>
  );
}
