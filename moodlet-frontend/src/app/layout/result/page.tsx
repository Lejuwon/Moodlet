"use client";

import { useEffect, useRef, useState } from "react";

export default function FloorplanFromImage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🔥 1) 로딩 상태
  const [loading, setLoading] = useState(true);

  // 🔥 2) 로딩 타이머 — 15초 후 loading=false
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  // 🔥 3) 로딩이 끝나면 캔버스 렌더링
  useEffect(() => {
    if (loading) return;

    async function init() {
      const fabricModule = await import("fabric");
      const fabric: any =
        (fabricModule as any).fabric ||
        (fabricModule as any).default ||
        fabricModule;

      const W = 1000;
      const H = 600;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: W,
        height: H,
        backgroundColor: "#f7f7f7",
        selection: false,
      });

      // 스타일
      const WALL_OUTER = "#222";
      const WALL_INNER = "#222";
      const OUTER_WIDTH = 8;
      const INNER_WIDTH = 3;

      const WHITE = "#fff";
      const GRAY1 = "#e5e5e5";
      const GRAY2 = "#dcdcdc";

      const PAD = 100;
      const totalW = 800;
      const totalH = 340;

      // 방/구역 함수
      const addRoom = (
        x: number,
        y: number,
        w: number,
        h: number,
        fill: string,
        label: string = "",
        thick: boolean = false
      ): void => {
        canvas.add(
          new fabric.Rect({
            left: x,
            top: y,
            width: w,
            height: h,
            fill,
            stroke: thick ? WALL_OUTER : WALL_INNER,
            strokeWidth: thick ? OUTER_WIDTH : INNER_WIDTH,
            selectable: false,
          })
        );
        if (label) {
          canvas.add(
            new fabric.Text(label, {
              left: x + w / 2,
              top: y + h / 2,
              fontSize: 22,
              fill: "#444",
              originX: "center",
              originY: "center",
              selectable: false,
            })
          );
        }
      };

      // 세로 창문
      const addVerticalWindow = (
        x: number,
        y: number,
        h: number
      ): void => {
        canvas.add(
          new fabric.Rect({
            left: x,
            top: y,
            width: 6,
            height: h,
            fill: "#5db1ff",
            selectable: false,
          })
        );
        canvas.add(
          new fabric.Rect({
            left: x + 8,
            top: y + 10,
            width: 4,
            height: h - 20,
            fill: "#9ad2ff",
            selectable: false,
          })
        );
      };

      // 문
      const addDoor = (
        x: number,
        y: number,
        r: number,
        angle: number = 0
      ): void => {
        const hinge = new fabric.Line([x, y, x + r, y], {
          stroke: "#777",
          strokeWidth: INNER_WIDTH,
          selectable: false,
        });
        hinge.rotate(angle);
        canvas.add(hinge);

        const arc = new fabric.Path(
          `M ${x} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y + r}`,
          {
            stroke: "#777",
            fill: "",
            strokeWidth: INNER_WIDTH,
            selectable: false,
          }
        );
        arc.rotate(angle);
        canvas.add(arc);
      };

      // ===============================
      // 내부 구조
      // ===============================
      addRoom(PAD, PAD, 300, 160, GRAY1, "욕실");
      addRoom(PAD + 300, PAD, 75, 160, GRAY1, "수납");
      addRoom(PAD, PAD + 160, 120, 180, GRAY2, "현관");

      const GAP = 40;
      const kitchenX = PAD + 120;
      const kitchenY = PAD + 230 + GAP;

      addRoom(kitchenX, kitchenY, 220, 110 - GAP, GRAY1, "주방");

      const bottomStorageX = kitchenX + 220;
      const bottomStorageW = totalW - (bottomStorageX - PAD);

      addRoom(bottomStorageX, kitchenY, bottomStorageW, 110 - GAP, GRAY1, "수납");

      addVerticalWindow(PAD + totalW - 10, PAD + 100, 150);
      addDoor(PAD - 70, PAD + 190, 70, 180);

      // 외곽선
      canvas.add(
        new fabric.Rect({
          left: PAD,
          top: PAD,
          width: totalW,
          height: totalH,
          fill: "",
          stroke: WALL_OUTER,
          strokeWidth: OUTER_WIDTH,
          selectable: false,
        })
      );

      // ===============================
      //  가구 배치
      // ===============================

      // 침대
      const bed = new fabric.Rect({
        left: PAD + totalW - 130,
        top: PAD + 10,
        width: 120,
        height: 210,
        fill: "#fcefe3",
        stroke: "#c89d72",
        strokeWidth: 2,
        rx: 10,
        ry: 10,
        selectable: true,
      });
      canvas.add(bed);
      canvas.add(
        new fabric.Text("침대", {
          left: bed.left + bed.width / 2,
          top: bed.top + bed.height / 2,
          originX: "center",
          originY: "center",
          fontSize: 20,
          fill: "#7a5a3a",
          selectable: false,
        })
      );

      // 책상
      const desk = new fabric.Rect({
        left: PAD + 430,
        top: PAD + 10,
        width: 130,
        height: 60,
        fill: "#e9f7ff",
        stroke: "#6fb9d6",
        strokeWidth: 2,
        rx: 6,
        ry: 6,
        selectable: true,
      });
      canvas.add(desk);
      canvas.add(
        new fabric.Text("책상", {
          left: desk.left + desk.width / 2,
          top: desk.top + desk.height / 2,
          originX: "center",
          originY: "center",
          fontSize: 18,
          fill: "#3c6f88",
          selectable: false,
        })
      );

      // 의자
      const chair = new fabric.Circle({
        left: desk.left + 50,
        top: desk.top + 70,
        radius: 25,
        fill: "#fff8e6",
        stroke: "#d1b97c",
        strokeWidth: 2,
        selectable: true,
      });
      canvas.add(chair);
      canvas.add(
        new fabric.Text("의자", {
          left: chair.left + chair.radius,
          top: chair.top + chair.radius,
          originX: "center",
          originY: "center",
          fontSize: 16,
          fill: "#8a6f3f",
          selectable: false,
        })
      );
    }

    init();
  }, [loading]);

  // ===========================
  //  로딩 화면
  // ===========================
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm flex flex-col items-center gap-6">
          <div className="w-full text-left">
            <p className="text-xs font-medium text-emerald-600 tracking-[0.2em] uppercase">
              Step 3
            </p>
            <h1 className="mt-2 text-xl font-semibold text-slate-900">
              가구 배치 결과를 준비하고 있어요
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              업로드한 평면도 이미지를 분석해서 침대, 책상, 의자 배치를 생성 중이에요.
              약 10~15초 정도 소요될 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-slate-500">
              공간을 분석하는 중입니다… 잠시만 기다려주세요.
            </p>
          </div>

          <div className="w-full h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-1/2 animate-[pulse_1.5s_ease-in-out_infinite] bg-emerald-400/70" />
          </div>
        </div>
      </main>
    );
  }

  // ===========================
  //  로딩 후 결과 화면
  // ===========================
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* 상단 타이틀 */}
        <header className="space-y-2">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-[0.2em]">
            RESULT
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            평면도 기반 가구 배치 결과
          </h1>
          <p className="text-sm text-slate-600">
            아래 평면도와 실제 공간 이미지를 함께 보면서 배치가 마음에 드는지 확인해보세요.
          </p>
        </header>

        {/* 캔버스 + 결과 이미지 영역 */}
        <div className="flex flex-col gap-8">
          {/* 왼쪽: 캔버스 카드 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              1. 평면도 위 가구 배치
            </h2>
            <div className="rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-auto">
              <canvas ref={canvasRef} className="block" />
            </div>
          </section>

          {/* 오른쪽: 실제 이미지 카드 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
            <div className="mb-3">
              <p className="text-gray-700 text-sm font-semibold">
                📌 실제 가구 배치 렌더링 결과
              </p>
              <p className="text-gray-500 text-xs mt-1">
                위 평면도 배치를 기반으로 생성된 실제 공간 이미지입니다.
                침대·책상·의자가 어떻게 배치되었는지 확인해보세요.
              </p>
            </div>

            <div className="relative w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              <img
                src="/result.png"
                alt="결과 이미지"
                className="w-full h-[340px] object-cover"
              />
            </div>
          </section>
        </div>
        <div className="w-full flex justify-center mt-10">
          <a
            href="/"
            className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 
                      text-white text-sm font-medium shadow-sm transition"
          >
            메인 화면으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}