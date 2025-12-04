"use client";

import { useRef, useState, useEffect } from "react";
import Konva from "konva";
import { Stage, Layer, Line, Rect, Arc, Group } from "react-konva";

// ================= SCALE =====================
const CM_TO_PX = 2;
const PX_TO_CM = 1 / CM_TO_PX;

// ================= TYPES =====================
type Tool = "select" | "wall" | "door" | "window" | "closet";

type Wall = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type Door = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  widthCm: number;
};

type Closet = {
  id: string;
  x: number;
  y: number;
  rotation: number;
};

type WindowObj = {
  id: string;
  wallId: string;
  posT: number;
  widthCm: number;
};

type SelectedItem =
  | { type: "door"; id: string }
  | { type: "closet"; id: string }
  | null;

// ================= MATH UTILS ======================
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function dot(ax: number, ay: number, bx: number, by: number) {
  return ax * bx + ay * by;
}

function wallLengthPx(w: Wall) {
  return dist(w.x1, w.y1, w.x2, w.y2);
}

function projectPointOnWall(px: number, py: number, wall: Wall) {
  const wx = wall.x2 - wall.x1;
  const wy = wall.y2 - wall.y1;
  const vx = px - wall.x1;
  const vy = py - wall.y1;
  const wallLenSq = wx * wx + wy * wy;

  let t = (vx * wx + vy * wy) / wallLenSq;
  t = Math.max(0.0, Math.min(1.0, t));

  const projX = wall.x1 + wx * t;
  const projY = wall.y1 + wy * t;
  return { projX, projY, t };
}

const clampT = (t: number) => Math.max(0.05, Math.min(0.95, t));

function windowAngleDeg(wall: Wall) {
  return (Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * 180) / Math.PI;
}

// ============ 폴리곤 계산 ============
// 방 면적 또는 AI 구조 분석용
function buildPolygonFromWalls(walls: Wall[]) {
  if (walls.length < 3) return [];

  const pts: [number, number][] = [];
  let curr = { x: walls[0].x1, y: walls[0].y1 };

  pts.push([curr.x, curr.y]);

  while (true) {
    const next = walls.find(w => w.x1 === curr.x && w.y1 === curr.y);
    if (!next) break;

    curr = { x: next.x2, y: next.y2 };
    pts.push([curr.x, curr.y]);

    if (curr.x === walls[0].x1 && curr.y === walls[0].y1) break;
  }
  return pts;
}

function calcPolygonArea(points: [number, number][]) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - y1 * x2;
  }
  return Math.abs(sum) / 2;
}

// ======================================================================
//                 🔥 AI ROOM PROFILE 생성 함수
// ======================================================================
function generateRoomProfile(
  walls: Wall[],
  doors: Door[],
  windows: WindowObj[],
  closets: Closet[]
) {
  const polygon = buildPolygonFromWalls(walls);
  const areaPx = calcPolygonArea(polygon);
  const areaM2 = (areaPx * PX_TO_CM * PX_TO_CM) / 10000;

  const outWalls = walls.map(w => ({
    id: w.id,
    start: [w.x1 * PX_TO_CM, w.y1 * PX_TO_CM],
    end: [w.x2 * PX_TO_CM, w.y2 * PX_TO_CM],
    length_cm: wallLengthPx(w) * PX_TO_CM,
  }));

  function nearestWall(x: number, y: number) {
    let best = null;
    let bestDist = Infinity;
    walls.forEach(w => {
      const p = projectPointOnWall(x, y, w);
      const d = dist(x, y, p.projX, p.projY);
      if (d < bestDist) {
        bestDist = d;
        best = w.id;
      }
    });
    return best;
  }

  const outDoors = doors.map(d => ({
    id: d.id,
    center: [d.x * PX_TO_CM, d.y * PX_TO_CM],
    rotation_deg: d.rotation,
    width_cm: d.widthCm,
    attached_wall: nearestWall(d.x, d.y),
  }));

  const outWindows = windows.map(w => {
    const wall = walls.find(ww => ww.id === w.wallId);
    if (!wall) return null;

    const cx = wall.x1 + (wall.x2 - wall.x1) * w.posT;
    const cy = wall.y1 + (wall.y2 - wall.y1) * w.posT;

    return {
      id: w.id,
      center: [cx * PX_TO_CM, cy * PX_TO_CM],
      width_cm: w.widthCm,
      attached_wall: wall.id,
    };
  });

  return {
    room: {
      area_m2: Number(areaM2.toFixed(2)),
    },
    walls: outWalls,
    doors: outDoors,
    windows: outWindows,
    closets,
  };
}

