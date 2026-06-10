const { useState, useEffect, useRef, useCallback } = React;

// ==================== CONTENT DATA ====================
const UNITS = {
  foundations: {
    id: "foundations", label: "Foundations", icon: "📐", color: "#3b82f6",
    topics: [
      { id: "scalars-vectors", title: "Scalars vs. Vectors & Kinematics", 
        content: `Scalars: magnitude only (time, mass, temp, energy, work, power).\nVectors: magnitude + direction (force, velocity, acceleration, momentum, fields).\n\nKinematics (constant acceleration):\n  v_f = v_i + a t\n  d = v_i t + ½ a t²\n  v_f² = v_i² + 2 a d`,
        formulas: ["v_f = v_i + a t", "d = v_i t + ½ a t²", "v_f² = v_i² + 2 a d"],
        flashcards: [
          { q: "Scalar vs. vector?", a: "Scalar = magnitude only; vector = magnitude + direction." },
          { q: "Distance vs. displacement?", a: "Distance = total path; displacement = net change." }
        ],
        quiz: [{ q: "Car accelerates from rest to 20 m/s in 5 s. Acceleration?", opts: ["4 m/s²", "5 m/s²", "2 m/s²", "10 m/s²"], ans: 0, exp: "a = 20/5 = 4 m/s²" }]
      },
      { id: "circular-projectile", title: "Circular & Projectile Motion", 
        content: `Circular motion: a_c = v²/r (toward center), F_c = m v²/r\nProjectile motion: Horizontal v_x constant, vertical a_y = -9.8 m/s²`,
        formulas: ["a_c = v² / r", "F_c = m v² / r", "v_x = v cosθ", "v_y = v sinθ"],
        flashcards: [{ q: "Centripetal acceleration direction?", a: "Toward center." }],
        quiz: [{ q: "v = 20 m/s, r = 5 m. Centripetal acceleration?", opts: ["80 m/s²", "4 m/s²", "100 m/s²", "20 m/s²"], ans: 0, exp: "a_c = 400/5 = 80 m/s²" }]
      }
    ]
  },
  forces: {
    id: "forces", label: "Forces & Newton's Laws", icon: "🎯", color: "#ef4444",
    topics: [
      { id: "newtons-laws", title: "Newton's Laws, Weight, Friction", 
        content: `Newton's 2nd Law: F_net = ma\nWeight: F_g = mg (g = 9.81 m/s²)\nFriction: F_f = μF_N\nIncline: F_∥ = mg sinθ, F_N = mg cosθ`,
        formulas: ["F_net = m a", "F_g = m g", "F_f = μ F_N", "F_∥ = m g sinθ"],
        flashcards: [{ q: "Newton's 2nd law?", a: "F_net = m a." }],
        quiz: [{ q: "10 kg box, F_net = 20 N. Acceleration?", opts: ["2 m/s²", "0.5 m/s²", "200 m/s²", "10 m/s²"], ans: 0, exp: "a = 20/10 = 2 m/s²" }]
      },
      { id: "momentum-impulse", title: "Momentum, Impulse & Collisions", 
        content: `Momentum: p = mv\nImpulse: J = FΔt = Δp\nConservation of momentum: p_before = p_after`,
        formulas: ["p = m v", "J = F Δt = Δp", "(m₁+m₂)v_f = m₁v₁ + m₂v₂"],
        flashcards: [{ q: "Momentum formula?", a: "p = mv." }],
        quiz: [{ q: "2 kg cart at 3 m/s. Momentum?", opts: ["6 kg·m/s", "1.5", "5", "0"], ans: 0, exp: "p = 2×3 = 6 kg·m/s" }]
      }
    ]
  },
  energy: {
    id: "energy", label: "Energy, Work & Power", icon: "⚡", color: "#f59e0b",
    topics: [
      { id: "energy-types", title: "Energy Types, Work, Power", 
        content: `Kinetic Energy: KE = ½mv²\nGravitational PE: PE = mgh\nWork: W = Fd\nPower: P = W/t`,
        formulas: ["KE = ½ m v²", "PE = m g h", "W = F d", "P = W / t"],
        flashcards: [{ q: "KE formula?", a: "½mv²." }],
        quiz: [{ q: "2 kg object at 3 m/s. Kinetic energy?", opts: ["9 J", "6 J", "3 J", "12 J"], ans: 0, exp: "KE = ½×2×9 = 9 J" }]
      },
      { id: "thermal-circuits", title: "Thermal Energy & Circuits", 
        content: `Heat: Q = mcΔT\nOhm's Law: V = IR\nSeries: R_eq = R₁ + R₂\nParallel: 1/R_eq = 1/R₁ + 1/R₂`,
        formulas: ["Q = m c ΔT", "V = I R", "P = V I"],
        flashcards: [{ q: "Ohm's Law?", a: "V = IR." }],
        quiz: [{ q: "12V battery, 6Ω resistor. Current?", opts: ["2 A", "0.5 A", "72 A", "18 A"], ans: 0, exp: "I = 12/6 = 2 A" }]
      }
    ]
  },
  waves: {
    id: "waves", label: "Waves & Optics", icon: "🌊", color: "#8b5cf6",
    topics: [
      { id: "wave-basics", title: "Wave Properties & EM Spectrum", 
        content: `Wave speed: v = fλ, Period: T = 1/f\nPhoton energy: E = hf\nSnell's Law: n₁ sinθ₁ = n₂ sinθ₂`,
        formulas: ["v = f λ", "T = 1/f", "E = h f", "n₁ sinθ₁ = n₂ sinθ₂"],
        flashcards: [{ q: "Wave speed equation?", a: "v = fλ." }],
        quiz: [{ q: "v = 340 m/s, f = 170 Hz. Wavelength?", opts: ["2 m", "0.5 m", "57800 m", "510 m"], ans: 0, exp: "λ = 340/170 = 2 m" }]
      },
      { id: "optics-mirrors", title: "Mirrors & Lenses", 
        content: `Mirror equation: 1/F = 1/dₒ + 1/dᵢ\nMagnification: M = -dᵢ/dₒ`,
        formulas: ["1/F = 1/dₒ + 1/dᵢ", "M = -dᵢ/dₒ"],
        flashcards: [{ q: "Mirror equation?", a: "1/F = 1/dₒ + 1/dᵢ." }],
        quiz: [{ q: "dₒ = 30 cm, F = 10 cm. Image distance?", opts: ["15 cm", "7.5 cm", "60 cm", "20 cm"], ans: 0, exp: "dᵢ = 15 cm" }]
      }
    ]
  },
  modern: {
    id: "modern", label: "Modern & Nuclear", icon: "💥", color: "#06b6d4",
    topics: [
      { id: "bigbang-nuclear", title: "Nuclear Physics", 
        content: `Mass-energy equivalence: E = mc²\nAlpha decay: Z-2, A-4\nBeta decay: Z+1, A unchanged`,
        formulas: ["E = m c²"],
        flashcards: [{ q: "Alpha decay changes atomic number by?", a: "-2." }],
        quiz: [{ q: "Two positive charges: force is?", opts: ["Attractive", "Repulsive", "Zero", "Depends"], ans: 1, exp: "Like charges repel." }]
      }
    ]
  }
};

