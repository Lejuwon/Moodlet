"use client";

import Link from "next/link";

const categories = [
  { name: "침대", href: "/category/bed" },
  { name: "소파", href: "/category/sofa" },
  { name: "테이블", href: "/category/table" },
  { name: "의자", href: "/category/chair" },
  { name: "수납·정리", href: "/category/storage" },
  { name: "패브릭", href: "/category/fabric" },
  { name: "식물·데코", href: "/category/decor" },
];

export default function HeaderCategoryText() {
  return (
    <nav
      className="
        flex
        flex-col md:flex-row          /* 모바일: 세로, PC: 가로 */
        gap-3 md:gap-6
        text-gray-200 text-sm font-medium
      "
    >
      {categories.map((c) => (
        <Link
          key={c.name}
          href={c.href}
          className="
            py-2 md:py-0
            border-b border-gray-700/60 last:border-b-0  /* 모바일에서만 줄 나눔 */
            md:border-none
            hover:text-yellow-300 transition
          "
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
