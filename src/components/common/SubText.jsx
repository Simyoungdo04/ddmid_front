function SubText({ className = '', ...props }) {
  return <p className={`text-[13px] text-text-muted ${className}`} {...props} />
}

export default SubText
