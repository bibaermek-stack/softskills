# Виртуалды STEM оқыту платформасы

**BR28713097** гранты аясында әзірленген виртуалды STEM оқыту платформасы.
Қаржыландырушы — Қазақстан Республикасы Ғылым және жоғары білім министрлігінің
Ғылым комитеті.

Жоба таныстырылым сайтын және интерактивті LMS панелін біріктіреді. Панельде
сабақтар, тесттер, ойындар, симуляциялар, оқытушы аналитикасы және Supabase
аутентификациясы бар. Supabase кілттері берілмесе, тіркелгі мен оқу нәтижелері
браузердегі демонстрациялық режимде жұмыс істейді.

## Тіл және типографика

Сайттың негізгі тілі — **қазақша** (`<html lang="kk">`). Барлық мәтін
`lib/content.ts` ішінде.

Қаріптер кирилл әліпбиін, оның ішінде `cyrillic-ext` ішкі жиынын, қолдауы
міндетті — қазақтың ә, ғ, қ, ң, ө, ұ, ү, һ әріптері сонда орналасқан:

- **Manrope** — тақырыптар (display)
- **Inter** — негізгі мәтін

> Бастапқы нұсқада қолданылған **Sora** қаріпінде кирилл әліпбиі мүлдем жоқ
> (тек `latin` / `latin-ext`), сондықтан ол ауыстырылды. Қаріпті ауыстырғанда
> `cyrillic` және `cyrillic-ext` ішкі жиындарының бар-жоғын міндетті түрде
> тексеріңіз.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase ·
Zustand · React Three Fiber + three.js · Framer Motion · GSAP (ScrollTrigger) ·
Lenis.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## Structure

```
app/                   public site, auth callback and dashboard routes
components/
  dashboard/            lessons, analytics, games and simulations
  layout/               Navbar, Footer
  providers/            auth and smooth-scroll providers
  sections/             public-site sections
  three/                WebGL scenes and models
  ui/                   shared UI, auth, search and presenter modals
lib/
  supabase/             account, relationship and realtime data access
  content.ts            public-site copy
  lessons.ts            interactive lesson definitions
  progress.ts           local progress plus authenticated Supabase persistence
  dataStore.ts          learning-record data access
supabase/migrations/    schema, RLS policies, triggers and XP calculation
scripts/
  optimize-models.mjs   the GLB pipeline (see below)
```

`lib/content.ts` is the single source of truth for copy. Section numbers in its
comments map to sections of the research description the site is built from.

## The 3D books

Four GLB books stand on a glowing platform in the hero. They rotate, bob, tilt
toward the cursor, glow and emit accent particles on hover, and on click the
camera dollies in while a reading panel opens with that volume's content.

The hero owns the **only** WebGL context on the page. The `#books` section
presents the same four volumes as regular DOM content and drives the hero scene
through `lib/bookBus.ts` rather than mounting a second canvas.

### Model optimisation — important

The source Meshy exports were **~56 MB each (226 MB total)**: roughly 2 M
triangles of unwelded float32 geometry per book plus 2048px JPEG textures. The
committed models in `public/models/` are **~0.28 MB each (1.14 MB total)** —
a 99.5% reduction — produced by:

```bash
npm run optimize:models -- <directory-of-source-glb-files>
```

The pipeline is dedup → resample → weld → simplify (2% ratio) → texture resize
to 1024 + WebP → prune → meshopt quantisation. Result per book: 39.5k triangles,
quantised attributes, three WebP maps, proportions preserved.

Two deliberate choices:

- **Meshopt, not Draco.** drei's `useGLTF` bundles the meshopt decoder via
  three-stdlib, whereas its Draco path downloads a decoder from a Google CDN at
  runtime. `Book.tsx` calls `useGLTF(url, false, true)` accordingly.
- **HTML labels, not drei `<Text>`.** troika-three-text fetches its default font
  from `fonts.gstatic.com`. The hover titles use drei `<Html>` so they render in
  the site's own typeface, stay selectable and remain accessible.

The four source files share one book mesh and differ only in cover textures —
they are real Kazakh STEM textbooks from the project (physics teaching
methodology, mechanics, VR experiments, 3D modelling).

## Charts

The analytics dashboard uses **single-hue marks with direct labels**, not one
colour per subject. Five brand-adjacent hues could not clear the colour-vision
separation floor — two of them were near-identical violets — and identity there
is already carried by the label. A "View as table" toggle exposes the same
numbers as text.

## Accessibility

- `prefers-reduced-motion` is honoured throughout: Lenis is not initialised,
  scroll reveals render statically, and 3D rotation/bobbing/particles stop.
- The WebGL canvas has no focusable targets, so the hero also renders real
  buttons for each book, visually hidden until focused.
- Skip link, focus-visible rings, labelled form controls, `aria-live` status on
  the demo form, keyboard-driven gallery lightbox (Esc / ← / →).

## Not verified

Anything driven by `requestAnimationFrame` could not be observed during
development: the available preview tab reported `visibilityState: "hidden"`, so
RAF never fired (measured: 0 frames in 500 ms). That blocks visual confirmation of

- the 3D book scene (React Three Fiber never initialises without RAF), and
- any `AnimatePresence mode="wait"` transition — the module spotlight and the
  book detail panel — because the exit animation never completes, so the
  incoming content never mounts. React state itself was confirmed correct
  (`aria-pressed` tracks the selected module).

Verified programmatically instead: models return 200 and their geometry,
UVs and textures are intact; WebGL is available; Manrope really renders the
Kazakh glyphs rather than falling back (`document.fonts.check` plus canvas
width comparison); no console or server errors; no horizontal overflow at
375 px or desktop; no SVG text escapes its viewBox.

**Run `npm run dev` in a normal browser to confirm the 3D scene and the
tabbed transitions visually.**
