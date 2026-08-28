// 테일윈드 preflight가 input 기본 테두리/배경을 다 지워버려서, 클래스 없이 쓰면 화면에
// 안 보이는 것처럼 된다 - 입력창은 항상 이걸 쓴다.
function Input({ className = '', ...props }) {
  return <input className={`px-2.5 py-2 rounded-[6px] border border-mist bg-surface text-text ${className}`} {...props} />
}

export default Input