// Practice Clusters
const CLUSTERS = [
  { id: "c1", title: "Kinematics & Motion Graphs", questions: [
    { q: "Car accelerates from rest to 20 m/s in 5 s. Acceleration?", opts: ["4 m/s²", "5 m/s²", "2 m/s²", "10 m/s²"], ans: 0, exp: "a = 20/5 = 4 m/s²" },
    { q: "Slope of velocity-time graph represents?", opts: ["Displacement", "Acceleration", "Speed", "Distance"], ans: 1, exp: "Slope = acceleration" }
  ]},
  { id: "c2", title: "Forces & Newton's Laws", questions: [
    { q: "10 kg box, net force 20 N. Acceleration?", opts: ["2 m/s²", "0.5 m/s²", "200 m/s²", "10 m/s²"], ans: 0, exp: "a = 20/10 = 2 m/s²" },
    { q: "Weight of 50 kg person? (g = 9.8 m/s²)", opts: ["50 N", "490 N", "5.1 N", "9.8 N"], ans: 1, exp: "F_g = 50 × 9.8 = 490 N" }
  ]},
  { id: "c3", title: "Circular Motion", questions: [
    { q: "2 kg ball, radius 4 m, speed 6 m/s. Centripetal force?", opts: ["18 N", "3 N", "72 N", "12 N"], ans: 0, exp: "F_c = 2×36/4 = 18 N" }
  ]},
  { id: "c4", title: "Momentum & Collisions", questions: [
    { q: "2 kg cart at 3 m/s. Momentum?", opts: ["6 kg·m/s", "1.5", "5", "0"], ans: 0, exp: "p = 2×3 = 6" }
  ]},
  { id: "c5", title: "Energy & Power", questions: [
    { q: "2 kg object at 3 m/s. Kinetic energy?", opts: ["9 J", "6 J", "3 J", "12 J"], ans: 0, exp: "KE = ½×2×9 = 9 J" }
  ]}
];

