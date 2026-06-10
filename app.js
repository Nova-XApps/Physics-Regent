// ================================================================
//  Nova Physics Regents – app.js
//  All content, logic, and UI components
//  Bugs fixed:
//    - AI Tutor wired to Anthropic API (claude-sonnet-4-20250514)
//    - localStorage wrapped in try/catch (iframe-safe)
//    - getNextTopic no longer marks next topic as completed early
//    - examTime resets properly on retake
//    - Cluster progress tracking key fixed
//    - Flashcard flipping uses CSS 3D (no text flash)
//    - Exam answered-question tracking
// ================================================================
const { useState, useEffect, useRef, useCallback } = React;

// ── Safe localStorage helpers ──────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsClear() {
  try { localStorage.clear(); } catch {}
}

// ── Shuffle helper ─────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ================================================================
//  CONTENT – Units / Topics
// ================================================================
const UNITS = {
  foundations: {
    id: "foundations", label: "Foundations", icon: "📐", color: "#3b82f6",
    topics: [
      {
        id: "scalars-vectors", title: "Scalars vs. Vectors & Kinematics",
        content: `**Scalars:** magnitude only — time, mass, temperature, energy, work, power.
**Vectors:** magnitude + direction — force, velocity, acceleration, momentum, fields.

Distance (scalar) vs. Displacement (vector).
Speed (scalar) vs. Velocity (vector).

Average velocity: v̄ = (v_f + v_i) / 2
Acceleration: a = Δv / t

**Kinematics (constant acceleration):**
  v_f = v_i + a t
  d = v_i t + ½ a t²
  v_f² = v_i² + 2 a d

**Velocity-time graph:** slope = acceleration, area under = displacement.`,
        formulas: ["v̄ = (v<sub>f</sub> + v<sub>i</sub>) / 2","a = Δv / t","v<sub>f</sub> = v<sub>i</sub> + a t","d = v<sub>i</sub> t + ½ a t²","v<sub>f</sub>² = v<sub>i</sub>² + 2 a d"],
        flashcards: [
          { q: "What is the difference between a scalar and a vector?", a: "Scalar = magnitude only; vector = magnitude + direction." },
          { q: "Distance vs. displacement?", a: "Distance = total path length (scalar); displacement = net change in position (vector)." },
          { q: "What does the slope of a v-t graph represent?", a: "Acceleration." },
          { q: "What does the area under a v-t graph represent?", a: "Displacement." },
          { q: "What is the kinematic equation for final velocity (no d)?", a: "v_f = v_i + at" },
          { q: "Unit of acceleration?", a: "m/s²" }
        ],
        quiz: [
          { q: "A car goes from rest to 20 m/s in 5 s. Acceleration?", opts: ["4 m/s²","5 m/s²","2 m/s²","10 m/s²"], ans: 0, exp: "a = Δv/t = 20/5 = 4 m/s²" },
          { q: "A ball falls from rest for 3 s (g=10 m/s²). Final velocity?", opts: ["30 m/s","15 m/s","10 m/s","3 m/s"], ans: 0, exp: "v = 0 + 10×3 = 30 m/s" },
          { q: "Object moving at constant velocity — its acceleration is:", opts: ["0","Positive","Negative","Cannot determine"], ans: 0, exp: "Constant velocity means no change in v, so a = 0." }
        ]
      },
      {
        id: "circular-projectile", title: "Circular & Projectile Motion",
        content: `**Circular motion:**
  Centripetal acceleration: a_c = v² / r (always toward center)
  Centripetal force: F_c = m v² / r
  Doubling velocity → quadruples a_c (since a_c ∝ v²)

**Projectile motion:**
  Horizontal: v_x constant, a_x = 0
  Vertical: a_y = −9.8 m/s² (downward)
  At peak: v_y = 0; time to peak t = v_y0 / g
  Total air time = 2 t_peak
  Range = v_x × total time
  
  Components: v_x = v cosθ, v_y = v sinθ
  Resultant: v = √(v_x² + v_y²)
  Launch angle: θ = tan⁻¹(v_y / v_x)`,
        formulas: ["a<sub>c</sub> = v² / r","F<sub>c</sub> = m v² / r","v<sub>x</sub> = v cosθ","v<sub>y</sub> = v sinθ","t<sub>peak</sub> = v<sub>y0</sub> / g","range = v<sub>x</sub> × 2t<sub>peak</sub>","v = √(v<sub>x</sub>² + v<sub>y</sub>²)","θ = tan⁻¹(v<sub>y</sub>/v<sub>x</sub>)"],
        flashcards: [
          { q: "Which direction does centripetal acceleration point?", a: "Toward the center of the circle." },
          { q: "If speed doubles, how does centripetal acceleration change?", a: "It quadruples (a_c ∝ v²)." },
          { q: "Horizontal acceleration in projectile motion?", a: "0 — horizontal velocity is constant." },
          { q: "Vertical velocity at the highest point of a projectile?", a: "0 m/s" },
          { q: "What provides centripetal force for the Moon's orbit?", a: "Earth's gravity." }
        ],
        quiz: [
          { q: "v = 20 m/s, r = 5 m — centripetal acceleration?", opts: ["80 m/s²","4 m/s²","100 m/s²","20 m/s²"], ans: 0, exp: "a_c = v²/r = 400/5 = 80 m/s²" },
          { q: "A ball is launched horizontally at 15 m/s. Horizontal velocity after 3 s?", opts: ["15 m/s","0 m/s","45 m/s","29.4 m/s"], ans: 0, exp: "Horizontal velocity is constant (no horizontal acceleration)." }
        ]
      }
    ]
  },
  forces: {
    id: "forces", label: "Forces & Newton's Laws", icon: "🎯", color: "#ef4444",
    topics: [
      {
        id: "newtons-laws", title: "Newton's Laws, Weight, Normal, Inclines, Friction",
        content: `**Newton's 1st Law (Inertia):** Objects remain at rest or at constant velocity unless a net force acts on them.
**Newton's 2nd Law:** F_net = m a
**Newton's 3rd Law:** Every action has an equal and opposite reaction (different objects).

**Weight:** F_g = mg (g = 9.81 m/s²)
**Normal force:** perpendicular to surface.
  Horizontal surface: F_N = mg
  Incline: F_N = mg cosθ

**Incline components:**
  Parallel (down slope): F_∥ = mg sinθ
  Perpendicular: F_⊥ = mg cosθ

**Friction:** F_f = μ F_N
  Static (μ_s): prevents motion; kinetic (μ_k): opposes motion; μ_k < μ_s

**Equilibrium:** F_net = 0 → a = 0 (object may still move at constant speed).`,
        formulas: ["F<sub>net</sub> = m a","F<sub>g</sub> = m g","F<sub>N</sub> = m g cosθ","F<sub>∥</sub> = m g sinθ","F<sub>f</sub> = μ F<sub>N</sub>"],
        flashcards: [
          { q: "State Newton's Second Law.", a: "F_net = ma — net force equals mass times acceleration." },
          { q: "Weight formula?", a: "F_g = mg" },
          { q: "Component of gravity parallel to an incline?", a: "F_∥ = mg sinθ (down the slope)." },
          { q: "Friction formula?", a: "F_f = μ F_N" },
          { q: "Why is static friction usually greater than kinetic friction?", a: "More intermolecular bonds must be broken to initiate motion than to maintain sliding." }
        ],
        quiz: [
          { q: "10 kg box, F_net = 20 N — acceleration?", opts: ["2 m/s²","0.5 m/s²","200 m/s²","10 m/s²"], ans: 0, exp: "a = F/m = 20/10 = 2 m/s²" },
          { q: "A 5 kg block on a 30° frictionless incline. Parallel force component?", opts: ["24.5 N","42.4 N","49 N","2.5 N"], ans: 0, exp: "F_∥ = mg sinθ = 5×9.8×0.5 = 24.5 N" },
          { q: "An object in equilibrium has:", opts: ["F_net = 0","F_net > 0","Acceleration","Zero velocity"], ans: 0, exp: "Equilibrium means net force is zero, so acceleration is zero." }
        ]
      },
      {
        id: "momentum-impulse", title: "Momentum, Impulse & Collisions",
        content: `**Momentum:** p = mv (kg·m/s) — a vector quantity.
**Impulse:** J = FΔt = Δp = mΔv
**Conservation of momentum (closed system):** p_total before = p_total after

**Collision types:**
  Perfectly inelastic: objects stick together.
    (m₁ + m₂) v_f = m₁v₁ + m₂v₂

  Elastic: bounce apart; both momentum AND kinetic energy conserved.
    m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′

  Explosion (start at rest): 0 = m₁v₁ + m₂v₂

**Impulse-momentum theorem:** FΔt = Δp
  Longer Δt → smaller F (airbags, crumple zones, catching softly).`,
        formulas: ["p = m v","J = F Δt = Δp","(m₁+m₂)v<sub>f</sub> = m₁v₁ + m₂v₂","0 = m₁v₁ + m₂v₂ (explosion)"],
        flashcards: [
          { q: "Momentum formula?", a: "p = mv (vector, kg·m/s)" },
          { q: "What does impulse equal?", a: "J = FΔt = Δp (change in momentum)" },
          { q: "What is conserved in a perfectly inelastic collision?", a: "Momentum (not kinetic energy — some is lost to heat/sound)." },
          { q: "What is conserved in an elastic collision?", a: "Both momentum AND kinetic energy." },
          { q: "Why do airbags reduce injury?", a: "They increase collision time (Δt), reducing the force (F = Δp/Δt)." }
        ],
        quiz: [
          { q: "2 kg cart at 3 m/s — momentum?", opts: ["6 kg·m/s","1.5 kg·m/s","5 kg·m/s","0"], ans: 0, exp: "p = mv = 2×3 = 6 kg·m/s" },
          { q: "3 kg moving at 4 m/s collides and sticks to stationary 2 kg. Final velocity?", opts: ["2.4 m/s","4 m/s","6 m/s","1.6 m/s"], ans: 0, exp: "p_i = 12 kg·m/s; v_f = 12/(3+2) = 2.4 m/s" }
        ]
      }
    ]
  },
  energy: {
    id: "energy", label: "Energy, Work & Power", icon: "⚡", color: "#f59e0b",
    topics: [
      {
        id: "energy-types", title: "Energy Types, Work, Power, Efficiency",
        content: `**Kinetic Energy:** KE = ½mv²
**Gravitational PE:** PE_g = mgh
**Elastic PE (spring):** PE_s = ½kx² (k = spring constant, x = compression/extension)

**Conservation of energy (no friction):**
  KE_i + PE_i = KE_f + PE_f

**Work:** W = Fd cosθ
  θ = angle between force and displacement.
  Positive work → adds energy; negative work → removes energy.
  Work done by perpendicular force = 0.

**Power:** P = W/t = Fv (Watts = J/s)

**Efficiency:** % eff = (useful output / total input) × 100%`,
        formulas: ["KE = ½ m v²","PE<sub>g</sub> = m g h","PE<sub>s</sub> = ½ k x²","W = F d cosθ","P = W / t = F v","% eff = (output/input) × 100%"],
        flashcards: [
          { q: "Kinetic energy formula?", a: "KE = ½mv²" },
          { q: "Gravitational potential energy formula?", a: "PE_g = mgh" },
          { q: "Elastic potential energy formula?", a: "PE_s = ½kx²" },
          { q: "Work formula?", a: "W = Fd cosθ (θ = angle between F and d)" },
          { q: "Power formula?", a: "P = W/t = Fv" },
          { q: "Efficiency formula?", a: "(useful output / total input) × 100%" }
        ],
        quiz: [
          { q: "2 kg at 3 m/s — KE?", opts: ["9 J","6 J","3 J","12 J"], ans: 0, exp: "KE = ½×2×3² = ½×2×9 = 9 J" },
          { q: "Force perpendicular to motion does how much work?", opts: ["0 J","Maximum work","½Fd","Fd"], ans: 0, exp: "W = Fd cosθ; θ=90° → cos90°=0 → W=0." }
        ]
      },
      {
        id: "thermal-circuits", title: "Thermal Energy & Electric Circuits",
        content: `**Thermal Energy (Heat):** Q = mcΔT
  m = mass (kg), c = specific heat (J/kg·°C), ΔT = temperature change.
  Water: c = 4186 J/kg·°C (high → heats slowly). Metals: low c → heat quickly.

**2nd Law of Thermodynamics:** heat flows spontaneously from hot → cold.
**Closed system:** Q_gained + Q_lost = 0.

**Specific heat table:**
  Water: 4186 J/kg·°C | Aluminum: 900 | Copper: 385 | Iron: 450

**Ohm's Law:** V = IR
**Series circuit:** R_eq = R₁ + R₂ + ... (same I, voltage splits)
**Parallel circuit:** 1/R_eq = 1/R₁ + 1/R₂ + ... (same V, current splits)
**Electrical energy:** W = VIt = I²Rt = (V²/R)t
**Electrical power:** P = VI = I²R = V²/R`,
        formulas: ["Q = m c ΔT","Q<sub>gained</sub> + Q<sub>lost</sub> = 0","V = I R","R<sub>series</sub> = ΣR<sub>i</sub>","1/R<sub>parallel</sub> = Σ(1/R<sub>i</sub>)","P = V I = I²R = V²/R","W = V I t"],
        flashcards: [
          { q: "Thermal energy equation?", a: "Q = mcΔT" },
          { q: "Specific heat of water?", a: "4186 J/kg·°C" },
          { q: "Ohm's Law?", a: "V = IR" },
          { q: "Series total resistance?", a: "Sum of all: R_eq = R₁ + R₂ + ..." },
          { q: "Parallel total resistance formula?", a: "1/R_eq = 1/R₁ + 1/R₂ + ..." },
          { q: "Three power formulas?", a: "P = VI = I²R = V²/R" }
        ],
        quiz: [
          { q: "12V, 6Ω — current?", opts: ["2 A","0.5 A","72 A","18 A"], ans: 0, exp: "I = V/R = 12/6 = 2 A" },
          { q: "0.5 kg water heated 20°C to 30°C (c=4186). Q = ?", opts: ["20930 J","4186 J","2093 J","41860 J"], ans: 0, exp: "Q = mcΔT = 0.5×4186×10 = 20930 J" }
        ]
      }
    ]
  },
  waves: {
    id: "waves", label: "Waves & Optics", icon: "🌊", color: "#8b5cf6",
    topics: [
      {
        id: "wave-basics", title: "Wave Properties & EM Spectrum",
        content: `**Wave speed:** v = fλ
**Period:** T = 1/f

**Transverse waves:** particle motion ⊥ wave travel (light, water, strings).
**Longitudinal waves:** particle motion ∥ wave travel (sound).

**Electromagnetic Spectrum (low → high frequency):**
  Radio → Microwave → Infrared → Visible → Ultraviolet → X-ray → Gamma

**Photon energy:** E = hf (h = 6.63×10⁻³⁴ J·s)
Higher frequency = higher energy.

**Refraction:** bending of waves at media boundary.
  Index of refraction: n = c/v (c = 3×10⁸ m/s)
  Snell's Law: n₁ sinθ₁ = n₂ sinθ₂
  Light bends toward normal when entering denser medium.

**Diffraction:** waves spread after passing through narrow opening.
**Polarization:** transverse waves oscillating in one plane only.
**Resonance:** large amplitude when driving frequency = natural frequency.`,
        formulas: ["v = f λ","T = 1 / f","E = h f","n = c / v","n₁sinθ₁ = n₂sinθ₂"],
        flashcards: [
          { q: "Wave speed equation?", a: "v = fλ" },
          { q: "Period-frequency relationship?", a: "T = 1/f" },
          { q: "EM spectrum order (low→high frequency)?", a: "Radio, Microwave, IR, Visible, UV, X-ray, Gamma" },
          { q: "Photon energy formula?", a: "E = hf" },
          { q: "State Snell's Law.", a: "n₁ sinθ₁ = n₂ sinθ₂" },
          { q: "What is the index of refraction?", a: "n = c/v — ratio of speed of light in vacuum to speed in medium." }
        ],
        quiz: [
          { q: "v=340 m/s, f=170 Hz — wavelength?", opts: ["2 m","0.5 m","57800 m","510 m"], ans: 0, exp: "λ = v/f = 340/170 = 2 m" },
          { q: "A wave has period 0.25 s — frequency?", opts: ["4 Hz","0.25 Hz","2.5 Hz","25 Hz"], ans: 0, exp: "f = 1/T = 1/0.25 = 4 Hz" }
        ]
      },
      {
        id: "optics-mirrors", title: "Mirrors & Lenses",
        content: `**Mirror/Lens equation:** 1/F = 1/d_o + 1/d_i
**Magnification:** M = h_i/h_o = −d_i/d_o
  |M| > 1 → enlarged; |M| < 1 → reduced
  M > 0 → upright; M < 0 → inverted

**Sign conventions:**
  Concave mirror / converging lens: F > 0
  Convex mirror / diverging lens: F < 0
  Real image: d_i > 0 (in front of mirror / behind lens)
  Virtual image: d_i < 0 (behind mirror / in front of lens)

**Ray diagram rules:**
  1. Parallel ray → through focal point.
  2. Focal ray → parallel to principal axis.

**Plane mirror:** d_i = −d_o, M = 1 (virtual, upright, same size).
**Convex mirror:** always virtual, upright, reduced.
**Concave mirror:** real/inverted if object beyond F; virtual/upright/magnified if object inside F.

**Law of Reflection:** θ_i = θ_r.`,
        formulas: ["1/F = 1/d<sub>o</sub> + 1/d<sub>i</sub>","M = −d<sub>i</sub> / d<sub>o</sub>","θ<sub>i</sub> = θ<sub>r</sub>"],
        flashcards: [
          { q: "Mirror/lens equation?", a: "1/F = 1/d_o + 1/d_i" },
          { q: "Magnification formula?", a: "M = −d_i/d_o" },
          { q: "Concave mirror focal length sign?", a: "Positive (F > 0)." },
          { q: "Convex mirror always produces what type of image?", a: "Virtual, upright, and reduced." },
          { q: "Law of reflection?", a: "Angle of incidence = angle of reflection (θ_i = θ_r)." }
        ],
        quiz: [
          { q: "d_o=30 cm, F=10 cm — image distance?", opts: ["15 cm","7.5 cm","60 cm","20 cm"], ans: 0, exp: "1/10=1/30+1/d_i → 1/d_i=3/30−1/30=2/30 → d_i=15 cm" },
          { q: "M = −2 means the image is:", opts: ["Enlarged and inverted","Reduced and inverted","Enlarged and upright","Reduced and upright"], ans: 0, exp: "|M|=2 > 1 → enlarged; negative → inverted." }
        ]
      }
    ]
  },
  modern: {
    id: "modern", label: "Modern & Nuclear", icon: "💥", color: "#06b6d4",
    topics: [
      {
        id: "bigbang-nuclear", title: "Big Bang, Radioactivity & Nuclear Energy",
        content: `**Big Bang evidence:**
  1. Redshift: galaxies moving away (Doppler effect → expanding universe).
  2. H/He abundance: ~75% hydrogen, ~25% helium from Big Bang nucleosynthesis.
  3. Cosmic Microwave Background (CMB): thermal afterglow radiation.

**Radioactive decay types:**
  Alpha (α): emits He nucleus → Z −2, A −4
  Beta⁻ (β⁻): neutron → proton + electron → Z +1, A unchanged
  Gamma (γ): high-energy photon → Z and A unchanged

**Mass-energy equivalence:** E = mc²

**Nuclear Fission:** splits a heavy nucleus (e.g., U-235).
  Chain reaction possible; controllable in reactors; produces radioactive waste.

**Nuclear Fusion:** combines light nuclei (e.g., ²H + ³H → ⁴He + n).
  Occurs in stars; releases more energy per kg; not yet commercially controlled.`,
        formulas: ["E = m c²","α: Z→Z−2, A→A−4","β⁻: Z→Z+1, A unchanged","γ: Z and A unchanged"],
        flashcards: [
          { q: "What does redshift indicate?", a: "Galaxies are moving away — universe is expanding." },
          { q: "What is the CMB?", a: "Cosmic Microwave Background — leftover thermal radiation from the Big Bang." },
          { q: "Alpha decay changes Z by how much?", a: "−2 (and A −4)." },
          { q: "Beta decay changes Z by?", a: "+1 (neutron becomes proton; A unchanged)." },
          { q: "Fission vs. fusion?", a: "Fission splits heavy nuclei; fusion combines light nuclei. Both release energy via E=mc²." }
        ],
        quiz: [
          { q: "U-238 undergoes alpha decay. Product?", opts: ["Th-234","U-234","Th-236","Pa-234"], ans: 0, exp: "Alpha: Z−2 (92→90=Th), A−4 (238→234). Product: Th-234." },
          { q: "Gamma decay changes the atomic number by:", opts: ["0","+1","−1","+2"], ans: 0, exp: "Gamma emits only energy (photon); no change in Z or A." }
        ]
      },
      {
        id: "electrostatics-magnetism", title: "Electrostatics & Magnetism",
        content: `**Coulomb's Law:** F_e = k q₁q₂ / r²
  k = 8.99×10⁹ N·m²/C²
  Like charges: repel. Opposite charges: attract.
  Inverse-square: doubling r → force × 1/4.

**Electric field:** E = F_e / q (N/C)
  Direction: away from positive, toward negative charge.

**Magnetism:**
  Magnetic field lines run north → south (outside magnet).
  Moving charges (current) create magnetic fields.
  Changing magnetic field induces EMF (Faraday's Law).
  Applications: motors, generators, transformers, MRI.

**Right-hand rule:** point fingers in direction of current, curl toward field → thumb = force direction.`,
        formulas: ["F<sub>e</sub> = k q₁q₂ / r²","E = F<sub>e</sub> / q","k = 8.99×10⁹ N·m²/C²"],
        flashcards: [
          { q: "State Coulomb's Law.", a: "F_e = kq₁q₂/r²; k = 8.99×10⁹ N·m²/C²." },
          { q: "Like charges do what?", a: "Repel each other." },
          { q: "Electric field direction?", a: "Away from positive charge, toward negative charge." },
          { q: "What creates a magnetic field?", a: "Moving electric charges (electric current)." },
          { q: "What is Faraday's Law about?", a: "A changing magnetic field induces an electric current (EMF)." }
        ],
        quiz: [
          { q: "Two positive charges — electrostatic force is:", opts: ["Repulsive","Attractive","Zero","Gravitational"], ans: 1, exp: "Like charges repel each other." },
          { q: "If distance between charges doubles, Coulomb force becomes:", opts: ["1/4 as large","1/2 as large","4× as large","2× as large"], ans: 0, exp: "F ∝ 1/r²; doubling r → F × 1/4." }
        ]
      }
    ]
  }
};

