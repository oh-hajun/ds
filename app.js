// 성경 66권 (개신교 기준) - 순서 고정
const DATA = [
  {
    testament: "구약성경 (39권)",
    sections: [
      { group: "율법서 (5권)", books: ["창세기","출애굽기","레위기","민수기","신명기"] },
      { group: "역사서 (12권)", books: ["여호수아","사사기","룻기","사무엘상","사무엘하","열왕기상","열왕기하","역대상","역대하","에스라","느헤미야","에스더"] },
      { group: "시가서 (5권)", books: ["욥기","시편","잠언","전도서","아가"] },
      { group: "대선지서 (5권)", books: ["이사야","예레미야","예레미야애가","에스겔","다니엘"] },
      { group: "소선지서 (12권)", books: ["호세아","요엘","아모스","오바댜","요나","미가","나훔","하박국","스바냐","학개","스가랴","말라기"] },
    ],
  },
  {
    testament: "신약성경 (27권)",
    sections: [
      { group: "복음서 (4권)", books: ["마태복음","마가복음","누가복음","요한복음"] },
      { group: "역사서 (1권)", books: ["사도행전"] },
      { group: "바울서신 (13권)", books: ["로마서","고린도전서","고린도후서","갈라디아서","에베소서","빌립보서","골로새서","데살로니가전서","데살로니가후서","디모데전서","디모데후서","디도서","빌레몬서"] },
      { group: "공동서신 (8권)", books: ["히브리서","야고보서","베드로전서","베드로후서","요한일서","요한이서","요한삼서","유다서"] },
      { group: "예언서 (1권)", books: ["요한계시록"] },
    ],
  },
];

// book → 고유키(slug) 생성
const slugify = (s) =>
  s.replace(/\s+/g, "")
   .replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g, "")
   .toLowerCase();

// 전체 book 메타 생성(순서 포함)
const BOOKS = [];
DATA.forEach((t, ti) => {
  t.sections.forEach((sec, si) => {
    sec.books.forEach((b, bi) => {
      BOOKS.push({
        name: b,
        slug: slugify(b),
        testament: t.testament,
        group: sec.group,
        order: BOOKS.length + 1,
      });
    });
  });
});

const $nav = document.getElementById("bookNav");
const $page = document.getElementById("page");
const $search = document.getElementById("search");
const $goHome = document.getElementById("goHome");

// LocalStorage key
const storageKey = (bookSlug) => `bible_videos_${bookSlug}`;

