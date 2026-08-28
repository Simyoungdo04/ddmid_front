function ParticipantItem({ className = '', ...props }) {
  return <li className={`px-2.5 py-2 border border-mist rounded-[6px] mb-1.5 text-sm ${className}`} {...props} />
}

export default ParticipantItem
