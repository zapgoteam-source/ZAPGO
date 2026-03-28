<!DOCTYPE html>

<html class="light" lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
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
                        "on-primary-fixed": "#3b0000",
                        "surface": "#f7f9fb",
                        "on-primary": "#ffffff",
                        "primary-fixed-dim": "#ffb4ab",
                        "on-tertiary-container": "#ffede6",
                        "error": "#ba1a1a",
                        "on-primary-fixed-variant": "#8d0000",
                        "tertiary": "#943700",
                        "primary": "#B10000",
                        "primary-fixed": "#ffdad6",
                        "secondary-fixed": "#ffdad6",
                        "error-container": "#ffdad6",
                        "on-surface": "#191c1e",
                        "on-primary-container": "#ffece9",
                        "surface-variant": "#e0e3e5",
                        "tertiary-fixed-dim": "#ffb596",
                        "inverse-primary": "#ffb4ab",
                        "surface-container": "#eceef0",
                        "secondary-container": "#ffdad6",
                        "background": "#f7f9fb",
                        "tertiary-container": "#bc4800",
                        "surface-tint": "#B10000",
                        "secondary": "#954949",
                        "surface-container-high": "#e6e8ea",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-low": "#f2f4f6",
                        "surface-dim": "#d8dadc",
                        "outline-variant": "#c3c6d7",
                        "inverse-surface": "#2d3133",
                        "on-surface-variant": "#434655",
                        "on-secondary-fixed-variant": "#7b3131",
                        "on-secondary-container": "#843939",
                        "secondary-fixed-dim": "#ffb4ab",
                        "on-error-container": "#93000a",
                        "tertiary-fixed": "#ffdbcd",
                        "on-tertiary-fixed-variant": "#7d2d00",
                        "on-secondary": "#ffffff",
                        "primary-container": "#B10000",
                        "surface-bright": "#f7f9fb",
                        "on-error": "#ffffff",
                        "on-secondary-fixed": "#3b0000"
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
            vertical-align: middle;
        }
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Manrope', sans-serif; }
        .glass-nav {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e0e3e5; border-radius: 10px; }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- Top Navigation Bar -->
<header class="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm dark:shadow-none border-b-0">
<div class="flex items-center gap-12">
<span class="text-xl font-black text-primary dark:text-red-400 font-['Manrope'] tracking-tight">에너지잡고 Admin</span>
<nav class="hidden md:flex gap-8 items-center h-full">
<a class="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-['Manrope'] font-bold tracking-tight" href="#">대시보드</a>
<a class="text-primary dark:text-red-400 border-b-2 border-primary dark:border-red-400 pb-1 font-bold font-['Manrope'] tracking-tight" href="#">고객 관리</a>
<a class="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-['Manrope'] font-bold tracking-tight" href="#">견적 관리</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="relative group">
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors cursor-pointer">search</span>
</div>
<button class="px-4 py-2 text-sm font-semibold text-primary dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all">로그아웃</button>
<div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/20">
<img alt="관리자 프로필" data-alt="Admin user profile avatar placeholder" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEwGG4MtjDHEu8oI-UTJh4PlYT1L-XIxqj5R7wUUP9p2LfktFpXjT4LlsdTOsHlCAvMn8isGamnj2W_VT0JSRmVe5AT346lxD5tL2DyIVn14rZDeRiBPRXISnk8FnYNi5sCykbdcuxe2zhQGkh0l9NblcJwjqsIBdYdvrFRANxQzKws8UgCGJGdMT58TL-CrAaW9g5x66otGdgrN0S_HoSpFQowzFp_K5hxwLEkY6aSQhzYgZPFp1maeEfHN8t-dRAjAV7LD5cJOnR"/>
</div>
</div>
</header>
<!-- Side Navigation Bar -->
<aside class="fixed left-0 top-0 h-full flex flex-col p-4 space-y-2 border-r border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 w-64 pt-20">
<div class="px-4 mb-6">
<p class="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase mb-1">Quick Menu</p>
<p class="text-xs text-on-surface-variant/70">Admin Control Panel</p>
</div>
<nav class="space-y-1">
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform group" href="#">
<span class="material-symbols-outlined text-lg" data-icon="dashboard">dashboard</span>
<span class="font-['Inter'] text-sm font-medium">전체 현황</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform group" href="#">
<span class="material-symbols-outlined text-lg" data-icon="pending_actions">pending_actions</span>
<span class="font-['Inter'] text-sm font-medium">신규 접수</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 text-primary dark:text-red-300 font-bold rounded-lg shadow-sm group" href="#">
<span class="material-symbols-outlined text-lg" data-icon="filter_alt">filter_alt</span>
<span class="font-['Inter'] text-sm font-medium">상세 필터</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform group" href="#">
<span class="material-symbols-outlined text-lg" data-icon="analytics">analytics</span>
<span class="font-['Inter'] text-sm font-medium">리포트</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 rounded-lg hover:translate-x-1 transition-transform group" href="#">
<span class="material-symbols-outlined text-lg" data-icon="settings">settings</span>
<span class="font-['Inter'] text-sm font-medium">시스템 설정</span>
</a>
</nav>
<div class="mt-auto p-4 bg-primary/10 rounded-xl border border-primary/10">
<p class="text-xs font-semibold text-primary mb-2">도움이 필요하신가요?</p>
<button class="w-full py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-all active:scale-95">문의 확인</button>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="ml-64 pt-20 p-8 min-h-screen bg-surface">
<div class="max-w-7xl mx-auto">
<!-- Page Header -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
<div>
<h1 class="text-3xl font-extrabold text-on-surface tracking-tight mb-2">고객 통합 관리</h1>
<p class="text-on-surface-variant body-md">에너지잡고 전체 고객 데이터를 조회하고 관리할 수 있습니다.</p>
</div>
<button class="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-md font-bold title-md active:scale-95 transition-transform shadow-md">
<span class="material-symbols-outlined text-[20px]">person_add</span>
                    고객 등록
                </button>
