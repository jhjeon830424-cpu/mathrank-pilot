/* =========================================================
   매쓰랭크 (MathRank) — 수학 파일럿
   - 문제: 템플릿 + 난수 생성, 정답은 프로그램이 직접 계산 (LLM 미사용 → 오류 없음)
   - 등급: ELO 스타일 RP(Rating Point) → 티어 매핑 (게임식 승급/강등)
   - 공유: 결과를 카드 이미지로 렌더링 (카톡/SNS 공유용)
   ========================================================= */

/* ---------- 유틸 ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a, b) {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.round((d2 - d1) / 86400000);
}

/* 분수 클래스: 부동소수점 오차 없이 정확한 분수 연산/기약분수 처리 */
class Frac {
  constructor(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    this.n = n / g;
    this.d = d / g;
  }
  add(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { return new Frac(this.n * o.d, this.d * o.n); }
  toDisplay() {
    if (this.d === 1) return `${this.n}`;
    const whole = Math.trunc(this.n / this.d);
    const rem = this.n - whole * this.d;
    if (whole !== 0 && rem !== 0) return `${whole} ${Math.abs(rem)}/${this.d}`;
    return `${this.n}/${this.d}`;
  }
  // 정답 비교용 정규화 문자열 (가분수 기준)
  key() { return `${this.n}/${this.d}`; }
}

function parseFracAnswer(str) {
  str = str.trim().replace(/\s+/g, ' ');
  if (str === '') return null;
  // 대분수 "1 2/3"
  let m = str.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (m) {
    const whole = parseInt(m[1], 10), n = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (d === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return new Frac(sign * (Math.abs(whole) * d + n), d);
  }
  m = str.match(/^(-?\d+)\/(\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10), d = parseInt(m[2], 10);
    if (d === 0) return null;
    return new Frac(n, d);
  }
  m = str.match(/^-?\d+(\.\d+)?$/);
  if (m) {
    if (str.includes('.')) {
      const [ip, fp] = str.split('.');
      const d = Math.pow(10, fp.length);
      return new Frac(parseInt(ip, 10) * d + (parseInt(ip,10) < 0 ? -1 : 1) * parseInt(fp, 10), d);
    }
    return new Frac(parseInt(str, 10), 1);
  }
  return null;
}

/* ---------- 티어 시스템: 별이 자라나는 오리지널 등급 (RP 기준, 인원제한 없음) ---------- */
const START_RATING = 120;
// category별로 이름과 뱃지 이미지를 공유하고, count(1~4)는 뱃지 아래 점 개수로만 구분한다.
const TIER_DEFS = [
  { name: '별사탕', category: 'candy', count: 1, hex: '#ff7aa8' },
  { name: '별사탕', category: 'candy', count: 2, hex: '#ff7aa8' },
  { name: '별사탕', category: 'candy', count: 3, hex: '#ff7aa8' },
  { name: '별사탕', category: 'candy', count: 4, hex: '#ff7aa8' },
  { name: '반짝별', category: 'twinkle', count: 1, hex: '#ffd166' },
  { name: '반짝별', category: 'twinkle', count: 2, hex: '#ffd166' },
  { name: '반짝별', category: 'twinkle', count: 3, hex: '#ffd166' },
  { name: '반짝별', category: 'twinkle', count: 4, hex: '#ffd166' },
  { name: '빛나는별', category: 'shining', count: 1, hex: '#ffb703' },
  { name: '빛나는별', category: 'shining', count: 2, hex: '#ffb703' },
  { name: '빛나는별', category: 'shining', count: 3, hex: '#ffb703' },
  { name: '빛나는별', category: 'shining', count: 4, hex: '#ffb703' },
  { name: '별똥별', category: 'shooting', count: 1, hex: '#4cc9f0' },
  { name: '별똥별', category: 'shooting', count: 2, hex: '#4cc9f0' },
  { name: '별똥별', category: 'shooting', count: 3, hex: '#4cc9f0' },
  { name: '별똥별', category: 'shooting', count: 4, hex: '#4cc9f0' },
  { name: '은하수', category: 'galaxy', count: 1, hex: '#9d4edd' },
  { name: '은하수', category: 'galaxy', count: 2, hex: '#9d4edd' },
  { name: '은하수', category: 'galaxy', count: 3, hex: '#9d4edd' },
  { name: '은하수', category: 'galaxy', count: 4, hex: '#9d4edd' },
  { name: '슈퍼노바', category: 'supernova', count: 1, hex: '#f72585' },
];
const CATEGORY_IMG = {
  candy: 'assets/badge_candy.jpg',
  twinkle: 'assets/badge_twinkle.jpg',
  shining: 'assets/badge_shining.jpg',
  shooting: 'assets/badge_shooting.jpg',
  galaxy: 'assets/badge_galaxy.jpg',
  supernova: 'assets/badge_supernova.jpg',
};
const TIER_STEP = 100; // 티어 1단계당 RP 폭
function tierForRating(rp) {
  const idx = Math.min(Math.floor(rp / TIER_STEP), TIER_DEFS.length - 1);
  const t = TIER_DEFS[Math.max(idx, 0)];
  const floor = idx * TIER_STEP;
  const ceil = idx === TIER_DEFS.length - 1 ? Infinity : floor + TIER_STEP;
  return { ...t, idx, floor, ceil, label: t.name, img: CATEGORY_IMG[t.category] };
}

/* ---------- 문제 템플릿 ---------- */
/* 각 템플릿은 (level) => { category, categoryLabel, question, answerType, check(input), difficulty } 반환 */

const CATS = {
  add_sub: '자연수 덧셈뺄셈',
  mul_div: '자연수 곱셈나눗셈',
  frac_addsub: '분수의 덧셈뺄셈',
  frac_muldiv: '분수의 곱셈나눗셈',
  dec_ops: '소수의 연산',
  gcd_lcm: '약수와 배수',
  ratio_percent: '비와 백분율',
  geometry: '도형',
  average: '평균',
  angle: '각도',
  unit_convert: '단위 변환',
  // 초1~3
  add_sub_9: '한두 자리 덧셈뺄셈',
  compare_order: '수의 비교와 순서',
  counting_picture: '그림 개수 세기',
  clock_hour: '시계 보기',
  add_sub_carry: '두세 자리 덧셈뺄셈',
  mult_table: '곱셈구구',
  length_basic: '길이 재기',
  clock_minute: '시간의 단위',
  pattern_find: '규칙 찾기',
  add_sub_big3: '세네 자리 덧셈뺄셈',
  mul_2digit: '두 자리 곱셈',
  division_basic: '나눗셈',
  fraction_intro: '분수의 기초',
  length_time3: '길이와 시간',
};

function numAnswerCheck(correctVal, tolerance = 0) {
  return (input) => {
    const v = parseFloat(input.trim());
    if (isNaN(v)) return false;
    return Math.abs(v - correctVal) <= tolerance + 1e-9;
  };
}
function fracAnswerCheck(fracAnswer) {
  return (input) => {
    const f = parseFracAnswer(input);
    if (!f) return false;
    return f.n === fracAnswer.n && f.d === fracAnswer.d;
  };
}

const TEMPLATES = {
  add_sub(level) {
    const isAdd = Math.random() < 0.5;
    let a, b, op, ans;
    if (level === 1) { a = randInt(10, 99); b = randInt(10, 99); }
    else if (level === 2) { a = randInt(100, 999); b = randInt(100, 999); }
    else { a = randInt(1000, 9999); b = randInt(100, 9999); }
    if (!isAdd && a < b) [a, b] = [b, a];
    op = isAdd ? '+' : '-';
    ans = isAdd ? a + b : a - b;
    return {
      category: 'add_sub', categoryLabel: CATS.add_sub,
      question: `${a} ${op} ${b} = ?`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 100 + (level - 1) * 300,
    };
  },

  mul_div(level) {
    let a, b, isDiv = Math.random() < 0.5, ans, question;
    if (level === 1) {
      if (isDiv) { b = randInt(2, 9); ans = randInt(2, 12); a = b * ans; question = `${a} ÷ ${b} = ?`; }
      else { a = randInt(2, 9); b = randInt(2, 12); ans = a * b; question = `${a} × ${b} = ?`; }
    } else if (level === 2) {
      if (isDiv) { b = randInt(2, 9); ans = randInt(10, 99); a = b * ans; question = `${a} ÷ ${b} = ?`; }
      else { a = randInt(11, 99); b = randInt(2, 99); ans = a * b; question = `${a} × ${b} = ?`; }
    } else {
      if (isDiv) { b = randInt(2, 12); ans = randInt(20, 200); a = b * ans; question = `${a} ÷ ${b} = ?`; }
      else { a = randInt(12, 99); b = randInt(12, 99); ans = a * b; question = `${a} × ${b} = ?`; }
    }
    return {
      category: 'mul_div', categoryLabel: CATS.mul_div,
      question: `${question}`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 150 + (level - 1) * 300,
    };
  },

  frac_addsub(level) {
    const isAdd = Math.random() < 0.5;
    let f1, f2, question;
    if (level === 1) {
      const d = randInt(3, 9);
      let n1 = randInt(1, d - 1), n2 = randInt(1, d - 1);
      f1 = new Frac(n1, d); f2 = new Frac(n2, d);
      if (!isAdd && f1.sub(f2).n < 0) [f1, f2] = [f2, f1];
    } else if (level === 2) {
      const d1 = randInt(2, 9), d2 = randInt(2, 9);
      f1 = new Frac(randInt(1, d1 - 1 || 1), d1);
      f2 = new Frac(randInt(1, d2 - 1 || 1), d2);
      if (!isAdd) {
        // 뺄셈은 결과 음수 방지
        const fa = f1.sub(f2);
        if (fa.n < 0) [f1, f2] = [f2, f1];
      }
    } else {
      const d1 = randInt(2, 10), d2 = randInt(2, 10);
      const w1 = randInt(1, 3), w2 = randInt(1, 3);
      f1 = new Frac(w1 * d1 + randInt(1, d1 - 1 || 1), d1);
      f2 = new Frac(w2 * d2 + randInt(1, d2 - 1 || 1), d2);
      if (!isAdd) {
        const fa = f1.sub(f2);
        if (fa.n < 0) [f1, f2] = [f2, f1];
      }
    }
    const ans = isAdd ? f1.add(f2) : f1.sub(f2);
    question = `${f1.toDisplay()} ${isAdd ? '+' : '-'} ${f2.toDisplay()} = ?  (기약분수로 입력, 예: 3/4)`;
    return {
      category: 'frac_addsub', categoryLabel: CATS.frac_addsub,
      question, answerType: 'fraction', check: fracAnswerCheck(ans),
      difficulty: 250 + (level - 1) * 300,
    };
  },

  frac_muldiv(level) {
    let f1, f2, isDiv, question, ans;
    if (level === 1) {
      const d = randInt(2, 9);
      f1 = new Frac(randInt(1, d - 1 || 1), d);
      const nat = randInt(2, 6);
      ans = f1.mul(new Frac(nat, 1));
      question = `${f1.toDisplay()} × ${nat} = ?  (기약분수 또는 자연수로 입력)`;
      return { category: 'frac_muldiv', categoryLabel: CATS.frac_muldiv, question, answerType: 'fraction', check: fracAnswerCheck(ans), difficulty: 350 };
    } else if (level === 2) {
      const d1 = randInt(2, 9), d2 = randInt(2, 9);
      f1 = new Frac(randInt(1, d1 - 1 || 1), d1);
      f2 = new Frac(randInt(1, d2 - 1 || 1), d2);
      ans = f1.mul(f2);
      question = `${f1.toDisplay()} × ${f2.toDisplay()} = ?  (기약분수로 입력)`;
      return { category: 'frac_muldiv', categoryLabel: CATS.frac_muldiv, question, answerType: 'fraction', check: fracAnswerCheck(ans), difficulty: 650 };
    } else {
      const d1 = randInt(2, 9), d2 = randInt(2, 9);
      f1 = new Frac(randInt(1, d1 - 1 || 1), d1);
      f2 = new Frac(randInt(1, d2 - 1 || 1), d2);
      ans = f1.div(f2);
      question = `${f1.toDisplay()} ÷ ${f2.toDisplay()} = ?  (기약분수로 입력)`;
      return { category: 'frac_muldiv', categoryLabel: CATS.frac_muldiv, question, answerType: 'fraction', check: fracAnswerCheck(ans), difficulty: 950 };
    }
  },

  dec_ops(level) {
    let a, b, op, ans, question;
    if (level === 1) {
      a = randInt(10, 99) / 10; b = randInt(10, 99) / 10;
      op = Math.random() < 0.5 ? '+' : '-';
      if (op === '-' && a < b) [a, b] = [b, a];
      ans = Math.round((op === '+' ? a + b : a - b) * 10) / 10;
      question = `${a} ${op} ${b} = ?`;
    } else if (level === 2) {
      a = randInt(100, 999) / 100; b = randInt(100, 999) / 100;
      op = Math.random() < 0.5 ? '+' : '-';
      if (op === '-' && a < b) [a, b] = [b, a];
      ans = Math.round((op === '+' ? a + b : a - b) * 100) / 100;
      question = `${a} ${op} ${b} = ?`;
    } else {
      a = randInt(10, 99) / 10; b = randInt(2, 9);
      op = Math.random() < 0.5 ? '×' : '÷';
      if (op === '×') { ans = Math.round(a * b * 100) / 100; }
      else { ans = Math.round((a * b) * 10) / 10; const dividend = ans; question = `${dividend} ÷ ${b} = ?`; ans = a; }
      if (!question) question = `${a} ${op} ${b} = ?`;
    }
    return {
      category: 'dec_ops', categoryLabel: CATS.dec_ops,
      question, answerType: 'number', check: numAnswerCheck(ans, 0.01),
      difficulty: 300 + (level - 1) * 300,
    };
  },

  gcd_lcm(level) {
    const isGcd = Math.random() < 0.5;
    let a, b, ans;
    if (level === 1) { a = randInt(4, 30); b = randInt(4, 30); }
    else if (level === 2) { a = randInt(6, 60); b = randInt(6, 60); }
    else { a = randInt(10, 100); b = randInt(10, 100); }
    ans = isGcd ? gcd(a, b) : lcm(a, b);
    return {
      category: 'gcd_lcm', categoryLabel: CATS.gcd_lcm,
      question: `${a}와 ${b}의 ${isGcd ? '최대공약수' : '최소공배수'}는?`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 400 + (level - 1) * 300,
    };
  },

  ratio_percent(level) {
    if (level === 1) {
      const whole = choice([20, 25, 50, 40, 80, 100]);
      const part = randInt(1, whole - 1);
      const ans = Math.round((part / whole) * 100);
      if ((part / whole) * 100 !== ans) return TEMPLATES.ratio_percent(level);
      return {
        category: 'ratio_percent', categoryLabel: CATS.ratio_percent,
        question: `${whole} 중 ${part}는 몇 %인가요?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 500,
      };
    } else if (level === 2) {
      const whole = choice([200, 300, 400, 500, 600, 800, 1000]);
      const pct = choice([10, 20, 25, 30, 40, 50, 75]);
      const ans = (whole * pct) / 100;
      return {
        category: 'ratio_percent', categoryLabel: CATS.ratio_percent,
        question: `${whole}의 ${pct}%는 얼마인가요?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 750,
      };
    } else {
      const g = randInt(2, 9);
      const a = g * randInt(2, 6), b = g * randInt(2, 6);
      return {
        category: 'ratio_percent', categoryLabel: CATS.ratio_percent,
        question: `${a} : ${b} 를 가장 간단한 자연수의 비로 나타내면 ?:? 입니다. 앞의 수를 입력하세요.`,
        answerType: 'number', check: numAnswerCheck(a / g),
        difficulty: 900,
      };
    }
  },

  geometry(level) {
    if (level === 1) {
      const w = randInt(3, 20), h = randInt(3, 20);
      const askArea = Math.random() < 0.5;
      const ans = askArea ? w * h : 2 * (w + h);
      return {
        category: 'geometry', categoryLabel: CATS.geometry,
        question: `가로 ${w}cm, 세로 ${h}cm인 직사각형의 ${askArea ? '넓이(cm²)' : '둘레(cm)'}는?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 200,
      };
    } else if (level === 2) {
      let base = randInt(4, 20), height;
      height = randInt(2, 20);
      if ((base * height) % 2 !== 0) height += 1;
      const ans = (base * height) / 2;
      return {
        category: 'geometry', categoryLabel: CATS.geometry,
        question: `밑변 ${base}cm, 높이 ${height}cm인 삼각형의 넓이(cm²)는?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 550,
      };
    } else {
      const a = randInt(4, 15), b = randInt(4, 15);
      let h = randInt(2, 15);
      // 사다리꼴 넓이 = (윗변+아랫변)×높이÷2
      let sum = a + b, prod = sum * h;
      if (prod % 2 !== 0) { h += 1; prod = sum * h; }
      const ans = prod / 2;
      return {
        category: 'geometry', categoryLabel: CATS.geometry,
        question: `윗변 ${a}cm, 아랫변 ${b}cm, 높이 ${h}cm인 사다리꼴의 넓이(cm²)는?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 850,
      };
    }
  },

  average(level) {
    let nums, ans;
    if (level === 1) {
      const avg = randInt(3, 20);
      nums = [avg + randInt(-3, 3), avg + randInt(-3, 3)];
      nums[1] = 2 * avg - nums[0];
      ans = avg;
      return {
        category: 'average', categoryLabel: CATS.average,
        question: `${nums[0]}, ${nums[1]} 의 평균은?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 500,
      };
    } else if (level === 2) {
      const count = randInt(3, 5);
      const avg = randInt(5, 30);
      const total = avg * count;
      nums = [];
      let remaining = total;
      for (let i = 0; i < count - 1; i++) {
        const v = randInt(Math.max(1, avg - 10), avg + 10);
        nums.push(v); remaining -= v;
      }
      nums.push(remaining);
      if (remaining < 0) return TEMPLATES.average(level);
      return {
        category: 'average', categoryLabel: CATS.average,
        question: `${nums.join(', ')} 의 평균은?`,
        answerType: 'number', check: numAnswerCheck(total / count),
        difficulty: 700,
      };
    } else {
      const count = randInt(3, 6);
      const avg = randInt(5, 30);
      const total = avg * count;
      return {
        category: 'average', categoryLabel: CATS.average,
        question: `수 ${count}개의 평균이 ${avg}일 때, 이 수들의 합은?`,
        answerType: 'number', check: numAnswerCheck(total),
        difficulty: 900,
      };
    }
  },

  angle(level) {
    if (level === 1) {
      const a = randInt(20, 160);
      const ans = 180 - a;
      return {
        category: 'angle', categoryLabel: CATS.angle,
        question: `일직선 위에 있는 두 각 중 한 각이 ${a}°일 때, 나머지 한 각은?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 150,
      };
    } else if (level === 2) {
      const a = randInt(30, 100), b = randInt(20, 130 - (180 - a - 130 > 0 ? 0 : 0));
      let b2 = randInt(20, 179 - a - 1 > 20 ? 179 - a - 1 : 21);
      const ans = 180 - a - b2;
      if (ans <= 0) return TEMPLATES.angle(level);
      return {
        category: 'angle', categoryLabel: CATS.angle,
        question: `삼각형의 세 각 중 두 각이 ${a}°, ${b2}°일 때, 나머지 한 각은?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 450,
      };
    } else {
      const a = randInt(60, 120), b = randInt(60, 120), c = randInt(30, 360 - a - b - 30 > 30 ? 360 - a - b - 30 : 31);
      const ans = 360 - a - b - c;
      if (ans <= 0) return TEMPLATES.angle(level);
      return {
        category: 'angle', categoryLabel: CATS.angle,
        question: `사각형의 네 각 중 세 각이 ${a}°, ${b}°, ${c}°일 때, 나머지 한 각은?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 700,
      };
    }
  },

  unit_convert(level) {
    if (level === 1) {
      const kind = choice(['cm_m', 'g_kg', 'ml_l']);
      const val = randInt(1, 9);
      const map = {
        cm_m: { q: `${val}m는 몇 cm인가요?`, ans: val * 100 },
        g_kg: { q: `${val}kg은 몇 g인가요?`, ans: val * 1000 },
        ml_l: { q: `${val}L는 몇 mL인가요?`, ans: val * 1000 },
      };
      return {
        category: 'unit_convert', categoryLabel: CATS.unit_convert,
        question: map[kind].q, answerType: 'number', check: numAnswerCheck(map[kind].ans),
        difficulty: 150,
      };
    } else if (level === 2) {
      const cm = randInt(100, 999);
      const m = Math.floor(cm / 100), rem = cm % 100;
      const ans = m + rem / 100;
      return {
        category: 'unit_convert', categoryLabel: CATS.unit_convert,
        question: `${cm}cm는 몇 m인가요? (소수로 입력, 예: 1.5)`,
        answerType: 'number', check: numAnswerCheck(ans, 0.001),
        difficulty: 500,
      };
    } else {
      const km = randInt(1, 5), m = randInt(1, 9) * 100;
      const ans = km * 1000 + m;
      return {
        category: 'unit_convert', categoryLabel: CATS.unit_convert,
        question: `${km}km ${m}m는 모두 몇 m인가요?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 750,
      };
    }
  },
  /* ---------- 초1 템플릿 ---------- */
  add_sub_9(level) {
    const isAdd = Math.random() < 0.5;
    let a, b;
    if (level === 1) { a = randInt(1, 9); b = randInt(1, 9); }
    else if (level === 2) { a = randInt(5, 19); b = randInt(1, 9); }
    else { a = randInt(10, 49); b = randInt(10, 49); }
    if (!isAdd && a < b) [a, b] = [b, a];
    const ans = isAdd ? a + b : a - b;
    return {
      category: 'add_sub_9', categoryLabel: CATS.add_sub_9,
      question: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 50 + (level - 1) * 150,
    };
  },

  compare_order(level) {
    let question, ans;
    if (level === 1) {
      let n1 = randInt(1, 20), n2 = randInt(1, 20);
      while (n1 === n2) n2 = randInt(1, 20);
      const askMax = Math.random() < 0.5;
      ans = askMax ? Math.max(n1, n2) : Math.min(n1, n2);
      question = `${n1}, ${n2} 중 더 ${askMax ? '큰' : '작은'} 수는?`;
    } else if (level === 2) {
      const nums = new Set();
      while (nums.size < 3) nums.add(randInt(1, 50));
      const arr = [...nums];
      const askMax = Math.random() < 0.5;
      ans = askMax ? Math.max(...arr) : Math.min(...arr);
      question = `${arr.join(', ')} 중 가장 ${askMax ? '큰' : '작은'} 수는?`;
    } else {
      const tens = randInt(2, 9), ones = randInt(0, 9);
      ans = tens * 10 + ones;
      question = `10개씩 ${tens}묶음과 낱개 ${ones}개는 모두 몇 개인가요?`;
    }
    return {
      category: 'compare_order', categoryLabel: CATS.compare_order,
      question, answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 60 + (level - 1) * 150,
    };
  },

  counting_picture(level) {
    const emojis = ['🍎', '⭐', '🍩', '🐣', '🎈'];
    const e = choice(emojis);
    let count;
    if (level === 1) count = randInt(3, 9);
    else if (level === 2) count = randInt(10, 20);
    else count = randInt(20, 30);
    return {
      category: 'counting_picture', categoryLabel: CATS.counting_picture,
      question: `${e.repeat(count)} 는 모두 몇 개인가요?`,
      answerType: 'number', check: numAnswerCheck(count),
      difficulty: 40 + (level - 1) * 120,
    };
  },

  clock_hour(level) {
    const h = randInt(1, 12);
    let question, ans;
    if (level === 1) {
      question = `짧은바늘이 ${h}, 긴바늘이 12를 가리키고 있어요. 지금은 몇 시인가요?`;
      ans = h;
    } else if (level === 2) {
      ans = h === 12 ? 1 : h + 1;
      question = `지금이 ${h}시 정각이에요. 1시간 후는 몇 시인가요?`;
    } else {
      ans = h === 12 ? 1 : h + 1;
      question = `지금이 ${h}시 30분이에요. 30분 후는 몇 시 정각인가요? (숫자만 입력)`;
    }
    return {
      category: 'clock_hour', categoryLabel: CATS.clock_hour,
      question, answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 60 + (level - 1) * 150,
    };
  },

  /* ---------- 초2 템플릿 ---------- */
  add_sub_carry(level) {
    const isAdd = Math.random() < 0.5;
    let a, b;
    if (level === 1) { a = randInt(10, 99); b = randInt(10, 99); }
    else if (level === 2) { a = randInt(100, 500); b = randInt(10, 500); }
    else { a = randInt(100, 999); b = randInt(100, 999); }
    if (!isAdd && a < b) [a, b] = [b, a];
    const ans = isAdd ? a + b : a - b;
    return {
      category: 'add_sub_carry', categoryLabel: CATS.add_sub_carry,
      question: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 150 + (level - 1) * 200,
    };
  },

  mult_table(level) {
    let a, b;
    if (level === 1) { a = randInt(2, 5); b = randInt(1, 9); }
    else if (level === 2) { a = randInt(6, 9); b = randInt(1, 9); }
    else { a = randInt(2, 9); b = randInt(2, 9); }
    const ans = a * b;
    return {
      category: 'mult_table', categoryLabel: CATS.mult_table,
      question: `${a} × ${b} = ?`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 150 + (level - 1) * 200,
    };
  },

  length_basic(level) {
    let question, ans;
    if (level === 1) {
      const cm = choice([100, 200, 300, 400, 500]);
      question = `${cm}cm는 몇 m인가요?`;
      ans = cm / 100;
    } else if (level === 2) {
      const m = randInt(1, 9), cm = randInt(1, 99);
      question = `${m}m ${cm}cm는 모두 몇 cm인가요?`;
      ans = m * 100 + cm;
    } else {
      const isAdd = Math.random() < 0.5;
      let x = randInt(50, 300), y = randInt(50, 300);
      if (!isAdd && x < y) [x, y] = [y, x];
      ans = isAdd ? x + y : x - y;
      question = `${x}cm ${isAdd ? '+' : '-'} ${y}cm = ? cm`;
    }
    return {
      category: 'length_basic', categoryLabel: CATS.length_basic,
      question, answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 150 + (level - 1) * 200,
    };
  },

  clock_minute(level) {
    let question, ans;
    if (level === 1) {
      const n = randInt(1, 5);
      question = `${n}시간은 모두 몇 분인가요?`;
      ans = n * 60;
    } else if (level === 2) {
      const n = randInt(1, 10);
      question = `${n}분은 모두 몇 초인가요?`;
      ans = n * 60;
    } else {
      const a = randInt(10, 50), b = randInt(10, 50);
      question = `${a}분 + ${b}분 = 몇 분인가요?`;
      ans = a + b;
    }
    return {
      category: 'clock_minute', categoryLabel: CATS.clock_minute,
      question, answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 150 + (level - 1) * 200,
    };
  },

  pattern_find(level) {
    let start, step;
    if (level === 1) { start = randInt(1, 10); step = choice([1, 2]); }
    else if (level === 2) { start = randInt(1, 20); step = choice([2, 3, 5]); }
    else { start = randInt(1, 30); step = choice([3, 4, 5, 10]); }
    const seq = [];
    for (let i = 0; i < 5; i++) seq.push(start + step * i);
    const blankIdx = randInt(1, 3);
    const ans = seq[blankIdx];
    const display = seq.map((v, i) => i === blankIdx ? '□' : v).join(', ');
    return {
      category: 'pattern_find', categoryLabel: CATS.pattern_find,
      question: `다음 수의 규칙에 맞게 □안에 알맞은 수를 넣으세요: ${display}`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 150 + (level - 1) * 200,
    };
  },

  /* ---------- 초3 템플릿 ---------- */
  add_sub_big3(level) {
    const isAdd = Math.random() < 0.5;
    let a, b;
    if (level === 1) { a = randInt(100, 999); b = randInt(100, 999); }
    else if (level === 2) { a = randInt(1000, 9999); b = randInt(100, 9999); }
    else { a = randInt(1000, 9999); b = randInt(1000, 9999); }
    if (!isAdd && a < b) [a, b] = [b, a];
    const ans = isAdd ? a + b : a - b;
    return {
      category: 'add_sub_big3', categoryLabel: CATS.add_sub_big3,
      question: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 250 + (level - 1) * 250,
    };
  },

  mul_2digit(level) {
    let a, b;
    if (level === 1) { a = randInt(10, 99); b = randInt(2, 9); }
    else if (level === 2) { a = randInt(11, 99); b = randInt(11, 30); }
    else { a = randInt(11, 99); b = randInt(11, 99); }
    const ans = a * b;
    return {
      category: 'mul_2digit', categoryLabel: CATS.mul_2digit,
      question: `${a} × ${b} = ?`,
      answerType: 'number', check: numAnswerCheck(ans),
      difficulty: 250 + (level - 1) * 250,
    };
  },

  division_basic(level) {
    if (level === 1) {
      const b = randInt(2, 9), ans = randInt(2, 9), a = b * ans;
      return {
        category: 'division_basic', categoryLabel: CATS.division_basic,
        question: `${a} ÷ ${b} = ?`, answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 250,
      };
    } else if (level === 2) {
      const b = randInt(2, 9), q = randInt(2, 12), r = randInt(1, b - 1), a = b * q + r;
      return {
        category: 'division_basic', categoryLabel: CATS.division_basic,
        question: `${a} ÷ ${b} 의 몫이 ${q}일 때, 나머지는?`, answerType: 'number', check: numAnswerCheck(r),
        difficulty: 500,
      };
    } else {
      const b = randInt(2, 9), ans = randInt(10, 40), a = b * ans;
      return {
        category: 'division_basic', categoryLabel: CATS.division_basic,
        question: `${a} ÷ ${b} = ?`, answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 750,
      };
    }
  },

  fraction_intro(level) {
    if (level === 1) {
      const d = randInt(3, 8);
      const shaded = randInt(1, d - 1);
      return {
        category: 'fraction_intro', categoryLabel: CATS.fraction_intro,
        question: `전체를 ${d}칸으로 나눈 도형에서 ${shaded}칸을 색칠했어요. 색칠한 부분을 분수로 나타내면 분자는 몇인가요?`,
        answerType: 'number', check: numAnswerCheck(shaded),
        difficulty: 300,
      };
    } else if (level === 2) {
      const d1 = randInt(2, 9);
      let d2 = randInt(2, 9);
      while (d2 === d1) d2 = randInt(2, 9);
      const bigger = Math.min(d1, d2);
      return {
        category: 'fraction_intro', categoryLabel: CATS.fraction_intro,
        question: `1/${d1} 과 1/${d2} 중 더 큰 분수의 분모를 입력하세요.`,
        answerType: 'number', check: numAnswerCheck(bigger),
        difficulty: 550,
      };
    } else {
      const d = randInt(4, 10);
      let n1 = randInt(1, d - 1), n2 = randInt(1, d - 1);
      while (n1 === n2) n2 = randInt(1, d - 1);
      const biggerN = Math.max(n1, n2);
      return {
        category: 'fraction_intro', categoryLabel: CATS.fraction_intro,
        question: `${n1}/${d} 과 ${n2}/${d} 중 더 큰 분수의 분자를 입력하세요.`,
        answerType: 'number', check: numAnswerCheck(biggerN),
        difficulty: 800,
      };
    }
  },

  length_time3(level) {
    if (level === 1) {
      const cm = randInt(1, 20);
      return {
        category: 'length_time3', categoryLabel: CATS.length_time3,
        question: `${cm}cm는 몇 mm인가요?`, answerType: 'number', check: numAnswerCheck(cm * 10),
        difficulty: 250,
      };
    } else if (level === 2) {
      const km = randInt(1, 9);
      return {
        category: 'length_time3', categoryLabel: CATS.length_time3,
        question: `${km}km는 몇 m인가요?`, answerType: 'number', check: numAnswerCheck(km * 1000),
        difficulty: 500,
      };
    } else {
      const h1 = randInt(1, 6), m1 = choice([10, 20, 30]), addMin = choice([10, 20]);
      const ans = m1 + addMin;
      return {
        category: 'length_time3', categoryLabel: CATS.length_time3,
        question: `${h1}시 ${m1}분에서 ${addMin}분 후는 ${h1}시 몇 분인가요?`,
        answerType: 'number', check: numAnswerCheck(ans),
        difficulty: 750,
      };
    }
  },
};

const GRADE_POOL = {
  1: ['add_sub_9', 'compare_order', 'counting_picture', 'clock_hour'],
  2: ['add_sub_carry', 'mult_table', 'length_basic', 'clock_minute', 'pattern_find'],
  3: ['add_sub_big3', 'mul_2digit', 'division_basic', 'fraction_intro', 'length_time3'],
  4: ['add_sub', 'mul_div', 'frac_addsub', 'dec_ops', 'geometry', 'angle', 'unit_convert'],
  5: ['frac_addsub', 'frac_muldiv', 'gcd_lcm', 'dec_ops', 'average', 'geometry', 'unit_convert'],
  6: ['frac_muldiv', 'ratio_percent', 'dec_ops', 'average', 'geometry', 'unit_convert', 'gcd_lcm'],
};
const GRADE_OFFSET = { 1: -60, 2: -40, 3: -20, 4: 0, 5: 80, 6: 160 };

function pickLevelForRating(rp, gradeOffset) {
  const r = rp;
  const roll = Math.random();
  let target;
  if (r < gradeOffset + 200) target = 1;
  else if (r < gradeOffset + 550) target = 2;
  else target = 3;
  if (roll < 0.2) target = Math.max(1, target - 1);
  else if (roll > 0.85) target = Math.min(3, target + 1);
  return target;
}

function generateSession(grade, rating) {
  const pool = GRADE_POOL[grade];
  const gradeOffset = GRADE_OFFSET[grade] ?? 0;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const cats = [];
  while (cats.length < 10) cats.push(...shuffled);
  const session = [];
  for (let i = 0; i < 10; i++) {
    const cat = cats[i];
    const level = pickLevelForRating(rating, gradeOffset);
    let problem;
    try { problem = TEMPLATES[cat](level); } catch (e) { problem = TEMPLATES.add_sub(1); }
    session.push(problem);
  }
  return session;
}

/* ---------- 프로필 저장 (localStorage, 접근 불가 시 메모리로 폴백) ---------- */
const STORAGE_KEY = 'mathrank_profile_v1';
let storageAvailable = true;
function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    storageAvailable = false;
    return null;
  }
}
function saveProfile(p) {
  if (!storageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch (e) {
    storageAvailable = false;
    console.warn('저장 공간에 접근할 수 없어 이번 세션에서만 진행 상황이 유지됩니다.', e);
  }
}
const GRADE_ACCENT = { 1: '#ffb86b', 2: '#ff6b6b', 3: '#5ee7c0', 4: '#3ddc97', 5: '#6c8cff', 6: '#ff7ad9' };
function applyGradeAccent(grade) {
  document.documentElement.style.setProperty('--grade-accent', GRADE_ACCENT[grade] || '#6c8cff');
}

function newProfile(grade) {
  return {
    grade,
    rating: START_RATING,
    streak: 0,
    lastCompletedDate: null,
    categoryStats: {},
    totalSessions: 0,
  };
}

let profile = loadProfile();
let currentSession = null;
let currentIndex = 0;
let sessionCorrect = 0;
let ratingBefore = 0;

/* ---------- 화면 전환 ---------- */
function showScreen(id) {
  $$('.screen').forEach(s => s.setAttribute('hidden', ''));
  $(`#${id}`).removeAttribute('hidden');
}

function isDoneToday() {
  return profile && profile.lastCompletedDate === todayStr();
}

/* ---------- 홈 화면 렌더 ---------- */
function renderHome() {
  const t = tierForRating(profile.rating);
  const badgeImg = $('#home-badge');
  badgeImg.src = t.img;
  badgeImg.alt = t.label;
  $('#home-tier-name').textContent = t.label;
  $('#home-rating').textContent = profile.rating;
  $('#home-streak').textContent = profile.streak;
  document.documentElement.style.setProperty('--tier-color', t.hex);
  applyGradeAccent(profile.grade);

  const span = t.ceil === Infinity ? 1 : (t.ceil - t.floor);
  const progressPct = t.ceil === Infinity ? 100 : Math.round(((profile.rating - t.floor) / span) * 100);
  $('#home-progress').style.width = `${progressPct}%`;
  $('#home-progress-label').textContent = t.ceil === Infinity
    ? '최고 등급 슈퍼노바 달성!'
    : `다음 등급까지 ${t.ceil - profile.rating} RP`;
  $('#home-pips').innerHTML = pipsHtml(t.count, t.hex);

  const done = isDoneToday();
  $('#btn-start-quiz').toggleAttribute('hidden', done);
  $('#home-done-msg').toggleAttribute('hidden', !done);
  $('#btn-change-grade').removeAttribute('hidden');
  showScreen('screen-home');
}

/* ---------- 등급표 화면 ---------- */
function pipsHtml(count, hex) {
  let s = '';
  for (let i = 0; i < count; i++) s += `<span class="pip" style="background:${hex}"></span>`;
  return s;
}

function renderTierTable() {
  const wrap = $('#tier-table');
  wrap.innerHTML = '';
  const currentIdx = tierForRating(profile.rating).idx;
  TIER_DEFS.slice().reverse().forEach((t) => {
    const idx = TIER_DEFS.indexOf(t);
    const floor = idx * TIER_STEP;
    const ceil = idx === TIER_DEFS.length - 1 ? null : floor + TIER_STEP;
    const img = CATEGORY_IMG[t.category];
    const row = document.createElement('div');
    row.className = 'tier-row' + (idx === currentIdx ? ' current' : '');
    row.innerHTML = `
      <div class="tr-badge"><img src="${img}" alt="${t.name}"><div class="pip-row">${pipsHtml(t.count, t.hex)}</div></div>
      <div class="tr-name">${t.name}</div>
      <div class="tr-range">${floor} ~ ${ceil ? ceil - 1 : '∞'} RP</div>
    `;
    wrap.appendChild(row);
  });
  showScreen('screen-tiers');
}

/* ---------- 취약 단원 리포트 ---------- */
function renderWeak() {
  const wrap = $('#weak-list');
  wrap.innerHTML = '';
  const stats = profile.categoryStats || {};
  const rows = Object.keys(stats)
    .map(cat => ({ cat, ...stats[cat], acc: stats[cat].total ? stats[cat].correct / stats[cat].total : 0 }))
    .filter(r => r.total >= 1)
    .sort((a, b) => a.acc - b.acc);

  if (rows.length === 0) {
    wrap.innerHTML = '<div class="weak-empty">아직 데이터가 없어요. 오늘의 문제를 풀어보세요!</div>';
  } else {
    rows.forEach(r => {
      const pct = Math.round(r.acc * 100);
      const cls = pct < 50 ? 'low' : pct < 80 ? 'mid' : 'high';
      const row = document.createElement('div');
      row.className = 'weak-row';
      row.innerHTML = `
        <div class="weak-row-top"><span>${CATS[r.cat] || r.cat}</span><span>${pct}% (${r.correct}/${r.total})</span></div>
        <div class="weak-bar-bg"><div class="weak-bar-fill ${cls}" style="width:${pct}%"></div></div>
      `;
      wrap.appendChild(row);
    });
  }
  showScreen('screen-weak');
}

/* ---------- 퀴즈 진행 ---------- */
function startQuiz() {
  currentSession = generateSession(profile.grade, profile.rating);
  currentIndex = 0;
  sessionCorrect = 0;
  ratingBefore = profile.rating;
  showScreen('screen-quiz');
  renderQuestion();
}

function renderQuestion() {
  const p = currentSession[currentIndex];
  $('#quiz-index').textContent = currentIndex + 1;
  $('#quiz-progress-fill').style.width = `${((currentIndex) / 10) * 100}%`;
  $('#quiz-category').textContent = p.categoryLabel;
  $('#quiz-question').textContent = p.question;
  $('#quiz-input').value = '';
  $('#quiz-hint').textContent = p.answerType === 'fraction' ? '분수는 "3/4" 또는 대분수 "1 1/2" 형태로 입력하세요.' : '';
  $('#quiz-feedback').setAttribute('hidden', '');
  $('#btn-submit-answer').removeAttribute('hidden');
  $('#quiz-input').removeAttribute('disabled');
  setTimeout(() => $('#quiz-input').focus(), 50);
}

function submitAnswer() {
  const p = currentSession[currentIndex];
  const input = $('#quiz-input').value;
  if (input.trim() === '') return;
  const correct = p.check(input);
  if (correct) sessionCorrect++;

  if (!profile.categoryStats[p.category]) profile.categoryStats[p.category] = { correct: 0, total: 0 };
  profile.categoryStats[p.category].total++;
  if (correct) profile.categoryStats[p.category].correct++;

  // ELO 갱신
  const expected = 1 / (1 + Math.pow(10, (p.difficulty - profile.rating) / 400));
  const K = 40;
  const delta = Math.round(K * ((correct ? 1 : 0) - expected));
  profile.rating = Math.max(0, profile.rating + delta);

  $('#btn-submit-answer').setAttribute('hidden', '');
  $('#quiz-input').setAttribute('disabled', '');
  $('#quiz-feedback').removeAttribute('hidden');
  const ft = $('#quiz-feedback-text');
  const fbMascot = $('#quiz-feedback-mascot');
  fbMascot.className = 'feedback-mascot';
  void fbMascot.offsetWidth;
  if (correct) {
    ft.textContent = `정답이에요! (${delta >= 0 ? '+' : ''}${delta} RP)`;
    ft.className = 'feedback-correct';
    fbMascot.src = 'assets/char_correct.jpg';
    fbMascot.classList.add('fb-correct');
  } else {
    ft.textContent = `아쉬워요. (${delta >= 0 ? '+' : ''}${delta} RP)`;
    ft.className = 'feedback-wrong';
    fbMascot.src = 'assets/char_wrong.jpg';
    fbMascot.classList.add('fb-wrong');
  }
  saveProfile(profile);
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= 10) {
    finishSession();
  } else {
    renderQuestion();
  }
}

