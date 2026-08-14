// ============ 潍坊风筝人格测试 · 逻辑层 ============

let current = 0;
let answers = new Array(QUESTIONS.length).fill(null);

// ---------- 通用 ----------
function traitByKey(key) {
  return ALL_TRAITS.find(t => t.key === key);
}

function show(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ---------- 答题 ----------
function start() {
  current = 0;
  answers = new Array(QUESTIONS.length).fill(null);
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[current];
  document.getElementById('q-title').textContent = q.title;
  document.getElementById('q-text').textContent = q.text;

  const wrap = document.getElementById('q-options');
  wrap.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.innerHTML = `<span class="opt-key">${opt.key}</span><span class="opt-text">${opt.text}</span>`;
    if (answers[current] === i) btn.classList.add('selected');
    btn.onclick = () => selectOption(i);
    wrap.appendChild(btn);
  });

  document.getElementById('progress-text').textContent = `${current + 1} / ${QUESTIONS.length}`;
  document.getElementById('progress-bar').style.width = `${((current + 1) / QUESTIONS.length) * 100}%`;
  document.getElementById('btn-prev').disabled = current === 0;
  document.getElementById('btn-next').textContent = current === QUESTIONS.length - 1 ? '看结果' : '下一题';
  document.getElementById('btn-next').disabled = answers[current] === null;
}

function selectOption(i) {
  answers[current] = i;
  document.querySelectorAll('#q-options .option').forEach((b, j) => b.classList.toggle('selected', j === i));
  document.getElementById('btn-next').disabled = false;
}

function next() {
  if (answers[current] === null) return;
  if (current < QUESTIONS.length - 1) { current++; renderQuestion(); }
  else { showResult(); }
}

function prev() {
  if (current > 0) { current--; renderQuestion(); }
}

// ---------- 评分 ----------
function computeScores() {
  const raw = {};
  ALL_TRAITS.forEach(t => raw[t.key] = 0);
  QUESTIONS.forEach((q, qi) => {
    const idx = answers[qi];
    if (idx == null) return;
    q.options[idx].traits.forEach(k => raw[k]++);
  });
  const rates = {};
  ALL_TRAITS.forEach(t => rates[t.key] = raw[t.key] / t.count);
  return { raw, rates };
}

function decide(list, rates) {
  const sorted = [...list].sort((a, b) => rates[b.key] - rates[a.key]);
  const top = sorted[0], second = sorted[1];
  const tie = (rates[top.key] - rates[second.key]) <= 0.1;
  return { top, second, tie, rates };
}

// ---------- 结果 ----------
function showResult() {
  const { rates } = computeScores();
  const toolR = decide(TOOLS, rates);
  const kiteR = decide(KITES, rates);

  // 主人格只取最高分（并列也只取一个），副人格 = 第二名
  const toolItem = toolR.top.item;
  const kiteItem = kiteR.top.item;

  // 主视觉：风筝在前，工具在后
  document.getElementById('result-hero').innerHTML = `
    <img src="images/${kiteR.top.img}.webp" alt="${kiteR.top.item}">
    <span class="hero-x">×</span>
    <img src="images/${toolR.top.img}.webp" alt="${toolR.top.item}">`;

  document.getElementById('result-headline').textContent = `${kiteItem} × ${toolItem}`;
  document.getElementById('result-sub').textContent = '这就是你的风筝人格';

  // 风筝（主人格 + 可点击副人格）
  document.getElementById('kite-card').innerHTML = traitCardHtml(kiteR.top);
  document.getElementById('kite-sub').innerHTML = subTraitHtml(kiteR.second, '风筝');

  // 工具（主人格 + 可点击副人格）
  document.getElementById('tool-card').innerHTML = traitCardHtml(toolR.top);
  document.getElementById('tool-sub').innerHTML = subTraitHtml(toolR.second, '工具');

  show('result');
}

