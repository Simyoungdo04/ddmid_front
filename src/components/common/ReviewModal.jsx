function ReviewModal({ reviewPlace, onClose }) {
  if (!reviewPlace) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[90%] max-w-[480px] h-[85%] bg-background rounded-lg flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-mist">
          <span className="text-sm font-semibold">{reviewPlace.name}</span>
          <button type="button" onClick={onClose} className="text-[13px] px-2 py-0.5 cursor-pointer">
            닫기 ✕
          </button>
        </div>
        <iframe src={reviewPlace.placeUrl} title={reviewPlace.name} className="flex-1 border-0" />
      </div>
    </div>
  )
}

export default ReviewModal