// ================================================================
//  NGSS CLUSTERS (10 × 5-6 questions each)
// ================================================================
const CLUSTERS = [
  { id:"c1", title:"Cluster 1: Kinematics & Motion Graphs", desc:"Analyze motion graphs, calculate acceleration and displacement, interpret v-t graphs.",
    questions:[
      { q:"A car goes from rest to 20 m/s in 5 s. Acceleration?", opts:["4 m/s²","5 m/s²","2 m/s²","10 m/s²"], ans:0, exp:"a = Δv/t = 20/5 = 4 m/s²" },
      { q:"Slope of a velocity-time graph represents:", opts:["Displacement","Acceleration","Speed","Distance"], ans:1, exp:"Slope of v-t = acceleration." },
      { q:"Area under a velocity-time graph represents:", opts:["Acceleration","Velocity","Displacement","Force"], ans:2, exp:"Area under v-t = displacement." },
      { q:"Object at constant 10 m/s for 8 s. Displacement?", opts:["80 m","1.25 m","10 m","8 m"], ans:0, exp:"d = v×t = 10×8 = 80 m." },
      { q:"Ball dropped from rest. Velocity after 2 s (g=10 m/s²)?", opts:["10 m/s","20 m/s","5 m/s","0 m/s"], ans:1, exp:"v = gt = 10×2 = 20 m/s." },
      { q:"Car at 25 m/s brakes to stop in 5 s. Acceleration?", opts:["-5 m/s²","5 m/s²","-25 m/s²","25 m/s²"], ans:0, exp:"a = (0−25)/5 = −5 m/s²" }
    ]
  },
  { id:"c2", title:"Cluster 2: Forces & Newton's Laws", desc:"Apply Newton's laws, calculate net force, analyze free-body diagrams.",
    questions:[
      { q:"10 kg box, net force 20 N — acceleration?", opts:["2 m/s²","0.5 m/s²","200 m/s²","10 m/s²"], ans:0, exp:"a = F/m = 20/10 = 2 m/s²" },
      { q:"50 kg student on Earth, weight (g=9.8)?", opts:["50 N","490 N","5.1 N","9.8 N"], ans:1, exp:"Fg = mg = 50×9.8 = 490 N." },
      { q:"5 kg block on 30° frictionless incline — parallel force?", opts:["24.5 N","42.4 N","49 N","2.5 N"], ans:0, exp:"F_∥ = mg sinθ = 5×9.8×0.5 = 24.5 N." },
      { q:"Net force on object is zero. The object:", opts:["Must be at rest","Must be moving","May be at rest or at constant velocity","Will accelerate"], ans:2, exp:"F_net=0 → a=0, so velocity is constant (could be zero or nonzero)." },
      { q:"1000 kg car accelerates from rest to 15 m/s in 10 s. Net force?", opts:["1500 N","1000 N","15000 N","100 N"], ans:0, exp:"a=1.5 m/s²; F=ma=1000×1.5=1500 N." }
    ]
  },
  { id:"c3", title:"Cluster 3: Circular Motion & Gravitation", desc:"Centripetal acceleration/force, gravitational force, orbital motion.",
    questions:[
      { q:"2 kg ball, r=4 m, v=6 m/s — centripetal force?", opts:["18 N","3 N","72 N","12 N"], ans:0, exp:"F_c = mv²/r = 2×36/4 = 18 N." },
      { q:"Radius doubled, speed constant — centripetal force:", opts:["Doubles","Halves","Quadruples","Unchanged"], ans:1, exp:"F_c ∝ 1/r; doubling r halves F_c." },
      { q:"Object in uniform circular motion — velocity direction:", opts:["Toward center","Away from center","Tangent to circle","Toward Earth"], ans:2, exp:"Velocity is always tangent (perpendicular to the radius)." },
      { q:"Distance between masses doubles — gravitational force:", opts:["Doubles","Halves","Quadruples","Becomes 1/4"], ans:3, exp:"F_g ∝ 1/r²; doubling r → force × 1/4." },
      { q:"What provides centripetal force for Moon's orbit?", opts:["Earth's gravity","Normal force","Tension","Moon's thrust"], ans:0, exp:"Gravity from Earth acts as the centripetal force for lunar orbit." }
    ]
  },
  { id:"c4", title:"Cluster 4: Momentum & Collisions", desc:"Conservation of momentum, impulse, elastic/inelastic collisions.",
    questions:[
      { q:"2 kg cart at 3 m/s — momentum?", opts:["6 kg·m/s","1.5 kg·m/s","5 kg·m/s","0"], ans:0, exp:"p = mv = 2×3 = 6 kg·m/s." },
      { q:"0.2 kg ball at 15 m/s stopped in 0.03 s — average force?", opts:["100 N","200 N","50 N","300 N"], ans:0, exp:"F = Δp/Δt = (0.2×15)/0.03 = 100 N." },
      { q:"3 kg (4 m/s) + stationary 2 kg stick together. Final v?", opts:["2.4 m/s","4 m/s","6 m/s","1.6 m/s"], ans:0, exp:"p_i=12; v_f=12/(3+2)=2.4 m/s." },
      { q:"Elastic collision — equal masses — after collision:", opts:["Stick together","Exchange velocities","Both stop","One stops"], ans:1, exp:"Equal-mass elastic collision → velocities exchange." },
      { q:"50 kg skater pushes off 75 kg skater (50 kg moves at 2 m/s right). 75 kg velocity?", opts:["−1.33 m/s","−2 m/s","−1 m/s","−0.5 m/s"], ans:0, exp:"0=50×2+75×v → v=−100/75=−1.33 m/s." }
    ]
  },
  { id:"c5", title:"Cluster 5: Work, Energy & Power", desc:"Calculate KE/PE, work, power, apply conservation of energy.",
    questions:[
      { q:"2 kg at 3 m/s — KE?", opts:["9 J","6 J","3 J","12 J"], ans:0, exp:"KE=½×2×9=9 J." },
      { q:"10 kg lifted 5 m (g=10 m/s²) — PE gained?", opts:["50 J","500 J","100 J","250 J"], ans:1, exp:"PE=mgh=10×10×5=500 J." },
      { q:"20 N force moves object 3 m — work done?", opts:["60 J","20 J","6.7 J","0 J"], ans:0, exp:"W=Fd=20×3=60 J." },
      { q:"500 W microwave for 10 s — energy used?", opts:["5000 J","50 J","500 J","5 J"], ans:0, exp:"W=Pt=500×10=5000 J." },
      { q:"60 kg student climbs 3 m stairs in 4 s (g=10) — power?", opts:["450 W","180 W","720 W","45 W"], ans:0, exp:"W=mgh=1800 J; P=W/t=1800/4=450 W." }
    ]
  },
  { id:"c6", title:"Cluster 6: Thermal Energy & Heat Transfer", desc:"Apply Q=mcΔT, heat transfer, specific heat.",
    questions:[
      { q:"0.5 kg water, 20°C→30°C (c=4186). Q=?", opts:["20930 J","4186 J","2093 J","41860 J"], ans:0, exp:"Q=0.5×4186×10=20930 J." },
      { q:"Metal with low specific heat will:", opts:["Heat up slowly","Heat up quickly","Store more energy","Not change temperature"], ans:1, exp:"Low c → small energy needed per degree → heats quickly." },
      { q:"Heat flows spontaneously:", opts:["Cold → hot","Hot → cold","Solid → liquid","Gas → solid"], ans:1, exp:"2nd Law of Thermodynamics: heat flows from hot to cold." },
      { q:"2 kg aluminum (c=900), 25°C→75°C. Q=?", opts:["90000 J","45000 J","180000 J","22500 J"], ans:0, exp:"Q=2×900×50=90000 J." }
    ]
  },
  { id:"c7", title:"Cluster 7: Electric Circuits & Ohm's Law", desc:"Analyze series/parallel circuits, power and energy calculations.",
    questions:[
      { q:"12 V, 6 Ω — current?", opts:["2 A","0.5 A","72 A","18 A"], ans:0, exp:"I=V/R=12/6=2 A." },
      { q:"3 Ω and 6 Ω in series — total R?", opts:["9 Ω","2 Ω","18 Ω","0.5 Ω"], ans:0, exp:"R_s=3+6=9 Ω." },
      { q:"3 Ω and 6 Ω in parallel — total R?", opts:["2 Ω","9 Ω","0.5 Ω","18 Ω"], ans:0, exp:"1/R=1/3+1/6=1/2 → R=2 Ω." },
      { q:"4 Ω resistor, 2 A current — power?", opts:["16 W","8 W","2 W","4 W"], ans:0, exp:"P=I²R=4×4=16 W." },
      { q:"60 W lamp at 120 V — current?", opts:["0.5 A","2 A","7200 A","60 A"], ans:0, exp:"I=P/V=60/120=0.5 A." }
    ]
  },
  { id:"c8", title:"Cluster 8: Waves & EM Spectrum", desc:"Apply v=fλ, analyze wave properties, photon energy.",
    questions:[
      { q:"v=340 m/s, f=170 Hz — wavelength?", opts:["2 m","0.5 m","57800 m","510 m"], ans:0, exp:"λ=v/f=340/170=2 m." },
      { q:"Period = 0.25 s — frequency?", opts:["4 Hz","0.25 Hz","2.5 Hz","25 Hz"], ans:0, exp:"f=1/T=1/0.25=4 Hz." },
      { q:"EM spectrum low → high frequency:", opts:["Radio, IR, Visible, UV, X-ray, Gamma","Gamma, X-ray, UV, Visible, IR, Radio","Radio, Visible, IR, UV, Gamma","Visible, Radio, IR, UV, Gamma"], ans:0, exp:"Radio (lowest) → Microwave → IR → Visible → UV → X-ray → Gamma (highest)." },
      { q:"Photon energy formula:", opts:["E=hf","E=mc²","E=½mv²","E=mgh"], ans:0, exp:"E=hf where h=6.63×10⁻³⁴ J·s." },
      { q:"Higher frequency light has:", opts:["Higher energy","Lower energy","Same energy","No energy"], ans:0, exp:"E=hf → higher f → higher E." }
    ]
  },
  { id:"c9", title:"Cluster 9: Optics – Mirrors & Lenses", desc:"Mirror/lens equation, magnification, image characteristics.",
    questions:[
      { q:"d_o=30 cm, F=10 cm — image distance?", opts:["15 cm","7.5 cm","60 cm","20 cm"], ans:0, exp:"1/d_i=1/10−1/30=2/30 → d_i=15 cm." },
      { q:"Concave mirror, F=15 cm, object at 25 cm — image is:", opts:["Real and inverted","Virtual and upright","Virtual and inverted","Real and upright"], ans:0, exp:"Object beyond F → real, inverted image." },
      { q:"Convex mirror always produces:", opts:["Virtual, upright, reduced","Real, inverted, enlarged","Virtual, inverted, reduced","Real, upright, enlarged"], ans:0, exp:"Convex mirrors always produce virtual, upright, reduced images." },
      { q:"Magnification of −2 means:", opts:["Enlarged and inverted","Reduced and inverted","Enlarged and upright","Reduced and upright"], ans:0, exp:"|M|=2>1 → enlarged; negative → inverted." },
      { q:"Plane mirror image is:", opts:["Virtual, upright, same size","Real, inverted, same size","Virtual, inverted, reduced","Real, upright, enlarged"], ans:0, exp:"Plane mirror: virtual, upright, same size." }
    ]
  },
  { id:"c10", title:"Cluster 10: Nuclear Physics & Modern", desc:"Alpha/beta/gamma decay, E=mc², fission vs. fusion.",
    questions:[
      { q:"Alpha decay changes atomic number by:", opts:["-2","+2","-1","0"], ans:0, exp:"Alpha (He nucleus) removes 2 protons → Z decreases by 2." },
      { q:"Beta decay changes atomic number by:", opts:["+1","-1","0","+2"], ans:0, exp:"Beta: neutron→proton → Z increases by 1." },
      { q:"Gamma decay changes atomic number by:", opts:["0","+1","-1","+2"], ans:0, exp:"Gamma emits only a photon → Z and A unchanged." },
      { q:"E=mc² relates:", opts:["Mass and energy","Force and mass","Velocity and energy","Power and time"], ans:0, exp:"Mass can be converted to energy: E=mc²." },
      { q:"Fusion occurs naturally in:", opts:["Stars","Nuclear reactors","X-ray machines","Batteries"], ans:0, exp:"Stars fuse hydrogen nuclei into helium under extreme pressure and temperature." }
    ]
  }
];