// URL: #/book/<slug>
function getRoute() {
  const h = location.hash || "";
  const m = h.match(/^#\/book\/(.+)$/);
  return m ? { type: "book", slug: m[1] } : { type: "home" };
}

function setRouteBook(slug) {
  location.hash = `#/book/${slug}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 유튜브 URL 최소 검증(형식만)
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

function loadLinks(bookSlug) {
  const raw = localStorage.getItem(storageKey(bookSlug));
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLinks(bookSlug, links) {
  localStorage.setItem(storageKey(bookSlug), JSON.stringify(links));
}

function renderNav(filterText = "") {
  const q = filterText.trim();
  const qLower = q.toLowerCase();

  // 활성 slug
  const route = getRoute();
  const activeSlug = route.type === "book" ? route.slug : null;

  let html = "";
  DATA.forEach((t) => {
    html += `<div class="section"><h2>${escapeHtml(t.testament)}</h2>`;
    t.sections.forEach((sec) => {
      // 필터 적용
      const filtered = sec.books.filter((b) => {
        if (!q) return true;
        return b.toLowerCase().includes(qLower);
      });

      if (filtered.length === 0) return;

      html += `<div class="group">
        <div class="group-title">${escapeHtml(sec.group)}</div>
        <div class="book-list">`;

      filtered.forEach((b) => {
        const slug = slugify(b);
        const active = slug === activeSlug ? "active" : "";
        html += `<a class="book-link ${active}" href="#/book/${slug}">${escapeHtml(b)}</a>`;
      });

      html += `</div></div>`;
    });
    html += `</div>`;
  });

  $nav.innerHTML = html;
}

function renderHome() {
  $page.innerHTML = `
    <div class="page-head">
      <div>
        <h3>성경 목록</h3>
        <div class="badges">
          <span class="badge">총 66권</span>
          <span class="badge">권별 유튜브 링크 게시판</span>
          <span class="badge">순서 유지</span>
        </div>
      </div>
    </div>

    <p style="color: var(--muted); margin: 0;">
      좌측 목록에서 성경을 선택하면 해당 권 페이지로 이동한다. 각 페이지에서 유튜브 링크(제목+URL)를 등록한다.
    </p>
  `;
}

function renderBookPage(book) {
  const links = loadLinks(book.slug);

  // 이전/다음
  const idx = BOOKS.findIndex((b) => b.slug === book.slug);
  const prev = idx > 0 ? BOOKS[idx - 1] : null;
  const next = idx < BOOKS.length - 1 ? BOOKS[idx + 1] : null;

  const rows = links.map((it, i) => {
    const title = escapeHtml(it.title || "");
    const url = escapeHtml(it.url || "");
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${title}</td>
        <td><a class="link" href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></td>
        <td>
          <button class="btn" type="button" data-action="delete" data-index="${i}">삭제</button>
        </td>
      </tr>
    `;
  }).join("");

  $page.innerHTML = `
    <div class="page-head">
      <div>
        <h3>${book.order}. ${escapeHtml(book.name)}</h3>
        <div class="badges">
          <span class="badge">${escapeHtml(book.testament)}</span>
          <span class="badge">${escapeHtml(book.group)}</span>
        </div>
      </div>
      <div class="badges">
        ${prev ? `<a class="badge link" href="#/book/${prev.slug}">← 이전: ${escapeHtml(prev.name)}</a>` : `<span class="badge">← 이전 없음</span>`}
        ${next ? `<a class="badge link" href="#/book/${next.slug}">다음: ${escapeHtml(next.name)} →</a>` : `<span class="badge">다음 없음 →</span>`}
      </div>
    </div>

    <h4 style="margin: 0 0 8px;">유튜브 링크 게시판</h4>
    <p style="margin: 0 0 10px; color: var(--muted);">
      제목과 유튜브 URL을 등록하면 이 권의 목록에 저장된다.
    </p>

    <div class="form">
      <input id="vTitle" type="text" placeholder="제목 (예: 창세기 1장 묵상)" />
      <input id="vUrl" type="text" placeholder="유튜브 URL (예: https://www.youtube.com/watch?v=...)" />
      <button id="addBtn" class="btn primary" type="button">등록</button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th style="width:70px;">번호</th>
          <th>제목</th>
          <th>URL</th>
          <th style="width:90px;">관리</th>
        </tr>
      </thead>
      <tbody>
        ${links.length ? rows : `<tr><td colspan="4" style="color: var(--muted);">등록된 링크가 없다.</td></tr>`}
      </tbody>
    </table>

    <div style="display:flex; gap:8px; margin-top: 12px; flex-wrap: wrap;">
      <button id="exportBtn" class="btn" type="button">이 권 링크 내보내기(JSON)</button>
      <button id="clearBtn" class="btn" type="button">이 권 링크 전체 삭제</button>
    </div>

    <pre id="exportBox" style="display:none; white-space: pre-wrap; word-break: break-word; margin-top: 10px; border: 1px solid var(--border); background: rgba(15,22,35,0.65); padding: 12px; border-radius: 12px;"></pre>
  `;

  // 이벤트 바인딩
  document.getElementById("addBtn").addEventListener("click", () => {
    const title = document.getElementById("vTitle").value.trim();
    const url = document.getElementById("vUrl").value.trim();

    if (!title) { alert("제목을 입력해야 한다."); return; }
    if (!url) { alert("URL을 입력해야 한다."); return; }
    if (!isValidUrl(url)) { alert("URL 형식이 올바르지 않다. (http/https)"); return; }

    const newLinks = loadLinks(book.slug);
    newLinks.push({ title, url, createdAt: new Date().toISOString() });
    saveLinks(book.slug, newLinks);

    // 입력 초기화 후 다시 렌더
    setRouteBook(book.slug);
    // hashchange가 이미 같은 해시라면 강제 렌더 필요
    render();
  });

  $page.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const index = Number(btn.dataset.index);

    if (action === "delete") {
      const cur = loadLinks(book.slug);
      if (!Number.isInteger(index) || index < 0 || index >= cur.length) return;
      cur.splice(index, 1);
      saveLinks(book.slug, cur);
      render();
    }
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    const ok = confirm("이 권의 링크를 모두 삭제한다. 계속할까?");
    if (!ok) return;
    saveLinks(book.slug, []);
    render();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const box = document.getElementById("exportBox");
    const cur = loadLinks(book.slug);
    box.style.display = "block";
    box.textContent = JSON.stringify({ book: book.name, slug: book.slug, links: cur }, null, 2);
  });
}

function render() {
  const route = getRoute();
  renderNav($search.value);

  if (route.type === "home") {
    // active 표시 제거용 재렌더
    renderNav($search.value);
    renderHome();
    return;
  }

  const book = BOOKS.find((b) => b.slug === route.slug);
  if (!book) {
    renderHome();
    return;
  }

  renderNav($search.value);
  renderBookPage(book);
}

window.addEventListener("hashchange", render);

$search.addEventListener("input", () => {
  renderNav($search.value);
});

$goHome.addEventListener("click", () => {
  location.hash = "";
  $search.value = "";
  render();
});

// 초기 진입
render();
