import Link from "next/link";

export default function FloorplanChoicePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex justify-center bg-slate-50 pt-24">
      {/* 헤더 아래의 컨텐츠 영역이라고 생각하고 여백 조금 줌 */}
      <main className="w-full max-w-5xl px-4 sm:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            평면도 기반 배치 시작하기
          </h1>
          <p className="text-sm text-slate-600">
            방 구조를 직접 그리거나, 이미 가지고 있는 평면도 이미지를 업로드해서
            가구 배치를 받아보세요.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* 직접 그리기 카드 */}
          <Link
            href="/floorplan/create"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                옵션 1
              </span>
              <h2 className="text-lg font-semibold text-slate-900">
                평면도 직접 그리기
              </h2>
              <p className="text-sm text-slate-600">
                벽, 문, 창문, 붙박이장을 캔버스에 직접 배치해서
                내 방 구조를 정교하게 만들 수 있어요.
              </p>
            </div>
            <div className="mt-5 text-xs font-medium text-emerald-700 group-hover:underline">
              평면도 그리러 가기 →
            </div>
          </Link>

          {/* 이미지 업로드 카드 */}
          <Link
            href="/floorplan/upload"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                옵션 2
              </span>
              <h2 className="text-lg font-semibold text-slate-900">
                평면도 이미지 업로드
              </h2>
              <p className="text-sm text-slate-600">
                이미 가지고 있는 도면 이미지를 업로드하고,
                추천받은 가구를 선택해 AI 배치 결과를 확인해요.
              </p>
            </div>
            <div className="mt-5 text-xs font-medium text-sky-700 group-hover:underline">
              평면도 업로드하러 가기 →
            </div>
          </Link>
        </div>
        
        <div className="flex justify-end mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-full 
                       border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            나중에 할게요
          </Link>
        </div>
      </main>
    </div>
  );
}
