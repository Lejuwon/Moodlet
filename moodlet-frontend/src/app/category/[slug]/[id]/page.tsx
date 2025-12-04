"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type ShoppingMallPrice = {
  mall_name: string;
  mall_price: string | number;
  ship_fee: string;
  mall_url: string;
};

type FurnitureDetail = {
  product_id: number;
  name: string;
  image_url?: string | null;
  detail_url?: string | null;
  category?: string | null;
  width?: number | null;
  depth?: number | null;
  height?: number | null;
  bed_size_code?: string | null;
  material?: string | null;
  color?: string | null;
  lowest_price?: number | null;
  highest_price?: number | null;
  prices?: ShoppingMallPrice[];
};

const CATEGORY_LABEL: Record<string, string> = {
  bed: "침대",
  sofa: "소파",
  table: "테이블",
  chair: "의자",
  storage: "수납·정리",
  fabric: "패브릭",
  decor: "식물·데코",
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function formatNumber(n?: number | string | null) {
  if (n === null || n === undefined) return "";
  const num =
    typeof n === "number"
      ? n
      : Number(String(n).replace(/[^0-9]/g, "")) || 0;
  return num.toLocaleString();
}

export default function FurnitureDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<FurnitureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/furniture/${id}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("상품을 찾을 수 없습니다.");
          }
          throw new Error(`서버 오류 (${res.status})`);
        }

        const data = (await res.json()) as FurnitureDetail;
        setProduct(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setError(err.message ?? "상품 정보를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
    return () => controller.abort();
  }, [id]);

  const categoryLabel = CATEGORY_LABEL[slug] ?? slug;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-600">상품 정보를 불러오는 중입니다…</p>
      </main>
    );
  }

  // 수정
  if (error || !product) {
    return (
        <main className="min-h-screen bg-[#f5f7fb] text-gray-900 flex items-center justify-center">
        <div className="text-center space-y-3">
            <p className="text-sm text-red-500">
            오류: {error ?? "알 수 없는 오류"}
            </p>
            <button
            onClick={() => router.back()}
            className="px-4 py-2 text-xs rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
            ← 이전 페이지로
            </button>
        </div>
        </main>
    );
   }


  const mainPrice =
    product.lowest_price ?? product.highest_price ?? null;

  const prices = product.prices ?? [];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-gray-900 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#ffdd5f]">
              무드렛
            </Link>
            <span>›</span>
            <Link
              href={`/category/${slug}`}
              className="hover:text-[#ffdd5f]"
            >
              {categoryLabel}
            </Link>
            <span>›</span>
            <span className="text-gray-600 line-clamp-1">
              {product.name}
            </span>
          </div>
        </div>

        {/* 상단 메인 영역: 이미지 + 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 왼쪽: 큰 이미지 (최적 크기 & 화질 유지) */}
            <div className="bg-white rounded-xl p-2 flex flex-col items-center justify-center">
                <div className="w-full max-w-[520px] mx-auto rounded-xl overflow-hidden flex items-center justify-center p-4">
                    {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="
                        object-contain
                        w-full
                        max-h-[300px]
                        "
                    />
                    ) : (
                    <span className="text-xs text-gray-400">이미지 없음</span>
                    )}
                </div>
            </div>

          {/* 오른쪽: 상품 정보 / 최저가 요약 */}
          <div className="bg-white rounded-xl p-6 flex flex-col gap-4">
            <div className="space-y-1">
              <p className="text-xs text-rose-500 font-semibold">
                배송비포함 · 쿠폰할인가
              </p>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-snug">
                {product.name}
              </h1>
            </div>

            {mainPrice && (
              <div>
                <span className="text-sm text-gray-500 mr-2">
                  최저
                </span>
                <span className="text-3xl font-bold text-rose-600">
                  {formatNumber(mainPrice)}원
                </span>
              </div>
            )}

            {/* 간단 스펙 */}
            <div className="text-xs text-gray-600 space-y-1">
              {product.width && product.depth && product.height && (
                <p>
                  크기: {product.width} x {product.depth} x{" "}
                  {product.height} cm
                </p>
              )}
              {product.bed_size_code && (
                <p>사이즈 코드: {product.bed_size_code}</p>
              )}
              {product.material && <p>재질: {product.material}</p>}
              {product.color && <p>색상: {product.color}</p>}
              {product.category && (
                <p>카테고리: {product.category}</p>
              )}
            </div>

            {/* 외부 상세페이지 바로가기 (쇼핑하우 원본) */}
            {product.detail_url && (
              <a
                href={product.detail_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md
                           bg-[#2559e9] text-white hover:bg-[#1d46b5] transition-colors self-start"
              >
                쇼핑하우 상세페이지에서 보기
              </a>
            )}
          </div>
        </div>

        {/* 아래: 판매처별 최저가 테이블 */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                판매처별 최저가
              </h2>
              <p className="text-[11px] text-gray-500 mt-1">
                쿠폰 할인과 배송비가 포함된 가격을 안내합니다.
              </p>
            </div>
            <span className="text-[11px] text-gray-500">
              최저가순
            </span>
          </div>

          {prices.length === 0 ? (
            <p className="text-sm text-gray-500">
              제휴 판매처 정보가 없습니다.
            </p>
          ) : (
            <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
              {prices.map((mall, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-2"
                >
                  <div className="flex-1 text-sm text-gray-800">
                    {mall.mall_name}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-[#2559e9]">
                      {formatNumber(mall.mall_price)}원
                    </span>
                    <span className="text-xs text-gray-500">
                      {mall.ship_fee}
                    </span>
                    <a
                      href={mall.mall_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-3 py-1 rounded-md border border-gray-300
                                 hover:border-[#2559e9] hover:text-[#2559e9]"
                    >
                      바로가기
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
