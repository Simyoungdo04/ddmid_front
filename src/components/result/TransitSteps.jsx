function TransitSteps({ nodes, edges, expandedLeg, onToggleLeg }) {
  return (
    <div className="my-2">
      {nodes.map((node, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 py-0.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${node.terminus ? 'bg-accent' : 'bg-text'}`} />
            <span className="text-sm font-semibold">{node.label}</span>
          </div>
          {edges[i] && (
            <div className="flex items-start gap-2 pl-[3px] py-1">
              <span
                className="w-0 self-stretch min-h-[18px] border-l-2"
                style={{
                  borderColor: edges[i].dashed ? 'var(--color-text-muted)' : edges[i].color,
                  borderLeftStyle: edges[i].dashed ? 'dashed' : 'solid',
                }}
              />
              <div className="flex flex-col">
                {edges[i].label &&
                  (edges[i].vehicles && edges[i].vehicles.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => onToggleLeg(edges[i].legIndex)}
                      className="text-left text-xs font-bold underline cursor-pointer bg-transparent border-0 p-0 [font:inherit]"
                      style={{ color: edges[i].color }}
                    >
                      {edges[i].label}
                    </button>
                  ) : (
                    <span
                      className="text-xs"
                      style={{
                        color: edges[i].dashed ? 'var(--color-text-muted)' : edges[i].color,
                        fontWeight: edges[i].dashed ? 400 : 700,
                      }}
                    >
                      {edges[i].label}
                    </span>
                  ))}
                {expandedLeg === edges[i].legIndex && edges[i].vehicles?.length > 0 && (
                  <span className="text-[11px] text-text-muted">탑승 가능: {edges[i].vehicles.join(', ')}</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default TransitSteps
