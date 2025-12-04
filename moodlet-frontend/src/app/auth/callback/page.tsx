"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    if (token && email) {
      // 유저 정보 저장 (Header에서 읽는 포맷 그대로)
      localStorage.setItem(
        "moodlet_user",
        JSON.stringify({
          id: "google",   // 나중에 필요하면 sub 써도 됨
          email,
          name,
        }),
      );
      localStorage.setItem("moodlet_access_token", token);
    }

    // 메인 화면으로 이동
    router.replace("/");
  }, [searchParams, router]);

  return null; // 로딩 화면 필요하면 여기서 간단한 스피너 보여줘도 됨
}