// ================================================================
//  REFERENCE DATA
// ================================================================
const REFERENCE_DATA = {
  constants: [
    { name:"Gravitational acceleration (g)", value:"9.81 m/s²", description:"Near Earth's surface" },
    { name:"Speed of light (c)", value:"3.00 × 10⁸ m/s", description:"In vacuum" },
    { name:"Planck's constant (h)", value:"6.63 × 10⁻³⁴ J·s", description:"Quantum mechanics" },
    { name:"Gravitational constant (G)", value:"6.67 × 10⁻¹¹ N·m²/kg²", description:"Universal gravitation" },
    { name:"Coulomb's constant (k)", value:"8.99 × 10⁹ N·m²/C²", description:"Electrostatic force" }
  ],
  units: [
    { quantity:"Force", unit:"Newton (N)", equivalent:"kg·m/s²" },
    { quantity:"Energy / Work", unit:"Joule (J)", equivalent:"N·m = kg·m²/s²" },
    { quantity:"Power", unit:"Watt (W)", equivalent:"J/s" },
    { quantity:"Charge", unit:"Coulomb (C)", equivalent:"A·s" },
    { quantity:"Voltage", unit:"Volt (V)", equivalent:"J/C" },
    { quantity:"Resistance", unit:"Ohm (Ω)", equivalent:"V/A" }
  ],
  prefixes: [
    { prefix:"kilo (k)", factor:"10³", meaning:"thousand" },
    { prefix:"mega (M)", factor:"10⁶", meaning:"million" },
    { prefix:"giga (G)", factor:"10⁹", meaning:"billion" },
    { prefix:"milli (m)", factor:"10⁻³", meaning:"thousandth" },
    { prefix:"micro (μ)", factor:"10⁻⁶", meaning:"millionth" },
    { prefix:"nano (n)", factor:"10⁻⁹", meaning:"billionth" }
  ],
  conversions: [
    { from:"1 m/s", to:"3.6 km/h", description:"Speed conversion" },
    { from:"1 kg·m/s²", to:"1 N", description:"Force conversion" },
    { from:"1 N·m", to:"1 J", description:"Work/energy conversion" },
    { from:"1 J/s", to:"1 W", description:"Power conversion" }
  ]
};

