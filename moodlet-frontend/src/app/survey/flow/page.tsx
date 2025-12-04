"use client";

import { useEffect, useState } from "react";
import { choiceQuestions, textQuestions } from "../questions";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ChoiceOptionId = "A" | "B" | "C";

type SurveyResult = {
  session_id?: number | null;
  finalStyle: string;
  finalStyleLabel: string;
  bestMatchStyles: string[];
  bestMatchStyleLabels: string[];
  worstStyle?: string | null;
  worstStyleLabel?: string | null;
  prompt: string;
  image?: string | null;
  imageUrl?: string | null;
};

type Product = {
  product_id: number;
  name: string;
  image_url: string;
  detail_url: string;
  category: string;
  lowest_price: number;
  score: number;
};

type RecommendResponse = {
  session_id: number;
  style_id: number;
  categories: Record<string, Product[]>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function SurveyFlow() {
  const router = useRouter();
  const totalQuestions = choiceQuestions.length + textQuestions.length;

  const [currentIndex, setCurrentIndex] = useState(0);

  // 설문 세션 ID (백엔드 /survey/sessions 에서 발급)
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [choiceAnswers, setChoiceAnswers] = useState<
    Record<string, ChoiceOptionId | null>
  >({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<RecommendResponse | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoError, setRecoError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isChoice = currentIndex < choiceQuestions.length;

  const currentChoiceQuestion = isChoice
    ? choiceQuestions[currentIndex]
    : null;

  const currentTextQuestion = !isChoice
    ? textQuestions[currentIndex - choiceQuestions.length]
    : null;

  useEffect(() => {
    if (recommendation && !activeCategory) {
      const firstCategory = Object.keys(recommendation.categories)[0];
      setActiveCategory(firstCategory);
    }
  }, [recommendation, activeCategory]);

  // ✅ 페이지 진입 시 세션 생성
  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/survey/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: null }), // 로그인 없으니 null
        });

        if (!res.ok) {
          console.error("세션 생성 실패", await res.text());
          return;
        }

        const data = await res.json();
        // schemas: StartSessionResponse { session_id, questions }
        setSessionId(data.session_id);
      } catch (e) {
        console.error("세션 생성 중 오류", e);
      }
    };

    createSession();
  }, []);

  const handleChoice = (option: ChoiceOptionId) => {
    if (!currentChoiceQuestion) return;
    setChoiceAnswers((prev) => ({
      ...prev,
      [currentChoiceQuestion.id]: option,
    }));
  };

  const handleText = (value: string) => {
    if (!currentTextQuestion) return;
    setTextAnswers((prev) => ({
      ...prev,
      [currentTextQuestion.id]: value,
    }));
  };

  // 👉 다음 질문 / 마지막이면 제출
  const goNext = async () => {
    const isLast = currentIndex === totalQuestions - 1;

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      await submitSurvey();
    }
  };

  // ✅ 최종 분석 API 호출: POST /survey/final-analysis
  const submitSurvey = async () => {
    setLoading(true);
    setError(null);

    // choiceAnswers 비어 있는 문항 기본값 처리
    const choicePayload: Record<string, ChoiceOptionId> = {};
    for (const q of choiceQuestions) {
      choicePayload[q.id] = (choiceAnswers[q.id] as ChoiceOptionId) ?? "A";
    }

    const payload = {
      session_id: sessionId, // 세션 없으면 null로 보내짐
      choiceAnswers: choicePayload,
      textAnswers,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/survey/final-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error("final-analysis 오류", msg);
        setError("결과 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const data: SurveyResult = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!result?.session_id) return;

    setRecoLoading(true);
    setRecoError(null);

    try {
      const res = await fetch(
        `${API_BASE_URL}/recommendations/from-survey?session_id=${result.session_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        console.error("recommendations 오류", msg);
        setRecoError("가구 추천을 불러오는 중 오류가 발생했습니다.");
        return;
      }

      const data: RecommendResponse = await res.json();
      setRecommendation(data);
    } catch (e) {
      console.error(e);
      setRecoError("네트워크 오류로 가구 추천을 불러오지 못했습니다.");
    } finally {
      setRecoLoading(false);
    }
  };

  // ================================
  //  결과 화면
  // ================================
  if (result) {
    const rawImage = result.image ?? result.imageUrl ?? null;
    const imageSrc =
      rawImage && rawImage.startsWith("/static/")
        ? `${API_BASE_URL}${rawImage}`
        : rawImage;

    const { finalStyleLabel, bestMatchStyleLabels, session_id } = {
      finalStyleLabel: result.finalStyleLabel,
      bestMatchStyleLabels: result.bestMatchStyleLabels ?? [],
      session_id: result.session_id,
    };

    const formatPrice = (price: number) =>
      new Intl.NumberFormat("ko-KR").format(price);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">
          {/* 상단 타이틀 영역 */}
          <header className="space-y-2">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-[0.2em]">
              STYLE RESULT
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              당신의 인테리어 스타일 결과
            </h1>
            <p className="text-sm text-slate-600">
              설문에 응답한 내용을 바탕으로 주원님의 취향에 가장 잘 맞는 스타일을
              분석했어요. 아래 결과를 확인하고, 이 스타일에 어울리는 가구까지
              함께 추천받아 보세요.
            </p>
          </header>

          {/* 결과 카드 */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8">
            {/* 스타일 + 이미지 영역 */}
            <div className="grid gap-6 md:grid-cols-[1.4fr,1fr] items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">
                    당신의 인테리어 스타일
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {finalStyleLabel}
                  </h2>
                </div>

                {/* 궁합이 좋은 스타일 */}
                {bestMatchStyleLabels && bestMatchStyleLabels.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500">
                      궁합이 좋은 스타일 ✨
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bestMatchStyleLabels.map((label, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-700"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  * 스타일 이름은 Moodlet 팀에서 정의한 내부 기준으로, 실제
                  인테리어 용어와 다를 수 있어요.
                </p>
              </div>

              {/* AI 이미지 */}
              {imageSrc && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img
                    src={imageSrc}
                    alt="AI Generated Interior"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* 가구 추천 버튼 */}
            <div className="pt-2 space-y-3">
              <button
                onClick={fetchRecommendations}
                disabled={!session_id || recoLoading}
                className="w-full md:w-auto px-6 py-3 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {recoLoading
                  ? "가구 추천 불러오는 중..."
                  : "이 스타일에 맞는 가구 추천 받기"}
              </button>

              {recoError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {recoError}
                </p>
              )}
            </div>

            {/* ✅ 추천 결과 섹션 */}
            {recommendation && (
              <section className="pt-6 border-t space-y-4">
                {/* 카테고리 선택 탭 + 평면도 배치 버튼 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* 카테고리 탭 */}
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(recommendation.categories).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1 text-xs rounded-full border transition ${
                          activeCategory === cat
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {cat.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  {/* 평면도 배치 버튼 */}
                  <Link
                    href="/floorplan"
                    className="px-4 py-1.5 text-xs rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                  >
                    AI 기반 평면도 배치
                  </Link>
                </div>

                {/* 선택된 카테고리의 상품 목록 */}
                {activeCategory && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendation.categories[activeCategory].map(
                        (item) => (
                          <a
                            key={item.product_id}
                            href={`/category/${item.category}/${item.product_id}`}
                            className="rounded-xl p-3 flex flex-col gap-2 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-sm transition-shadow"
                          >
                            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-medium text-slate-800 line-clamp-2">
                                {item.name}
                              </p>
                              <p className="text-sm font-semibold text-emerald-700">
                                {formatPrice(item.lowest_price)}원
                              </p>
                            </div>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 메인으로 돌아가기 */}
            <div className="pt-4 border-t mt-4 flex justify-between items-center gap-3 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => router.push("/style")}
                className="hover:text-slate-700 underline underline-offset-4"
              >
                ← 스타일 소개로 돌아가기
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                메인 화면으로
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ================================
  //  설문 진행 화면
  // ================================
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* 상단 설명 */}
        <header className="space-y-2">
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-[0.2em]">
            STYLE SURVEY
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            스타일 맞춤 추천 설문을 진행할게요
          </h1>
          <p className="text-sm text-slate-600">
            총 {totalQuestions}개의 질문에 답하면, 주원님의 취향을 분석해
            인테리어 스타일과 추천 가구를 함께 보여드려요.
          </p>
        </header>

        {/* 질문 카드 */}
        <section className="w-full max-w-md mx-auto bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          {/* 현재 질문 번호 */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            질문 {currentIndex + 1} / {totalQuestions}
          </p>

          {/* 질문 텍스트 */}
          <h2 className="text-lg font-medium text-slate-900">
            {isChoice ? currentChoiceQuestion?.text : currentTextQuestion?.text}
          </h2>

          {/* 선택형 */}
          {isChoice && currentChoiceQuestion && (
            <div className="space-y-3">
              {currentChoiceQuestion.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition ${
                    choiceAnswers[currentChoiceQuestion.id] === opt.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200"
                  }`}
                  onClick={() => handleChoice(opt.id as ChoiceOptionId)}
                >
                  <input
                    type="radio"
                    checked={choiceAnswers[currentChoiceQuestion.id] === opt.id}
                    readOnly
                  />
                  <span className="text-sm text-slate-800">{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* 서술형 */}
          {!isChoice && currentTextQuestion && (
            <textarea
              className="w-full p-3 border border-slate-200 rounded-xl text-sm min-h-[110px] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder={
                currentTextQuestion.placeholder ?? "자유롭게 적어주세요"
              }
              value={textAnswers[currentTextQuestion.id] ?? ""}
              onChange={(e) => handleText(e.target.value)}
            />
          )}

          {/* 에러 메시지 */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* 다음 버튼 */}
          <button
            onClick={goNext}
            disabled={loading}
            className="w-full py-3 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {currentIndex === totalQuestions - 1
              ? loading
                ? "결과 불러오는 중..."
                : "결과 보기"
              : "다음 질문"}
          </button>

          {/* 나중에 할게요 / 메인 */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hover:text-slate-700 underline underline-offset-4"
            >
              나중에 할게요
            </button>
            <span>진행 중인 답변은 자동으로 저장되지 않아요.</span>
          </div>
        </section>
      </div>
    </main>
  );
}