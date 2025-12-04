"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, X, Search, User as UserIcon } from "lucide-react";
import HeaderCategoryText from "@/components/HeaderCategoryText";
import HeaderAIFeatures from "./HeaderAIFeatures";

const NAV_ITEMS = [
  { label: "AI 스타일 맞춤 추천", href: "/survey" },
  { label: "AI 기반 평면도 배치", href: "/floorplan" },
  { label: "AI 실감형 가구 합성", href: "/preview" },
];

type MoodletUser = {
  id: string;
  email: string;
  name: string;
};

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);           // 모바일 메뉴
  const [showSearch, setShowSearch] = useState(false);   // 모바일 검색창
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [user, setUser] = useState<MoodletUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);       // 프로필 드롭다운

  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCategoryPage = pathname?.startsWith("/category");

  const toggleMenu = () => setMenuOpen((v) => !v);

  // ⭐ 로그인 정보 로드 + 구글 콜백 처리
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    const nameFromQuery = params.get("name");

    // 1️⃣ 구글 로그인 직후
    if (token && email) {
      const userData: MoodletUser = {
        id: "",
        email,
        name: nameFromQuery || email.split("@")[0],
      };

      localStorage.setItem("moodlet_user", JSON.stringify(userData));
      localStorage.setItem("moodlet_token", token);
      setUser(userData);

      params.delete("token");
      params.delete("email");
      params.delete("name");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);

      return;
    }

    // 2️⃣ 새로고침 / 재방문
    const raw = localStorage.getItem("moodlet_user");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as MoodletUser;
      setUser(parsed);
    } catch (e) {
      console.error("Failed to parse moodlet_user", e);
    }
  }, [pathname]);

  const isLoggedIn = !!user;
  const userInitial =
    user?.name?.trim()?.[0] ?? user?.email?.trim()?.[0] ?? "U";

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      window.location.href = "http://localhost:8000/auth/google/login";
    } else {
      window.location.href = "/mypage";
    }
  };

  // 🔥 헤더를 숨겨야 하는 경로들
  const hiddenPaths = ["/preview", "/survey", "/floorplan", "/furniture/select", "/layout/result"];

  // 경로가 해당 prefix로 시작하면 헤더 출력 안 함
  if (hiddenPaths.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <header
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${isHome
          ? "bg-transparent border-b-0 shadow-none backdrop-blur-[3px]"
          : "bg-white/95 border-b border-gray-200 shadow-sm"
        }
      `}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center">
        {/* =============== 모바일 헤더 (md 미만) =============== */}
        <div className="flex w-full items-center justify-between md:hidden">
          {/* 햄버거 버튼 */}
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setIsOpen((v) => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100/20 transition z-20"
          >
            {isOpen ? (
              <X size={20} className="text-gray-100" />
            ) : (
              <Menu size={22} className="text-gray-100" />
            )}
          </button>

          {/* 가운데 로고 */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 z-10">
            <img src="/logo.png" alt="moodlet" className="h-30" />
          </Link>

          {/* 오른쪽 아이콘들: 검색 + 찜 */}
          <div className="flex items-center gap-1.5 z-20">
            <button
              type="button"
              aria-label="검색"
              onClick={() => setShowSearch((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100/20 transition"
            >
              <Search size={18} className="text-gray-100" />
            </button>

            <button
              type="button"
              aria-label="찜 목록"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100/20 transition"
            >
              <Heart size={18} className="text-gray-100" />
            </button>
          </div>
        </div>

        {/* =============== 데스크톱 헤더 (md 이상) =============== */}
        <div className="hidden md:flex w-full items-center justify-between">
          {/* 왼쪽: 로고 + (카테고리 / AI 기능 / NAV 메뉴) */}
          <div className="flex items-center gap-10">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="moodlet"
                className="hidden md:block h-28"
              />
            </Link>

            {/* 홈: 카테고리 / 카테고리 페이지: AI 기능 3개 / 나머지: NAV_ITEMS */}
            {isHome ? (
              <div className="flex items-center">
                <HeaderCategoryText />
              </div>
            ) : isCategoryPage ? (
              <div className="flex items-center">
                <HeaderAIFeatures variant="light" />
              </div>
            ) : (
              <nav className="flex items-center gap-6 text-gray-800 text-[13px] font-bold">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hover:text-gray-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}


          </div>

          {/* 가운데: 검색 인풋 */}
          <div className="flex-1 flex justify-end pr-8">
            {!isHome ? (
              <input
                type="text"
                placeholder="검색"
                className="
                  w-[320px] h-10 rounded-full border border-gray-300 
                  px-4 text-sm focus:outline-none focus:border-gray-500
                "
              />
            ) : (
              <div
                className={`
                  transition-all duration-300 overflow-hidden
                  ${desktopSearchOpen ? "w-[320px] opacity-100" : "w-0 opacity-0"}
                `}
              >
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  className="
                    w-full h-10 rounded-full border border-gray-300 
                    bg-black/20 text-white px-4 text-sm
                    focus:outline-none focus:border-gray-400
                  "
                />
              </div>
            )}
          </div>

          {/* 오른쪽: 검색아이콘(홈), 찜, 프로필 */}
          <div className="flex items-center gap-3">
            {isHome && (
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100/10 transition"
                aria-label="검색"
                onClick={() => setDesktopSearchOpen((v) => !v)}
              >
                <Search size={20} className="text-gray-100" />
              </button>
            )}

            {/* 찜 버튼 */}
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center 
              hover:bg-gray-100/10 transition"
              aria-label="찜 목록"
            >
              <Heart
                size={20}
                className={isHome ? "text-gray-100" : "text-gray-700"}
              />
            </button>

            {/* 프로필 / 로그인 버튼 */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={toggleMenu}
                  className="
                    w-10 h-10 rounded-full 
                    bg-gray-300 flex items-center justify-center
                    hover:ring-2 hover:ring-yellow-300 transition
                  "
                >
                  <UserIcon size={20} className="text-white" />
                </button>

                {menuOpen && (
                  <div
                    className="
                      absolute right-0 mt-2 w-40 
                      bg-white rounded-xl shadow-xl py-2 z-50
                      animate-[fadeIn_0.15s_ease-out]
                    "
                  >
                    <button
                      onClick={() => (window.location.href = "/mypage")}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      마이페이지
                    </button>

                    <button
                      onClick={() => {
                        localStorage.removeItem("moodlet_user");
                        window.location.href = "/";
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleProfileClick}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100/10 transition"
              >
                <UserIcon
                  size={20}
                  className={isHome ? "text-gray-100" : "text-gray-700"}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =============== 모바일 검색창 =============== */}
      <div
        className={`
          md:hidden bg-black/60
          overflow-hidden transition-all duration-200
          ${showSearch ? "max-h-16 py-3" : "max-h-0 py-0"}
        `}
      >
        <div className="max-w-[1400px] mx-auto px-4">
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            className="
              w-full h-10
              rounded-full border border-gray-400 
              bg-black/40 text-white
              px-4 text-sm
              focus:outline-none focus:border-gray-200
            "
          />
        </div>
      </div>

      {/* =============== 모바일 드롭다운 메뉴 =============== */}
      <div
        className={`
          md:hidden bg-black/70
          transition-[max-height] duration-200
          ${isOpen ? "max-h-screen" : "max-h-0"}
          overflow-y-auto
        `}
      >
        <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-3">
          {/* 네비게이션 항목들 */}
          <nav className="flex flex-col gap-2">
            {isHome ? (
              <div className="flex items-center">
                <HeaderCategoryText />
              </div>
            ) : isCategoryPage ? (
              <HeaderAIFeatures />
            ) : (
              <div className="flex flex-col gap-2 text-sm text-gray-100">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </nav>

          <div className="h-px bg-gray-600 my-1" />

          {/* 모바일 프로필 / 로그인 버튼 */}
          <button
            type="button"
            onClick={handleProfileClick}
            className="w-full flex items-center gap-3 py-2"
          >
            <span
              className="
                w-9 h-9 rounded-full
                flex items-center justify-center
                bg-yellow-300 text-gray-800 font-semibold
              "
            >
              {isLoggedIn ? (
                userInitial
              ) : (
                <UserIcon size={18} className="text-gray-800" />
              )}
            </span>
            <span className="text-sm font-medium text-gray-100">
              {isLoggedIn ? "내 프로필" : "로그인 / 회원가입"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
