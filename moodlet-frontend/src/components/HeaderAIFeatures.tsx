// src/components/HeaderAIFeatures.tsx
"use client";

import Link from "next/link";

const features = [
  {
    name: "AI 스타일 맞춤 추천",
    href: "/survey",
  },
  {
    name: "AI 기반 평면도 배치",
    href: "/floorplan",
  },
  {
    name: "AI 실감형 가구 합성",
    href: "/preview",
  },
];

type HeaderAIFeaturesProps = {
  /** 
   * light  : 밝은 배경(카테고리 페이지 상단)에서 사용
   * dark   : 어두운 배경(모바일 드롭다운)에서 사용
   */
  variant?: "light" | "dark";
};

export default function HeaderAIFeatures({ variant = "light" }: HeaderAIFeaturesProps) {
  const titleClass =
    variant === "light"
      ? "font-medium text-gray-900 group-hover:text-[#ffdd5f]"
      : "font-medium text-gray-100 group-hover:text-[#ffdd5f]";

  const descClass =
    variant === "light"
      ? "text-[11px] text-gray-500 group-hover:text-gray-700"
      : "text-[11px] text-gray-400 group-hover:text-gray-200";

  return (
    <nav className="flex gap-6 text-sm">
      {features.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="group flex flex-col leading-tight transition-colors"
        >
          <span className={titleClass}>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}
