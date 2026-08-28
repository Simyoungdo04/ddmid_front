function ErrorText({ className = '', ...props }) {
  return <p className={`text-[13px] text-danger ${className}`} {...props} />
}

export default ErrorText
