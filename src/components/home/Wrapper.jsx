function Wrapper({ className = '', ...props }) {
  return <div className={`max-w-[480px] mx-auto my-10 px-4 ${className}`} {...props} />
}

export default Wrapper
