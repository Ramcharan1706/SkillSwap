import React from 'react'

interface TimeSlot {
  time: string
  meetLink: string
}

interface TimeSlotSelectorProps {
  timeSlots: TimeSlot[]
  selectedTimeSlot: TimeSlot | null
  onSelectSlot: (slot: TimeSlot) => void
  disabled?: boolean
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  timeSlots,
  selectedTimeSlot,
  onSelectSlot,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6" style={{ background: '#1e40af' }}>
      {timeSlots.map((slot) => (
        <button
          key={slot.time}
          type="button"
          onClick={() => onSelectSlot(slot)}
          disabled={disabled}
          className={`px-6 py-3 rounded-2xl border-2 font-bold text-lg transition-all duration-500 ${
            selectedTimeSlot?.time === slot.time
              ? 'bg-blue-800 text-white border-blue-800 shadow-xl'
              : 'bg-blue-800/10 hover:bg-blue-800/20 border-blue-800/30 text-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={`Select time slot ${slot.time}`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  )
}

export default TimeSlotSelector