</div>
<!-- Search Filters Bento Box -->
<section class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
<div class="md:col-span-2 bg-surface-container-low p-6 rounded-xl flex flex-col gap-3">
<span class="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">STEP 01. 기간 및 검색어</span>
<div class="grid grid-cols-2 gap-3">
<div class="flex flex-col gap-1">
<label class="text-xs font-semibold text-on-surface-variant">등록일 범위</label>
<input class="w-full bg-surface-container-highest border-none rounded-sm px-3 py-2 text-sm focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 outline-none transition-all" type="date"/>
</div>
<div class="flex flex-col gap-1">
<label class="text-xs font-semibold text-on-surface-variant">고객명/연락처</label>
<input class="w-full bg-surface-container-highest border-none rounded-sm px-3 py-2 text-sm focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 outline-none transition-all" placeholder="검색어 입력..." type="text"/>
</div>
</div>
</div>
<div class="bg-surface-container-low p-6 rounded-xl flex flex-col gap-3">
<span class="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">STEP 02. 담당자</span>
<div class="flex flex-col gap-1">
<label class="text-xs font-semibold text-on-surface-variant">상담자 선택</label>
<select class="w-full bg-surface-container-highest border-none rounded-sm px-3 py-2 text-sm focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 outline-none transition-all">
<option>전체</option>
<option>김철수 팀장</option>
<option>이영희 매니저</option>
</select>
</div>
</div>
<div class="bg-surface-container-low p-6 rounded-xl flex flex-col gap-3">
<span class="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">STEP 03. 현장</span>
<div class="flex flex-col gap-1">
<label class="text-xs font-semibold text-on-surface-variant">시공팀장 선택</label>
<select class="w-full bg-surface-container-highest border-none rounded-sm px-3 py-2 text-sm focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/40 outline-none transition-all">
<option>전체</option>
<option>박건우 소장</option>
<option>최민수 팀장</option>
</select>
</div>
</div>
</section>
<!-- Data Table Section -->
<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
<div class="overflow-x-auto custom-scrollbar">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low">
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">등록일</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">상태</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">이름</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">연락처</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">주소</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">상담자</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">시공일정</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase text-right">최종시공금액</th>
<th class="px-6 py-4 text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">입금일자</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/10">
<!-- Row 1 -->
<tr class="hover:bg-surface-container/30 cursor-pointer transition-colors group">
<td class="px-6 py-5 text-sm font-['Manrope'] text-on-surface">2023.10.24</td>
<td class="px-6 py-5">
<span class="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-[11px] font-bold">시공완료</span>
</td>
<td class="px-6 py-5 text-sm font-bold text-primary group-hover:underline">홍길동</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">010-1234-5678</td>
<td class="px-6 py-5 text-sm text-on-surface-variant truncate max-w-[180px]">서울시 강남구 테헤란로 123</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">김철수</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">2023.11.02</td>
<td class="px-6 py-5 text-sm font-['Manrope'] font-bold text-right text-on-surface">4,500,000</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">2023.11.03</td>
</tr>
<!-- Row 2 -->
<tr class="hover:bg-surface-container/30 cursor-pointer transition-colors group">
<td class="px-6 py-5 text-sm font-['Manrope'] text-on-surface">2023.10.23</td>
<td class="px-6 py-5">
<span class="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[11px] font-bold">상담중</span>
</td>
<td class="px-6 py-5 text-sm font-bold text-primary group-hover:underline">이영희</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">010-9876-5432</td>
<td class="px-6 py-5 text-sm text-on-surface-variant truncate max-w-[180px]">경기도 성남시 분당구 판교역로 45</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">이매니저</td>
<td class="px-6 py-5 text-sm text-outline-variant">-</td>
<td class="px-6 py-5 text-sm font-['Manrope'] font-bold text-right text-on-surface">1,200,000</td>
<td class="px-6 py-5 text-sm text-outline-variant">-</td>
</tr>
<!-- Row 3 -->
<tr class="hover:bg-surface-container/30 cursor-pointer transition-colors group">
<td class="px-6 py-5 text-sm font-['Manrope'] text-on-surface">2023.10.22</td>
<td class="px-6 py-5">
<span class="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold">대기중</span>
</td>
<td class="px-6 py-5 text-sm font-bold text-primary group-hover:underline">박지성</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">010-5555-4444</td>
<td class="px-6 py-5 text-sm text-on-surface-variant truncate max-w-[180px]">부산광역시 해운대구 센텀남대로 8</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">김철수</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">2023.12.15</td>
<td class="px-6 py-5 text-sm font-['Manrope'] font-bold text-right text-on-surface">8,900,000</td>
<td class="px-6 py-5 text-sm text-outline-variant">-</td>
</tr>
<!-- Row 4 -->
<tr class="hover:bg-surface-container/30 cursor-pointer transition-colors group">
<td class="px-6 py-5 text-sm font-['Manrope'] text-on-surface">2023.10.21</td>
<td class="px-6 py-5">
<span class="px-3 py-1 bg-error-container text-on-error-container rounded-full text-[11px] font-bold">취소</span>
</td>
<td class="px-6 py-5 text-sm font-bold text-primary group-hover:underline">최보검</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">010-1111-2222</td>
<td class="px-6 py-5 text-sm text-on-surface-variant truncate max-w-[180px]">인천광역시 연수구 송도동 99</td>
<td class="px-6 py-5 text-sm text-on-surface-variant">이매니저</td>
<td class="px-6 py-5 text-sm text-outline-variant">-</td>
<td class="px-6 py-5 text-sm font-['Manrope'] font-bold text-right text-on-surface">0</td>
<td class="px-6 py-5 text-sm text-outline-variant">-</td>
</tr>
</tbody>
</table>
</div>
<!-- Pagination -->
<div class="px-6 py-4 flex items-center justify-between bg-surface-container-low/50">
<p class="text-xs text-on-surface-variant">전체 <span class="font-bold text-primary">1,248</span>명 중 1-4 표시</p>
<div class="flex gap-2">
<button class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 hover:bg-white text-on-surface-variant">
<span class="material-symbols-outlined text-sm">chevron_left</span>
</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-xs">1</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 hover:bg-white text-on-surface-variant text-xs">2</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 hover:bg-white text-on-surface-variant text-xs">3</button>
<button class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant/30 hover:bg-white text-on-surface-variant">
<span class="material-symbols-outlined text-sm">chevron_right</span>
</button>
</div>
</div>
</div>
<!-- Footer Stats Bento Grid Overlay -->
<div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
<div class="p-6 bg-surface-container-low rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
<span class="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-8xl text-primary/5 select-none" style="font-variation-settings: 'FILL' 1;">groups</span>
<span class="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">이번 달 신규 고객</span>
<div class="flex items-baseline gap-2">
<span class="text-4xl font-black font-['Manrope'] text-on-surface tracking-tighter">124</span>
<span class="text-sm font-bold text-primary">+12%</span>
</div>
</div>
<div class="p-6 bg-surface-container-low rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
<span class="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-8xl text-secondary/5 select-none" style="font-variation-settings: 'FILL' 1;">construction</span>
<span class="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">진행 중인 시공</span>
<div class="flex items-baseline gap-2">
<span class="text-4xl font-black font-['Manrope'] text-on-surface tracking-tighter">42</span>
<span class="text-sm font-bold text-secondary">안정</span>
</div>
</div>
<div class="p-6 bg-surface-container-low rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
<span class="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-8xl text-tertiary/5 select-none" style="font-variation-settings: 'FILL' 1;">payments</span>
<span class="text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase">총 누적 매출</span>
<div class="flex items-baseline gap-2">
<span class="text-4xl font-black font-['Manrope'] text-on-surface tracking-tighter">2.8B</span>
<span class="text-sm font-bold text-tertiary">₩</span>
</div>
</div>
</div>
</div>
</main>
</body></html>