// ================================================================
//  Build master pools
// ================================================================
let ALL_FLASHCARDS = [];
let ALL_QUIZ = [];
Object.values(UNITS).forEach(unit => {
  unit.topics.forEach(topic => {
    (topic.flashcards || []).forEach(f => ALL_FLASHCARDS.push({ ...f, unit: unit.label, topic: topic.title }));
    (topic.quiz || []).forEach(q => ALL_QUIZ.push({ ...q, unit: unit.label, topic: topic.title }));
  });
});
CLUSTERS.forEach(c => c.questions.forEach(q => ALL_QUIZ.push({ ...q, unit: "Clusters", topic: c.title })));

// ================================================================
//  SIMULATIONS
// ================================================================
const EnergyBarSim = () => {
  const [h, setH] = useState(25);
  const m = 2, g = 9.81, maxH = 50;
  const pe = m * g * h, ke = m * g * maxH - pe;
  const peW = Math.round((pe / (m * g * maxH)) * 100);
  const keW = 100 - peW;
  return (
    <div>
      <label className="sim-controls">Height (m): <strong style={{color:"#00d4ff"}}>{h}</strong></label>
      <input type="range" min="0" max="50" value={h} onChange={e => setH(+e.target.value)} style={{width:"100%", accentColor:"#00d4ff", margin:"0.4rem 0"}} />
      <div style={{display:"flex", gap:"0.5rem", marginBottom:"0.5rem"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"0.7rem", color:"#f59e0b", marginBottom:"0.2rem"}}>PE_g</div>
          <div style={{background:"#1e3a52", borderRadius:"4px", height:"18px", overflow:"hidden"}}>
            <div style={{width:`${peW}%`, height:"100%", background:"linear-gradient(90deg,#f59e0b,#ef4444)", transition:"width 0.2s"}} />
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:"0.7rem", color:"#00d4ff", marginBottom:"0.2rem"}}>KE</div>
          <div style={{background:"#1e3a52", borderRadius:"4px", height:"18px", overflow:"hidden"}}>
            <div style={{width:`${keW}%`, height:"100%", background:"linear-gradient(90deg,#00d4ff,#7c3aed)", transition:"width 0.2s"}} />
          </div>
        </div>
      </div>
      <div className="sim-output">
        <span><span className="label">PE_g = </span>{pe.toFixed(0)} J</span>
        <span><span className="label">KE = </span>{ke.toFixed(0)} J</span>
        <span><span className="label">Total = </span>{(pe + ke).toFixed(0)} J</span>
      </div>
    </div>
  );
};

