function ButtonRow({ className = '', ...props }) {
  return <div className={`flex gap-2 mt-3 ${className}`} {...props} />
}

export default ButtonRow