function finishSession() {
  const today = todayStr();
  if (profile.lastCompletedDate) {
    const gap = daysBetween(profile.lastCompletedDate, today);
    if (gap === 1) profile.streak += 1;
    else if (gap > 1) profile.streak = 1;
    // gap === 0 이면 (이미 오늘 완료된 경우) 유지
  } else {
    profile.streak = 1;
  }
  profile.lastCompletedDate = today;
  profile.totalSessions = (profile.totalSessions || 0) + 1;
  saveProfile(profile);

  const tierBefore = tierForRating(ratingBefore);
  const tierAfter = tierForRating(profile.rating);

  $('#result-score').textContent = `${sessionCorrect}/10`;
  const delta = profile.rating - ratingBefore;
  $('#result-delta').textContent = `${delta >= 0 ? '+' : ''}${delta}`;
  $('#result-delta').style.color = delta >= 0 ? 'var(--good)' : 'var(--bad)';
  $('#result-streak').textContent = `${profile.streak}일`;

  const headline = $('#result-headline');
  const mascot = $('#result-mascot');
  mascot.classList.remove('celebrate');
  if (sessionCorrect >= 9) { headline.textContent = '완벽해요! 오늘의 결과'; void mascot.offsetWidth; mascot.classList.add('celebrate'); }
  else if (sessionCorrect >= 7) headline.textContent = '아주 잘했어요! 오늘의 결과';
  else if (sessionCorrect >= 4) headline.textContent = '수고했어요! 오늘의 결과';
  else headline.textContent = '오늘의 결과 (내일 다시 도전!)';

  const levelup = $('#result-levelup');
  if (tierAfter.idx > tierBefore.idx) {
    levelup.removeAttribute('hidden');
    $('#levelup-tier').textContent = `✨ ${tierAfter.label}`;
  } else {
    levelup.setAttribute('hidden', '');
  }

  $('#btn-download-card').setAttribute('hidden', '');
  $('#btn-share-card').setAttribute('hidden', '');
  clearCanvas();

  showScreen('screen-result');
}

