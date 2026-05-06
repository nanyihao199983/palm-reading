/* ============================================================
   AI 手相分析 H5 - app.js
   前端模拟版：可替换 analyzeImage() 中的逻辑接入真实 AI API
   ============================================================ */

// ---------- 页面路由 ----------
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ---------- 星星背景 ----------
(function generateStars() {
  const container = document.querySelector('.stars');
  if (!container) return;
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:rgba(255,255,255,${Math.random() * 0.7 + 0.2});
      top:${Math.random() * 100}%;
      left:${Math.random() * 100}%;
      animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
      animation-delay:${Math.random() * 4}s;
    `;
    container.appendChild(star);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes twinkle{0%,100%{opacity:.3}50%{opacity:1}}`;
  document.head.appendChild(style);
})();

// ---------- 图片上传处理 ----------
let uploadedImageData = null;

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImageData = e.target.result;

    const previewImg = document.getElementById('preview-img');
    previewImg.src = uploadedImageData;
    previewImg.style.display = 'block';

    const placeholder = document.getElementById('upload-placeholder');
    placeholder.style.display = 'none';

    const uploadArea = document.getElementById('upload-area');
    uploadArea.classList.add('has-image');

    const analyzeSection = document.getElementById('analyze-section');
    analyzeSection.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ---------- 开始分析 ----------
function startAnalysis() {
  if (!uploadedImageData) {
    showToast('请先上传手掌照片');
    return;
  }

  goPage('page-loading');

  const loadingImg = document.getElementById('loading-img');
  loadingImg.src = uploadedImageData;

  runLoadingAnimation().then(() => {
    // 分析完成后生成结果
    const result = generatePalmResult();
    renderResult(result);
    goPage('page-unlock');
  });
}

