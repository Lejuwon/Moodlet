"use client";

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useAnimation,
  useInView,
} from "framer-motion";
import type { Variants } from "framer-motion";
import Link from "next/link";

// 스타일 카드 타입 + 데이터
type StyleItem = {
  id: number;        // 🔹 themeId
  title: string;
  desc: string;
  image: string;
};

const styles: StyleItem[] = [
  {
    id: 1,
    title: "미니멀 & 모던",
    desc: "화이트·그레이와 직선적인 가구로 완성하는 깔끔하고 세련된 도시형 공간",
    image: "/style1.jpg",
  },
  {
    id: 2,
    title: "북유럽 (스칸디나비안)",
    desc: "밝은 우드와 부드러운 컬러, 풍부한 자연광으로 편안하고 따뜻한 북유럽 감성",
    image: "/style2.jpg",
  },
  {
    id: 3,
    title: "내추럴 & 우드",
    desc: "원목 가구와 베이지 톤, 린넨·라탄 등 자연 소재로 안정감을 주는 내추럴 스타일",
    image: "/style3.jpg",
  },
  {
    id: 4,
    title: "빈티지 & 앤티크",
    desc: "앤티크 가구와 클래식 소품, 깊은 브라운 톤으로 레트로한 무드를 연출하는 공간",
    image: "/style4.jpg",
  },
  {
    id: 5,
    title: "파스텔",
    desc: "부드러운 파스텔 컬러와 러블리한 디테일이 돋보이는 달콤하고 아늑한 공간",
    image: "/style5.jpg",
  },
  {
    id: 6,
    title: "인더스트리얼",
    desc: "콘크리트·메탈·블랙 포인트로 거친 질감과 도시적인 분위기를 살린 인더스트리얼 스타일",
    image: "/style6.jpg",
  },
  {
    id: 7,
    title: "미드센츄리",
    desc: "둥근 곡선 가구, 원색 포인트, 낮은 가구 비율이 특징인 50–60년대 미드센츄리 감성",
    image: "/style7.jpg",
  },
  {
    id: 8,
    title: "플랜테리어",
    desc: "다양한 그린 식물과 라탄·우드 가구로 집 안을 싱그러운 실내 정원처럼 만드는 스타일",
    image: "/style8.jpg",
  },
];

