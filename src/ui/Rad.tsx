/**
 * Rad — the UnoffIChO mascot: a free radical with one unpaired electron.
 *
 * Usage:
 *   <Rad pose="idle" />
 *   <Rad pose="correct" size={96} />
 *
 * Poses: idle · pointing · thinking · correct · wrong · celebrating
 * Body colour doubles as answer feedback (teal = neutral, phenolphthalein
 * pink = right, methyl-orange = wrong). Changing `pose` replays its reaction
 * animation. All motion is disabled under prefers-reduced-motion.
 */
export type RadPose =
  | "idle"
  | "pointing"
  | "thinking"
  | "correct"
  | "wrong"
  | "celebrating";

export const RAD_POSES: RadPose[] = [
  "idle",
  "pointing",
  "thinking",
  "correct",
  "wrong",
  "celebrating",
];

export interface RadProps {
  pose?: RadPose;
  size?: number;
  title?: string;
  className?: string;
}

const INK = "#1E2A3A";
const ELECTRON = "#FFD447";
const CHEEK = "#FF8FB8";

const PALETTE = {
  teal: { body: "#36ADA4", shade: "#278A83" },
  pink: { body: "#FF6FAE", shade: "#DB4F8E" },
  orange: { body: "#F7843E", shade: "#D5652B" },
} as const;

const POSE_COLOUR: Record<RadPose, keyof typeof PALETTE> = {
  idle: "teal",
  pointing: "teal",
  thinking: "teal",
  correct: "pink",
  wrong: "orange",
  celebrating: "pink",
};

const CSS = `
.rad .rad-fill { transition: fill .35s ease, stroke .35s ease; }
.rad .rad-float { animation: rad-float 3.2s ease-in-out infinite; }
.rad .rad-bob { animation: rad-bob 1.7s ease-in-out infinite; }
.rad .rad-orbit { transform-origin: 80px 34px; animation: rad-spin 1.3s linear infinite; }
.rad .rad-blink { transform-box: fill-box; transform-origin: center; animation: rad-blink 4.5s infinite; }
.rad .rad-react-wrong { animation: rad-shake .5s ease-in-out 1; }
.rad .rad-react-correct { transform-origin: 80px 92px; animation: rad-pop .45s ease-out 1; }
.rad .rad-react-celebrating { animation: rad-bounce .7s ease-in-out infinite; }
.rad .rad-react-pointing { animation: rad-nudge 1.2s ease-in-out infinite; }
.rad .rad-twinkle { transform-box: fill-box; transform-origin: center; animation: rad-twinkle 1.1s ease-in-out infinite; }
.rad .rad-twinkle:nth-of-type(2) { animation-delay: .3s; }
.rad .rad-twinkle:nth-of-type(3) { animation-delay: .6s; }
.rad .rad-twinkle:nth-of-type(4) { animation-delay: .85s; }
@keyframes rad-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes rad-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes rad-spin { to { transform: rotate(360deg); } }
@keyframes rad-blink { 0%,94%,100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
@keyframes rad-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(2px); } }
@keyframes rad-pop { 0% { transform: scale(.9); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes rad-bounce { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-10px); } }
@keyframes rad-nudge { 0%,100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
@keyframes rad-twinkle { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.55); opacity: .6; } }
@media (prefers-reduced-motion: reduce) { .rad * { animation: none !important; } }
`;

/* ---------- parts ---------- */

function Arm({ d, colour }: { d: string; colour: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <path
        className="rad-fill"
        d={d}
        fill="none"
        stroke={colour}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </g>
  );
}

function Hand({ x, y, colour }: { x: number; y: number; colour: string }) {
  return (
    <circle className="rad-fill" cx={x} cy={y} r={6} fill={colour} stroke={INK} strokeWidth={3} />
  );
}

function Electron({ x, y, dim = false }: { x: number; y: number; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.65 : 1}>
      <circle cx={x} cy={y} r={13} fill={ELECTRON} opacity={0.3} />
      <circle cx={x} cy={y} r={7} fill={ELECTRON} stroke={INK} strokeWidth={2.5} />
      <circle cx={x - 2.2} cy={y - 2.4} r={1.8} fill="#fff" />
    </g>
  );
}

function star(cx: number, cy: number, s: number) {
  return `M${cx} ${cy - s} Q${cx} ${cy} ${cx + s} ${cy} Q${cx} ${cy} ${cx} ${cy + s} Q${cx} ${cy} ${cx - s} ${cy} Q${cx} ${cy} ${cx} ${cy - s}Z`;
}

const REST_LEFT = "M50 104 Q30 110 31 124";
const REST_RIGHT = "M110 104 Q130 110 129 124";

/* ---------- component ---------- */

