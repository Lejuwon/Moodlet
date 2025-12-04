"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type FurnitureOption = {
  key: string;
  label: string;
};

const FURNITURE_OPTIONS: FurnitureOption[] = [
  { key: "bed", label: "침대" },
  { key: "desk", label: "책상" },
  { key: "chair", label: "의자" },
  { key: "sofa", label: "소파" },
  { key: "wardrobe", label: "옷장" },
  { key: "cabinet", label: "서랍장" },
  { key: "shelf", label: "책장" },
  { key: "dining", label: "식탁" },
  { key: "vanity", label: "화장대" },
  { key: "rug", label: "러그" },
];

export default function FurnitureSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fp_id = searchParams.get("fp_id");

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!fp_id) {
      alert("평면도 정보가 없습니다. 처음 화면으로 돌아가주세요.");
      return;
    }
    if (selected.length === 0) {
      alert("배치할 가구를 하나 이상 선택해주세요.");
      return;
    }

    setLoading(true);

    // 👉 실제 배치 API에 맞게 수정해서 사용하면 됨
    try {
      // 예시: /api/floorplan/arrange 호출
      /*
      const res = await fetch("http://localhost:8000/api/floorplan/arrange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fp_id: fpId,
          furniture_types: selected,
        }),
      });

      const data = await res.json();
      router.push(`/floorplan/preview?fp_id=${fpId}&task_id=${data.task_id}`);
      */

      // 일단은 배치 캔버스로 보내는 예시
      router.push(`/layout/result?fp_id=${fp_id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        {/* 상단 타이틀 */}
        <div className="mb-8">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-[0.2em]">
            STEP 2
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            어떤 가구를 배치할까요?
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            평면도에 배치해보고 싶은 가구를 선택해주세요. 여러 개를 함께 선택할 수도 있어요.
          </p>
        </div>

        {/* 가구 선택 카드 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {FURNITURE_OPTIONS.map((item) => {
              const isActive = selected.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleSelect(item.key)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition
                    ${
                      isActive
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                        : "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40"
                    }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`h-5 w-5 flex items-center justify-center rounded-full text-[11px] ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isActive ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 하단 영역 */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-4 text-left"
            >
              ← 평면도 업로드 화면으로 돌아가기
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || selected.length === 0}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-emerald-500 px-8 py-2.5
                         text-sm font-medium text-white shadow-sm hover:bg-emerald-600
                         disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "배치 중..." : "선택한 가구 배치하기"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}