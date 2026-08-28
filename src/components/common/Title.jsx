function Title({ className = '', ...props }) {
  return <h1 className={`text-lg text-text ${className}`} {...props} />
}

export default Title
