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

  const toolItem = toolR.tie ? `${toolR.top.item} · ${toolR.second.item}` : toolR.top.item;
  const kiteItem = kiteR.tie ? `${kiteR.top.item} · ${kiteR.second.item}` : kiteR.top.item;

  document.getElementById('result-headline').textContent = `${toolItem} × ${kiteItem}`;
  document.getElementById('result-sub').textContent = '这就是你的风筝人格';

  document.getElementById('tool-card').innerHTML = renderTraitCards(toolR);
  document.getElementById('kite-card').innerHTML = renderTraitCards(kiteR);

  const easter = [];
  if (!toolR.tie) easter.push(`${toolR.second.item}`);
  if (!kiteR.tie) easter.push(`${kiteR.second.item}`);
  document.getElementById('easter').textContent = easter.length ? `你的隐藏副特质：${easter.join('、')}` : '';

  show('result');
}

function renderTraitCards(r) {
  const list = r.tie ? [r.top, r.second] : [r.top];
  return list.map(t => traitCardHtml(t)).join('');
}

function traitCardHtml(t) {
  return `
    <div class="trait-card" style="--c:${t.color}">
      <div class="trait-top">
        <span class="trait-emoji">${t.emoji}</span>
        <span class="trait-name">${t.item}</span>
        <span class="trait-tagline">${t.tagline}</span>
      </div>
      <div class="trait-desc">${t.result}</div>
    </div>`;
}

// ---------- 海报 ----------
function openPoster() {
  buildPoster();
  show('poster');
}

function buildPoster() {
  const { rates } = computeScores();
  const toolR = decide(TOOLS, rates);
  const kiteR = decide(KITES, rates);

  const toolItem = toolR.tie ? `${toolR.top.item}·${toolR.second.item}` : toolR.top.item;
  const kiteItem = kiteR.tie ? `${kiteR.top.item}·${kiteR.second.item}` : kiteR.top.item;

  const W = 750, H = 1334, S = 2;
  const canvas = document.getElementById('poster-canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  // 背景渐变
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, toolR.top.color);
  g.addColorStop(1, kiteR.top.color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 顶部柔光
  const sheen = ctx.createRadialGradient(W / 2, 80, 20, W / 2, 80, 600);
  sheen.addColorStop(0, 'rgba(255,255,255,0.25)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, 480);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 测试名
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '600 44px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('潍坊风筝人格测试', W / 2, 130);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 26px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('—— 你的人生姿态，藏在一只风筝里', W / 2, 182);

  // 圆形徽章
  const cy = 400;
  ctx.beginPath();
  ctx.arc(W / 2, cy, 150, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();

  ctx.font = '110px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.fillText(toolR.top.emoji, W / 2 - 95, cy + 5);
  ctx.fillText(kiteR.top.emoji, W / 2 + 95, cy + 5);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '300 54px "PingFang SC", sans-serif';
  ctx.fillText('×', W / 2, cy + 5);

  // 主结论
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 76px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`${toolItem} × ${kiteItem}`, W / 2, 640);

  // 定位句
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 34px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`${toolR.top.tagline}，${kiteR.top.tagline}`, W / 2, 780);

  // 关键词标签
  const tags = [...toolR.top.keywords, ...kiteR.top.keywords];
  drawTags(ctx, tags, W / 2, 860);

  // 底部
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '500 30px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('长按保存 · 测测你的风筝人格', W / 2, 1250);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '400 26px "PingFang SC", sans-serif';
  ctx.fillText('kitepersonalities.github.io', W / 2, 1296);

  // 转成图片
  document.getElementById('poster-img').src = canvas.toDataURL('image/png');
}

function drawTags(ctx, tags, cx, cy) {
  const padX = 20, h = 52, gap = 14;
  ctx.font = '500 27px "PingFang SC", "Microsoft YaHei", sans-serif';
  const widths = tags.map(t => ctx.measureText(t).width + padX * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);

  let x = cx - total / 2;
  const y = cy;
  tags.forEach((t, i) => {
    const w = widths[i];
    roundRect(ctx, x, y - h / 2, w, h, h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t, x + w / 2, y + 2);
    x += w + gap;
  });
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
