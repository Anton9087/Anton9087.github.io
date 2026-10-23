(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var plural = function (n, one, few, many) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
    return many;
  };
  var svg = function (d, cls) { return '<svg class="i ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  var I = {
    arrow: svg("M4 12h15M13 6l6 6-6 6", "i-arrow"),
    ext: svg("M7 17L17 7M9 7h8v8"),
    doc: svg("M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6"),
    deck: svg("M3 4h18v12H3zM12 16v4M8 20h8"),
    down: svg("M12 4v11M7 10l5 5 5-5M5 20h14"),
    zoom: svg("M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8M10.5 8v5M8 10.5h5"),
    check: svg("M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6zM8.5 12l2.5 2.5 4.5-5"),
    info: svg("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.5"),
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };
  var goal = function (name) {
    try { if (window.ym && SITE.metrikaId) window.ym(SITE.metrikaId, "reachGoal", name); } catch (e) {}
  };
  var isExt = function (href) { return /^https?:/i.test(href); };
  var pagesWord = function (n) { return n + " " + plural(n, "страница", "страницы", "страниц"); };
  var slidesWord = function (n) { return n + " " + plural(n, "слайд", "слайда", "слайдов"); };
  var hasPages = function (m) { return !!(m && m.view && m.pages > 0); };
  var pageSrc = function (m, k) { return m.view + "/" + pad(k) + ".webp"; };
  var focusables = function (box) {
    return $$('a[href],button:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])', box)
      .filter(function (el) { return el.offsetWidth || el.offsetHeight || el.getClientRects().length; });
  };
  var trapTab = function (e, box) {
    var f = focusables(box); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  var swipe = function (el, onLeft, onRight) {
    var x0 = null, y0 = 0;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) onLeft(); else onRight(); }
    }, { passive: true });
  };
  var downloadBtn = function (m, label, cls) {
    return '<a class="pill-btn ' + (cls || "") + '" href="' + esc(m.file) + '" download="' + esc(m.download || "") + '" data-goal="download">' + I.down + esc(label) + "</a>";
  };
  var openBtn = function (m, cls) {
    return '<a class="pill-btn ' + (cls || "") + '" href="' + esc(m.file) + '" target="_blank" rel="noopener" data-goal="pdf_open">' + I.ext + "Открыть PDF</a>";
  };

  /* ================= CASES ================= */
  // Обложка: либо путь к картинке, либо объект {bg, fg, sub, label, big, cap, shot, shotBg}
  var arrowBig = '<svg viewBox="0 0 60 24" aria-hidden="true"><path d="M2 12h52M44 3l10 9-10 9"/></svg>';
  function coverHTML(c, lazy, num) {
    var ld = lazy ? ' loading="lazy"' : "";
    if (typeof c === "string") return '<img class="cv-img" src="' + esc(c) + '" alt=""' + ld + ">";
    return '<span class="cv" style="--cb:' + esc(c.bg) + ";--cf:" + esc(c.fg) + ";--cs:" + esc(c.sub) + ";--sb:" + esc(c.shotBg || "#fff") + '">' +
      '<span class="cv-l">' + esc(c.label || num || "") + "</span>" +
      '<span class="cv-b">' + esc(c.big).replace(/\s*→\s*/g, arrowBig) + "</span>" +
      '<span class="cv-c">' + esc(c.cap).replace(/\n/g, "<br>") + "</span>" +
      (c.shot ? '<span class="cv-s"><img src="' + esc(c.shot) + '" alt=""' + ld + ' decoding="async"></span>' : "") +
      "</span>";
  }
  var list = $("#cases-list");
  list.innerHTML = PROJECTS.map(function (p, idx) {
    var acts = '<button class="pill-btn fill sm" type="button" data-open="' + p.id + '" data-tab="info">Подробнее' + I.arrow + "</button>";
    if (p.doc) acts += '<button class="pill-btn sm" type="button" data-open="' + p.id + '" data-tab="doc">' + I.doc + esc(p.doc.label || "Документ") + "</button>";
    if (p.deck) acts += '<button class="pill-btn sm" type="button" data-open="' + p.id + '" data-tab="deck">' + I.deck + "Презентация</button>";
    (p.links || []).forEach(function (l) {
      acts += '<a class="ext-link" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + I.ext + "</a>";
    });
    return '<article class="case rv" id="case-' + esc(p.id) + '">' +
      '<button class="case-cover" type="button" data-open="' + p.id + '" data-tab="info" aria-label="Подробнее о кейсе: ' + esc(p.title) + '">' +
        coverHTML(p.cover, true, pad(idx + 1) + " / " + pad(PROJECTS.length)) + '<span class="peek">Подробнее' + I.arrow + "</span></button>" +
      '<div class="case-body">' +
        '<p class="case-meta"><span>' + esc(p.kicker) + "</span>" + (p.year ? "<span>" + esc(p.year) + "</span>" : "") + "</p>" +
        "<h3>" + esc(p.title) + "</h3>" +
        '<p class="case-role">' + esc(p.role) + "</p>" +
        '<p class="case-sum">' + esc(p.summary) + "</p>" +
        '<div class="case-stats">' + p.stats.map(function (s) { return "<div><b>" + esc(s.value) + "</b><span>" + esc(s.label) + "</span></div>"; }).join("") + "</div>" +
        '<p class="case-res"><b>Результат</b>' + esc(p.result) + "</p>" +
        '<div class="case-actions">' + acts + "</div>" +
      "</div></article>";
  }).join("");

  /* ================= CASE VIEWER ================= */
  var modal = $("#modal"), mBox = $(".modal-box", modal), mScroll = $("#m-scroll"), mTabs = $("#m-tabs"), mActions = $("#m-actions");
  var cur = null, curTab = "info", slide = 1, lastFocus = null, pushed = false;
  var isOpen = function () { return modal.classList.contains("open"); };

  function renderHead(p) {
    $("#m-kicker").textContent = p.kicker + (p.year ? " · " + p.year : "");
    $("#m-title").textContent = p.title;
    var t = [["info", "Описание", ""]];
    if (p.doc) t.push(["doc", p.doc.label || "Документ", hasPages(p.doc) ? pagesWord(p.doc.pages) : "PDF"]);
    if (p.deck) t.push(["deck", "Презентация", hasPages(p.deck) ? slidesWord(p.deck.pages) : "PDF"]);
    mTabs.innerHTML = t.map(function (x) {
      return '<button class="tab" type="button" role="tab" id="tab-' + x[0] + '" data-tab="' + x[0] + '" aria-controls="m-scroll" aria-selected="false">' +
        esc(x[1]) + (x[2] ? "<small>" + esc(x[2]) + "</small>" : "") + "</button>";
    }).join("");
  }

  function panelInfo(p) {
    var mats = "";
    if (p.doc) mats += '<button class="mat-row" type="button" data-goto="doc">' + I.doc + "<span>" + esc(p.doc.label || "Документ кейса") + "<small>" + (hasPages(p.doc) ? pagesWord(p.doc.pages) + ", " : "") + "можно скачать в PDF</small></span>" + I.arrow + "</button>";
    if (p.deck) mats += '<button class="mat-row" type="button" data-goto="deck">' + I.deck + "<span>Презентация<small>" + (hasPages(p.deck) ? slidesWord(p.deck.pages) + ", " : "") + "можно скачать в PDF</small></span>" + I.arrow + "</button>";
    (p.links || []).forEach(function (l) {
      mats += '<a class="mat-row" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + I.ext + "<span>" + esc(l.label) + "<small>" + esc(l.href.replace(/^https?:\/\//, "")) + "</small></span>" + I.ext + "</a>";
    });
    return '<div class="pi">' +
      '<div class="pi-main">' +
        '<p class="pi-sub">' + esc(p.summary) + "</p>" +
        '<div class="m-stats">' + p.stats.map(function (s) { return "<div><b>" + esc(s.value) + "</b><span>" + esc(s.label) + "</span></div>"; }).join("") + "</div>" +
        "<h4>Задача</h4><p>" + esc(p.task) + "</p>" +
        "<h4>Что сделал</h4><ul>" + p.did.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" +
        '<h4>Результат</h4><p class="pi-res">' + esc(p.result) + "</p>" +
      "</div>" +
      '<aside class="pi-side">' +
        '<div class="pi-cover">' + coverHTML(p.cover, false, pad(PROJECTS.indexOf(p) + 1) + " / " + pad(PROJECTS.length)) + "</div>" +
        '<dl class="pi-facts"><div><dt>Роль</dt><dd>' + esc(p.role) + "</dd></div>" +
          (p.year ? "<div><dt>Год</dt><dd>" + esc(p.year) + "</dd></div>" : "") +
          '<div><dt>Инструменты и методы</dt><dd class="pi-tags">' + (p.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</dd></div></dl>" +
        (mats ? '<div class="mat"><p class="mat-title">Материалы</p>' + mats + "</div>" : "") +
      "</aside></div>";
  }

  function panelDoc(p) {
    var d = p.doc;
    if (!hasPages(d)) {
      return '<iframe class="pdf-frame" src="' + esc(d.file) + '" title="' + esc(d.label || "Документ") + '"></iframe>' +
        '<div class="panel-foot">' + downloadBtn(d, "Скачать PDF", "fill sm") + openBtn(d, "sm") + "</div>";
    }
    var h = '<div class="pages">';
    for (var k = 1; k <= d.pages; k++) {
      h += '<figure class="page"><img src="' + esc(pageSrc(d, k)) + '" alt="' + esc(p.title) + ", страница " + k + " из " + d.pages + '" width="1100" height="1556"' + (k > 2 ? ' loading="lazy"' : "") + " decoding=\"async\"><figcaption>" + k + " / " + d.pages + "</figcaption></figure>";
    }
    return h + '</div><div class="panel-foot">' + downloadBtn(d, "Скачать PDF", "fill sm") + openBtn(d, "sm") + "</div>";
  }

  function panelDeck(p) {
    var d = p.deck;
    if (!hasPages(d)) {
      return '<iframe class="pdf-frame" src="' + esc(d.file) + '" title="Презентация"></iframe>' +
        '<div class="panel-foot">' + downloadBtn(d, "Скачать PDF", "fill sm") + openBtn(d, "sm") + "</div>";
    }
    var th = "";
    for (var k = 1; k <= d.pages; k++) {
      th += '<button class="thumb" type="button" data-slide="' + k + '" aria-label="Слайд ' + k + '"><img src="' + esc(pageSrc(d, k)) + '" alt="" loading="lazy" decoding="async"></button>';
    }
    return '<div class="deck"><div class="deck-in">' +
      '<div class="stage" id="stage"><img id="slide-img" alt="" width="1600" height="900">' +
        '<button class="s-nav prev" type="button" data-step="-1" aria-label="Предыдущий слайд">' + I.prev + "</button>" +
        '<button class="s-nav next" type="button" data-step="1" aria-label="Следующий слайд">' + I.next + "</button></div>" +
      '<div class="deck-bar"><p class="counter" id="counter" aria-live="polite"></p><p class="deck-hint">Листай стрелками или свайпом</p></div>' +
      '<div class="thumbs" id="thumbs">' + th + "</div></div></div>" + slideList(p, d);
  }

  // на телефоне слайды идут лентой, как страницы документа
  function slideList(p, d) {
    var h = '<div class="slide-list">';
    for (var k = 1; k <= d.pages; k++) {
      h += '<figure class="slide-item"><img src="' + esc(pageSrc(d, k)) + '" alt="' + esc(p.title) + ", слайд " + k + " из " + d.pages + '" width="1600" height="900" loading="lazy" decoding="async"><figcaption>' + k + " / " + d.pages + "</figcaption></figure>";
    }
    return h + '</div><div class="panel-foot slide-foot">' + downloadBtn(d, "Скачать PDF", "fill sm") + openBtn(d, "sm") + "</div>";
  }

  function showSlide(k) {
    var d = cur && cur.deck; if (!d || !hasPages(d)) return;
    slide = Math.max(1, Math.min(d.pages, k));
    var img = $("#slide-img"); if (!img) return;
    img.src = pageSrc(d, slide);
    img.alt = cur.title + ", слайд " + slide + " из " + d.pages;
    $("#counter").innerHTML = pad(slide) + " <span>/ " + pad(d.pages) + "</span>";
    $(".s-nav.prev", mScroll).disabled = slide === 1;
    $(".s-nav.next", mScroll).disabled = slide === d.pages;
    var thumbs = $("#thumbs"), active = null;
    $$(".thumb", thumbs).forEach(function (t) {
      var on = +t.dataset.slide === slide; t.setAttribute("aria-current", on ? "true" : "false"); if (on) active = t;
    });
    if (active) thumbs.scrollLeft = active.offsetLeft - thumbs.clientWidth / 2 + active.clientWidth / 2;
    [slide - 1, slide + 1].forEach(function (n) { if (n >= 1 && n <= d.pages) { var im = new Image(); im.src = pageSrc(d, n); } });
  }

  function setTab(tab) {
    var p = cur;
    if ((tab === "doc" && !p.doc) || (tab === "deck" && !p.deck)) tab = "info";
    curTab = tab;
    $$(".tab", mTabs).forEach(function (b) {
      var on = b.dataset.tab === tab;
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    mScroll.setAttribute("aria-labelledby", "tab-" + tab);
    mScroll.setAttribute("role", "tabpanel");
    mScroll.innerHTML = tab === "doc" ? panelDoc(p) : tab === "deck" ? panelDeck(p) : panelInfo(p);
    mScroll.scrollTop = 0;
    var m = tab === "doc" ? p.doc : tab === "deck" ? p.deck : null;
    mActions.innerHTML = m ? downloadBtn(m, "Скачать PDF", "fill") + openBtn(m) : "";
    if (tab === "deck") { showSlide(1); swipe($("#stage"), function () { showSlide(slide + 1); }, function () { showSlide(slide - 1); }); }
    if (tab !== "info") goal(tab + "_" + p.id);
  }

  var caseHash = function (id, tab) { return "#case-" + id + (tab && tab !== "info" ? "-" + tab : ""); };
  var parseHash = function () {
    var m = /^#case-([a-z0-9_]+?)(?:-(doc|deck))?$/i.exec(location.hash);
    if (!m) return null;
    var p = PROJECTS.filter(function (x) { return x.id === m[1]; })[0];
    return p ? { id: p.id, tab: m[2] || "info" } : null;
  };
  var setHash = function (h, push) {
    try { history[push ? "pushState" : "replaceState"]({ modal: true }, "", h); } catch (e) {}
  };

  function openCase(id, tab, how) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var was = isOpen();
    if (!was) lastFocus = document.activeElement;
    if (cur !== p || !was) { cur = p; renderHead(p); }
    setTab(tab || "info");
    if (!was) {
      modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("locked");
      setTimeout(function () { var t = $('.tab[aria-selected="true"]', mTabs); (t || $(".m-x", modal)).focus({ preventScroll: true }); }, 60);
      goal("case_open_" + p.id);
    }
    if (how === "click") { setHash(caseHash(p.id, curTab), !was); if (!was) pushed = true; }
    else if (how !== "history") setHash(caseHash(p.id, curTab), false);
  }
  function hideModal() {
    if (!isOpen()) return;
    modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    setTimeout(function () { if (!isOpen()) mScroll.innerHTML = ""; }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function closeCase() {
    if (pushed) { pushed = false; history.back(); hideModal(); }
    else { hideModal(); setHash(location.pathname + location.search, false); }
  }

  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); openCase(o.dataset.open, o.dataset.tab, "click"); return; }
  });
  mTabs.addEventListener("click", function (e) { var b = e.target.closest(".tab"); if (b) { setTab(b.dataset.tab); setHash(caseHash(cur.id, curTab), false); } });
  modal.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { closeCase(); return; }
    var g = e.target.closest("[data-goto]"); if (g) { setTab(g.dataset.goto); setHash(caseHash(cur.id, curTab), false); return; }
    var st = e.target.closest("[data-step]"); if (st) { showSlide(slide + +st.dataset.step); return; }
    var th = e.target.closest("[data-slide]"); if (th) { showSlide(+th.dataset.slide); }
  });
  window.addEventListener("popstate", function () {
    var h = parseHash();
    if (h) { pushed = false; openCase(h.id, h.tab, "history"); }
    else { pushed = false; hideModal(); }
  });

  /* ================= CERTIFICATES ================= */
  var groupsEl = $("#cert-groups"), order = [];
  groupsEl.innerHTML = CERT_GROUPS.map(function (g) {
    var items = CERTIFICATES.filter(function (c) { return c.group === g.id; });
    if (!items.length) return "";
    return '<div class="cert-group rv"><div class="cg-head"><h3>' + esc(g.title) + "</h3><span>" + items.length + " " + plural(items.length, "сертификат", "сертификата", "сертификатов") + "</span></div>" +
      '<div class="cert-grid">' + items.map(function (c) {
        var i = order.push(c) - 1;
        return '<button class="cert" type="button" data-cert="' + i + '" aria-label="Открыть сертификат: ' + esc(c.issuer + ", " + c.title) + '">' +
          '<span class="cert-img"><img src="' + esc(c.thumb || c.img) + '" alt="" loading="lazy" decoding="async"><span class="cert-zoom">' + I.zoom + "</span></span>" +
          '<span class="cert-body"><span class="cert-issuer"><span>' + esc(c.issuer) + "</span>" + (c.year ? "<span>" + esc(c.year) + "</span>" : "") + "</span>" +
          '<span class="cert-title">' + esc(c.title) + "</span>" +
          (c.verify ? '<span class="cert-ok">' + I.check + "Проверка онлайн</span>" : "") + "</span></button>";
      }).join("") + "</div></div>";
  }).join("");
  var hint = $("#certs-hint");
  if (hint) hint.textContent = order.length + " " + plural(order.length, "сертификат", "сертификата", "сертификатов") + " · нажми, чтобы открыть целиком";

  var lb = $("#lb"), lbBox = $(".lb-box", lb), lbImg = $("#lb-img"), lbIdx = 0, lbFocus = null;
  var lbOpen = function () { return lb.classList.contains("open"); };
  function showCert(i) {
    lbIdx = (i + order.length) % order.length;
    var c = order[lbIdx];
    lbImg.classList.remove("low");
    lbImg.onload = function () { if (lbImg.naturalWidth < 700) lbImg.classList.add("low"); };
    lbImg.src = c.img; lbImg.alt = "Сертификат: " + c.issuer + ", " + c.title;
    $("#lb-issuer").textContent = c.issuer + (c.year ? " · " + c.year : "");
    $("#lb-title").textContent = c.title;
    $("#lb-note").textContent = c.note || "";
    $("#lb-count").textContent = (lbIdx + 1) + " / " + order.length;
    var isPdf = /\.pdf$/i.test(c.file);
    $("#lb-actions").innerHTML =
      (c.verify ? '<a class="pill-btn fill sm" href="' + esc(c.verify) + '" target="_blank" rel="noopener" data-goal="cert_verify">' + I.check + "Проверить подлинность</a>" : "") +
      '<a class="pill-btn sm" href="' + esc(c.file) + '" target="_blank" rel="noopener" data-goal="cert_file">' + I.ext + (isPdf ? "Открыть PDF" : "Открыть файл") + "</a>";
    [lbIdx - 1, lbIdx + 1].forEach(function (n) { var im = new Image(); im.src = order[(n + order.length) % order.length].img; });
  }
  function openCert(i) {
    lbFocus = document.activeElement;
    showCert(i);
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); document.body.classList.add("locked");
    setTimeout(function () { $(".lb-x", lb).focus({ preventScroll: true }); }, 60);
    goal("cert_open");
  }
  function closeCert() {
    lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
    if (!isOpen()) document.body.classList.remove("locked");
    if (lbFocus && lbFocus.focus) lbFocus.focus({ preventScroll: true });
  }
  groupsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-cert]"); if (b) openCert(+b.dataset.cert); });
  lb.addEventListener("click", function (e) {
    if (e.target.closest("[data-lb-close]")) { closeCert(); return; }
    var n = e.target.closest("[data-lb]"); if (n) showCert(lbIdx + +n.dataset.lb);
  });
  swipe($(".lb-stage", lb), function () { showCert(lbIdx + 1); }, function () { showCert(lbIdx - 1); });

  /* ================= KEYBOARD ================= */
  document.addEventListener("keydown", function (e) {
    if (lbOpen()) {
      if (e.key === "Escape") { e.preventDefault(); closeCert(); }
      else if (e.key === "ArrowRight") showCert(lbIdx + 1);
      else if (e.key === "ArrowLeft") showCert(lbIdx - 1);
      else if (e.key === "Tab") trapTab(e, lbBox);
      return;
    }
    if (isOpen()) {
      if (e.key === "Escape") { e.preventDefault(); closeCase(); }
      else if (e.key === "Tab") trapTab(e, mBox);
      else if (curTab === "deck" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault(); showSlide(slide + (e.key === "ArrowRight" ? 1 : -1));
      }
    }
  });

  /* ================= NAV ================= */
  var burger = $("#burger"), menu = $("#menu");
  var setMenu = function (open) {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  };
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("click", function (e) { if (menu.classList.contains("open") && !e.target.closest(".nav")) setMenu(false); });
  var nav = $(".nav");
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  if ("IntersectionObserver" in window) {
    var navLinks = $$("a", menu);
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section, footer").forEach(function (s) { secIO.observe(s); });
  }

  /* ================= REVEAL ================= */
  $$(".stats,.strengths li,.exp-card,.skills>div,.process li,.band,.foot").forEach(function (el) { el.classList.add("rv"); });
  var items = $$(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    items.forEach(function (el, k) { el.style.transitionDelay = (k % 4) * 60 + "ms"; io.observe(el); });
  } else items.forEach(function (el) { el.classList.add("in"); });

  /* ================= GOALS ================= */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-goal]"); if (a) goal(a.dataset.goal);
  });

  /* ================= DEEP LINK ================= */
  var start = parseHash();
  if (start) openCase(start.id, start.tab, "load");

  /* ================= ЯНДЕКС.МЕТРИКА ================= */
  // Подключается, только когда в data.js указан номер счётчика (SITE.metrikaId)
  if (SITE.metrikaId) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(SITE.metrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }
})();
