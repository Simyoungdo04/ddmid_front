function RestaurantItem({ $chosen = false, className = '', ...props }) {
  return (
    <li
      className={`flex justify-between items-center px-2.5 py-2 rounded-[6px] mb-1.5 text-sm border ${
        $chosen ? 'border-accent' : 'border-mist'
      } ${className}`}
      {...props}
    />
  )
}

export default RestaurantItem