// Build quiz pools
let ALL_FLASHCARDS = [];
let ALL_QUIZ = [];
Object.values(UNITS).forEach(unit => {
  unit.topics.forEach(topic => {
    if (topic.flashcards) topic.flashcards.forEach(f => ALL_FLASHCARDS.push({ ...f, unit: unit.label }));
    if (topic.quiz) topic.quiz.forEach(q => ALL_QUIZ.push({ ...q, source: unit.label }));
  });
});
CLUSTERS.forEach(cluster => {
  cluster.questions.forEach(q => ALL_QUIZ.push({ ...q, source: cluster.title }));
});

const shuffle = (arr) => {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Speech helper
const speak = (text) => {
  if ('speechSynthesis' in window) {
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
};

// Simulation component
const EnergySim = () => {
  const [h, setH] = useState(25);
  const pe = 2 * 9.81 * h;
  const ke = 2 * 9.81 * 50 - pe;
  return (
    <div className="sim-controls">
      <label>Height: {h} m</label>
      <input type="range" min="0" max="50" value={h} onChange={e => setH(+e.target.value)} />
      <div className="sim-output">PE = {pe.toFixed(0)} J &nbsp; KE = {ke.toFixed(0)} J</div>
    </div>
  );
};

const SIMULATIONS = [
  { id: "energy", title: "Energy Bar Chart", icon: "⚡", comp: EnergySim }
];

// Main App Component
const App = () => {
  const [page, setPage] = useState('dashboard');
  const [activeUnit, setActiveUnit] = useState('foundations');
  const [activeTopic, setActiveTopic] = useState(null);
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('xp') || '0'));
  const [completed, setCompleted] = useState(() => JSON.parse(localStorage.getItem('completed') || '{}'));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('streak') || '0'));
  const [lastStudy, setLastStudy] = useState(() => localStorage.getItem('lastStudy') || '');
  const [wrongTracker, setWrongTracker] = useState(() => JSON.parse(localStorage.getItem('wrongTracker') || '{}'));
  const [fcDeck, setFcDeck] = useState(() => shuffle(ALL_FLASHCARDS));
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlip, setFcFlip] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizDeck, setQuizDeck] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSel, setQuizSel] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [examActive, setExamActive] = useState(false);
  const [examAns, setExamAns] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examDeck] = useState(() => shuffle(ALL_QUIZ).slice(0, 10));
  const [examTime, setExamTime] = useState(1800);
  const [clusterQuizActive, setClusterQuizActive] = useState(false);
  const [activeCluster, setActiveCluster] = useState(null);
  const [clusterQuizIdx, setClusterQuizIdx] = useState(0);
  const [clusterQuizSel, setClusterQuizSel] = useState(null);
  const [clusterQuizScore, setClusterQuizScore] = useState(0);
  const [clusterQuizDone, setClusterQuizDone] = useState(false);
  const [formulaVisible, setFormulaVisible] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [customQuizMode, setCustomQuizMode] = useState(false);
  const [customTopics, setCustomTopics] = useState([]);
  const [customCount, setCustomCount] = useState(5);
  const timerRef = useRef(null);

  // Theme effect
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Exam timer
  useEffect(() => {
    if (examActive && !examSubmitted) {
      timerRef.current = setInterval(() => setExamTime(t => t > 0 ? t - 1 : 0), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [examActive, examSubmitted]);

  useEffect(() => {
    if (examActive && !examSubmitted && examTime === 0) submitExam();
  }, [examTime]);

  const updateStreak = () => {
    let today = new Date().toDateString();
    if (lastStudy !== today) {
      let newStreak = lastStudy ? (new Date() - new Date(lastStudy) <= 86400000 ? streak + 1 : 1) : 1;
      setStreak(newStreak);
      setLastStudy(today);
      localStorage.setItem('streak', newStreak);
      localStorage.setItem('lastStudy', today);
      addXp(newStreak % 5 === 0 ? 20 : 5);
    }
  };

  const addXp = (amt) => {
    let n = xp + amt;
    setXp(n);
    localStorage.setItem('xp', n);
  };

  const markComplete = (key) => {
    updateStreak();
    let c = { ...completed, [key]: true };
    setCompleted(c);
    localStorage.setItem('completed', JSON.stringify(c));
    addXp(5);
  };

  const trackWrong = (qText, topic) => {
    let newWrong = { ...wrongTracker, [qText]: (wrongTracker[qText] || 0) + 1 };
    setWrongTracker(newWrong);
    localStorage.setItem('wrongTracker', JSON.stringify(newWrong));
  };

  const resetProgress = () => {
    if (confirm('Reset all progress? This will clear XP, completed topics, and stats.')) {
      setXp(0);
      setCompleted({});
      setWrongTracker({});
      setStreak(0);
      localStorage.clear();
      window.location.reload();
    }
  };

  const getNextTopic = (unitId, topicId) => {
    const unit = UNITS[unitId];
    const idx = unit.topics.findIndex(t => t.id === topicId);
    if (idx + 1 < unit.topics.length) {
      return { unitId, topic: unit.topics[idx + 1] };
    }
    const ids = Object.keys(UNITS);
    const uidx = ids.indexOf(unitId);
    if (uidx + 1 < ids.length) {
      return { unitId: ids[uidx + 1], topic: UNITS[ids[uidx + 1]].topics[0] };
    }
    return null;
  };

  const goToNextTopic = () => {
    if (!activeTopic) return;
    const next = getNextTopic(activeUnit, activeTopic.id);
    if (next) {
      setActiveUnit(next.unitId);
      setActiveTopic(next.topic);
      markComplete(`${next.unitId}-${next.topic.id}`);
    }
  };

  const startQuiz = (filter, customQuestions = null) => {
    let pool = customQuestions ? customQuestions : (filter === 'all' ? ALL_QUIZ : ALL_QUIZ.filter(q => q.source === filter));
    let selected = shuffle(pool).slice(0, customQuestions ? customQuestions.length : 10);
    setQuizDeck(selected);
    setQuizIdx(0);
    setQuizSel(null);
    setQuizScore(0);
    setQuizDone(false);
    setQuizActive(true);
    setPage('quiz');
  };

  const handleQuiz = (idx) => {
    if (quizSel !== null) return;
    setQuizSel(idx);
    if (idx === quizDeck[quizIdx].ans) {
      setQuizScore(s => s + 1);
      addXp(10);
    } else {
      trackWrong(quizDeck[quizIdx].q, quizDeck[quizIdx].source);
    }
  };

  const nextQuiz = () => {
    if (quizIdx + 1 >= quizDeck.length) {
      setQuizDone(true);
      addXp(20);
    } else {
      setQuizIdx(i => i + 1);
      setQuizSel(null);
    }
  };

  const submitExam = () => {
    clearInterval(timerRef.current);
    setExamSubmitted(true);
    let correct = 0;
    examDeck.forEach((q, i) => {
      if (examAns[i] === q.ans) correct++;
      else trackWrong(q.q, q.source);
    });
    addXp(correct * 15);
  };

  const startCustomQuiz = () => {
    let selectedPool = ALL_QUIZ;
    if (customTopics.length > 0) {
      selectedPool = ALL_QUIZ.filter(q => customTopics.includes(q.source));
    }
    if (selectedPool.length === 0) selectedPool = ALL_QUIZ;
    startQuiz('custom', shuffle(selectedPool).slice(0, customCount));
    setCustomQuizMode(false);
  };

  const exportProgress = () => {
    let data = { xp, completed, wrongTracker, streak, exportDate: new Date().toISOString() };
    let blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'nova_progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProgress = (e) => {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = ev => {
      let data = JSON.parse(ev.target.result);
      setXp(data.xp || 0);
      setCompleted(data.completed || {});
      setWrongTracker(data.wrongTracker || {});
      setStreak(data.streak || 0);
      localStorage.setItem('xp', data.xp || 0);
      localStorage.setItem('completed', JSON.stringify(data.completed || {}));
      localStorage.setItem('wrongTracker', JSON.stringify(data.wrongTracker || {}));
      localStorage.setItem('streak', data.streak || 0);
      alert('Progress imported successfully!');
    };
    reader.readAsText(file);
  };

  const printNotes = () => {
    if (!activeTopic) return;
    let content = `<html><head><title>${activeTopic.title} - Nova Physics Notes</title><style>body{font-family:sans-serif;padding:2rem;line-height:1.6;}pre{white-space:pre-wrap;}</style></head><body><h1>${activeTopic.title}</h1><p>${activeTopic.content}</p><h2>Key Formulas</h2><ul>${(activeTopic.formulas || []).map(f => `<li>${f}</li>`).join('')}</ul></body></html>`;
    let win = window.open();
    win.document.write(content);
    win.print();
  };

  const level = Math.floor(xp / 100) + 1;
  const totalTopics = Object.values(UNITS).reduce((s, u) => s + u.topics.length, 0);
  const completedCount = Object.keys(completed).length;
  const weakTopics = Object.entries(wrongTracker).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const NAV = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'learn', label: '📖 Learn' },
    { id: 'simulations', label: '🔬 Sims' },
    { id: 'flashcards', label: '🃏 Cards' },
    { id: 'quiz', label: '❓ Quiz' },
    { id: 'exam', label: '📝 Exam' },
    { id: 'clusters', label: '📚 Clusters' },
    { id: 'reference', label: '📖 Ref' },
    { id: 'formulas', label: '📐 Formulas' }
  ];

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="logo">⚛️ Nova Physics Regents+</div>
        <div className="nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-btn ${page === n.id ? 'active' : ''}`}
              onClick={() => {
                setPage(n.id);
                setQuizActive(false);
                setExamActive(false);
                setClusterQuizActive(false);
                setCustomQuizMode(false);
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
        <div className="xp-badge">
          🔥 Lv.{level} · {xp} XP · Streak {streak} 🔥
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="reset-btn" onClick={resetProgress}>↺</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <>
            <h1>Nova Dashboard</h1>
            <div className="card" style={{ marginBottom: '1rem', background: 'var(--surface2)' }}>
              <div className="flex-between">
                <span>🔥 {streak} day streak! {streak > 0 && '⭐ Keep studying!'}</span>
                <span>⬆️ {xp % 100}/100 to Lv.{level + 1}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${xp % 100}%` }} />
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div>✅ Topics Completed</div>
                <div style={{ fontSize: '2rem' }}>{completedCount}/{totalTopics}</div>
              </div>
              <div className="card">
                <div>📊 Weakest Area</div>
                <div style={{ fontSize: '0.9rem' }}>{weakTopics.length === 0 ? 'None yet! Keep going!' : weakTopics[0][0].slice(0, 40)}</div>
              </div>
              <div className="card">
                <div>📥 Progress</div>
                <div className="flex-row">
                  <button className="btn btn-secondary" onClick={exportProgress}>📤 Export</button>
                  <input type="file" accept=".json" onChange={importProgress} style={{ fontSize: '0.7rem' }} />
                </div>
              </div>
            </div>

            {weakTopics.length > 0 && (
              <div className="card">
                <h3>📉 Topics to Review</h3>
                {weakTopics.map(([q, c]) => (
                  <div key={q} className="weakness-card">
                    ❌ {q.slice(0, 60)}... ({c}x wrong)
                  </div>
                ))}
                <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => startQuiz('all')}>
                  Practice Weak Topics →
                </button>
              </div>
            )}

            <div className="grid-2" style={{ marginTop: '1rem' }}>
              {Object.values(UNITS).map(u => {
                let done = u.topics.filter(t => completed[`${u.id}-${t.id}`]).length;
                let mastery = done === u.topics.length;
                return (
                  <div
                    key={u.id}
                    className={`card unit-card ${mastery ? 'completed' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setPage('learn'); setActiveUnit(u.id); setActiveTopic(null); }}
                  >
                    <span className="unit-icon">{u.icon}</span>
                    <h3>{u.label} {mastery && <span className="mastery-badge">🌟 Mastered</span>}</h3>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(done / u.topics.length) * 100}%`, background: u.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid-2">
              <button className="card" onClick={() => setCustomQuizMode(true)}>🎯 Custom Quiz Builder</button>
              <button className="card" onClick={() => { setExamActive(true); setExamAns({}); setExamSubmitted(false); setExamTime(1800); setPage('exam'); }}>📝 Full Exam</button>
              <button className="card" onClick={() => { setFcDeck(shuffle(ALL_FLASHCARDS)); setPage('flashcards'); }}>🃏 Flashcards</button>
            </div>

            {customQuizMode && (
              <div className="card">
                <h3>Build Your Custom Quiz</h3>
                <div className="grid-2">
                  {Object.values(UNITS).map(u => (
                    <label key={u.id}>
                      <input
                        type="checkbox"
                        checked={customTopics.includes(u.label)}
                        onChange={e => {
                          if (e.target.checked) setCustomTopics([...customTopics, u.label]);
                          else setCustomTopics(customTopics.filter(t => t !== u.label));
                        }}
                      /> {u.label}
                    </label>
                  ))}
                </div>
                <label>Number of questions: </label>
                <input type="number" min="3" max="20" value={customCount} onChange={e => setCustomCount(Math.min(20, Math.max(3, parseInt(e.target.value) || 5)))} />
                <div className="flex-row" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={startCustomQuiz}>Start Quiz ({customCount} Qs)</button>
                  <button className="btn btn-secondary" onClick={() => setCustomQuizMode(false)}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* LEARN */}
        {page === 'learn' && (
          <div className="learn-layout">
            <div className="learn-sidebar">
              {Object.values(UNITS).map(u => (
                <div key={u.id}>
                  <button className="sidebar-unit-btn" onClick={() => setActiveUnit(u.id)}>
                    {u.icon} {u.label}
                  </button>
                  {activeUnit === u.id && u.topics.map(t => (
                    <button
                      key={t.id}
                      className={`sidebar-topic-btn ${activeTopic?.id === t.id ? 'active' : ''} ${completed[`${u.id}-${t.id}`] ? 'done' : ''}`}
                      onClick={() => { setActiveTopic(t); markComplete(`${u.id}-${t.id}`); }}
                    >
                      {completed[`${u.id}-${t.id}`] ? '✅ ' : '○ '}{t.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {activeTopic ? (
              <div className="card">
                <h2>
                  {activeTopic.title}
                  <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => speak(activeTopic.content)}>🔊 Read</button>
                  <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={printNotes}>🖨️ Print</button>
                </h2>
                <div className="prose">{activeTopic.content}</div>
                {activeTopic.formulas && (
                  <>
                    <h3>Key Formulas</h3>
                    <div className="grid-2">
                      {activeTopic.formulas.map((f, i) => (
                        <div key={i} className="formula-card">
                          <code>{f}</code>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="flex-row" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => startQuiz(UNITS[activeUnit]?.label)}>❓ Quiz This Unit</button>
                  {getNextTopic(activeUnit, activeTopic.id) && (
                    <button className="next-topic-btn" onClick={goToNextTopic}>Next Topic →</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <p>👈 Select a topic from the sidebar to start studying</p>
              </div>
            )}
          </div>
        )}

        {/* SIMULATIONS */}
        {page === 'simulations' && (
          <>
            <h1>Interactive Simulations</h1>
            <div className="grid-2">
              {SIMULATIONS.map(s => (
                <div key={s.id} className="card">
                  <div style={{ fontSize: '2rem' }}>{s.icon}</div>
                  <h3>{s.title}</h3>
                  <s.comp />
                </div>
              ))}
            </div>
          </>
        )}

        {/* FLASHCARDS */}
        {page === 'flashcards' && (
          <>
            <h1>Flashcards</h1>
            {fcDeck.length > 0 ? (
              <>
                <div className="flashcard" onClick={() => setFcFlip(!fcFlip)}>
                  {fcFlip ? fcDeck[fcIdx]?.a : fcDeck[fcIdx]?.q}
                </div>
                <div className="flex-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => { if (fcIdx > 0) { setFcIdx(fcIdx - 1); setFcFlip(false); } }}>← Prev</button>
                  <button className="btn btn-primary" onClick={() => { setFcIdx((fcIdx + 1) % fcDeck.length); setFcFlip(false); }}>Next →</button>
                  <button className="btn btn-secondary" onClick={() => { setFcDeck(shuffle(ALL_FLASHCARDS)); setFcIdx(0); setFcFlip(false); }}>🔀 Shuffle</button>
                </div>
              </>
            ) : (
              <p>No flashcards available.</p>
            )}
          </>
        )}

        {/* QUIZ */}
        {page === 'quiz' && (
          <>
            {!quizActive ? (
              <div>
                <h1>Quiz Mode</h1>
                <div className="grid-2">
                  <button className="card" onClick={() => startQuiz('all')}>🌐 All Units</button>
                  {Object.values(UNITS).map(u => (
                    <button key={u.id} className="card" onClick={() => startQuiz(u.label)}>
                      {u.icon} {u.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : quizDone ? (
              <div className="card text-center">
                <div style={{ fontSize: '3rem' }}>{quizScore >= 8 ? '🏆' : '👍'}</div>
                <h2>{quizScore}/{quizDeck.length} correct</h2>
                <p>+{quizScore * 10 + 20} XP earned</p>
                <button className="btn btn-primary" onClick={() => setQuizActive(false)}>Back to Quiz Menu</button>
              </div>
            ) : (
              <>
                <div className="flex-between">
                  <span>Question {quizIdx + 1} of {quizDeck.length}</span>
                  <span>✅ {quizScore} correct</span>
                  <button className="btn btn-secondary" onClick={() => speak(quizDeck[quizIdx]?.q)}>🔊 Read Question</button>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(quizIdx / quizDeck.length) * 100}%` }} />
                </div>
                <div className="card">
                  <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>{quizDeck[quizIdx]?.q}</p>
                  <div className="grid-2">
                    {quizDeck[quizIdx]?.opts.map((opt, i) => (
                      <button
                        key={i}
                        className={`quiz-option ${quizSel !== null ? (i === quizDeck[quizIdx].ans ? 'correct' : (i === quizSel ? 'wrong' : '')) : ''}`}
                        onClick={() => handleQuiz(i)}
                        disabled={quizSel !== null}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {quizSel !== null && (
                  <div className={quizSel === quizDeck[quizIdx].ans ? 'feedback-correct' : 'feedback-wrong'}>
                    <p>{quizDeck[quizIdx].exp}</p>
                    <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={nextQuiz}>
                      {quizIdx + 1 >= quizDeck.length ? 'See Results →' : 'Next Question →'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* EXAM */}
        {page === 'exam' && (
          <>
            {!examActive ? (
              <div className="card text-center">
                <h1>Practice Regents Exam</h1>
                <p>10 questions · 30 minutes · Covers all topics</p>
                <button className="btn btn-primary" onClick={() => { setExamActive(true); setExamAns({}); setExamSubmitted(false); setExamTime(1800); }}>
                  Start Exam →
                </button>
              </div>
            ) : examSubmitted ? (
              <div>
                <div className="card text-center">
                  <div style={{ fontSize: '3rem' }}>{examDeck.filter((_, i) => examAns[i] === examDeck[i].ans).length >= 7 ? '🏆' : '📚'}</div>
                  <h2>Score: {examDeck.filter((_, i) => examAns[i] === examDeck[i].ans).length}/{examDeck.length}</h2>
                  <p>+{examDeck.filter((_, i) => examAns[i] === examDeck[i].ans).length * 15} XP earned</p>
                  <button className="btn btn-secondary" onClick={() => setExamActive(false)}>Back to Exam Menu</button>
                </div>
                {examDeck.map((q, i) => (
                  <div key={i} className="card" style={{ marginTop: '0.5rem' }}>
                    <p><strong>{i + 1}. {q.q}</strong></p>
                    <p>Your answer: {q.opts[examAns[i]] || '(blank)'} {examAns[i] !== q.ans && <span style={{ color: 'var(--green)' }}> · Correct: {q.opts[q.ans]}</span>}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{q.exp}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex-between">
                  <span>⏱ {Math.floor(examTime / 60)}:{(examTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Object.keys(examAns).length}/{examDeck.length} answered</span>
                </div>
                {examDeck.map((q, i) => (
                  <div key={i} className="card" style={{ marginBottom: '0.75rem' }}>
                    <p><strong>{i + 1}. {q.q}</strong></p>
                    <div className="grid-2">
                      {q.opts.map((opt, j) => (
                        <button
                          key={j}
                          className="quiz-option"
                          style={{ background: examAns[i] === j ? 'rgba(124,58,237,0.2)' : '' }}
                          onClick={() => setExamAns({ ...examAns, [i]: j })}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={submitExam}>
                  Submit Exam →
                </button>
              </>
            )}
          </>
        )}

        {/* CLUSTERS */}
        {page === 'clusters' && (
          <>
            {!clusterQuizActive ? (
              <>
                <h1>Practice Clusters</h1>
                <p style={{ marginBottom: '1rem' }}>Topic-focused question sets for targeted practice.</p>
                <div className="grid-2">
                  {CLUSTERS.map(c => (
                    <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setActiveCluster(c); setClusterQuizIdx(0); setClusterQuizSel(null); setClusterQuizScore(0); setClusterQuizDone(false); setClusterQuizActive(true); }}>
                      <h3>{c.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{c.questions.length} questions</p>
                      <span style={{ color: 'var(--nova-light)' }}>Start →</span>
                    </div>
                  ))}
                </div>
              </>
            ) : clusterQuizDone ? (
              <div className="card text-center">
                <div style={{ fontSize: '3rem' }}>{clusterQuizScore >= 1 ? '🏆' : '👍'}</div>
                <h2>{clusterQuizScore}/{activeCluster?.questions.length} correct</h2>
                <p>+{clusterQuizScore * 10 + 20} XP earned</p>
                <button className="btn btn-secondary" onClick={() => setClusterQuizActive(false)}>Back to Clusters</button>
              </div>
            ) : (
              <>
                <div className="flex-between">
                  <span>Question {clusterQuizIdx + 1} of {activeCluster?.questions.length}</span>
                  <span>✅ {clusterQuizScore}</span>
                  <button className="btn btn-secondary" onClick={() => speak(activeCluster?.questions[clusterQuizIdx]?.q)}>🔊</button>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(clusterQuizIdx / activeCluster.questions.length) * 100}%` }} />
                </div>
                <div className="card">
                  <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{activeCluster?.questions[clusterQuizIdx]?.q}</p>
                  <div className="grid-2">
                    {activeCluster?.questions[clusterQuizIdx]?.opts.map((opt, i) => (
                      <button
                        key={i}
                        className={`quiz-option ${clusterQuizSel !== null ? (i === activeCluster.questions[clusterQuizIdx].ans ? 'correct' : (i === clusterQuizSel ? 'wrong' : '')) : ''}`}
                        onClick={() => {
                          if (clusterQuizSel !== null) return;
                          setClusterQuizSel(i);
                          if (i === activeCluster.questions[clusterQuizIdx].ans) {
                            setClusterQuizScore(s => s + 1);
                            addXp(10);
                          } else {
                            trackWrong(activeCluster.questions[clusterQuizIdx].q, activeCluster.title);
                          }
                        }}
                        disabled={clusterQuizSel !== null}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {clusterQuizSel !== null && (
                  <div className={clusterQuizSel === activeCluster.questions[clusterQuizIdx].ans ? 'feedback-correct' : 'feedback-wrong'}>
                    <p>{activeCluster.questions[clusterQuizIdx].exp}</p>
                    <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => {
                      if (clusterQuizIdx + 1 >= activeCluster.questions.length) {
                        setClusterQuizDone(true);
                        addXp(20);
                      } else {
                        setClusterQuizIdx(i => i + 1);
                        setClusterQuizSel(null);
                      }
                    }}>
                      {clusterQuizIdx + 1 >= activeCluster.questions.length ? 'See Results →' : 'Next Question →'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* REFERENCE */}
        {page === 'reference' && (
          <>
            <h1>Reference Tables</h1>
            <div className="reference-table">
              <h2>Physical Constants</h2>
              <table>
                <thead><tr><th>Constant</th><th>Value</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td>g</td><td>9.81 m/s²</td><td>Gravitational acceleration</td></tr>
                  <tr><td>c</td><td>3.00 × 10⁸ m/s</td><td>Speed of light</td></tr>
                  <tr><td>h</td><td>6.63 × 10⁻³⁴ J·s</td><td>Planck's constant</td></tr>
                  <tr><td>k</td><td>8.99 × 10⁹ N·m²/C²</td><td>Coulomb's constant</td></tr>
                </tbody>
              </table>
              <h2>Metric Prefixes</h2>
              <table>
                <thead><tr><th>Prefix</th><th>Symbol</th><th>Factor</th></tr></thead>
                <tbody>
                  <tr><td>kilo</td><td>k</td><td>10³</td></tr>
                  <tr><td>mega</td><td>M</td><td>10⁶</td></tr>
                  <tr><td>milli</td><td>m</td><td>10⁻³</td></tr>
                  <tr><td>micro</td><td>μ</td><td>10⁻⁶</td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* FORMULAS */}
        {page === 'formulas' && (
          <>
            <h1>Formula Reference Sheet</h1>
            {Object.values(UNITS).map(u => (
              <div key={u.id}>
                <h2 style={{ color: u.color }}>{u.icon} {u.label}</h2>
                <div className="grid-2">
                  {u.topics.flatMap(t => (t.formulas || []).map((f, i) => (
                    <div key={`${u.id}-${i}`} className="formula-card">
                      <code dangerouslySetInnerHTML={{ __html: f }} />
                      <div className="meta" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>{t.title}</div>
                    </div>
                  )))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Floating Formula Button */}
      <div className="formula-popup" onClick={() => setFormulaVisible(true)}>📐 Formulas</div>
      {formulaVisible && (
        <div className="formula-overlay" onClick={() => setFormulaVisible(false)}>
          <div className="formula-panel" onClick={e => e.stopPropagation()}>
            <h2>Quick Formula Reference</h2>
            <div className="grid-2">
              {Object.values(UNITS).flatMap(u => u.topics[0]?.formulas || []).slice(0, 12).map((f, i) => (
                <code key={i} style={{ padding: '0.25rem' }}>{f}</code>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setFormulaVisible(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
