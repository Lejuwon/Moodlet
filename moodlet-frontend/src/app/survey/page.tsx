// src/app/style/page.tsx
"use client";

import Link from "next/link";

export default function StyleIntroPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-24 md:pt-20">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14 space-y-8">
        {/* 제목 / 설명 */}
        <section className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            Moodlet · Style Survey
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold leading-snug">
            스타일 맞춤 추천 설문을
            <br className="hidden md:block" />
            지금 바로 시작해 볼까요?
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            총 <span className="font-medium">10개 질문</span>으로
            <span className="md:inline block"> 미니멀, 북유럽, 빈티지 등 8가지 인테리어 스타일 중</span>
            주원님의 취향에 가장 잘 맞는 스타일을 찾아드려요.
            <br />
            마지막에는 주원님 답변을 반영한{" "}
            <span className="font-medium">AI 인테리어 이미지</span>도 함께 생성됩니다.
          </p>
        </section>

        {/* 안내 카드 */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                소요 시간
              </p>
              <p className="font-medium text-slate-800">약 1분 내외</p>
              <p className="text-slate-500">
                짧은 시간 안에 빠르게
                <br />
                취향을 진단할 수 있어요.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                구성
              </p>
              <p className="font-medium text-slate-800">
                선택형 7문항 · 서술형 3문항
              </p>
              <p className="text-slate-500">
                보기에서 골라 답하고,
                <br />
                마지막에 원하는 분위기를
                <br />
                자유롭게 적어주시면 됩니다.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                결과
              </p>
              <p className="font-medium text-slate-800">
                스타일 + AI 인테리어 이미지
              </p>
              <p className="text-slate-500">
                나에게 어울리는 스타일과
                <br />
                그 스타일을 시각화한 이미지를
                <br />
                한 번에 확인할 수 있어요.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500 mb-2">
              설문을 시작하면, 이후에 답변을 바탕으로 결과 화면과 이미지를 생성합니다.
            </p>
            <div className="flex flex-wrap gap-3">
              {/* ✅ 실제 설문 시작 버튼 → /survey */}
              <Link
                href="/survey/flow"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                네, 설문을 시작할게요
              </Link>

              {/* 돌아가기 / 홈으로 */}
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                나중에 할게요
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