const OhmsLawSim = () => {
  const [v, setV] = useState(12), [r, setR] = useState(6);
  const i = v / r, p = v * i;
  return (
    <div>
      <label className="sim-controls">Voltage: <strong style={{color:"#f59e0b"}}>{v} V</strong></label>
      <input type="range" min="1" max="24" value={v} onChange={e => setV(+e.target.value)} style={{width:"100%", accentColor:"#f59e0b", margin:"0.25rem 0 0.6rem"}} />
      <label className="sim-controls">Resistance: <strong style={{color:"#ef4444"}}>{r} Ω</strong></label>
      <input type="range" min="1" max="20" value={r} onChange={e => setR(+e.target.value)} style={{width:"100%", accentColor:"#ef4444", margin:"0.25rem 0 0.6rem"}} />
      <div style={{background:"#0a192f", border:"1px solid #1e3a52", borderRadius:"8px", padding:"0.75rem", fontFamily:"monospace", fontSize:"0.9rem", color:"#00d4ff", textAlign:"center", marginBottom:"0.5rem"}}>
        {v} V = {i.toFixed(2)} A × {r} Ω
      </div>
      <div className="sim-output">
        <span><span className="label">I = </span>{i.toFixed(2)} A</span>
        <span><span className="label">P = </span>{p.toFixed(1)} W</span>
        <span><span className="label">W (10s) = </span>{(p * 10).toFixed(0)} J</span>
      </div>
    </div>
  );
};

const WaveSim = () => {
  const [f, setF] = useState(2), [a, setA] = useState(35), [animate, setAnimate] = useState(true);
  const phaseRef = useRef(0);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const draw = () => {
      ctx.clearRect(0, 0, 400, 100);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= 400; x++) {
        const y = 50 + a * Math.sin(2 * Math.PI * f * x / 100 - phaseRef.current);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (animate) { phaseRef.current += 0.08; rafRef.current = requestAnimationFrame(draw); }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [f, a, animate]);
  return (
    <div>
      <label className="sim-controls">Frequency: <strong style={{color:"#8b5cf6"}}>{f} Hz</strong></label>
      <input type="range" min="1" max="8" value={f} onChange={e => setF(+e.target.value)} style={{width:"100%", accentColor:"#8b5cf6", margin:"0.25rem 0 0.6rem"}} />
      <label className="sim-controls">Amplitude: <strong style={{color:"#00d4ff"}}>{a}</strong></label>
      <input type="range" min="10" max="45" value={a} onChange={e => setA(+e.target.value)} style={{width:"100%", accentColor:"#00d4ff", margin:"0.25rem 0 0.6rem"}} />
      <canvas ref={canvasRef} width="400" height="100" style={{width:"100%", background:"#0a192f", borderRadius:"6px", display:"block"}} />
      <div className="sim-output" style={{marginTop:"0.5rem"}}>
        <span><span className="label">λ ≈ </span>{(340 / f).toFixed(1)} m</span>
        <span><span className="label">T = </span>{(1 / f).toFixed(3)} s</span>
        <button onClick={() => setAnimate(x => !x)} style={{background:"transparent", border:"1px solid #2c5274", color:"#6a9bbb", padding:"0.1rem 0.5rem", borderRadius:"4px", fontSize:"0.72rem", cursor:"pointer"}}>{animate ? "⏸ Pause" : "▶ Play"}</button>
      </div>
    </div>
  );
};

