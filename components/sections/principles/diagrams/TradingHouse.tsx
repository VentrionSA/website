/**
 * An old trading house, drawn as an architect's front elevation in the colours of the
 * network globe: steps, a colonnade, an entablature with dentils and a pediment holding
 * a clock, whose burgundy hands keep turning. A dimension line and the centre axis
 * mark it as a drawing.
 */

const LINE = "rgb(24 67 53 / 0.5)";
const FACADE = "#e3e6dd";
const STONE = "#d9ddd2";
const SHADE = "#c9d1c5";
const GREEN = "#5b796c";

const COLS = [93, 135.8, 178.6, 221.4, 264.2, 307];

export function TradingHouse() {
  const dentils = Array.from({ length: 33 }, (_, i) => 74 + i * 7.8);
  const bays = COLS.slice(0, -1).map((c, i) => ({ x0: c + 9, x1: COLS[i + 1] - 9, door: i === 2 }));

  return (
    <svg viewBox="0 0 400 300" className="block h-auto w-full" role="img" aria-label="An old trading house, drawn as a front elevation.">
      {/* drawing marks: centre axis and a dimension line */}
      <line x1={200} y1={2} x2={200} y2={292} stroke={LINE} strokeOpacity={0.35} strokeWidth={0.6} strokeDasharray="6 3 1.5 3" />
      <g stroke={LINE} strokeWidth={0.6} fill="none">
        <line x1={370} y1={40} x2={370} y2={278} />
        <line x1={364} y1={40} x2={376} y2={40} />
        <line x1={364} y1={278} x2={376} y2={278} />
        <line x1={366} y1={44} x2={374} y2={36} />
        <line x1={366} y1={282} x2={374} y2={274} />
      </g>

      {/* ground and steps */}
      <line x1={14} y1={278} x2={386} y2={278} stroke={LINE} strokeWidth={0.8} />
      <g stroke={LINE} strokeWidth={0.7}>
        <rect x={50} y={272} width={300} height={6} fill={STONE} />
        <rect x={58} y={266} width={284} height={6} fill={STONE} />
        <rect x={66} y={260} width={268} height={6} fill={STONE} />
        <rect x={72} y={254} width={256} height={6} fill={FACADE} />
      </g>

      {/* the wall behind the colonnade, with its doors and windows */}
      <rect x={80} y={128} width={240} height={126} fill={SHADE} stroke={LINE} strokeWidth={0.7} />
      {bays.map((b, i) =>
        b.door ? (
          <g key={i}>
            <rect x={b.x0 + 3} y={168} width={b.x1 - b.x0 - 6} height={86} fill={GREEN} stroke={LINE} strokeWidth={0.7} />
            <line x1={(b.x0 + b.x1) / 2} y1={168} x2={(b.x0 + b.x1) / 2} y2={254} stroke="#f4f0e6" strokeOpacity={0.5} strokeWidth={0.7} />
            <rect x={b.x0} y={160} width={b.x1 - b.x0} height={6} fill={FACADE} stroke={LINE} strokeWidth={0.6} />
          </g>
        ) : (
          <g key={i}>
            <rect x={b.x0 + 4} y={182} width={b.x1 - b.x0 - 8} height={50} fill={GREEN} fillOpacity={0.85} stroke={LINE} strokeWidth={0.6} />
            <line x1={(b.x0 + b.x1) / 2} y1={182} x2={(b.x0 + b.x1) / 2} y2={232} stroke="#f4f0e6" strokeOpacity={0.55} strokeWidth={0.6} />
            <line x1={b.x0 + 4} y1={200} x2={b.x1 - 4} y2={200} stroke="#f4f0e6" strokeOpacity={0.55} strokeWidth={0.6} />
            <rect x={b.x0 + 1} y={176} width={b.x1 - b.x0 - 2} height={4} fill={FACADE} stroke={LINE} strokeWidth={0.5} />
          </g>
        ),
      )}

      {/* the colonnade */}
      {COLS.map((c) => (
        <g key={c} stroke={LINE} strokeWidth={0.7}>
          <rect x={c - 12} y={248} width={24} height={6} fill={FACADE} />
          <rect x={c - 9} y={128} width={18} height={120} fill={FACADE} />
          <line x1={c - 4.5} y1={130} x2={c - 4.5} y2={246} strokeOpacity={0.55} />
          <line x1={c} y1={130} x2={c} y2={246} strokeOpacity={0.55} />
          <line x1={c + 4.5} y1={130} x2={c + 4.5} y2={246} strokeOpacity={0.55} />
          <rect x={c - 11} y={124} width={22} height={4} fill={FACADE} />
          <rect x={c - 13} y={120} width={26} height={4} fill={FACADE} />
        </g>
      ))}

      {/* entablature: architrave, frieze, dentils, cornice */}
      <g stroke={LINE} strokeWidth={0.7}>
        <rect x={72} y={108} width={256} height={12} fill={FACADE} />
        <rect x={72} y={95} width={256} height={13} fill={STONE} />
        {dentils.map((x) => (
          <rect key={x} x={x} y={95} width={4} height={4} fill={FACADE} strokeWidth={0.5} />
        ))}
        <rect x={64} y={87} width={272} height={8} fill={FACADE} />
      </g>

      {/* pediment, with the clock */}
      <path d="M64,87 L200,38 L336,87 Z" fill={FACADE} stroke={LINE} strokeWidth={0.7} strokeLinejoin="round" />
      <path d="M84,83 L200,47 L316,83 Z" fill={STONE} stroke={LINE} strokeWidth={0.6} strokeLinejoin="round" />
      <circle cx={200} cy={68} r={11} fill="#f4f0e6" stroke={GREEN} strokeWidth={1.2} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={200} y1={58.5} x2={200} y2={60.5} stroke={GREEN} strokeWidth={0.8} transform={`rotate(${a} 200 68)`} />
      ))}
      <line x1={200} y1={68} x2={200} y2={62} stroke="#b52336" strokeWidth={1.4} strokeLinecap="round" className="clock-hour" />
      <line x1={200} y1={68} x2={200} y2={59.5} stroke="#b52336" strokeWidth={0.9} strokeLinecap="round" className="clock-minute" />
      <circle cx={200} cy={68} r={1.2} fill="#b52336" />

      {/* acroteria and the flag */}
      <g fill={FACADE} stroke={LINE} strokeWidth={0.6}>
        <path d="M58,87 l6,-8 l6,8 Z" />
        <path d="M330,87 l6,-8 l6,8 Z" />
      </g>
      <line x1={200} y1={38} x2={200} y2={6} stroke={GREEN} strokeWidth={1.1} />
      <path d="M200.6,7 C208,4.5 214,9.5 223,7 L223,19 C214,21.5 208,16.5 200.6,19 Z" fill="#b52336" className="flag" />
    </svg>
  );
}