function subTraitHtml(t, label) {
  return `
    <div class="sub-trait" style="--c:${t.color}" onclick="toggleSub(this)">
      <div class="sub-trait-head">
        <span class="sub-trait-label">副人格 · ${label}</span>
        <span class="sub-trait-name">${t.item}</span>
        <span class="sub-trait-arrow">▾</span>
      </div>
      <div class="sub-trait-body">${traitCardHtml(t)}</div>
    </div>`;
}

function toggleSub(el) {
  el.classList.toggle('open');
}

function traitCardHtml(t) {
  return `
    <div class="trait-card" style="--c:${t.color}">
      <div class="trait-top">
        <img class="trait-img" src="images/${t.img}.webp" alt="${t.item}">
        <div class="trait-meta">
          <span class="trait-name">${t.item}</span>
          <span class="trait-tagline">${t.tagline}</span>
        </div>
      </div>
      <div class="trait-desc">${t.result}</div>
    </div>`;
}

// ---------- 海报 ----------
function openPoster() {
  buildPoster();
  show('poster');
}

async function buildPoster() {
  const { rates } = computeScores();
  const toolR = decide(TOOLS, rates);
  const kiteR = decide(KITES, rates);

  const toolItem = toolR.top.item;
  const kiteItem = kiteR.top.item;

  const W = 750, H = 1334, S = 2;
  const canvas = document.getElementById('poster-canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  // 加载素材图
  const [toolImg, kiteImg] = await Promise.all([
    loadImg(`images/${toolR.top.img}.webp`),
    loadImg(`images/${kiteR.top.img}.webp`),
  ]);

  // 背景渐变（风筝在前 → 工具）
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, kiteR.top.color);
  g.addColorStop(1, toolR.top.color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 顶部柔光
  const sheen = ctx.createRadialGradient(W / 2, 60, 20, W / 2, 60, 620);
  sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, 500);

  // 大风筝图（主体，居中偏上，向下延伸）
  drawContain(ctx, kiteImg, W / 2, 460, 600);

  // 小工具图（右下点缀）
  drawContain(ctx, toolImg, W * 0.62, 780, 180);

  // 渐变蒙版：让图在文字区域渐隐
  const mask = ctx.createLinearGradient(0, 600, 0, 1140);
  mask.addColorStop(0, 'rgba(0,0,0,0)');
  mask.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = mask;
  ctx.fillRect(0, 600, W, 540);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 测试名
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.font = '600 44px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('潍坊风筝人格测试', W / 2, 128);

  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.font = '400 26px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('—— 你的人生姿态，藏在一只风筝里', W / 2, 182);

  // 主结论（风筝 × 工具，自适应字号）
  const title = `${kiteItem} × ${toolItem}`;
  const ts = fitFont(ctx, title, 70, 660);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, W / 2, 1000);

  // 底部
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '500 30px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('长按保存 · 测测你的风筝人格', W / 2, 1250);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 26px "PingFang SC", sans-serif';
  ctx.fillText('kitepersonalities.github.io', W / 2, 1296);

  // 转成图片
  document.getElementById('poster-img').src = canvas.toDataURL('image/png');
}

function fitFont(ctx, text, baseSize, maxWidth) {
  let size = baseSize;
  ctx.font = `700 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 28) {
    size -= 2;
    ctx.font = `700 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  }
  return size;
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败: ' + src));
    img.src = src;
  });
}

function drawContain(ctx, img, cx, cy, size) {
  const s = Math.min(size / img.width, size / img.height);
  const w = img.width * s;
  const h = img.height * s;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function downloadPoster() {
  const canvas = document.getElementById('poster-canvas');
  const link = document.createElement('a');
  link.download = '我的风筝人格.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start').onclick = start;
  document.getElementById('btn-prev').onclick = prev;
  document.getElementById('btn-next').onclick = next;
  document.getElementById('btn-poster').onclick = openPoster;
  document.getElementById('btn-save').onclick = downloadPoster;
  document.querySelectorAll('.btn-retest').forEach(b => b.onclick = start);
});
