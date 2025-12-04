"use client";

import { useRef } from "react";
import Header from "@/components/Header";
import IntroSection from "@/components/IntroSection";

export default function Home() {
  return (
    <>
      {/* 헤더: 화면 최상단 고정 */}
      {/* <Header /> */}

      {/* 헤더 높이만큼 띄우고 나머지 콘텐츠 시작 */}
      <main className="min-h-screen bg-[#060713] text-white pt-16 w-full flex flex-col items-center">
        {/* 1) 인트로 랜딩 섹션 */}
        <IntroSection />
      </main>
    </>
  );
}