export function Rad({
  pose = "idle",
  size = 120,
  title = "Rad, the UnoffIChO mascot",
  className,
}: RadProps) {
  const { body, shade } = PALETTE[POSE_COLOUR[pose]];

  // Arms drawn behind the body
  const backArms: Array<{ d: string; hand?: [number, number] }> = {
    idle: [{ d: REST_LEFT }, { d: REST_RIGHT }],
    pointing: [{ d: REST_LEFT }, { d: "M110 96 Q128 92 145 82", hand: [146, 81] as [number, number] }],
    thinking: [{ d: REST_LEFT }],
    correct: [{ d: REST_LEFT }, { d: "M110 98 Q132 94 135 74", hand: [135, 72] as [number, number] }],
    wrong: [{ d: "M50 108 Q38 120 41 135" }, { d: "M110 108 Q122 120 119 135" }],
    celebrating: [
      { d: "M52 82 Q36 66 34 48", hand: [34, 46] as [number, number] },
      { d: "M108 82 Q124 66 126 48", hand: [126, 46] as [number, number] },
    ],
  }[pose];

  // Eye offset (where Rad is looking)
  const look = ({
    idle: [0, 0],
    pointing: [4, 0],
    thinking: [-3, -4],
    correct: [0, 0],
    wrong: [0, 1],
    celebrating: [0, 0],
  } satisfies Record<RadPose, [number, number]>)[pose];

  const happyEyes = pose === "correct" || pose === "celebrating";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={["rad", className].filter(Boolean).join(" ")}
    >
      <title>{title}</title>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ground shadow */}
      <ellipse cx={80} cy={150} rx={30} ry={5} fill={INK} opacity={0.15} />

      <g key={pose} className={`rad-react-${pose}`}>
        <g className="rad-float">
          {/* arms behind body */}
          {backArms.map((a, i) => (
            <g key={i}>
              <Arm d={a.d} colour={body} />
              {a.hand && <Hand x={a.hand[0]} y={a.hand[1]} colour={body} />}
            </g>
          ))}

          {/* body */}
          <circle className="rad-fill" cx={80} cy={92} r={46} fill={body} />
          <path
            className="rad-fill"
            d="M34.7 100 A46 46 0 0 0 125.3 100 A54 40 0 0 1 34.7 100Z"
            fill={shade}
          />
          <ellipse cx={63} cy={66} rx={11} ry={7} fill="#fff" opacity={0.5} transform="rotate(-30 63 66)" />
          <circle cx={77} cy={58} r={3} fill="#fff" opacity={0.5} />
          <circle cx={80} cy={92} r={46} fill="none" stroke={INK} strokeWidth={3} />

          {/* cheeks */}
          {pose !== "wrong" && (
            <g fill={CHEEK} opacity={0.55}>
              <ellipse cx={56} cy={99} rx={6} ry={3.5} />
              <ellipse cx={104} cy={99} rx={6} ry={3.5} />
            </g>
          )}

          {/* eyes */}
          {happyEyes ? (
            <g fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round">
              <path d="M59 88 Q66 80 73 88" />
              <path d="M87 88 Q94 80 101 88" />
            </g>
          ) : (
            <g transform={`translate(${look[0]} ${look[1]})`}>
              <g className="rad-blink">
                <ellipse cx={66} cy={86} rx={5.5} ry={7.5} fill={INK} />
                <ellipse cx={94} cy={86} rx={5.5} ry={7.5} fill={INK} />
                <circle cx={68} cy={83} r={2} fill="#fff" />
                <circle cx={96} cy={83} r={2} fill="#fff" />
              </g>
            </g>
          )}

          {/* brows */}
          {pose === "wrong" && (
            <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round">
              <path d="M58 77 L71 72" />
              <path d="M89 72 L102 77" />
            </g>
          )}
          {pose === "thinking" && (
            <path d="M85 71 Q92 66 99 69" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          )}

          {/* mouth */}
          {pose === "idle" && (
            <path d="M72 102 Q80 109 88 102" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          )}
          {pose === "pointing" && <path d="M70 101 Q80 113 90 101Z" fill={INK} strokeLinejoin="round" />}
          {pose === "thinking" && (
            <path d="M75 106 Q81 103 87 105" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          )}
          {pose === "correct" && (
            <g>
              <path d="M68 100 Q80 117 92 100Z" fill={INK} />
              <path d="M74 106.5 Q80 112 86 106.5 Q80 103.5 74 106.5Z" fill="#FF9CC4" />
            </g>
          )}
          {pose === "wrong" && (
            <path
              d="M70 106 q3.3 -3 6.6 0 t6.6 0 t6.6 0"
              fill="none"
              stroke={INK}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
          {pose === "celebrating" && (
            <g>
              <ellipse cx={80} cy={105} rx={7} ry={8} fill={INK} />
              <ellipse cx={80} cy={109} rx={4.5} ry={3} fill="#FF9CC4" />
            </g>
          )}

          {/* arm in front of body (hand on chin) */}
          {pose === "thinking" && (
            <g>
              <Arm d="M121 113 Q117 128 101 124" colour={body} />
              <Hand x={98} y={123} colour={body} />
            </g>
          )}

          {/* sweat drop */}
          {pose === "wrong" && (
            <path d="M121 56 Q128 66 121 70 Q114 66 121 56Z" fill="#8FD3FF" stroke={INK} strokeWidth={2} />
          )}

          {/* the unpaired electron */}
          {pose === "celebrating" ? (
            <g className="rad-bob">
              <Electron x={68} y={24} />
              <Electron x={92} y={24} />
            </g>
          ) : pose === "thinking" ? (
            <g className="rad-orbit">
              <Electron x={80} y={20} />
            </g>
          ) : (
            <g className="rad-bob">
              <Electron x={pose === "pointing" ? 92 : 80} y={pose === "wrong" ? 33 : 26} dim={pose === "wrong"} />
            </g>
          )}
        </g>

        {/* sparkles */}
        {pose === "celebrating" && (
          <g fill={ELECTRON} stroke={INK} strokeWidth={1.5} strokeLinejoin="round">
            <path className="rad-twinkle" d={star(20, 42, 8)} />
            <path className="rad-twinkle" d={star(142, 34, 7)} />
            <path className="rad-twinkle" d={star(146, 118, 6)} />
            <path className="rad-twinkle" d={star(14, 116, 6)} />
          </g>
        )}
      </g>
    </svg>
  );
}

export default Rad;