const ProjectileSim = () => {
  const [ang, setAng] = useState(45), [sp, setSp] = useState(20);
  const rad = ang * Math.PI / 180;
  const vx = sp * Math.cos(rad), vy = sp * Math.sin(rad);
  const t = 2 * vy / 9.81, range = vx * t, maxH = vy * vy / (2 * 9.81);
  const points = [];
  for (let i = 0; i <= 50; i++) {
    const ti = (i / 50) * t;
    const x = vx * ti, y = vy * ti - 0.5 * 9.81 * ti * ti;
    points.push([x, y]);
  }
  const scaleX = 360 / Math.max(range, 1), scaleY = 80 / Math.max(maxH, 1);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${20 + p[0] * scaleX} ${90 - p[1] * scaleY}`).join(' ');
  return (
    <div>
      <label className="sim-controls">Launch angle: <strong style={{color:"#f59e0b"}}>{ang}°</strong></label>
      <input type="range" min="5" max="85" value={ang} onChange={e => setAng(+e.target.value)} style={{width:"100%", accentColor:"#f59e0b", margin:"0.25rem 0 0.6rem"}} />
      <label className="sim-controls">Initial speed: <strong style={{color:"#00d4ff"}}>{sp} m/s</strong></label>
      <input type="range" min="5" max="40" value={sp} onChange={e => setSp(+e.target.value)} style={{width:"100%", accentColor:"#00d4ff", margin:"0.25rem 0 0.6rem"}} />
      <svg viewBox="0 0 400 100" style={{width:"100%", background:"#0a192f", borderRadius:"6px", display:"block"}}>
        <line x1="20" y1="90" x2="380" y2="90" stroke="#1e3a52" strokeWidth="1" />
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="20" cy="90" r="4" fill="#00d4ff" />
      </svg>
      <div className="sim-output" style={{marginTop:"0.5rem"}}>
        <span><span className="label">Range = </span>{range.toFixed(1)} m</span>
        <span><span className="label">Max height = </span>{maxH.toFixed(1)} m</span>
        <span><span className="label">Time = </span>{t.toFixed(2)} s</span>
      </div>
    </div>
  );
};

const SIMULATIONS = [
  { id:"energy", title:"Energy Bar Chart", icon:"⚡", desc:"Explore KE/PE trade-off", comp:EnergyBarSim },
  { id:"ohms", title:"Ohm's Law", icon:"🔋", desc:"Vary voltage & resistance", comp:OhmsLawSim },
  { id:"wave", title:"Wave Properties", icon:"🌊", desc:"Animate frequency & amplitude", comp:WaveSim },
  { id:"proj", title:"Projectile Motion", icon:"🎯", desc:"Adjust launch angle & speed", comp:ProjectileSim }
];

// ================================================================
//  AI TUTOR component (Anthropic API)
// ================================================================
const SYSTEM_PROMPT = `You are Nova, an expert Physics Regents tutor for New York State high school students. 
You know the entire NY Regents Physics curriculum: kinematics, Newton's laws, momentum, energy, waves, optics, electricity, magnetism, nuclear physics, and modern physics.
Give clear, concise explanations. Show step-by-step solutions when appropriate. 
Use simple language. Reference relevant formulas. Be encouraging.
Keep answers under 200 words unless the student asks for more detail.`;

const AITutor = () => {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm Nova 🤖 Your Physics Regents AI tutor. Ask me anything — formulas, concepts, practice problems, or exam strategies!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      // Build conversation history for the API
      const history = messages
        .filter(m => m.role !== "ai" || messages.indexOf(m) > 0) // skip opening greeting
        .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
      history.push({ role: "user", content: q });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history
        })
      });
      const data = await res.json();
      const reply = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim()
        || "Sorry, I couldn't get a response. Please try again!";
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: "Connection error. Check your network and try again." }]);
    }
    setLoading(false);
  }, [input, loading, messages]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = [
    "Explain Newton's Second Law with an example",
    "How do I solve a projectile motion problem?",
    "What's the difference between elastic and inelastic collisions?",
    "Explain the mirror equation step by step"
  ];

  return (
    <div>
      <div className="tutor-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className={`msg-avatar ${m.role}`}>{m.role === "ai" ? "🤖" : "👤"}</div>
            <div className="msg-bubble" style={{whiteSpace:"pre-wrap"}}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="msg ai">
            <div className="msg-avatar ai">🤖</div>
            <div className="msg-bubble">
              <div className="typing-indicator"><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div style={{marginBottom:"0.75rem"}}>
          <div className="section-title">Try asking:</div>
          <div style={{display:"flex", gap:"0.4rem", flexWrap:"wrap"}}>
            {suggestions.map((s, i) => (
              <button key={i}
                style={{background:"var(--bg3)", border:"1px solid var(--border)", color:"var(--text-muted)", padding:"0.35rem 0.7rem", borderRadius:"99px", fontSize:"0.72rem", cursor:"pointer", transition:"all 0.2s"}}
                onMouseEnter={e => e.target.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.target.style.borderColor = "var(--border)"}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      <div className="tutor-input-row">
        <textarea ref={inputRef} className="tutor-input" rows="2" placeholder="Ask Nova a physics question... (Enter to send)" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
        <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()} style={{alignSelf:"flex-end", padding:"0.6rem 1rem"}}>
          {loading ? "..." : "Send ↑"}
        </button>
      </div>
    </div>
  );
};

// ================================================================
//  MAIN APP
// ================================================================
const App = () => {
  const [page, setPage] = useState('dashboard');

  // Learn state
  const [activeUnit, setActiveUnit] = useState('foundations');
  const [activeTopic, setActiveTopic] = useState(null);

  // Progress
  const [xp, setXp] = useState(() => lsGet('xp', 0));
  const [completed, setCompleted] = useState(() => lsGet('completed', {}));

  // Flashcards
  const [fcDeck, setFcDeck] = useState(() => shuffle(ALL_FLASHCARDS));
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  // Quiz
  const [quizDeck, setQuizDeck] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSel, setQuizSel] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  // Exam
  const [examDeck] = useState(() => shuffle(ALL_QUIZ).slice(0, 20));
  const [examAns, setExamAns] = useState({});
  const [examTime, setExamTime] = useState(1800);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const timerRef = useRef(null);

  // Clusters
  const [activeCluster, setActiveCluster] = useState(null);
  const [clusterIdx, setClusterIdx] = useState(0);
  const [clusterSel, setClusterSel] = useState(null);
  const [clusterScore, setClusterScore] = useState(0);
  const [clusterDone, setClusterDone] = useState(false);

  // Sims
  const [openSim, setOpenSim] = useState(null);

  // ── Exam timer ──
  useEffect(() => {
    if (examStarted && !examSubmitted) {
      timerRef.current = setInterval(() => setExamTime(t => t > 0 ? t - 1 : 0), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [examStarted, examSubmitted]);
  useEffect(() => {
    if (examStarted && !examSubmitted && examTime === 0) submitExam();
  }, [examTime]);

  // ── XP / progress helpers ──
  const addXp = amt => {
    const n = xp + amt;
    setXp(n);
    lsSet('xp', n);
  };
  const markComplete = key => {
    const c = { ...completed, [key]: true };
    setCompleted(c);
    lsSet('completed', c);
  };
  const resetProgress = () => {
    if (!confirm('Reset all progress? This will clear XP and completed topics.')) return;
    setXp(0);
    setCompleted({});
    lsClear();
    window.location.reload();
  };

  // ── Topic navigation ──
  const getNextTopic = (unitId, topicId) => {
    const unit = UNITS[unitId];
    if (!unit) return null;
    const idx = unit.topics.findIndex(t => t.id === topicId);
    if (idx !== -1 && idx + 1 < unit.topics.length)
      return { unitId, topic: unit.topics[idx + 1] };
    const unitIds = Object.keys(UNITS);
    const uIdx = unitIds.findIndex(id => id === unitId);
    if (uIdx !== -1 && uIdx + 1 < unitIds.length) {
      const nextUnit = UNITS[unitIds[uIdx + 1]];
      return { unitId: unitIds[uIdx + 1], topic: nextUnit.topics[0] };
    }
    return null;
  };

  const goToNextTopic = () => {
    if (!activeTopic) return;
    const next = getNextTopic(activeUnit, activeTopic.id);
    if (next) {
      setActiveUnit(next.unitId);
      setActiveTopic(next.topic);
      // Only mark the CURRENT topic as complete when moving on; next opens fresh
      markComplete(`${activeUnit}-${activeTopic.id}`);
      addXp(5);
    }
  };

  // ── Quiz ──
  const startQuiz = (filter) => {
    const pool = filter === 'all' ? ALL_QUIZ : ALL_QUIZ.filter(q => q.unit === filter);
    setQuizDeck(shuffle(pool).slice(0, 10));
    setQuizIdx(0);
    setQuizSel(null);
    setQuizScore(0);
    setQuizDone(false);
    setQuizStarted(true);
    setPage('quiz');
  };
  const handleQuizAnswer = idx => {
    if (quizSel !== null) return;
    setQuizSel(idx);
    if (idx === quizDeck[quizIdx].ans) { setQuizScore(s => s + 1); addXp(10); }
  };
  const nextQuiz = () => {
    if (quizIdx + 1 >= quizDeck.length) { setQuizDone(true); addXp(20); }
    else { setQuizIdx(i => i + 1); setQuizSel(null); }
  };

  // ── Exam ──
  const startExam = () => {
    setExamAns({});
    setExamTime(1800);
    setExamSubmitted(false);
    setExamStarted(true);
  };
  const submitExam = () => {
    clearInterval(timerRef.current);
    const correct = examDeck.filter((_, i) => examAns[i] === examDeck[i].ans).length;
    setExamSubmitted(true);
    addXp(correct * 15);
  };
  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Clusters ──
  const startCluster = c => {
    setActiveCluster(c);
    setClusterIdx(0);
    setClusterSel(null);
    setClusterScore(0);
    setClusterDone(false);
  };
  const handleClusterAnswer = idx => {
    if (clusterSel !== null) return;
    setClusterSel(idx);
    if (idx === activeCluster.questions[clusterIdx].ans) { setClusterScore(s => s + 1); addXp(10); }
  };
  const nextCluster = () => {
    if (clusterIdx + 1 >= activeCluster.questions.length) { setClusterDone(true); addXp(20); }
    else { setClusterIdx(i => i + 1); setClusterSel(null); }
  };

  // ── Derived ──
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = 100 - (xp % 100);
  const totalTopics = Object.values(UNITS).reduce((s, u) => s + u.topics.length, 0);
  const completedCount = Object.keys(completed).length;

  const NAV = [
    { id:'dashboard', label:'🏠 Home' },
    { id:'learn',     label:'📖 Learn' },
    { id:'simulations', label:'🔬 Simulations' },
    { id:'flashcards', label:'🃏 Flashcards' },
    { id:'quiz',      label:'❓ Quiz' },
    { id:'exam',      label:'📝 Exam' },
    { id:'clusters',  label:'📚 Clusters' },
    { id:'reference', label:'📋 Reference' },
    { id:'formulas',  label:'📐 Formulas' },
    { id:'ai-tutor',  label:'🤖 AI Tutor' }
  ];

  const navTo = id => {
    setPage(id);
    setQuizStarted(false);
    setActiveCluster(null);
    setClusterDone(false);
  };

  // ================================================================
  //  RENDER
  // ================================================================
  return (
    <div>
      {/* ── Header ── */}
      <div className="header">
        <div className="logo">⚛️ Nova <span>Physics Regents</span></div>
        <nav className="nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-btn ${page === n.id ? 'active' : ''}`} onClick={() => navTo(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="xp-badge">
          🔥 Lv.{level} &nbsp; {xp} XP &nbsp;|&nbsp; {xpToNext} to next
          <button className="btn btn-danger" onClick={resetProgress}>Reset</button>
        </div>
      </div>

      <div className="container">

        {/* ============================================================
            DASHBOARD
        ============================================================ */}
        {page === 'dashboard' && (
          <div>
            <h1>Your Nova Dashboard</h1>
            <div className="yt-wrap">
              <iframe src="https://www.youtube.com/embed/IYruBR8nDjk" title="Physics Review" allowFullScreen />
            </div>

            {/* Stats */}
            <div className="grid-stat">
              <div className="stat-card"><div className="stat-value">{xp}</div><div className="stat-label">Total XP</div></div>
              <div className="stat-card"><div className="stat-value">Lv.{level}</div><div className="stat-label">Level</div></div>
              <div className="stat-card"><div className="stat-value">{completedCount}</div><div className="stat-label">Topics Done</div></div>
              <div className="stat-card"><div className="stat-value">{totalTopics - completedCount}</div><div className="stat-label">Remaining</div></div>
            </div>

            {/* Level progress */}
            <div className="card" style={{marginBottom:"1rem"}}>
              <div className="flex-between" style={{marginBottom:"0.4rem"}}>
                <span style={{fontSize:"0.8rem", fontWeight:600}}>Level {level} → {level + 1}</span>
                <span style={{fontSize:"0.75rem", color:"var(--text-muted)"}}>{xp % 100}/100 XP</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{width:`${xp % 100}%`}} /></div>
            </div>

            {/* Units */}
            <div className="section-title">Units</div>
            <div className="grid-2">
              {Object.values(UNITS).map(u => {
                const done = u.topics.filter(t => completed[`${u.id}-${t.id}`]).length;
                const mastery = done === u.topics.length;
                return (
                  <div key={u.id} className={`card unit-card clickable ${mastery ? 'completed' : ''}`}
                    onClick={() => { navTo('learn'); setActiveUnit(u.id); setActiveTopic(null); }}>
                    <div className="unit-icon">{u.icon}</div>
                    <h3>{u.label} {mastery && <span className="mastery-badge">🌟 Mastered</span>}</h3>
                    <div className="unit-meta">{done}/{u.topics.length} topics</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width:`${(done / u.topics.length) * 100}%`, background: u.color}} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="section-title">Quick Actions</div>
            <div className="action-grid">
              <div className="action-card" onClick={() => { setFcDeck(shuffle(ALL_FLASHCARDS)); setFcIdx(0); setFcFlipped(false); navTo('flashcards'); }}>
                <span className="ac-icon">🃏</span><span>Flashcards</span>
              </div>
              <div className="action-card" onClick={() => startQuiz('all')}>
                <span className="ac-icon">❓</span><span>Random Quiz</span>
              </div>
              <div className="action-card" onClick={() => { startExam(); navTo('exam'); }}>
                <span className="ac-icon">📝</span><span>Practice Exam</span>
              </div>
              <div className="action-card" onClick={() => navTo('clusters')}>
                <span className="ac-icon">📚</span><span>Clusters</span>
              </div>
              <div className="action-card" onClick={() => navTo('simulations')}>
                <span className="ac-icon">🔬</span><span>Simulations</span>
              </div>
              <div className="action-card" onClick={() => navTo('ai-tutor')}>
                <span className="ac-icon">🤖</span><span>AI Tutor</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            LEARN
        ============================================================ */}
        {page === 'learn' && (
          <div className="learn-layout">
            {/* Sidebar */}
            <div className="sidebar">
              {Object.values(UNITS).map(u => (
                <div key={u.id}>
                  <button className={`sidebar-unit-btn ${activeUnit === u.id ? 'open' : ''}`}
                    onClick={() => setActiveUnit(activeUnit === u.id ? null : u.id)}>
                    <span>{u.icon}</span> {u.label}
                  </button>
                  {activeUnit === u.id && (
                    <div>
                      {u.topics.map(t => (
                        <button key={t.id}
                          className={`sidebar-topic-btn ${activeTopic?.id === t.id ? 'active' : ''} ${completed[`${u.id}-${t.id}`] ? 'done' : ''}`}
                          onClick={() => {
                            setActiveTopic(t);
                            markComplete(`${u.id}-${t.id}`);
                            addXp(5);
                          }}>
                          {completed[`${u.id}-${t.id}`] ? '✅ ' : '○ '}{t.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Content */}
            {activeTopic ? (
              <div className="topic-content">
                <h2>{activeTopic.title}</h2>
                <div className="prose">{activeTopic.content}</div>

                {activeTopic.formulas?.length > 0 && (
                  <>
                    <h3 style={{marginTop:"1.25rem", color:"var(--accent3)"}}>Key Formulas</h3>
                    <div className="formula-grid">
                      {activeTopic.formulas.map((f, i) => (
                        <div key={i} className="formula-card" dangerouslySetInnerHTML={{__html: f}} />
                      ))}
                    </div>
                  </>
                )}

                <div className="flex-row" style={{marginTop:"1.25rem"}}>
                  <button className="btn btn-secondary"
                    onClick={() => { setFcDeck(shuffle(activeTopic.flashcards || [])); setFcIdx(0); setFcFlipped(false); navTo('flashcards'); }}>
                    🃏 Study Flashcards
                  </button>
                  <button className="btn btn-secondary"
                    onClick={() => startQuiz(UNITS[activeUnit]?.label)}>
                    ❓ Take Quiz
                  </button>
                  {(() => {
                    const next = getNextTopic(activeUnit, activeTopic.id);
                    return next && (
                      <button className="btn btn-next" onClick={goToNextTopic}>
                        ➡️ Next: {next.topic.title}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="topic-content text-center" style={{padding:"3rem"}}>
                <div style={{fontSize:"2.5rem", marginBottom:"0.75rem"}}>👈</div>
                <p>Select a topic from the sidebar to begin studying.</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            SIMULATIONS
        ============================================================ */}
        {page === 'simulations' && (
          <div>
            <h1>Interactive Simulations</h1>
            <p style={{marginBottom:"1rem"}}>Adjust sliders to explore physics concepts in real time.</p>
            <div className="grid-2">
              {SIMULATIONS.map(s => (
                <div key={s.id} className="sim-card">
                  <div className="sim-header" onClick={() => setOpenSim(openSim === s.id ? null : s.id)}>
                    <h3>{s.icon} {s.title}</h3>
                    <span style={{fontSize:"0.75rem", color:"var(--text-muted)"}}>{openSim === s.id ? "▲ Close" : "▼ Open"}</span>
                  </div>
                  {openSim !== s.id && (
                    <div style={{padding:"0.6rem 1rem", fontSize:"0.78rem", color:"var(--text-muted)"}}>{s.desc}</div>
                  )}
                  {openSim === s.id && (
                    <div className="sim-body"><s.comp /></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            FLASHCARDS
        ============================================================ */}
        {page === 'flashcards' && (
          <div>
            <h1>Flashcards</h1>
            {fcDeck.length > 0 ? (
              <>
                <div style={{fontSize:"0.75rem", color:"var(--text-muted)", marginBottom:"0.75rem", textAlign:"center"}}>
                  {fcIdx + 1} / {fcDeck.length}
                  {fcDeck[fcIdx]?.topic && <span style={{marginLeft:"0.5rem"}}>· {fcDeck[fcIdx].topic}</span>}
                </div>
                <div className="flashcard-wrap" onClick={() => setFcFlipped(f => !f)}>
                  <div className={`flashcard ${fcFlipped ? 'flipped' : ''}`} style={{height:"200px"}}>
                    <div className="flashcard-face flashcard-front">{fcDeck[fcIdx]?.q}</div>
                    <div className="flashcard-face flashcard-back">{fcDeck[fcIdx]?.a}</div>
                  </div>
                </div>
                <div className="flashcard-hint">Tap card to {fcFlipped ? "hide" : "reveal"} answer</div>
                <div className="fc-controls">
                  <button onClick={() => { if (fcIdx > 0) { setFcIdx(fcIdx - 1); setFcFlipped(false); } }}>← Prev</button>
                  <button onClick={() => { setFcIdx((fcIdx + 1) % fcDeck.length); setFcFlipped(false); }}>Next →</button>
                  <button onClick={() => { setFcDeck(shuffle(ALL_FLASHCARDS)); setFcIdx(0); setFcFlipped(false); }}>🔀 Shuffle All</button>
                </div>
                <div className="progress-bar" style={{marginTop:"1rem"}}>
                  <div className="progress-fill" style={{width:`${((fcIdx + 1) / fcDeck.length) * 100}%`}} />
                </div>
              </>
            ) : <p>No flashcards available.</p>}
          </div>
        )}

        {/* ============================================================
            QUIZ
        ============================================================ */}
        {page === 'quiz' && (
          <div>
            {!quizStarted ? (
              <div>
                <h1>Practice Quiz</h1>
                <p style={{marginBottom:"1rem"}}>Choose a unit to quiz, or go random across all topics.</p>
                <div className="action-grid">
                  <div className="action-card" onClick={() => startQuiz('all')}>
                    <span className="ac-icon">🌐</span><span>All Units</span>
                  </div>
                  {Object.values(UNITS).map(u => (
                    <div key={u.id} className="action-card" onClick={() => startQuiz(u.label)}>
                      <span className="ac-icon">{u.icon}</span><span>{u.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : quizDone ? (
              <div className="quiz-result">
                <div className="result-icon">{quizScore >= 8 ? '🏆' : quizScore >= 5 ? '👍' : '📚'}</div>
                <h2>{quizScore} / {quizDeck.length}</h2>
                <p>{quizScore >= 8 ? "Excellent work!" : quizScore >= 5 ? "Good effort — keep practicing!" : "Review the topics and try again!"}</p>
                <p style={{color:"var(--accent3)"}}>+{quizScore * 10 + 20} XP earned</p>
                <div className="flex-row" style={{justifyContent:"center", marginTop:"1rem"}}>
                  <button className="btn btn-primary" onClick={() => startQuiz('all')}>Try Again</button>
                  <button className="btn btn-secondary" onClick={() => setQuizStarted(false)}>Change Unit</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="quiz-meta">
                  <span>Q{quizIdx + 1} / {quizDeck.length}</span>
                  <span style={{color:"var(--accent4)"}}>✅ {quizScore} correct</span>
                </div>
                <div className="progress-bar" style={{marginBottom:"0.75rem"}}>
                  <div className="progress-fill" style={{width:`${(quizIdx / quizDeck.length) * 100}%`}} />
                </div>
                <div className="quiz-question">
                  <p>{quizDeck[quizIdx]?.q}</p>
                  <div className="quiz-options">
                    {quizDeck[quizIdx]?.opts.map((opt, i) => (
                      <button key={i}
                        className={`quiz-option ${quizSel !== null ? (i === quizDeck[quizIdx].ans ? 'correct' : (i === quizSel ? 'wrong' : '')) : ''}`}
                        onClick={() => handleQuizAnswer(i)} disabled={quizSel !== null}>
                        <span style={{color:"var(--accent3)", marginRight:"0.4rem"}}>{String.fromCharCode(65 + i)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                </div>
                {quizSel !== null && (
                  <div className={`feedback ${quizSel === quizDeck[quizIdx].ans ? 'correct' : 'wrong'}`}>
                    <p><strong>{quizSel === quizDeck[quizIdx].ans ? '✅ Correct!' : `❌ Incorrect — Answer: ${quizDeck[quizIdx].opts[quizDeck[quizIdx].ans]}`}</strong></p>
                    <p>{quizDeck[quizIdx].exp}</p>
                    <button className="btn btn-secondary" style={{marginTop:"0.5rem"}} onClick={nextQuiz}>
                      {quizIdx + 1 >= quizDeck.length ? 'See Results →' : 'Next Question →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            EXAM MODE
        ============================================================ */}
        {page === 'exam' && (
          <div>
            {!examStarted ? (
              <div className="quiz-result">
                <div className="result-icon">📝</div>
                <h2 style={{marginBottom:"0.5rem"}}>Practice Regents Exam</h2>
                <p>20 questions · 30-minute timer · Covers all units</p>
                <button className="btn btn-primary" style={{marginTop:"1rem"}} onClick={startExam}>Start Exam</button>
              </div>
            ) : examSubmitted ? (
              <div>
                {/* Results summary */}
                <div className="quiz-result" style={{marginBottom:"1rem"}}>
                  <div className="result-icon">{examDeck.filter((_, i) => examAns[i] === examDeck[i].ans).length >= 14 ? '🏆' : '📚'}</div>
                  <h2>{examDeck.filter((_, i) => examAns[i] === examDeck[i].ans).length} / {examDeck.length}</h2>
                  <p>+{examDeck.filter((_, i) => examAns[i] === examDeck[i].ans).length * 15} XP earned</p>
                  <button className="btn btn-primary" style={{marginTop:"0.75rem"}} onClick={() => { setExamStarted(false); setExamSubmitted(false); }}>Retake Exam</button>
                </div>
                {/* Answer review */}
                {examDeck.map((q, i) => (
                  <div key={i} className="exam-question" style={{borderLeft:`4px solid ${examAns[i] === q.ans ? 'var(--accent4)' : 'var(--red)'}`}}>
                    <div className="q-num">Q{i + 1}</div>
                    <p>{q.q}</p>
                    <p style={{fontSize:"0.78rem", color:"var(--text-muted)", marginBottom:"0.25rem"}}>
                      Your answer: <strong style={{color: examAns[i] === q.ans ? 'var(--accent4)' : 'var(--red)'}}>
                        {q.opts[examAns[i]] || '(not answered)'}
                      </strong>
                      {examAns[i] !== q.ans && (
                        <span style={{color:"var(--accent4)"}}> · Correct: {q.opts[q.ans]}</span>
                      )}
                    </p>
                    <p style={{fontSize:"0.75rem", color:"var(--text-muted)"}}>{q.exp}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="exam-header">
                  <span className={`timer ${examTime < 300 ? 'urgent' : ''}`}>⏱ {formatTime(examTime)}</span>
                  <span style={{fontSize:"0.8rem", color:"var(--text-muted)"}}>
                    {Object.keys(examAns).length} / {examDeck.length} answered
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={submitExam}>Submit Exam</button>
                </div>
                {examDeck.map((q, i) => (
                  <div key={i} className={`exam-question ${examAns[i] !== undefined ? 'answered' : ''}`}>
                    <div className="q-num">Q{i + 1} {examAns[i] !== undefined && '✓'}</div>
                    <p>{q.q}</p>
                    <div className="quiz-options">
                      {q.opts.map((opt, j) => (
                        <button key={j} className={`quiz-option ${examAns[i] === j ? 'correct' : ''}`}
                          onClick={() => setExamAns(prev => ({ ...prev, [i]: j }))}>
                          <span style={{color:"var(--accent3)", marginRight:"0.4rem"}}>{String.fromCharCode(65 + j)}.</span>{opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="btn btn-primary" style={{width:"100%", marginTop:"0.75rem", padding:"0.75rem"}} onClick={submitExam}>
                  Submit Exam
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            CLUSTERS
        ============================================================ */}
        {page === 'clusters' && (
          <div>
            {!activeCluster ? (
              <div>
                <h1>Regents Practice Clusters</h1>
                <p style={{marginBottom:"1rem"}}>10 NGSS-aligned clusters, each covering a key exam topic. Complete them all to master the Regents!</p>
                <div className="grid-2">
                  {CLUSTERS.map(c => (
                    <div key={c.id} className="card cluster-card" onClick={() => startCluster(c)}>
                      <h3>{c.title}</h3>
                      <p className="cluster-desc">{c.desc}</p>
                      <div className="flex-between" style={{marginTop:"0.5rem"}}>
                        <span style={{fontSize:"0.72rem", color:"var(--text-muted)"}}>{c.questions.length} questions</span>
                        <button className="btn btn-gold btn-sm">Start →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : clusterDone ? (
              <div className="quiz-result">
                <div className="result-icon">{clusterScore >= Math.ceil(activeCluster.questions.length * 0.7) ? '🏆' : '👍'}</div>
                <h2>{clusterScore} / {activeCluster.questions.length}</h2>
                <p>{activeCluster.title}</p>
                <p style={{color:"var(--accent3)"}}>+{clusterScore * 10 + 20} XP</p>
                <div className="flex-row" style={{justifyContent:"center", marginTop:"1rem"}}>
                  <button className="btn btn-primary" onClick={() => startCluster(activeCluster)}>Retry</button>
                  <button className="btn btn-secondary" onClick={() => { setActiveCluster(null); setClusterDone(false); }}>Back to Clusters</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{marginBottom:"0.5rem"}}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveCluster(null)}>← Back</button>
                  <span style={{marginLeft:"0.75rem", fontSize:"0.8rem", color:"var(--text-muted)"}}>{activeCluster.title}</span>
                </div>
                <div className="quiz-meta">
                  <span>Q{clusterIdx + 1} / {activeCluster.questions.length}</span>
                  <span style={{color:"var(--accent4)"}}>✅ {clusterScore}</span>
                </div>
                <div className="progress-bar" style={{marginBottom:"0.75rem"}}>
                  <div className="progress-fill" style={{width:`${(clusterIdx / activeCluster.questions.length) * 100}%`, background:"var(--accent3)"}} />
                </div>
                <div className="quiz-question">
                  <p>{activeCluster.questions[clusterIdx].q}</p>
                  <div className="quiz-options">
                    {activeCluster.questions[clusterIdx].opts.map((opt, i) => (
                      <button key={i}
                        className={`quiz-option ${clusterSel !== null ? (i === activeCluster.questions[clusterIdx].ans ? 'correct' : (i === clusterSel ? 'wrong' : '')) : ''}`}
                        onClick={() => handleClusterAnswer(i)} disabled={clusterSel !== null}>
                        <span style={{color:"var(--accent3)", marginRight:"0.4rem"}}>{String.fromCharCode(65 + i)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                </div>
                {clusterSel !== null && (
                  <div className={`feedback ${clusterSel === activeCluster.questions[clusterIdx].ans ? 'correct' : 'wrong'}`}>
                    <p><strong>{clusterSel === activeCluster.questions[clusterIdx].ans ? '✅ Correct!' : `❌ Answer: ${activeCluster.questions[clusterIdx].opts[activeCluster.questions[clusterIdx].ans]}`}</strong></p>
                    <p>{activeCluster.questions[clusterIdx].exp}</p>
                    <button className="btn btn-secondary" style={{marginTop:"0.5rem"}} onClick={nextCluster}>
                      {clusterIdx + 1 >= activeCluster.questions.length ? 'See Results →' : 'Next →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            REFERENCE
        ============================================================ */}
        {page === 'reference' && (
          <div>
            <h1>Reference Tables</h1>

            <div className="ref-section">
              <h2>Physical Constants</h2>
              <table className="ref-table">
                <thead><tr><th>Constant</th><th>Value</th><th>Notes</th></tr></thead>
                <tbody>{REFERENCE_DATA.constants.map(c => (
                  <tr key={c.name}><td>{c.name}</td><td><code>{c.value}</code></td><td>{c.description}</td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="ref-section">
              <h2>SI Units</h2>
              <table className="ref-table">
                <thead><tr><th>Quantity</th><th>Unit</th><th>Equivalent</th></tr></thead>
                <tbody>{REFERENCE_DATA.units.map(u => (
                  <tr key={u.quantity}><td>{u.quantity}</td><td>{u.unit}</td><td><code>{u.equivalent}</code></td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="ref-section">
              <h2>Metric Prefixes</h2>
              <table className="ref-table">
                <thead><tr><th>Prefix</th><th>Factor</th><th>Meaning</th></tr></thead>
                <tbody>{REFERENCE_DATA.prefixes.map(p => (
                  <tr key={p.prefix}><td>{p.prefix}</td><td><code>{p.factor}</code></td><td>{p.meaning}</td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="ref-section">
              <h2>Common Conversions</h2>
              <table className="ref-table">
                <thead><tr><th>From</th><th>To</th><th>Description</th></tr></thead>
                <tbody>{REFERENCE_DATA.conversions.map(c => (
                  <tr key={c.from}><td><code>{c.from}</code></td><td><code>{c.to}</code></td><td>{c.description}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================
            FORMULAS
        ============================================================ */}
        {page === 'formulas' && (
          <div>
            <h1>Formula Reference</h1>
            {Object.values(UNITS).map(u => (
              <div key={u.id} className="ref-section">
                <h2 style={{color: u.color}}>{u.icon} {u.label}</h2>
                <div className="formula-grid">
                  {u.topics.flatMap(t =>
                    (t.formulas || []).map((f, i) => (
                      <div key={`${u.id}-${t.id}-${i}`} className="formula-card">
                        <div dangerouslySetInnerHTML={{__html: f}} />
                        <div className="formula-topic">{t.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================
            AI TUTOR
        ============================================================ */}
        {page === 'ai-tutor' && (
          <div>
            <h1>Nova AI Tutor <span style={{fontSize:"0.7rem", background:"rgba(0,212,255,0.1)", border:"1px solid var(--accent)", borderRadius:"99px", padding:"0.1rem 0.5rem", verticalAlign:"middle", color:"var(--accent)"}}>LIVE</span></h1>
            <p style={{marginBottom:"1rem"}}>Ask any Physics Regents question. Nova is powered by Claude AI and knows the full NY Regents curriculum.</p>
            <AITutor />
          </div>
        )}

      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