// ======================================================================
//             📌 여기부터 진짜 메인 컴포넌트 시작
// ======================================================================
export default function FloorplanEditor() {
  const stageRef = useRef<Konva.Stage | null>(null);

  const [tool, setTool] = useState<Tool>("select");

  const [walls, setWalls] = useState<Wall[]>([]);
  const [drawingWall, setDrawingWall] = useState<Wall | null>(null);

  const [doors, setDoors] = useState<Door[]>([]);
  const [closets, setClosets] = useState<Closet[]>([]);

  const [windows, setWindows] = useState<WindowObj[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<WindowObj | null>(null);

  const [selectedWall, setSelectedWall] = useState<Wall | null>(null);
  const [wallLengthCm, setWallLengthCm] = useState(0);

  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);

  const [stageSize, setStageSize] = useState({
    width: 1200,
    height: 800,
  });

  // ================= Stage Resize =================
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth - 240,
        height: window.innerHeight - 10,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ================= SAVE BUTTON ====================
  const handleSave = async () => {
    const raw = { walls, doors, windows, closets };
    const aiProfile = generateRoomProfile(walls, doors, windows, closets);

    const payload = {
      user_id: 1,
      image_url: "",
      meta_json: { raw, ai_profile: aiProfile },
    };

    console.log("📌 저장 데이터:", payload);

    alert("평면도 저장 준비 완료 (console 확인)");
  };

  // ================= MOUSE DOWN =======================
  const handleMouseDown = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;
    const { x, y } = pos;

    // ---- 문 ----
    if (tool === "door") {
      setDoors([
        ...doors,
        {
          id: crypto.randomUUID(),
          x,
          y,
          rotation: 0,
          widthCm: 80,
        },
      ]);
      return;
    }

    // ---- 붙박이장 ----
    if (tool === "closet") {
      setClosets([...closets, { id: crypto.randomUUID(), x, y, rotation: 0 }]);
      return;
    }

    // ---- 창문 ----
    if (tool === "window") {
      if (walls.length === 0) return;

      let bestWall: Wall | null = null;
      let bestDist = Infinity;
      let bestProj = { projX: x, projY: y, t: 0 };

      walls.forEach((w) => {
        const p = projectPointOnWall(x, y, w);
        const d = dist(x, y, p.projX, p.projY);

        if (d < bestDist) {
          bestDist = d;
          bestWall = w;
          bestProj = p;
        }
      });

      if (!bestWall) return;

      const t = clampT(bestProj.t);
      const wallId = (bestWall as Wall).id;

      setWindows([
        ...windows,
        {
          id: crypto.randomUUID(),
          wallId,
          posT: t,
          widthCm: 120,
        },
      ]);
      return;
    }

    // ---- 벽 ----
    if (tool === "wall") {
      setDrawingWall({
        id: crypto.randomUUID(),
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      });
      return;
    }
  };

  // ================= MOUSE MOVE =======================
  const handleMouseMove = () => {
    if (!drawingWall) return;

    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    setDrawingWall({
      ...drawingWall,
      x2: pos.x,
      y2: pos.y,
    });
  };

  // ================= MOUSE UP =========================
  const handleMouseUp = () => {
    if (drawingWall) {
      setWalls([...walls, drawingWall]);
      setDrawingWall(null);
    }
  };

  // ================= APPLY WALL LENGTH =================
  const applyWallLength = () => {
    if (!selectedWall || wallLengthCm <= 0) return;

    const newPx = wallLengthCm * CM_TO_PX;
    const oldPx = wallLengthPx(selectedWall);
    const scale = newPx / oldPx;

    const dx = selectedWall.x2 - selectedWall.x1;
    const dy = selectedWall.y2 - selectedWall.y1;

    setWalls((prev) =>
      prev.map((w) =>
        w.id === selectedWall.id
          ? { ...w, x2: w.x1 + dx * scale, y2: w.y1 + dy * scale }
          : w
      )
    );
  };

  // ============ APPLY WINDOW WIDTH ============
  const applyWindowWidthCm = (cm: number) => {
    setWindows((prev) =>
      prev.map((w) =>
        selectedWindow && w.id === selectedWindow.id
          ? { ...w, widthCm: cm }
          : w
      )
    );
  };

  const applyDoorWidthCm = (cm: number) => {
    setDoors((prev) =>
      prev.map((d) =>
        selectedItem?.type === "door" && d.id === selectedItem.id
          ? { ...d, widthCm: cm }
          : d
      )
    );
  };

  // ============================= RENDER =============================
  return (
    <div className="flex w-screen h-screen pt-16">
      {/* LEFT PANEL */}
      <div className="w-56 bg-gray-100 border-r p-4">
        <h2 className="font-bold text-lg mb-4">도구</h2>

        {["select", "wall", "door", "window", "closet"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTool(t as Tool);
              setSelectedWall(null);
              setSelectedWindow(null);
              setSelectedItem(null);
            }}
            className={`p-2 mb-2 w-full border rounded ${
              tool === t ? "bg-black text-white" : "bg-white"
            }`}
          >
            {t === "select" && "선택"}
            {t === "wall" && "벽"}
            {t === "door" && "문"}
            {t === "window" && "창문"}
            {t === "closet" && "붙박이장"}
          </button>
        ))}

        {/* 완료 버튼 */}
        <button
          onClick={handleSave}
          className="p-2 mt-4 w-full bg-green-600 text-white rounded"
        >
          완료 (저장)
        </button>

        {/* 벽 UI */}
        {selectedWall && (
          <div className="mt-5 border bg-white p-3 rounded">
            <h3 className="font-semibold mb-2">벽 길이(cm)</h3>
            <input
              type="number"
              value={wallLengthCm}
              onChange={(e) => setWallLengthCm(Number(e.target.value))}
              className="border p-2 w-full mb-2"
            />
            <button
              className="bg-black text-white p-2 w-full rounded"
              onClick={applyWallLength}
            >
              적용
            </button>
          </div>
        )}

        {/* 창문 UI */}
        {selectedWindow && (
          <div className="mt-5 border bg-white p-3 rounded">
            <h3 className="font-semibold mb-2">창문 너비(cm)</h3>
            <input
              type="number"
              value={selectedWindow.widthCm}
              onChange={(e) => applyWindowWidthCm(Number(e.target.value))}
              className="border p-2 w-full"
            />
          </div>
        )}

        {/* 문/붙박이 회전 */}
        {selectedItem &&
          (selectedItem.type === "door" || selectedItem.type === "closet") && (
            <div className="mt-5 border bg-white p-3 rounded">
              <h3 className="font-semibold mb-2">회전</h3>
              <button
                className="bg-black text-white p-2 w-full rounded"
                onClick={() => {
                  if (selectedItem.type === "door") {
                    setDoors((prev) =>
                      prev.map((d) =>
                        d.id === selectedItem.id
                          ? { ...d, rotation: d.rotation + 90 }
                          : d
                      )
                    );
                  } else {
                    setClosets((prev) =>
                      prev.map((c) =>
                        c.id === selectedItem.id
                          ? { ...c, rotation: c.rotation + 90 }
                          : c
                      )
                    );
                  }
                }}
              >
                회전하기 (90°)
              </button>
            </div>
          )}

        {/* 문 너비 */}
        {selectedItem?.type === "door" && (
          <div className="mt-5 border bg-white p-3 rounded">
            <h3 className="font-semibold mb-2">문 너비(cm)</h3>
            <input
              type="number"
              value={
                doors.find((d) => d.id === selectedItem.id)?.widthCm || 80
              }
              onChange={(e) => applyDoorWidthCm(Number(e.target.value))}
              className="border p-2 w-full"
            />
          </div>
        )}
      </div>

      {/* CANVAS -------------------------------------------------------------- */}
      <div className="flex-1">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="bg-white"
        >
          <Layer>
            {/* === 벽 === */}
            {walls.map((w) => (
              <Line
                key={w.id}
                points={[w.x1, w.y1, w.x2, w.y2]}
                stroke={selectedWall?.id === w.id ? "#007aff" : "#000"}
                strokeWidth={selectedWall?.id === w.id ? 5 : 4}
                onClick={() => {
                  setSelectedWall(w);
                  setSelectedWindow(null);
                  setSelectedItem(null);
                  setWallLengthCm(Math.round(wallLengthPx(w) / CM_TO_PX));
                }}
              />
            ))}

            {/* === 벽 그리는 중 === */}
            {drawingWall && (
              <Line
                points={[
                  drawingWall.x1,
                  drawingWall.y1,
                  drawingWall.x2,
                  drawingWall.y2,
                ]}
                stroke="#999"
                dash={[6, 4]}
                strokeWidth={3}
              />
            )}

            {/* === 창문 === */}
            {windows.map((win) => {
              const wall = walls.find((w) => w.id === win.wallId);
              if (!wall) return null;

              const angle = windowAngleDeg(wall);
              const winWidthPx = win.widthCm * CM_TO_PX;
              const half = winWidthPx / 2;

              const wx = wall.x2 - wall.x1;
              const wy = wall.y2 - wall.y1;

              const cx = wall.x1 + wx * win.posT;
              const cy = wall.y1 + wy * win.posT;

              return (
                <Group
                  key={win.id}
                  x={cx}
                  y={cy}
                  rotation={angle}
                  draggable
                  onClick={() => {
                    setSelectedWindow(win);
                    setSelectedWall(null);
                    setSelectedItem(null);
                  }}
                  onDragMove={(e) => {
                    const px = e.target.x();
                    const py = e.target.y();
                    const proj = projectPointOnWall(px, py, wall);
                    const t = clampT(proj.t);

                    setWindows((prev) =>
                      prev.map((w) =>
                        w.id === win.id ? { ...w, posT: t } : w
                      )
                    );
                  }}
                >
                  <Line points={[-half, -4, half, -4]} stroke="#000" strokeWidth={4} />
                  <Line points={[-half, 0, half, 0]} stroke="#000" strokeWidth={2} />
                  <Line points={[-half, 4, half, 4]} stroke="#000" strokeWidth={4} />
                </Group>
              );
            })}

            {/* === 문 === */}
            {doors.map((d) => {
              const doorWidthPx = d.widthCm * CM_TO_PX;

              return (
                <Group
                  key={d.id}
                  x={d.x}
                  y={d.y}
                  rotation={d.rotation}
                  draggable
                  onClick={() => {
                    setSelectedItem({ type: "door", id: d.id });
                    setSelectedWindow(null);
                    setSelectedWall(null);
                  }}
                >
                  <Line
                    points={[0, 0, doorWidthPx, 0]}
                    stroke="#000"
                    strokeWidth={4}
                  />
                  <Arc
                    x={0}
                    y={0}
                    innerRadius={0}
                    outerRadius={doorWidthPx}
                    angle={90}
                    rotation={-90}
                    stroke="#000"
                    strokeWidth={2}
                  />
                </Group>
              );
            })}

            {/* === 붙박이장 === */}
            {closets.map((c) => (
              <Group
                key={c.id}
                x={c.x}
                y={c.y}
                rotation={c.rotation}
                draggable
                onClick={() => {
                  setSelectedItem({ type: "closet", id: c.id });
                  setSelectedWindow(null);
                  setSelectedWall(null);
                }}
              >
                <Rect width={80} height={60} stroke="#000" strokeWidth={2} />
                <Line points={[40, 0, 40, 60]} stroke="#000" strokeWidth={1.5} />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}