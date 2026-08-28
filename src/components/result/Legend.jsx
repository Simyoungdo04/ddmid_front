// colors: 색 하나 또는 배열 - 지하철처럼 구간마다 노선색이 달라서 한 범례에 여러 노선이
// 걸치는 경우, 점을 여러 개(| ●● 지하철 |) 찍어서 보여준다.
function Legend({ colors, label, active, onClick }) {
  const dots = Array.isArray(colors) ? colors : [colors]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 border-0 rounded-[6px] px-2 py-[3px] cursor-pointer text-xs text-inherit ${
        active ? 'font-bold bg-surface' : 'font-normal bg-transparent'
      }`}
    >
      <span className="inline-flex gap-0.5">
        {dots.map((c, i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />
        ))}
      </span>
      {label}
    </button>
  )
}

export default Legend
