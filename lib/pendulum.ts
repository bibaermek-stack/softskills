/**
 * Математикалық маятниктің физикасы.
 *
 * Мұндағы бүкіл есептеу таза функциялар түрінде: React те, requestAnimationFrame
 * те қатыспайды. Сондықтан оны анимацияны күтпей-ақ тікелей тексеруге болады —
 * «Қадам» түймесі де, автоматты жүріс те дәл осы функцияларды шақырады.
 *
 * Теңдеу — толық сызықтық емес түрі, кіші бұрыш жуықтауы қолданылмайды:
 *
 *     θ̈ = −(g/L)·sin θ − b·θ̇
 *
 * Себебі модульдің оқыту мақсаты дәл осы: амплитуда өскен сайын период де
 * өседі, ал sin θ ≈ θ жуықтауы бұл әсерді жасырып қояды.
 */

export type PendulumParams = {
  /** Ұзындығы, м. */
  length: number;
  /** Массасы, кг. Периодқа әсер етпейді — тек энергияға. */
  mass: number;
  /** Еркін түсу үдеуі, м/с². */
  gravity: number;
  /** Сөну коэффициенті, 1/с. */
  damping: number;
};

export type PendulumState = {
  /** Тік осьтен ауытқу бұрышы, рад. */
  theta: number;
  /** Бұрыштық жылдамдық, рад/с. */
  omega: number;
  /** Модельдік уақыт, с. */
  t: number;
};

/** Тұрақты интегралдау қадамы. */
export const FIXED_STEP = 1 / 240;

/**
 * Бір қадам — жартылай айқын (симплектикалық) Эйлер әдісі.
 *
 * RK4 емес, себебі симплектикалық схема энергияны шектеулі ұстайды: сөну нөл
 * болғанда толық энергия жинақталып ауытқымайды. Ал интерфейсте энергия
 * көрсетілетіндіктен, оның баяу «ағып кетуі» оқушыға қате түсінік берер еді.
 */
export function stepPendulum(
  state: PendulumState,
  params: PendulumParams,
  h: number = FIXED_STEP,
): PendulumState {
  const alpha =
    -(params.gravity / params.length) * Math.sin(state.theta) - params.damping * state.omega;
  // Жылдамдық алдымен жаңарады, содан кейін координата — симплектикалық рет.
  const omega = state.omega + h * alpha;
  return { theta: state.theta + h * omega, omega, t: state.t + h };
}

/**
 * `dt` секундқа жылжыту: тұрақты қадамдармен, қалдығы келесі шақыруға сақталады.
 * Қадам саны шектелген — қойынды ұзақ жабылып қалғанда цикл ұзап кетпеуі үшін.
 */
export function advance(
  state: PendulumState,
  params: PendulumParams,
  dt: number,
  carry = 0,
  maxSteps = 16,
): { state: PendulumState; carry: number } {
  let acc = carry + Math.min(dt, 0.05);
  let next = state;
  let steps = 0;

  while (acc >= FIXED_STEP && steps < maxSteps) {
    next = stepPendulum(next, params, FIXED_STEP);
    acc -= FIXED_STEP;
    steps += 1;
  }

  return { state: next, carry: steps < maxSteps ? acc : 0 };
}

/** Кіші бұрыш периоды: T₀ = 2π√(L/g). */
export function smallAnglePeriod(params: PendulumParams): number {
  return 2 * Math.PI * Math.sqrt(params.length / params.gravity);
}

/**
 * Амплитуда түзетуі бар период (қатардың алғашқы екі мүшесі):
 * T ≈ T₀·(1 + θ₀²/16 + 11·θ₀⁴/3072).
 */
export function correctedPeriod(params: PendulumParams, theta0: number): number {
  const a = Math.abs(theta0);
  return smallAnglePeriod(params) * (1 + (a * a) / 16 + (11 * a ** 4) / 3072);
}

/** Кинетикалық, потенциалдық және толық энергия, Дж. */
export function energy(state: PendulumState, params: PendulumParams) {
  const kinetic = 0.5 * params.mass * params.length ** 2 * state.omega ** 2;
  const potential = params.mass * params.gravity * params.length * (1 - Math.cos(state.theta));
  return { kinetic, potential, total: kinetic + potential };
}

/** Тіректен есептегенде жүктің координатасы (SVG үшін ыңғайлы). */
export function bobPosition(theta: number, length: number) {
  return { x: Math.sin(theta) * length, y: Math.cos(theta) * length };
}

export const DEG = 180 / Math.PI;
export const RAD = Math.PI / 180;