function clearCanvas() {
  const canvas = $('#share-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* ---------- 공유 카드 렌더링 (Canvas) ---------- */
function resolveCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const IMAGE_CACHE = {};
function loadImage(src) {
  if (IMAGE_CACHE[src]) return IMAGE_CACHE[src];
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  IMAGE_CACHE[src] = p;
  return p;
}

async function drawShareCard() {
  const canvas = $('#share-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const tier = tierForRating(profile.rating);
  const baseColor = tier.hex;

  // 배경 그라데이션
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#141830');
  grad.addColorStop(1, '#0b0e1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 상단 액센트 바
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, 14);

  // 브랜드
  ctx.fillStyle = '#f1f2f6';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('🏆 매쓰랭크', 40, 80);
  ctx.fillStyle = '#9aa0b4';
  ctx.font = '18px sans-serif';
  ctx.fillText(`초${profile.grade} 수학 · ${todayStr()}`, 40, 112);

  // 티어 뱃지 원
  ctx.beginPath();
  ctx.arc(W / 2, 300, 130, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = baseColor;
  ctx.stroke();

  ctx.textAlign = 'center';
  try {
    const badgeImg = await loadImage(tier.img);
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, 300, 118, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(badgeImg, W / 2 - 118, 300 - 118, 236, 236);
    ctx.restore();
  } catch (e) {
    ctx.font = '90px sans-serif';
    ctx.fillStyle = '#f1f2f6';
    ctx.fillText('✨', W / 2, 335);
  }

  ctx.font = 'bold 38px sans-serif';
  ctx.fillStyle = '#f1f2f6';
  ctx.fillText(tier.label, W / 2, 490);

  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#9aa0b4';
  ctx.fillText(`${profile.rating} RP`, W / 2, 528);

  // 통계 카드 3분할
  const statsY = 610;
  const stats = [
    { label: '오늘 정답', value: `${sessionCorrect}/10` },
    { label: 'RP 변화', value: `${profile.rating - ratingBefore >= 0 ? '+' : ''}${profile.rating - ratingBefore}` },
    { label: '연속 출석', value: `${profile.streak}일` },
  ];
  const boxW = (W - 80 - 20 * 2) / 3;
  stats.forEach((s, i) => {
    const x = 40 + i * (boxW + 20);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, x, statsY, boxW, 110, 16);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#f1f2f6';
    ctx.fillText(s.value, x + boxW / 2, statsY + 48);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#9aa0b4';
    ctx.fillText(s.label, x + boxW / 2, statsY + 78);
  });

  // 하단 카피
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#f1f2f6';
  ctx.fillText('무료로 하루 10문제, 등급 올리기 🔥', W / 2, 800);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#6c8cff';
  ctx.fillText('mathrank.app (파일럿)', W / 2, 835);

  ctx.textAlign = 'left';
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

/* ---------- 이벤트 바인딩 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $$('.grade-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const grade = parseInt(btn.dataset.grade, 10);
      profile = newProfile(grade);
      saveProfile(profile);
      renderHome();
    });
  });

  $('#btn-change-grade').addEventListener('click', () => {
    showScreen('screen-onboarding');
  });

  $('#btn-start-quiz').addEventListener('click', startQuiz);

  $('#btn-submit-answer').addEventListener('click', submitAnswer);
  $('#quiz-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (!$('#btn-submit-answer').hasAttribute('hidden')) submitAnswer();
      else nextQuestion();
    }
  });
  $('#btn-next-question').addEventListener('click', nextQuestion);

  $('#btn-make-card').addEventListener('click', async () => {
    await drawShareCard();
    $('#btn-download-card').removeAttribute('hidden');
    $('#btn-share-card').removeAttribute('hidden');
  });

  $('#btn-download-card').addEventListener('click', () => {
    const canvas = $('#share-canvas');
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mathrank_${todayStr()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });

  $('#btn-share-card').addEventListener('click', async () => {
    const canvas = $('#share-canvas');
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'mathrank.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: '매쓰랭크 결과',
            text: `오늘 수학 ${sessionCorrect}/10 문제 맞췄어요! 등급: ${tierForRating(profile.rating).label}`,
          });
        } catch (e) { /* 사용자가 취소 */ }
      } else {
        alert('이 브라우저는 공유 기능을 지원하지 않아요. "이미지 저장" 버튼으로 저장 후 카톡에 직접 첨부해주세요.');
      }
    });
  });

  $('#btn-back-home').addEventListener('click', renderHome);
  $('#btn-view-tiers').addEventListener('click', renderTierTable);
  $('#btn-view-weak').addEventListener('click', renderWeak);
  $$('[data-back="home"]').forEach(btn => btn.addEventListener('click', renderHome));

  // 초기 화면
  if (profile) renderHome();
  else showScreen('screen-onboarding');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
