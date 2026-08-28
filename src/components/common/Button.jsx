function Button({ $active = false, className = '', ...props }) {
  return (
    <button
      className={`px-3.5 py-2 rounded-[6px] border border-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        $active ? 'bg-accent text-text-inverse' : 'bg-background text-accent'
      } ${className}`}
      {...props}
    />
  )
}

export default Button
