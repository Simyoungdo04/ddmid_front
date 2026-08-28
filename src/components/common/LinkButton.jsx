// 텍스트만 있고 버튼처럼 안 보이는 인라인 액션(상세 정보 보기 등)에 쓴다.
function LinkButton({ className = '', ...props }) {
  return (
    <button
      type="button"
      className={`text-accent underline cursor-pointer bg-transparent border-0 p-0 text-xs [font:inherit] ${className}`}
      {...props}
    />
  )
}

export default LinkButton
