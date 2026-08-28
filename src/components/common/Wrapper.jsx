function Wrapper({ className = '', ...props }) {
  return <div className={`max-w-[520px] mx-auto my-6 px-4 ${className}`} {...props} />
}

export default Wrapper