export default function IntroSection() {
  const ref = useRef<HTMLDivElement | null>(null);

  // MAIN FEATURES 섹션 애니메이션 컨트롤
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const featuresControls = useAnimation();

  // 👇 once: true 로 한 번만 트리거되게
  const featuresInView = useInView(featuresRef, {
    amount: 0.4,
    once: true,
  });

  useEffect(() => {
    if (featuresInView) {
      featuresControls.start("visible");
    }
    // ❌ else 부분은 없애기 (한 번 visible 되면 계속 유지)
  }, [featuresInView, featuresControls]);

  const featuresVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 80,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.0,
        ease: "easeOut",
      },
    },
  };

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // 첫 문구: 위로 올라가면서 사라짐
  const firstY = useTransform(scrollYProgress, [0, 0.4], [0, -80]);
  const firstOpacity = useTransform(scrollYProgress, [0, 0.3, 0.45], [1, 1, 0]);

  // 두 번째 문구: 아래에서 올라오면서 등장
  const secondY = useTransform(scrollYProgress, [0.2, 0.8], [60, 0]);
  const secondOpacity = useTransform(
    scrollYProgress,
    [0.35, 0.6, 0.9],
    [0, 1, 1]
  );

  // 스타일 카드 자동 슬라이드
  const [styleIndex, setStyleIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setStyleIndex((prev) => (prev + 1) % styles.length);
    }, 3500); // 🔁 1초마다 다음 스타일로
    return () => clearInterval(id);
  }, []);

  const currentStyle = styles[styleIndex];

  return (
    <>
      {/* 🟡 1. 배경 고정 + 문구 교차 섹션 (거실 사진) */}
      <section
        ref={ref}
        className="
          relative
          w-full
          h-[320vh]          /* 스크롤 여유 */
          mt-[-64px]         /* 헤더 뒤까지 배경 보이게 */
          bg-[#060713]
        "
      >
        <div
          className="
            sticky top-0
            h-screen
            flex items-center justify-center
            overflow-hidden
            z-10
          "
          style={{
            backgroundImage: "url('/main_bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* 배경 어둡게 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/35 to-black/10" />

          <div className="relative w-full max-w-[900px] mx-auto px-6">
            {/* 1️⃣ 첫 번째 문구 */}
            <motion.div
              style={{ y: firstY, opacity: firstOpacity }}
              className="
                absolute inset-0
                flex flex-col items-center justify-center
                text-center
              "
            >
              <h1 className="text-3xl md:text-5xl font-semibold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] leading-tight mb-4">
                내 공간의 무드를
                <br className="hidden md:block" />
                한 번에 찾아주는{" "}
                <span className="text-yellow-500">Moodlet</span>
              </h1>
              <p className="text-sm md:text-base text-slate-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] leading-relaxed max-w-xl mx-auto">
                좋아하는 느낌, 원하는 스타일만 골라도
                <br className="hidden md:block" />
                Moodlet이 어울리는 가구와 소품을 한 번에 추천해줘요.
              </p>
            </motion.div>

            {/* 2️⃣ 두 번째 문구 (ABOUT MOODLET) */}
            <motion.div
              style={{ y: secondY, opacity: secondOpacity }}
              className="
                absolute inset-0
                flex flex-col items-center justify-center
                text-center
              "
            >
              <p className="text-xs font-semibold tracking-[0.25em] text-yellow-300 uppercase mb-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                ABOUT MOODLET
              </p>

              <h2 className="text-2xl md:text-4xl font-semibold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)] mb-4 leading-tight">
                스타일 검색부터 가구 찾기까지,
                <br className="hidden md:block" />
                인테리어 여정을 한 화면에서.
              </h2>

              <p className="text-sm md:text-base text-slate-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] leading-relaxed max-w-2xl mx-auto">
                Moodlet은 AI를 활용해 좋아하는 무드를 이해하고,
                <br className="hidden md:block" />
                그 분위기에 맞는 스타일 카드와 실제 가구·소품을 연결해 주는
                인테리어 추천 플랫폼이에요.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🔵 2. MAIN FEATURES – 네이비 화면이 위에 겹치듯 올라오면서, 스크롤마다 재생 */}
      <motion.section
        ref={featuresRef}
        variants={featuresVariants}
        initial="hidden"
        animate={featuresControls}
        className="
          relative
          w-full
          h-[90vh] md:h-screen
          flex items-center justify-center text-center px-6
          bg-[#060713]
          mt-[-56px]          /* ✅ 위 섹션 쪽으로 끌어올리기 */
          pt-16  
          z-20
          rounded-t-[48px]      /* 🔥 위쪽만 둥글게 */
          overflow-hidden 
        "
      >
        {/* 위의 히어로 배경과 자연스럽게 이어지도록, 살짝 윗부분은 투명한 그라데이션 */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent to-[#060713] pointer-events-none" />

        <div className="relative max-w-[1000px] mx-auto">
          <h3 className="text-xs font-semibold tracking-[0.25em] text-yellow-300 uppercase mb-10">
            MAIN FEATURES
          </h3>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10 text-white">
            {/* 버튼 1 – 스타일 맞춤 추천 */}
            <motion.div
              whileHover={{ scale: 1.06, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Link
                href="/survey"
                className="
                  block
                  p-6 md:p-8
                  rounded-3xl
                  bg-white/5 backdrop-blur-sm
                  cursor-pointer
                  hover:bg-white/8
                "
              >
                <h4 className="text-lg md:text-xl font-semibold mb-3">
                  AI 스타일 맞춤 추천
                </h4>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  좋아하는 무드를 기반으로
                  <br />
                  한 눈에 들어오는 스타일 카드 제공
                </p>
              </Link>
            </motion.div>

            {/* 버튼 2 – 스타일 기반 가구 연동 */}
            <motion.div
              whileHover={{ scale: 1.06, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.03,
              }}
            >
              <Link
                href="/floorplan"
                className="
                  block
                  p-6 md:p-8
                  rounded-3xl
                  bg-white/5 backdrop-blur-sm
                  cursor-pointer
                  hover:bg-white/8
                "
              >
                <h4 className="text-lg md:text-xl font-semibold mb-3">
                  AI 기반 평면도 배치
                </h4>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  AI가 구조·동선을 분석해
                  <br />
                  최적의 가구 레이아웃 생성
                </p>
              </Link>
            </motion.div>

            {/* 버튼 3 – 내 공간 미리보기 */}
            <motion.div
              whileHover={{ scale: 1.06, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.06,
              }}
            >
              <Link
                href="/preview"
                className="
                  block
                  p-6 md:p-8
                  rounded-3xl
                  bg-white/5 backdrop-blur-sm
                  cursor-pointer
                  hover:bg-white/8
                "
              >
                <h4 className="text-lg md:text-xl font-semibold mb-3">
                  AI 실감형 가구 합성
                </h4>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  사진 기반 딥러닝 합성으로
                  <br />
                  가구 배치 결과 미리보기
                </p>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 🌙 3. 스타일 카드 슬라이드 섹션 (MULTIPLY 레이아웃 느낌) */}
      <section
        className="
          w-full
          bg-[#060713]
          min-h-screen           /* 👈 한 화면을 꽉 채우고 */
          flex items-center
          py-16 md:py-24
          text-white
        "
      >
        <div
          className="
            max-w-[1200px]
            mx-auto
            grid
            md:grid-cols-2
            gap-10 md:gap-16
            items-center
            px-6
          "
        >
          {/* 왼쪽 – 현재 스타일 설명 */}
          <div className="space-y-4 md:space-y-6">
            <p className="text-xs font-semibold tracking-[0.25em] text-yellow-300 uppercase">
              STYLE CARDS
            </p>
            <h3 className="text-2xl md:text-4xl font-semibold leading-snug">
              당신의 무드에 맞는
              <br className="hidden md:block" />
              스타일 카드를 만나보세요.
            </h3>
            <motion.div
              key={currentStyle.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <h4 className="text-xl md:text-2xl font-semibold text-yellow-200">
                {currentStyle.title}
              </h4>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                {currentStyle.desc}
              </p>
            </motion.div>

            {/* 인디케이터 (동그라미) */}
            <div className="flex gap-2 mt-4">
              {styles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStyleIndex(i)}  // 🔥 클릭하면 해당 스타일로 이동
                  className={`
                    w-2 h-2 rounded-full
                    transition
                    ${i === styleIndex ? "bg-yellow-300" : "bg-slate-500/60"}
                  `}
                  aria-label={`Go to style ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 오른쪽 – 자동 슬라이드 이미지 */}
          <motion.div
            key={currentStyle.image}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="
              w-full
              aspect-[4/3]
              rounded-3xl
              overflow-hidden
              shadow-[0_24px_80px_rgba(0,0,0,0.55)]
            "
          >
            <Link href={`/themes/${currentStyle.id}`} className="block w-full h-full">
              <img
                src={currentStyle.image}
                alt={currentStyle.title}
                className="w-full h-full object-cover cursor-pointer"
              />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}