function SubmitButton({ className = '', ...props }) {
  return (
    <button
      className={`mt-5 w-full p-2.5 rounded-[10px] bg-accent text-text-inverse text-sm cursor-pointer disabled:bg-mist disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  )
}

export default SubmitButton
