function Input({ className = '', ...props }) {
  return <input className={`w-full px-2.5 py-2 rounded-[6px] border border-mist bg-surface ${className}`} {...props} />
}

export default Input
