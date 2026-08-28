function Label({ className = '', ...props }) {
  return <label className={`block text-[13px] text-text-muted mb-1 ${className}`} {...props} />
}

export default Label
