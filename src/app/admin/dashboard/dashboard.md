<!DOCTYPE html>

<html class="light" lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>에너지잡고 Admin - 대시보드</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "outline": "#737686",
                        "surface-container-highest": "#e0e3e5",
                        "inverse-on-surface": "#eff1f3",
                        "on-tertiary-fixed": "#360f00",
                        "on-background": "#191c1e",
                        "on-tertiary": "#ffffff",
                        "on-primary-fixed": "#310000",
                        "surface": "#f7f9fb",
                        "on-primary": "#ffffff",
                        "primary-fixed-dim": "#ffb4a9",
                        "on-tertiary-container": "#ffede6",
                        "error": "#ba1a1a",
                        "on-primary-fixed-variant": "#690000",
                        "tertiary": "#943700",
                        "primary": "#B10000",
                        "primary-fixed": "#ffdad4",
                        "secondary-fixed": "#ffdad4",
                        "error-container": "#ffdad6",
                        "on-surface": "#191c1e",
                        "on-primary-container": "#ffffff",
                        "surface-variant": "#f4dddb",
                        "tertiary-fixed-dim": "#ffb596",
                        "inverse-primary": "#ffb4a9",
                        "surface-container": "#f4f0ef",
                        "secondary-container": "#ffd9d3",
                        "background": "#f7f9fb",
                        "tertiary-container": "#bc4800",
                        "surface-tint": "#B10000",
                        "secondary": "#775652",
                        "surface-container-high": "#ebe4e3",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-low": "#f7f3f2",
                        "surface-dim": "#e1d9d8",
                        "outline-variant": "#d8c2bf",
                        "inverse-surface": "#362f2e",
                        "on-surface-variant": "#534341",
                        "on-secondary-fixed-variant": "#5d3f3b",
                        "on-secondary-container": "#2c1512",
                        "secondary-fixed-dim": "#e7bdb7",
                        "on-error-container": "#93000a",
                        "tertiary-fixed": "#ffdbcd",
                        "on-tertiary-fixed-variant": "#7d2d00",
                        "on-secondary": "#ffffff",
                        "primary-container": "#B10000",
                        "surface-bright": "#fff8f6",
                        "on-error": "#ffffff",
                        "on-secondary-fixed": "#2c1512"
                    },
                    fontFamily: {
                        "headline": ["Manrope"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, .font-headline { font-family: 'Manrope', sans-serif; }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm dark:shadow-none font-['Manrope'] font-bold tracking-tight">
<div class="flex items-center gap-12">
<span class="text-xl font-black text-primary dark:text-red-400">에너지잡고 Admin</span>
<div class="hidden md:flex space-x-8">
<a class="text-primary dark:text-red-400 border-b-2 border-primary dark:border-red-400 pb-1 font-bold" href="#">대시보드</a>
<a class="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">고객 관리</a>
<a class="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">견적 관리</a>
</div>
</div>
<div class="flex items-center space-x-4">
<div class="relative hidden lg:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
<input class="bg-surface-container-low border-none rounded-lg py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="고객명, 연락처 검색" type="text"/>
</div>
<button class="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all Active:scale-98">로그아웃</button>
<img class="w-8 h-8 rounded-full border border-outline-variant" data-alt="관리자 프로필 아바타" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEghbWw_EquajlhHKx6Te_IHFJrEhU1xRj0_EDOcodWbr9ZUVGKDUv1j7rmtzaNRbnqGB8uXv0EQw27XXhJFoLHJCJQZOKOjvKZM_OZ6fVdE6npdlT8dxev58hvICkFYU5N9ByTafDlntbsv8gjgwlb-RY14Qk7-ypr-WVhHSoTsvx27cJ6thEcMA8ebkgUoWNx81pkNuF9OeDQI0QYIYGKwMRVpbueKpEMeGklV7OyO7d9_q-ml1tRWJ2KD1fmlbolbTL1s-OiiIr"/>
</div>
</nav>
<!-- SideNavBar -->
<aside class="fixed left-0 top-0 h-full flex flex-col p-4 space-y-2 border-r border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 w-64 pt-16 z-40">
<div class="px-4 py-6">
<h3 class="text-xs font-bold text-outline uppercase tracking-widest">Quick Menu</h3>
<p class="text-[10px] text-on-surface-variant">Admin Control Panel</p>
</div>
<div class="space-y-1">
<a class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 text-primary dark:text-red-400 font-bold rounded-lg shadow-sm hover:translate-x-1 transition-transform" href="#">
<span class="material-symbols-outlined text-[20px]">dashboard</span>
<span class="text-sm">전체 현황</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform" href="#">
<span class="material-symbols-outlined text-[20px]">pending_actions</span>
<span class="text-sm">신규 접수</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform" href="#">
<span class="material-symbols-outlined text-[20px]">filter_alt</span>
<span class="text-sm">상세 필터</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform" href="#">
<span class="material-symbols-outlined text-[20px]">analytics</span>
<span class="text-sm">리포트</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform" href="#">
<span class="material-symbols-outlined text-[20px]">settings</span>
<span class="text-sm">시스템 설정</span>
</a>
</div>
<div class="mt-auto p-4 bg-primary-fixed rounded-xl">
<p class="text-xs font-bold text-on-primary-fixed mb-2">도움이 필요하신가요?</p>
<button class="w-full bg-primary text-on-primary py-2 rounded-lg text-xs font-bold shadow-sm">문의 확인</button>
</div>
</aside>
<!-- Main Canvas -->
<main class="ml-64 pt-16 min-h-screen">
<div class="p-8 max-w-[1600px] mx-auto">
<!-- Header & Filter Bar -->
<header class="mb-10 flex flex-col gap-6">
<div class="flex justify-between items-end">
<div>
<span class="text-xs font-bold text-primary tracking-[0.1em] uppercase">STEP 01</span>
<h1 class="text-3xl font-extrabold tracking-tight mt-1">대시보드 실시간 현황</h1>
</div>
<div class="flex gap-3">
<div class="bg-surface-container-low px-4 py-2 rounded-lg flex items-center gap-4">
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-tertiary"></span>
<span class="text-sm font-medium">대기 12</span>
</div>
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-primary"></span>
<span class="text-sm font-medium">상담 08</span>
</div>
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-secondary"></span>
<span class="text-sm font-medium">완료 45</span>
</div>
</div>
</div>
</div>
<!-- Filter Bar -->
<div class="bg-surface-container-low p-2 rounded-xl flex items-center gap-4 flex-wrap">
<div class="flex-1 min-w-[150px]">
<select class="w-full bg-surface-container-lowest border-none rounded-lg text-sm px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-primary/20">
<option>전체 상태</option>
<option>대기 중</option>
<option>상담 중</option>
<option>시공 완료</option>
</select>
</div>
<div class="flex-1 min-w-[150px]">
<select class="w-full bg-surface-container-lowest border-none rounded-lg text-sm px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-primary/20">
<option>유입 경로 (전체)</option>
<option>네이버 검색</option>
<option>인스타그램</option>
<option>지인 추천</option>
</select>
</div>
<div class="flex-1 min-w-[150px]">
<select class="w-full bg-surface-container-lowest border-none rounded-lg text-sm px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-primary/20">
<option>대리점 코드</option>
<option>강남지점 (A01)</option>
<option>서초지점 (A02)</option>
</select>
</div>
<button class="bg-white p-2.5 rounded-lg border border-outline-variant/20 hover:bg-red-50 transition-colors">
<span class="material-symbols-outlined text-[20px] text-on-surface-variant">refresh</span>
</button>
</div>
</header>
<!-- 2-Column Layout -->
<div class="grid grid-cols-12 gap-8">
<!-- Left: Customer List (7/12) -->
<section class="col-span-7 space-y-4">
<div class="flex justify-between items-center mb-2 px-1">
<h2 class="text-lg font-bold">접수 고객 목록</h2>
<span class="text-sm text-on-surface-variant">총 156명</span>
</div>
<div class="space-y-3">
<!-- Customer Item Active -->
<div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-primary transition-all flex items-center justify-between group cursor-pointer">
<div class="flex items-center gap-5">
<div class="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">김</div>
<div>
<div class="flex items-center gap-2 mb-1">
<h3 class="font-bold text-lg">김철수</h3>
<span class="px-3 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">상담 중</span>
</div>
<div class="flex gap-4 text-sm text-on-surface-variant">
<span>010-1234-5678</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">calendar_today</span> 2024.05.20</span>
</div>
</div>
</div>
<div class="text-right">
<p class="text-xs text-on-surface-variant mb-1">예상 금액</p>
<p class="text-lg font-black text-primary">₩ 4,500,000</p>
</div>
</div>
<!-- Customer Item -->
<div class="bg-surface-container-low p-6 rounded-xl hover:bg-surface-container-highest transition-all flex items-center justify-between group cursor-pointer">
<div class="flex items-center gap-5">
<div class="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold">이</div>
<div>
<div class="flex items-center gap-2 mb-1">
<h3 class="font-bold text-lg">이영희</h3>
<span class="px-3 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-wider">대기 중</span>
</div>
<div class="flex gap-4 text-sm text-on-surface-variant">
<span>010-9876-5432</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">calendar_today</span> 2024.05.21</span>
</div>
</div>
</div>
<div class="text-right">
<p class="text-xs text-on-surface-variant mb-1">예상 금액</p>
<p class="text-lg font-black">₩ 3,200,000</p>
</div>
</div>
<!-- Customer Item -->
<div class="bg-surface-container-low p-6 rounded-xl hover:bg-surface-container-highest transition-all flex items-center justify-between group cursor-pointer">
<div class="flex items-center gap-5">
<div class="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold">박</div>
<div>
<div class="flex items-center gap-2 mb-1">
<h3 class="font-bold text-lg">박민준</h3>
<span class="px-3 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">시공 완료</span>
</div>
<div class="flex gap-4 text-sm text-on-surface-variant">
<span>010-1111-2222</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">calendar_today</span> 2024.05.15</span>
</div>
</div>
</div>
<div class="text-right">
<p class="text-xs text-on-surface-variant mb-1">예상 금액</p>
<p class="text-lg font-black">₩ 12,800,000</p>
</div>
</div>
<!-- Customer Item -->
<div class="bg-surface-container-low p-6 rounded-xl hover:bg-surface-container-highest transition-all flex items-center justify-between group cursor-pointer">
<div class="flex items-center gap-5">
<div class="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold">최</div>
<div>
<div class="flex items-center gap-2 mb-1">
<h3 class="font-bold text-lg">최서연</h3>
<span class="px-3 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">상담 중</span>
</div>
<div class="flex gap-4 text-sm text-on-surface-variant">
<span>010-4444-5555</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">calendar_today</span> 2024.05.20</span>
</div>
</div>
</div>
<div class="text-right">
<p class="text-xs text-on-surface-variant mb-1">예상 금액</p>
<p class="text-lg font-black">₩ 5,100,000</p>
</div>
</div>
</div>
</section>
<!-- Right: Detailed Preview (5/12) -->
<section class="col-span-5 relative">
<div class="sticky top-24 space-y-6">
<div class="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/10">
<!-- Hero Preview Section -->
<div class="p-8 bg-gradient-to-br from-primary to-[#8a0000] text-on-primary">
<div class="flex justify-between items-start mb-6">
<div>
<span class="text-[10px] font-bold tracking-widest bg-white/20 px-2 py-1 rounded">DETAIL VIEW</span>
<h2 class="text-3xl font-black mt-2">김철수 고객님</h2>
<p class="text-on-primary-container/80 text-sm mt-1">서울시 강남구 삼성동 123-45</p>
</div>
<button class="bg-white/10 p-2 rounded-full backdrop-blur-sm">
<span class="material-symbols-outlined">edit</span>
</button>
</div>
<div class="grid grid-cols-2 gap-4">
<div class="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
<p class="text-xs opacity-70 mb-1 text-on-primary">연락처</p>
<p class="font-bold">010-1234-5678</p>
</div>
<div class="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
<p class="text-xs opacity-70 mb-1 text-on-primary">접수 경로</p>
<p class="font-bold">네이버 블로그</p>
</div>
</div>
</div>
<div class="p-8 space-y-8">
<!-- Quote Summary -->
<div>
<h4 class="text-xs font-bold text-outline mb-4 uppercase tracking-tighter">최근 견적 요약</h4>
<div class="bg-surface-container-low p-5 rounded-xl">
<div class="flex justify-between items-center mb-3">
<span class="text-sm">LX 하우시스 수퍼세이브 5</span>
<span class="font-bold text-primary">₩ 4,500,000</span>
</div>
<div class="flex justify-between items-center text-xs text-on-surface-variant">
<span>창호 8세트, 단열 시공 포함</span>
<span>2024.05.20 발행</span>
</div>
</div>
</div>
<!-- Assign Status -->
<div>
<h4 class="text-xs font-bold text-outline mb-4 uppercase tracking-tighter">시공 배정 상태</h4>
<div class="flex items-center gap-4">
<div class="flex-1 flex items-center gap-3 bg-surface p-3 rounded-lg">
<span class="material-symbols-outlined text-primary">engineering</span>
<div>
<p class="text-[10px] text-on-surface-variant">팀장</p>
<p class="text-sm font-bold">홍길동 팀장</p>
</div>
</div>
<div class="flex-1 flex items-center gap-3 bg-surface p-3 rounded-lg">
<span class="material-symbols-outlined text-primary">event_available</span>
<div>
<p class="text-[10px] text-on-surface-variant">일정</p>
<p class="text-sm font-bold">2024.06.05 확정</p>
</div>
</div>
</div>
</div>
<!-- Counseling Memos -->
<div>
<div class="flex justify-between items-center mb-4">
<h4 class="text-xs font-bold text-outline uppercase tracking-tighter">상담 메모</h4>
<button class="text-[10px] font-bold text-primary flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">add_circle</span> 메모 추가
                                    </button>
</div>
<div class="space-y-4">
<div class="border-l-2 border-primary-fixed/50 pl-4">
<p class="text-xs font-bold mb-1">05월 21일 14:20</p>
<p class="text-sm text-on-surface-variant leading-relaxed">거실 창호 색상 변경 요청 (화이트 -&gt; 다크 그레이). 주방 단열 추가 문의하심.</p>
</div>
<div class="border-l-2 border-primary-fixed/50 pl-4">
<p class="text-xs font-bold mb-1">05월 20일 09:30</p>
<p class="text-sm text-on-surface-variant leading-relaxed">최초 방문 견적 완료. LX 하우시스 제품 선호. 시공 시 사다리차 진입 가능 확인.</p>
</div>
</div>
</div>
<!-- Action Buttons -->
<div class="grid grid-cols-2 gap-3 pt-4">
<button class="bg-surface-container-high text-primary py-4 rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-all active:scale-95">배정하기</button>
<button class="bg-primary text-on-primary py-4 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95">상세 보기</button>
</div>
</div>
</div>
</div>
</section>
</div>
</div>
</main>
<!-- Floating Action Button for Mobile Context -->
<div class="md:hidden fixed bottom-8 right-8 z-50">
<button class="w-16 h-16 rounded-full bg-primary text-on-primary shadow-2xl flex items-center justify-center">
<span class="material-symbols-outlined text-[32px]" data-weight="fill">add</span>
</button>
</div>
</body></html>



```markdown
# Design System Strategy: Architectural Energy & Editorial Depth

## 1. Overview & Creative North Star: "The Kinetic Gallery"
This design system moves away from the static, "templated" nature of traditional energy platforms. Our North Star is **The Kinetic Gallery**. We treat every screen as a high-end architectural spread—utilizing intentional asymmetry, expansive white space, and bold typographic scaling to command authority.

The system is defined by a "Deep Red" precision. By pairing the aggressive power of `#B10000` with soft, layered neutrals and the technical clarity of Manrope, we create an environment that feels both high-voltage and meticulously curated. We do not build "pages"; we compose "vistas" where information flows with the logic of a premium editorial magazine.

---

## 2. Color Theory & Tonal Depth
Our palette is anchored in a sophisticated red spectrum, balanced by a warm, paper-like neutral base.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section should sit on a `surface` background to define its territory without a "box" look.

### Surface Hierarchy & Nesting
Instead of a flat grid, treat the UI as stacked sheets of fine paper.
- **Surface (Base):** `#fff8f6` - The canvas.
- **Surface-Container-Low:** `#fff0ee` - Subtle grouping for secondary content.
- **Surface-Container-Highest:** `#fbdbd6` - For focused, high-priority interactive modules.
- **The Glass Rule:** For floating navigation or modal overlays, use `surface` at 70% opacity with a `20px` backdrop-blur to allow the rich red accents to bleed through the "frosted" interface.

### Signature Textures
Main CTAs and Hero backgrounds should utilize a subtle linear gradient from `primary` (#850000) to `primary_container` (#B10000) at a 135-degree angle. This adds "soul" and a sense of liquid energy that flat hex codes cannot replicate.

---

## 3. Typography: The Editorial Voice
We use **Manrope** exclusively. Its geometric yet humanist qualities provide the "architectural lens" required for this brand.

- **Display (LG/MD):** Used for "Statement Moments." Always set to `font-weight: 800` with a `-0.02em` letter spacing to feel dense and authoritative.
- **Headline (LG/MD):** The primary storytelling tool. Use `headline-lg` (2rem) for section entries, ensuring ample vertical breathing room (at least `spacing-12`).
- **Body (LG/MD):** Set to `font-weight: 400` with a generous line-height (1.6) to maintain the "High-End Editorial" readability.
- **Labels:** Use `label-md` in uppercase with `+0.05em` letter spacing for technical data points, evoking a blueprint-style aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
We reject traditional drop shadows in favor of **Ambient Dimensionality**.

- **The Layering Principle:** Achieve depth by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` section creates a natural lift.
- **Ambient Shadows:** If a floating effect is vital (e.g., a primary action fab), use a shadow color tinted with the `on-surface` value (`#281715` at 6% opacity) with a blur radius of `32px` and a `Y` offset of `12px`. Never use pure black or grey.
- **The "Ghost Border" Fallback:** If a container requires a boundary for accessibility, use the `outline_variant` token at **15% opacity**. High-contrast, 100% opaque borders are forbidden.

---

## 5. Components & Primitives

### Buttons
- **Primary:** Background `primary_container` (#B10000), text `on_primary` (#ffffff). Corner radius `Round Eight` (0.5rem). Use a slight horizontal scale-up (1.02x) on hover to indicate "stored energy."
- **Secondary:** Transparent background with a `Ghost Border` and `primary` text.
- **Tertiary:** No container. Text only in `primary`, using `label-md` for a sophisticated, "understated" action.

### Cards & Data Modules
- **Rule:** Forbid the use of divider lines.
- **Implementation:** Separate content using the Spacing Scale (e.g., `spacing-6` between header and body). Use a subtle shift to `surface_container_low` for the card background to distinguish it from the page.

### Input Fields
- Avoid the "boxed-in" look. Use a `surface_variant` background with a bottom-only stroke in `outline_variant` (20% opacity). On focus, the bottom stroke expands to 2px in `primary` red.

### Signature Component: The "Energy Meter"
A custom linear progress element using the `tertiary` (#0027b9) to `primary` (#B10000) gradient, representing the transition from cold storage to active energy output.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace Asymmetry:** Offset your columns. Let an image bleed off the edge of the grid while text stays centered.
- **Use "White Space" as a Tool:** Use `spacing-20` and `spacing-24` to separate major content clusters to maintain a premium feel.
- **Maintain Tonal Contrast:** Use `on_surface_variant` for sub-captions to ensure the `primary` red elements truly "pop."

### Don’t:
- **Don't use 1px lines:** Do not use lines to separate list items; use `spacing-3` and background tonal shifts.
- **Don't crowd the Red:** The `#B10000` is powerful. Use it sparingly for "Key Actions" and "Active States" only. If everything is red, nothing is important.
- **Don't use Standard Shadows:** Avoid "dirty" grey shadows that break the clean, architectural light of the `surface` color.```