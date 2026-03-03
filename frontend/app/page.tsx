"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, request } from "@/lib/api";
import type { InterestsResponse } from "@/types/onboarding";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("checking...");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  useEffect(() => {
    request<InterestsResponse>("/api/onboarding/interests")
      .then((data) => {
        if (data.interests.length === 0) {
          router.replace("/onboarding/interests");
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          // Not logged in — redirect to onboarding
          router.replace("/onboarding/interests");
        } else {
          // API unreachable — show page anyway
          setReady(true);
        }
      });
  }, [router]);

  if (!ready) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Your Podcast</h1>
      <p className="text-lg text-gray-500">
        每天自动生成的中文科技播客 🎙️
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
