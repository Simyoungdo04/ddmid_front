function Title({ className = '', ...props }) {
  return <h1 className={`text-xl text-text ${className}`} {...props} />
}

export default Title