// ---------- 加载动画 ----------
function runLoadingAnimation() {
  return new Promise((resolve) => {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const durations = [1200, 2000, 3200, 4500]; // ms when each step activates
    const totalDuration = 5500;

    const bar = document.getElementById('loading-bar');
    const pct = document.getElementById('loading-pct');

    let start = null;
    function animFrame(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / totalDuration, 1);

      const eased = easeInOutCubic(progress);
      bar.style.width = (eased * 100) + '%';
      pct.textContent = Math.round(eased * 100) + '%';

      steps.forEach((id, idx) => {
        const el = document.getElementById(id);
        const activateAt = durations[idx];
        const doneAt = idx < steps.length - 1 ? durations[idx + 1] : totalDuration;
        if (elapsed >= activateAt && elapsed < doneAt) {
          el.className = 'step active';
        } else if (elapsed >= doneAt) {
          el.className = 'step done';
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animFrame);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(animFrame);
  });
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ---------- 转发计数 ----------
let shareCount = 0;
const REQUIRED_SHARES = 3;

function confirmShare() {
  if (shareCount >= REQUIRED_SHARES) return;
  shareCount++;

  const dots = ['dot-1', 'dot-2', 'dot-3'];
  document.getElementById(dots[shareCount - 1]).classList.add('filled');

  document.getElementById('share-count').textContent = shareCount;
  document.getElementById('btn-count').textContent = shareCount;

  if (shareCount >= REQUIRED_SHARES) {
    document.getElementById('share-step-1').classList.add('done');
    document.getElementById('share-step-2').classList.add('done');
    showToast('✅ 分享成功！正在解锁你的报告...');
    setTimeout(() => goPage('page-result'), 1200);
  } else {
    showToast(`已确认 ${shareCount}/3 次，还需转发 ${REQUIRED_SHARES - shareCount} 个群组`);
  }
}

function showShareGuide() {
  const guide = document.getElementById('wechat-share-guide');
  guide.style.display = 'block';
  setTimeout(() => guide.style.display = 'none', 3500);
}

// ---------- 结果渲染 ----------
function renderResult(result) {
  // 日期
  const now = new Date();
  document.getElementById('result-date').textContent =
    `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 生成`;

  // 分数
  document.getElementById('score-num').textContent = result.overallScore;

  setTimeout(() => {
    document.getElementById('bar-love').style.width = result.scores.love + '%';
    document.getElementById('bar-career').style.width = result.scores.career + '%';
    document.getElementById('bar-money').style.width = result.scores.money + '%';
    document.getElementById('bar-health').style.width = result.scores.health + '%';
    document.getElementById('txt-love').textContent = result.scores.love;
    document.getElementById('txt-career').textContent = result.scores.career;
    document.getElementById('txt-money').textContent = result.scores.money;
    document.getElementById('txt-health').textContent = result.scores.health;
  }, 300);

  // 掌纹
  const palmContent = document.getElementById('palm-lines-content');
  palmContent.innerHTML = result.palmLines.map(line => `
    <div class="palm-line-item">
      <div class="palm-line-name">${line.name}</div>
      <div class="palm-line-desc">${line.desc}</div>
    </div>
  `).join('');

  // 近期运势
  const fortuneContent = document.getElementById('fortune-content');
  fortuneContent.innerHTML = result.fortune.map(f => `
    <div class="fortune-period">
      <strong>${f.period}</strong>
      <span>${f.desc}</span>
    </div>
  `).join('');

  // 开运建议
  const luckyContent = document.getElementById('lucky-content');
  luckyContent.innerHTML = result.lucky.map(l => `
    <div class="lucky-item">
      <span class="lucky-icon">${l.icon}</span>
      <div class="lucky-text">
        <strong>${l.title}</strong>
        <p>${l.desc}</p>
      </div>
    </div>
  `).join('');
}

// ============================================================
// ✨ AI 分析提示词 & 结果生成器
// 真实接入 AI 时：将 generatePalmResult() 替换为 API 调用
// 下方展示完整提示词模板供参考
// ============================================================

/* -------------------------------------------------------
   [系统提示词 System Prompt - 发给 AI 模型]
   -------------------------------------------------------
   你是一位精通中国传统手相学与现代心理分析的资深命理师，
   拥有30年手相解读经验，同时具备丰富的心理学与东方玄学知识。

   你的任务是通过分析用户提供的手掌图像，提供一份专业、
   有温度、个性化的手相分析报告。

   ## 分析维度
   请从以下维度进行分析：
   1. **生命线**（Life Line）：健康状况、生命力、体质、重大人生转折
   2. **感情线**（Heart Line）：感情状态、恋爱运、婚姻走向、人际关系
   3. **智慧线**（Head Line）：思维方式、决策能力、事业倾向
   4. **事业线**（Fate Line）：事业发展、财富积累、人生方向
   5. **太阳线**（Sun Line，如可见）：名誉、成就感、社会认可
   6. **财运纹**：整体财运走向、偏财正财
   7. **掌丘分析**：金星丘、木星丘等主要掌丘的饱满程度

   ## 输出格式（严格按 JSON 返回）
   {
     "overallScore": <60-95的整数>,
     "scores": {
       "love": <50-95>,
       "career": <50-95>,
       "money": <50-95>,
       "health": <50-95>
     },
     "palmLines": [
       {"name": "线名 + emoji", "desc": "100-150字详细解读"},
       ...（至少4条）
     ],
     "fortune": [
       {"period": "近1个月", "desc": "60-80字运势预测"},
       {"period": "近3个月", "desc": "60-80字运势预测"},
       {"period": "今年下半年", "desc": "60-80字运势预测"}
     ],
     "lucky": [
       {"icon": "emoji", "title": "开运方向", "desc": "40-60字具体建议"},
       ...（4条）
     ]
   }

   ## 风格要求
   - 语言温暖、有诗意，带有东方神秘感
   - 积极正向为主，即使有挑战也要给出希望和建议
   - 个性化表达，避免通用模板感
   - 数据分析与感性描述兼顾
   - 字数适中，不要过于简短或啰嗦

   [用户提示词 User Prompt]
   请分析以下手掌图像：[附上图片]
   用户信息（可选）：{birthYear}年生，{gender}
   -------------------------------------------------------
*/

// ---------- 本地模拟数据（接入真实AI前使用）----------
const PALM_DATA_POOL = {
  love: [
    {
      highScore: true,
      desc: "你的感情线深刻而绵长，弧度优美，起点靠近食指根部，显示你对爱情有着高度的理想和追求。感情线末端分叉，暗示你的感情世界丰富细腻，既渴望深度连接，又保有自我。近期有贵人缘加持，缘分可能在意想不到的场合悄然出现。"
    },
    {
      highScore: false,
      desc: "感情线清晰有力但略显平直，反映你在感情上较为理性，有时因为保护自己而显得疏离。这并非坏事——你懂得在感情中保持清醒。近期建议主动打开心扉，给自己一个新的可能。感情运在下半年有明显提升。"
    }
  ],
  career: [
    {
      desc: "事业线由手腕延伸至中指根部，线条清晰坚定，是事业运极佳的标志。你天生具有领导气质，在职场中容易获得上级赏识。线中段有细小支线向上，预示着近期将有重要的晋升或转型机遇，把握住每一个展示自我的机会。"
    },
    {
      desc: "你的智慧线倾斜角度适中，向月丘延伸，表明你兼具逻辑思维与创意直觉，非常适合需要创新思考的领域。事业线虽然起点稍晚，但后劲强劲，三十岁以后将迎来事业的真正腾飞，厚积薄发是你的命格特质。"
    }
  ],
  life: [
    {
      desc: "生命线宽阔且深刻，围绕金星丘形成优美弧度，显示你拥有充沛的生命能量和旺盛的体质。线条中段略有横纹，提示中年阶段需注意作息规律，避免因过度劳累而损耗精气。整体而言你的健康基础扎实，善加保养可享长寿之福。"
    }
  ],
  sun: [
    {
      desc: "手掌上可见隐约的太阳线，从掌心延伸至无名指下方，这是贵人运与名誉运的象征。虽然线条尚不明显，但预示着你在特定领域有获得公众认可的潜力。随着人生阅历的积累，这条线将愈发清晰，名声与成就将在中年后水到渠成。"
    }
  ],
  money: [
    {
      desc: "食指与中指间可见一两条细小的财帛纹，加之金星丘饱满充盈，整体财运格局不俗。你的财富积累方式更偏向于稳健型，正财运旺，适合通过专业技能或副业积累财富。今年下半年财运有明显上升趋势，有望实现一定的财务突破。"
    }
  ]
};

function generatePalmResult() {
  const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const loveScore = r(68, 93);
  const careerScore = r(70, 92);
  const moneyScore = r(65, 90);
  const healthScore = r(72, 94);
  const overallScore = Math.round((loveScore + careerScore + moneyScore + healthScore) / 4);

  return {
    overallScore,
    scores: { love: loveScore, career: careerScore, money: moneyScore, health: healthScore },
    palmLines: [
      {
        name: "❤️ 感情线",
        desc: pick(PALM_DATA_POOL.love).desc
      },
      {
        name: "💼 事业线 / 智慧线",
        desc: pick(PALM_DATA_POOL.career).desc
      },
      {
        name: "💚 生命线",
        desc: pick(PALM_DATA_POOL.life).desc
      },
      {
        name: "☀️ 太阳线 / 贵人运",
        desc: pick(PALM_DATA_POOL.sun).desc
      },
      {
        name: "💰 财帛纹",
        desc: pick(PALM_DATA_POOL.money).desc
      }
    ],
    fortune: [
      {
        period: "📅 近1个月",
        desc: pick([
          "近期运势呈上升曲线，特别是人际关系方面有明显的转机。工作上会遇到一个需要你挺身而出的时机，勇敢表达想法，机遇往往藏在挑战之中。注意避免在小事上消耗精力。",
          "本月整体运势平稳中见惊喜。情感方面可能有意外相遇或关系升温；财务上避免冲动消费，但有一笔意外收入的可能。健康注意颈椎和睡眠质量。"
        ])
      },
      {
        period: "📆 近3个月",
        desc: pick([
          "这三个月是你的潜伏蓄力期，看似平静的水面下暗流涌动。人脉资源将在这段时间默默积累，到季末会有一个重要的展示舞台出现。感情上有望进入新阶段或与旧识重逢。",
          "事业线在近三个月内有明显向上的趋势，可能迎来职位调整或项目突破。感情运在第二个月达到高峰，单身者可主动出击。财运先平后升，下旬有进账。"
        ])
      },
      {
        period: "🗓️ 今年下半年",
        desc: pick([
          "下半年是你命格中重要的积累期。事业上的努力将开始产生可见的回报，财运稳中有升，适合考虑中长期投资规划。感情上需要更多的真诚投入。整体而言是蜕变成长的关键半年。",
          "今年下半年你的整体运势进入正循环。太阳线隐约可见，说明你的努力将逐渐获得他人认可，名誉运上升。在人生的某个决策点上，跟随直觉将比理性分析更能带你走向正途。"
        ])
      }
    ],
    lucky: [
      {
        icon: "🎨",
        title: "幸运颜色",
        desc: pick(["深紫色与金色是你近期的幸运色彩，佩戴或穿着可增强气场，在重要场合能给你带来额外的自信与好运。", "靛蓝色与米白色能平衡你的能量场，适合在需要集中注意力或重要谈判时佩戴使用。"])
      },
      {
        icon: "🧭",
        title: "开运方位",
        desc: pick(["近期东南方向对你最为有利，适合在此方位办公或就寝时头朝此方向，有助于招财纳福、贵人运加持。", "北方与西方是你的财气方位，家中在此方向摆放绿植或水晶球，有助于激活财运场域。"])
      },
      {
        icon: "💎",
        title: "护身宝石",
        desc: pick(["紫水晶与月光石适合你现阶段随身携带，前者增强智慧与直觉，后者助力感情运，两者相辅相成。", "黄水晶或黄金饰品能有效提升你的财运磁场，在重要商谈或求职时佩戴效果尤为显著。"])
      },
      {
        icon: "🌿",
        title: "日常宜忌",
        desc: pick(["近期宜多接触自然，户外活动能为你补充生命能量。宜在清晨冥想5分钟，整理思绪。忌与负能量人群过多相处，保护自己的精神场域。", "近期宜主动拓展社交圈，与志同道合的朋友交流能激发新机遇。饮食上多补充坚果类食物，有益心智清明与判断力。"])
      }
    ]
  };
}

// ---------- 计算器逻辑 ----------
let calcState = {
  screen: '0',
  sub: '',
  waitingOperand: false,
  operator: null,
  prevValue: null,
  shouldReset: false
};

function calcAction(type, val) {
  const screen = document.getElementById('calc-screen');
  const sub = document.getElementById('calc-sub');

  switch (type) {
    case 'num':
      if (calcState.screen === '0' || calcState.shouldReset) {
        calcState.screen = val;
        calcState.shouldReset = false;
      } else {
        if (calcState.screen.length < 12) calcState.screen += val;
      }
      break;

    case 'dot':
      if (calcState.shouldReset) { calcState.screen = '0.'; calcState.shouldReset = false; }
      else if (!calcState.screen.includes('.')) calcState.screen += '.';
      break;

    case 'clear':
      calcState = { screen: '0', sub: '', waitingOperand: false, operator: null, prevValue: null, shouldReset: false };
      break;

    case 'plusminus':
      if (calcState.screen !== '0') {
        calcState.screen = calcState.screen.startsWith('-')
          ? calcState.screen.slice(1)
          : '-' + calcState.screen;
      }
      break;

    case 'percent':
      calcState.screen = String(parseFloat(calcState.screen) / 100);
      break;

    case 'op':
      if (calcState.operator && calcState.prevValue !== null && !calcState.shouldReset) {
        const result = calculate(calcState.prevValue, parseFloat(calcState.screen), calcState.operator);
        calcState.screen = formatCalcResult(result);
        calcState.sub = `${formatCalcResult(calcState.prevValue)} ${calcState.operator} ${formatCalcResult(parseFloat(calcState.screen))} =`;
        calcState.prevValue = result;
      } else {
        calcState.prevValue = parseFloat(calcState.screen);
      }
      calcState.operator = val;
      calcState.sub = `${formatCalcResult(calcState.prevValue)} ${val}`;
      calcState.shouldReset = true;
      break;

    case 'equal':
      if (calcState.operator !== null && calcState.prevValue !== null) {
        const result = calculate(calcState.prevValue, parseFloat(calcState.screen), calcState.operator);
        calcState.sub = `${formatCalcResult(calcState.prevValue)} ${calcState.operator} ${formatCalcResult(parseFloat(calcState.screen))} =`;
        calcState.screen = formatCalcResult(result);
        calcState.operator = null;
        calcState.prevValue = null;
        calcState.shouldReset = true;
      }
      break;
  }

  screen.textContent = calcState.screen;
  sub.textContent = calcState.sub;
}

function calculate(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : 0;
    default: return b;
  }
}

function formatCalcResult(num) {
  if (Number.isInteger(num)) return String(num);
  const s = num.toPrecision(10);
  return parseFloat(s).toString();
}

// ---------- Toast ----------
function showToast(msg, duration = 2200) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', duration);
}
