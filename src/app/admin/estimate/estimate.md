<!DOCTYPE html>

<html lang="ko"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>에너지잡고 Admin - 견적 상세</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "surface-container": "#eceef0",
                "surface": "#f7f9fb",
                "tertiary": "#943700",
                "on-primary-fixed-variant": "#003ea8",
                "primary-fixed": "#dbe1ff",
                "tertiary-fixed": "#ffdbcd",
                "inverse-surface": "#2d3133",
                "surface-container-high": "#e6e8ea",
                "surface-dim": "#d8dadc",
                "on-background": "#191c1e",
                "surface-container-lowest": "#ffffff",
                "inverse-primary": "#b4c5ff",
                "on-error": "#ffffff",
                "on-secondary-container": "#394c84",
                "on-error-container": "#93000a",
                "on-primary-container": "#eeefff",
                "surface-container-low": "#f2f4f6",
                "on-secondary-fixed-variant": "#31447b",
                "surface-tint": "#0053db",
                "secondary-fixed": "#dbe1ff",
                "secondary-container": "#acbfff",
                "tertiary-fixed-dim": "#ffb596",
                "outline": "#737686",
                "tertiary-container": "#bc4800",
                "error-container": "#ffdad6",
                "surface-container-highest": "#e0e3e5",
                "secondary-fixed-dim": "#b4c5ff",
                "error": "#ba1a1a",
                "secondary": "#495c95",
                "on-secondary-fixed": "#00174b",
                "surface-bright": "#f7f9fb",
                "on-tertiary": "#ffffff",
                "on-tertiary-container": "#ffede6",
                "on-tertiary-fixed-variant": "#7d2d00",
                "on-surface-variant": "#434655",
                "primary-fixed-dim": "#b4c5ff",
                "on-surface": "#191c1e",
                "on-primary": "#ffffff",
                "primary-container": "#2563eb",
                "primary": "#004ac6",
                "on-tertiary-fixed": "#360f00",
                "background": "#f7f9fb",
                "on-primary-fixed": "#00174b",
                "inverse-on-surface": "#eff1f3",
                "surface-variant": "#e0e3e5",
                "on-secondary": "#ffffff",
                "outline-variant": "#c3c6d7"
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
        h1, h2, h3, .font-headline { font-family: 'Manrope', sans-serif; }
        .glass-nav {
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
    </style>
</head>
<body class="bg-surface text-on-surface antialiased">
<!-- TopNavBar -->
<header class="fixed top-0 w-full flex justify-between items-center px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 shadow-sm dark:shadow-none">
<div class="flex items-center gap-8">
<span class="text-xl font-black text-blue-700 dark:text-blue-500 tracking-tighter">에너지잡고 Admin</span>
<nav class="hidden md:flex gap-6 items-center">
<a class="text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors font-manrope font-bold text-sm tracking-tight" href="#">대시보드</a>
<a class="text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors font-manrope font-bold text-sm tracking-tight" href="#">고객 관리</a>
<a class="text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 font-bold pb-1 font-manrope font-bold text-sm tracking-tight" href="#">견적 관리</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="relative hidden sm:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
<input class="bg-surface-container-highest border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 w-64 transition-all" placeholder="견적 번호 검색" type="text"/>
</div>
<button class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500">
<span class="material-symbols-outlined">settings</span>
</button>
<div class="w-8 h-8 rounded-full bg-primary-fixed overflow-hidden">
<img alt="관리자 프로필" class="w-full h-full object-cover" data-alt="professional male profile picture with a friendly expression in corporate attire, soft studio lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW7vJ098ldGuieZkiRNKc_zvMmSDmiF3WsISSLKv9Ks2Rwd8UhI8Owcnd16YQ6utCGFRFCyliXIw06NBD5ebOyS5NnN1aWTh29MRHEnh8na79OOjt_Jw0mf9aEpQEYv7oWL6HD8W1XO1gBfXp2rERWFkGjpQyrWQkWt9yT5-13z7QaHzxZTR5b7XSEToMnK7aLdVX7QxCHnJtCSMPYlG_i1EUXwOKtsyPaCViO8Bewg5Ce7Zp61PnQtTD9OPZSMbTsEoXjimImiE-A"/>
</div>
</div>
</header>
<!-- SideNavBar (Left) -->
<aside class="fixed left-0 h-full w-64 pt-20 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hidden md:block">
<div class="px-6 py-4">
<h2 class="font-inter text-xs font-bold text-outline-variant uppercase tracking-widest mb-4">Quick Menu</h2>
<div class="flex flex-col gap-1">
<a class="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-r-full font-bold px-4 py-3 -ml-6 pl-10 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1" href="#">
<span class="material-symbols-outlined text-[20px]">edit_note</span>
<span class="font-inter text-sm">퀵 견적수정</span>
</a>
<a class="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 px-4 py-3 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1" href="#">
<span class="material-symbols-outlined text-[20px]">sync_alt</span>
<span class="font-inter text-sm">상태 변경</span>
</a>
<a class="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 px-4 py-3 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1" href="#">
<span class="material-symbols-outlined text-[20px]">history</span>
<span class="font-inter text-sm">히스토리</span>
</a>
<a class="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 px-4 py-3 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1" href="#">
<span class="material-symbols-outlined text-[20px]">chat_bubble</span>
<span class="font-inter text-sm">문자 발송</span>
</a>
<a class="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 px-4 py-3 flex items-center gap-3 transition-transform duration-200 hover:translate-x-1" href="#">
<span class="material-symbols-outlined text-[20px]">description</span>
<span class="font-inter text-sm">메모 작성</span>
</a>
</div>
<div class="mt-10">
<button class="w-full py-4 bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all">
                    새 견적 생성
                </button>
</div>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="md:ml-64 pt-24 pb-12 px-6 lg:px-12">
<!-- Header Section -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
<div>
<nav class="flex items-center gap-2 text-outline-variant text-sm mb-2 font-medium">
<span>견적 관리</span>
<span class="material-symbols-outlined text-xs">chevron_right</span>
<span class="text-on-surface-variant">견적 상세 확인</span>
</nav>
<div class="flex items-center gap-4">
<h1 class="text-3xl font-black tracking-tight text-on-surface">EST-2024-0522</h1>
<span class="px-3 py-1 bg-primary-fixed text-on-primary-fixed text-xs font-bold rounded-full">진행 중</span>
</div>
<p class="mt-2 text-on-surface-variant font-medium">고객명: <span class="text-on-surface font-bold">김태평</span></p>
</div>
<div class="flex gap-3">
<button class="px-6 py-3 bg-surface-container-high text-on-surface font-bold rounded-lg hover:scale-[0.98] transition-all">임시 저장</button>
<button class="px-8 py-3 bg-gradient-to-br from-primary-container to-primary text-on-primary font-bold rounded-lg shadow-xl shadow-primary/10 hover:scale-[0.98] transition-all flex items-center gap-2">
<span class="material-symbols-outlined text-[20px]">save</span>
                    수정 저장
                </button>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
<!-- Left Column: Info & Survey -->
<div class="lg:col-span-4 space-y-8">
<!-- 본문 1영역: 고객 정보 -->
<section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
<h3 class="text-lg font-extrabold mb-6 flex items-center gap-2">
<span class="w-1.5 h-6 bg-primary rounded-full"></span>
                        고객 정보
                    </h3>
<div class="space-y-5">
<div class="flex justify-between items-center">
<span class="text-on-surface-variant text-sm font-medium">이름</span>
<span class="text-on-surface font-bold">김태평</span>
</div>
<div class="flex justify-between items-center">
<span class="text-on-surface-variant text-sm font-medium">연락처</span>
<span class="text-on-surface font-bold">010-1234-5678</span>
</div>
<div class="flex flex-col gap-1">
<span class="text-on-surface-variant text-sm font-medium">주소</span>
<span class="text-on-surface font-bold leading-tight">서울시 서초구 반포동 래미안 원베일리 102동 1502호</span>
</div>
<div class="flex justify-between items-center">
<span class="text-on-surface-variant text-sm font-medium">평형</span>
<span class="text-on-surface font-bold">32평 (84㎡)</span>
</div>
<div class="flex justify-between items-center">
<span class="text-on-surface-variant text-sm font-medium">대리점 코드</span>
<span class="text-on-surface font-bold text-primary">SEOCHO-001</span>
</div>
</div>
</section>
<!-- 본문 2영역: 설문 결과 -->
<section class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
<h3 class="text-lg font-extrabold mb-6 flex items-center gap-2">
<span class="w-1.5 h-6 bg-secondary rounded-full"></span>
                        설문 결과
                    </h3>
<div class="flex flex-wrap gap-2">
<div class="flex flex-col gap-1 w-full p-4 bg-surface-container-low rounded-lg">
<span class="text-xs text-on-surface-variant font-bold uppercase tracking-wider">외부 소음</span>
<div class="flex items-center gap-2">
<span class="px-2.5 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-black rounded-full">심함</span>
<p class="text-sm text-on-surface-variant">차도 소음 유입이 많음</p>
</div>
</div>
<div class="flex flex-col gap-1 w-full p-4 bg-surface-container-low rounded-lg">
<span class="text-xs text-on-surface-variant font-bold uppercase tracking-wider">결로 현상</span>
<div class="flex items-center gap-2">
<span class="px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-black rounded-full">약간 있음</span>
<p class="text-sm text-on-surface-variant">겨울철 창틀 하단 습기</p>
</div>
</div>
<div class="flex flex-col gap-1 w-full p-4 bg-surface-container-low rounded-lg">
<span class="text-xs text-on-surface-variant font-bold uppercase tracking-wider">단열 상태</span>
<div class="flex items-center gap-2">
<span class="px-2.5 py-1 bg-error-container text-on-error-container text-xs font-black rounded-full">매우 취약</span>
<p class="text-sm text-on-surface-variant">냉기 유입이 직접적으로 느껴짐</p>
</div>
</div>
</div>
</section>
<!-- 본문 6영역: 이력 -->
<section class="bg-surface rounded-xl p-2">
<h3 class="text-sm font-black text-outline mb-4 px-2 uppercase tracking-tighter">수정 이력 타임라인</h3>
<div class="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
<div class="relative pl-8">
<div class="absolute left-0 top-1.5 w-[24px] h-[24px] bg-white border-2 border-primary rounded-full z-10 flex items-center justify-center">
<div class="w-2 h-2 bg-primary rounded-full"></div>
</div>
<p class="text-xs text-on-surface-variant font-medium">2024.05.22 14:30</p>
<p class="text-sm font-bold text-on-surface mt-0.5">최종 견적 승인</p>
<p class="text-xs text-on-surface-variant">관리자: 박주임</p>
</div>
<div class="relative pl-8">
<div class="absolute left-0 top-1.5 w-[24px] h-[24px] bg-white border-2 border-outline-variant rounded-full z-10"></div>
<p class="text-xs text-on-surface-variant font-medium">2024.05.22 11:15</p>
<p class="text-sm font-bold text-on-surface mt-0.5">창문 규격 및 단가 수정</p>
<p class="text-xs text-on-surface-variant">거실 큰창 옵션 변경 (일반 -&gt; 패브릭씰러)</p>
</div>
<div class="relative pl-8">
<div class="absolute left-0 top-1.5 w-[24px] h-[24px] bg-white border-2 border-outline-variant rounded-full z-10"></div>
<p class="text-xs text-on-surface-variant font-medium">2024.05.21 18:00</p>
<p class="text-sm font-bold text-on-surface mt-0.5">셀프 견적 생성</p>
<p class="text-xs text-on-surface-variant">고객: 김태평</p>
</div>
</div>
</section>
</div>
<!-- Right Column: Window List & Totals -->
<div class="lg:col-span-8 space-y-8">
<!-- 본문 3영역: 창문 목록 -->
<section>
<div class="flex items-center justify-between mb-6">
<h3 class="text-xl font-extrabold flex items-center gap-2">
<span class="w-1.5 h-6 bg-primary-container rounded-full"></span>
                            창문 목록 <span class="text-primary text-sm font-medium ml-2">총 3개소</span>
</h3>
<button class="text-primary text-sm font-bold hover:underline flex items-center gap-1">
<span class="material-symbols-outlined text-sm">add_circle</span>
                            창문 추가
                        </button>
</div>
<div class="space-y-4">
<!-- Card 1 -->
<div class="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 group transition-all hover:border-primary/20">
<div class="flex flex-col md:flex-row gap-6">
<div class="w-full md:w-48 h-32 rounded-lg bg-surface-container overflow-hidden shrink-0">
<img alt="거실 큰창 이미지" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="modern minimalist living room with a large floor-to-ceiling glass window showing garden view, bright natural light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs-ekB9fMcs_sMFz0hfUexD02D-hxpoSgKTDBTXkEfDyVnEjhTurJ02i3M9QTg74kPcJ0WcXs9oDZfyDdNALymBG9xosLOJq6wyu5zRQDNwEILpXdNZEpCfmna59EXaFCDEGW_3FApMlqODx1otTgEUzk6gMpAVq31yBBhGpzX2LSdoDvp1BI7WK8NxHkNBzB47WFkV6StQHLWJGzmQHzpsz_O0YH2zocStMtJX9Wi5vc7mYvPPeKPceT_EawczGORyE6im57M_TyR"/>
</div>
<div class="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4">
<div class="col-span-2">
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">위치 / 유형</label>
<div class="flex gap-2">
<input class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full focus:ring-1 focus:ring-primary/30" type="text" value="거실 큰창"/>
</div>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">구조</label>
<select class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full">
<option>2짝 1:1</option>
<option>3짝 1:2:1</option>
</select>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">단창/이중창</label>
<select class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full">
<option>이중창</option>
<option>단창</option>
</select>
</div>
<div class="col-span-2">
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">추가 서비스</label>
<div class="flex flex-wrap gap-2">
<span class="px-2 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded flex items-center gap-1">
                                                패브릭씰러 <button><span class="material-symbols-outlined text-[14px]">close</span></button>
</span>
<span class="px-2 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded flex items-center gap-1">
                                                방충망 교체 <button><span class="material-symbols-outlined text-[14px]">close</span></button>
</span>
</div>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">수량</label>
<input class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full" type="number" value="1"/>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">금액</label>
<input class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full text-right" type="text" value="3,200,000"/>
</div>
</div>
</div>
</div>
<!-- Card 2 -->
<div class="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 group transition-all hover:border-primary/20">
<div class="flex flex-col md:flex-row gap-6">
<div class="w-full md:w-48 h-32 rounded-lg bg-surface-container overflow-hidden shrink-0">
<img alt="안방 창문 이미지" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="cozy master bedroom with a standard wooden frame window, soft morning light hitting the bed linens" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIFnmVahH4w1riqU6g9kgdNCTJezpwcS3VG3zFyxgLsHYYc6ZrI7PI3eV-srQEHIJ8tY7oT0hy35ExnfTtePeQW76DZkQhur3Zg1Ep0trAV159Dgfr0LcJGDlOj7ftXFi3nLPkqNysOy52bxJ1seM7Ot23Bdbi_56IH7uYId8oiMUZlyHKpYZJ06YmhxIZA74fb8gJOgwnb6cBZNT_aBFRgDaw2JqHZ1xFQWAWkuEXrTD9pEvE8-LVAUfva9n1woAMXRvrKFF6cp0g"/>
</div>
<div class="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4">
<div class="col-span-2">
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">위치 / 유형</label>
<div class="flex gap-2">
<input class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full focus:ring-1 focus:ring-primary/30" type="text" value="안방 창문"/>
</div>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">구조</label>
<select class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full">
<option>2짝 1:1</option>
<option>3짝 1:2:1</option>
</select>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">단창/이중창</label>
<select class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full">
<option>이중창</option>
<option>단창</option>
</select>
</div>
<div class="col-span-2">
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">추가 서비스</label>
<div class="flex flex-wrap gap-2">
<span class="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-[11px] font-bold rounded flex items-center gap-1">
                                                + 서비스 선택
                                            </span>
</div>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">수량</label>
<input class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full" type="number" value="1"/>
</div>
<div>
<label class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">금액</label>
<input class="bg-surface-container-low border-none rounded-md px-3 py-2 text-sm font-bold w-full text-right" type="text" value="2,100,000"/>
</div>
</div>
</div>
</div>
</div>
</section>
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
<!-- 본문 4영역: 금액 조정 -->
<section class="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm self-start">
<h3 class="text-lg font-extrabold mb-6 flex items-center gap-2">
<span class="w-1.5 h-6 bg-tertiary rounded-full"></span>
                            추가 / 할인 조정
                        </h3>
<div class="space-y-4">
<div class="flex gap-4">
<label class="flex-1">
<input checked="" class="hidden peer" name="adjustment" type="radio"/>
<div class="text-center py-2 rounded-md border-2 border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary/5 font-bold text-sm cursor-pointer">추가 (+)</div>
</label>
<label class="flex-1">
<input class="hidden peer" name="adjustment" type="radio"/>
<div class="text-center py-2 rounded-md border-2 border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary/5 font-bold text-sm cursor-pointer">할인 (-)</div>
</label>
</div>
<div>
<label class="text-xs font-bold text-on-surface-variant mb-1 block">조정 금액</label>
<div class="relative">
<input class="w-full bg-surface-container-low border-none rounded-md py-3 px-4 font-manrope font-bold text-right pr-12" placeholder="금액 입력" type="text" value="1,250,000"/>
<span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm">원</span>
</div>
</div>
<div>
<label class="text-xs font-bold text-on-surface-variant mb-1 block">조정 사유</label>
<textarea class="w-full bg-surface-container-low border-none rounded-md py-3 px-4 text-sm min-h-[100px] resize-none" placeholder="조정 사유를 입력하세요.">실측 결과 및 거실 패브릭씰러 상위 옵션 적용으로 인한 자재비 추가</textarea>
</div>
</div>
</section>
<!-- 본문 5영역: 합계 -->
<section class="bg-gradient-to-br from-inverse-surface to-slate-800 text-white rounded-xl p-8 shadow-2xl">
<h3 class="text-lg font-extrabold mb-8 flex items-center gap-2">
<span class="w-1.5 h-6 bg-primary-fixed rounded-full"></span>
                            최종 견적 요약
                        </h3>
<div class="space-y-6">
<div class="flex justify-between items-center text-slate-400">
<span class="text-sm">셀프견적 금액</span>
<span class="font-manrope font-medium">7,200,000원</span>
</div>
<div class="flex justify-between items-center text-slate-400">
<span class="text-sm">관리자 수정 (추가)</span>
<span class="font-manrope font-medium text-blue-400">+ 1,250,000원</span>
</div>
<div class="h-[1px] bg-white/10 my-2"></div>
<div class="space-y-1">
<div class="flex justify-between items-end">
<span class="text-sm font-bold text-slate-300">최종 예상 견적가</span>
<span class="text-4xl font-manrope font-black tracking-tighter text-white">8,450,000<span class="text-lg ml-1">원</span></span>
</div>
<p class="text-[11px] text-slate-500 text-right uppercase tracking-widest font-bold">Inc. VAT &amp; Installation fee</p>
</div>
<div class="pt-6">
<div class="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3">
<span class="material-symbols-outlined text-blue-400 text-[20px]">info</span>
<p class="text-xs text-slate-400 leading-relaxed">상기 금액은 실측 데이터 기반으로 산정되었으며, 현장 상황에 따라 시공 시 일부 변경될 수 있습니다.</p>
</div>
</div>
</div>
</section>
</div>
</div>
</div>
</main>
<!-- FAB (Suppressed on Details according to rules, but present for contextual action if needed as 'Quick Memo') -->
<!-- Rule says suppress on Details. So we leave it out or keep it hidden. -->
</body></html>