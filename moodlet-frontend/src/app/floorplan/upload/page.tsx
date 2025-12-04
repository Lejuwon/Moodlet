"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export default function FloorplanUploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ===============================
  // 파일 선택
  // ===============================
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // ===============================
  // 업로드 요청
  // ===============================
  const handleUpload = async () => {
    if (!file) {
      alert("평면도 이미지를 먼저 선택해주세요!");
      return;
    }

    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/floorplan/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        setLoading(false);
        alert("업로드에 실패했어요. 다시 시도해주세요.");
        return;
      }

      const data = await res.json();
      setLoading(false);

      if (!data.fp_id) {
        alert("업로드는 되었지만 fp_id를 찾지 못했어요.");
        return;
      }

      // 업로드 성공 🎉
      router.push(`/furniture/select?fp_id=${data.fp_id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("업로드 중 오류가 발생했어요.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        {/* 상단 타이틀 영역 */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            평면도 이미지 업로드
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            가지고 있는 도면 이미지를 업로드하면, 무드렛이 이 구조에 맞는 가구 배치를 준비할게요 🪄
          </p>
        </div>

        {/* 본문 카드 */}
        <div className="grid gap-8 md:grid-cols-[2fr,1.5fr]">
          {/* 왼쪽: 업로드 영역 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">
                1. 평면도 이미지 선택하기
              </h2>
              <p className="text-xs text-slate-500">
                JPG, PNG 형식의 평면도 이미지를 업로드해주세요.  
                너무 흐릿한 사진보다는 도면이 또렷하게 보이는 이미지가 좋아요.
              </p>

              {/* 드롭존 스타일 영역 */}
              <label
                htmlFor="floorplan-file"
                className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center hover:border-emerald-400 hover:bg-emerald-50/60 transition-colors"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-slate-500">
                  📐
                </span>
                <p className="text-sm font-medium text-slate-800">
                  평면도 이미지를 선택하거나 끌어다 놓기
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  클릭해서 파일을 선택하거나, 이 영역으로 이미지를 드래그해보세요.
                </p>
                {file && (
                  <p className="mt-3 text-xs text-emerald-700">
                    선택된 파일: <span className="font-medium">{file.name}</span>
                  </p>
                )}
              </label>

              <input
                id="floorplan-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* 하단 버튼들 */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/floorplan")}
                className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-4 text-left"
              >
                ← 평면도 선택 화면으로 돌아가기
              </button>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300 transition-colors"
              >
                {loading ? "업로드 중..." : "이미지 업로드하고 가구 배치 받기"}
              </button>
            </div>
          </section>

          {/* 오른쪽: 미리보기 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              2. 업로드 전 미리보기
            </h2>

            <div className="flex-1 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img
                  src={preview}
                  alt="floorplan preview"
                  className="max-h-[320px] w-full object-contain"
                />
              ) : (
                <p className="text-xs text-slate-400">
                  선택된 이미지가 아직 없어요. 왼쪽에서 평면도 이미지를 선택해 주세요.
                </p>
              )}
            </div>

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              * 평면도에서 방 윤곽과 문, 창문 등이 잘 보이도록 잘라서 업로드하면  
              더 정확한 가구 배치 결과를 받을 수 있어요.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}