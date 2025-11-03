import React, { useState, useMemo, useEffect, useReducer } from 'react'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'
import algosdk from 'algosdk'
import TimeSlotSelector from './TimeSlotSelector'
import { createNFT } from '../utils/nftUtils'

interface BookingModalProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  skillId: number
  initialSkillRate: number
  selectedSlot: { slot: string; link: string }
  algorand: AlgorandClient | null
  activeAddress: string | undefined
  onBookingSuccess?: (skillId: number, slot: string) => void
  defaultReceiver?: string
  timeSlots?: { time: string; meetLink: string }[]
}

interface TimeSlot {
  time: string
  meetLink: string
}

interface BookingState {
  loading: boolean
  bookingConfirmed: boolean
  bookingError: string | null
}

type BookingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONFIRMED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_CONFIRMED':
      return { ...state, bookingConfirmed: action.payload }
    case 'SET_ERROR':
      return { ...state, bookingError: action.payload }
    default:
      return state
  }
}

const DEFAULT_RECEIVER =
  '2ZTFJNDXPWDETGJQQN33HAATRHXZMBWESKO2AUFZUHERH2H3TG4XTNPL4Y'

const BookingModal: React.FC<BookingModalProps> = ({
  openModal,
  setModalState,
  skillId,
  initialSkillRate,
  selectedSlot,
  algorand,
  activeAddress,
  onBookingSuccess,
  defaultReceiver = DEFAULT_RECEIVER,
  timeSlots: propTimeSlots,
}) => {
  const [skillRate, setSkillRate] = useState<number>(initialSkillRate || 0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [receiverAddress, setReceiverAddress] = useState<string>(defaultReceiver)
  const [bookingState, dispatch] = useReducer(bookingReducer, {
    loading: false,
    bookingConfirmed: false,
    bookingError: null,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner } = useWallet()

  const totalPayment = skillRate
  const isSkillRateValid = skillRate > 0
  const isReceiverValid = algosdk.isValidAddress(receiverAddress)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()

  const client = useMemo(() => {
    if (algorand) {
      const c = algorand
      if (transactionSigner) c.setDefaultSigner(transactionSigner)
      return c
    }
    return null
  }, [algorand, transactionSigner])

  /** ---------------- TIME SLOTS ---------------- */
  const defaultTimeSlots: TimeSlot[] = [
    { time: '10:00 AM', meetLink: 'https://meet.google.com/new-1010-session' },
    { time: '12:00 PM', meetLink: 'https://meet.google.com/new-1200-session' },
    { time: '2:00 PM', meetLink: 'https://meet.google.com/new-1400-session' },
    { time: '4:00 PM', meetLink: 'https://meet.google.com/new-1600-session' },
  ]
  const timeSlots = propTimeSlots || defaultTimeSlots

  // Automatically assign a default slot once booking is confirmed
  useEffect(() => {
    if (bookingState.bookingConfirmed && !selectedTimeSlot) {
      setSelectedTimeSlot(timeSlots[0])
    }
  }, [bookingState.bookingConfirmed, selectedTimeSlot, timeSlots])

  // Reset state when modal opens
  useEffect(() => {
    if (openModal) {
      setSelectedTimeSlot(null)
      dispatch({ type: 'SET_CONFIRMED', payload: false })
      dispatch({ type: 'SET_ERROR', payload: null })
    }
  }, [openModal])

  /** ---------------- PAYMENT METHODS ---------------- */
  /**
   * Sends payment using the connected wallet signer.
   * @returns Promise<string> - Transaction ID
   */
  const sendPayment = async (): Promise<string> => {
    if (!transactionSigner || !activeAddress || !client) {
      const errorMsg = 'Please connect your wallet.'
      enqueueSnackbar(errorMsg, { variant: 'warning' })
      return Promise.reject(errorMsg)
    }

    try {
      enqueueSnackbar(`Sending ${totalPayment.toFixed(3)} ALGO...`, { variant: 'info' })

      const result = await client!.send.payment({
        sender: activeAddress,
        receiver: receiverAddress,
        amount: algo(totalPayment),
        signer: transactionSigner,
      })

      enqueueSnackbar(`✅ Payment successful! TxID: ${result.txIds[0]}`, { variant: 'success' })
      return result.txIds[0]
    } catch (error: any) {
      const errorMsg = `Payment failed: ${error.message || error}`
      enqueueSnackbar(errorMsg, { variant: 'error' })
      throw new Error(errorMsg)
    }
  }

  // Removed insecure fallback payment method for security reasons

  /** ---------------- HANDLE BOOKING ---------------- */
  /**
   * Handles the booking process including validation and payment.
   */
  const handleBookSession = async () => {
    if (!activeAddress || !transactionSigner) {
      dispatch({ type: 'SET_ERROR', payload: 'Please connect your wallet and ensure it is active.' })
      return
    }
    if (!isReceiverValid) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid receiver address.' })
      return
    }
    if (!isSkillRateValid) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a valid skill rate.' })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    try {
      await sendPayment()
      enqueueSnackbar('Booking your session...', { variant: 'info' })
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate booking delay

      // Award NFT for booking - Create real NFT asset
      try {
        const assetId = await createNFT(activeAddress!, transactionSigner, client!, skillId)
        if (assetId) {
          console.log(`NFT Asset created with ID: ${assetId} for wallet: ${activeAddress}`)
          enqueueSnackbar(`🎨 NFT Asset #${assetId} created and stored in your wallet!`, { variant: 'success' })
          enqueueSnackbar(`🎁 Check your profile to view this NFT in your collection!`, { variant: 'info' })
        } else {
          enqueueSnackbar('NFT creation failed, but booking was successful.', { variant: 'warning' })
        }
      } catch (error) {
        console.error('Failed to create NFT:', error)
        enqueueSnackbar('NFT creation failed, but booking was successful.', { variant: 'warning' })
      }

      dispatch({ type: 'SET_CONFIRMED', payload: true })
      enqueueSnackbar(`🎉 Your session has been successfully booked!`, {
        variant: 'success',
      })
      if (onBookingSuccess) {
        onBookingSuccess(skillId, selectedSlot.slot)
      }
    } catch (error: any) {
      const errorMessage = error.message || error || 'Unknown error occurred'
      dispatch({ type: 'SET_ERROR', payload: `Booking failed: ${errorMessage}` })
      enqueueSnackbar(`❌ Booking failed: ${errorMessage}`, { variant: 'error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return (
    <dialog
      id="booking_modal"
      className={`modal ${openModal ? 'modal-open' : ''} bg-black/70 backdrop-blur-md`}
      onClose={() => setModalState(false)}
      aria-modal="true"
      role="dialog"
      style={{ background: '#1e40af' }}
    >
      <form
        method="dialog"
        className="modal-box bg-blue-800/10 border-2 border-blue-800/30 shadow-3xl max-w-2xl p-10 rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault()
          if (!bookingState.loading) handleBookSession()
        }}
        aria-labelledby="booking_modal_title"
      >
        <h3
          id="booking_modal_title"
          className="text-4xl font-bold mb-8 flex items-center justify-center text-white"
        >
          🚀 Book a Session
        </h3>

        {/* Skill Info */}
        <div className="mb-8 text-center">
          <label className="text-xl font-bold text-gray-700 mb-3 block">🎯 Skill ID</label>
          <div className="bg-blue-800/10 px-6 py-4 rounded-2xl font-bold text-white border-2 border-blue-800/30 text-xl shadow-lg">
            {skillId}
          </div>
        </div>

        {/* Selected Slot */}
        <div className="mb-8">
          <label className="text-xl font-bold text-gray-700 mb-3 block">📅 Selected Slot</label>
          <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-800 font-semibold select-all">
            {selectedSlot.slot}
          </div>
        </div>

            {/* Receiver */}
        <div className="mb-8">
          <label
            htmlFor="receiver-address"
            className="text-xl font-bold text-gray-700 mb-3 block"
          >
            🏠 Receiver Address
          </label>
          <input
            id="receiver-address"
            type="text"
            value={receiverAddress}
            onChange={(e) => {
              setReceiverAddress(e.target.value.trim())
              dispatch({ type: 'SET_ERROR', payload: null })
            }}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-mono transition-all duration-500 text-white bg-blue-800/10
              ${
                isReceiverValid || receiverAddress === ''
                  ? 'border-blue-800/30 focus:ring-4 focus:ring-blue-500'
                  : 'border-red-400 focus:ring-4 focus:ring-red-300'
              }
              placeholder:text-white/50`}
            disabled={bookingState.loading || bookingState.bookingConfirmed}
            placeholder="Enter Algorand address"
            aria-describedby="receiver-error"
          />
        </div>


        {/* Skill Rate (Fixed) */}
        <div className="mb-8">
          <label className="text-xl font-bold text-gray-700 mb-3 block">💰 Skill Rate (ALGO/hr)</label>
          <div className="w-full px-6 py-4 rounded-2xl border-2 border-blue-800/30 bg-blue-800/10 text-xl font-bold text-white">
            {skillRate.toFixed(3)}
          </div>
        </div>

        {/* Error Message */}
        {bookingState.bookingError && (
          <div
            id="receiver-error"
            className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl"
            role="alert"
          >
            <p className="text-red-700 font-bold">❌ {bookingState.bookingError}</p>
          </div>
        )}

        {/* Total and Book Button */}
        <div className="flex justify-between items-center mt-10 p-6 bg-blue-800/10 rounded-3xl border-2 border-blue-800/30 shadow-xl">
          <strong className="text-2xl text-white">💎 Total: {totalPayment.toFixed(3)} ALGO</strong>
          <button
            type="submit"
            disabled={bookingState.loading || bookingState.bookingConfirmed}
            className="bg-blue-800 text-white px-8 py-4 rounded-2xl font-bold text-xl hover:bg-blue-900 transition-all disabled:opacity-50"
            aria-label={
              bookingState.loading
                ? 'Processing payment'
                : bookingState.bookingConfirmed
                ? 'Booking confirmed'
                : 'Pay and book session'
            }
          >
            {bookingState.loading
              ? '🔄 Processing...'
              : bookingState.bookingConfirmed
              ? '✅ Booked'
              : '✨ Pay & Book'}
          </button>
        </div>

        {/* ---------------- SHOW SLOTS ONLY AFTER BOOKING CONFIRMATION ---------------- */}
        {bookingState.bookingConfirmed && (
          <div className="mt-8 p-6 bg-blue-800/10 rounded-3xl border-2 border-blue-800/30 shadow-lg">
            <h4 className="text-2xl font-bold text-white mb-4">🎉 Booking Confirmed!</h4>
            <p className="text-lg text-white mb-4">
              You can now select your session time or join directly:
            </p>

            {/* Time Slots (now visible only after booking) */}
            <TimeSlotSelector
              timeSlots={timeSlots}
              selectedTimeSlot={selectedTimeSlot}
              onSelectSlot={setSelectedTimeSlot}
            />

            {selectedTimeSlot && (
              <div className="p-4 bg-blue-800/10 rounded-2xl border-2 border-blue-800/30">
                <p className="text-lg text-white mb-2">
                  ✅ Selected Slot: <strong>{selectedTimeSlot.time}</strong>
                </p>
                <p className="text-sm text-white/70 mb-4">
                  Your meeting link is ready. You can join the session or share the link below.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => window.open(selectedTimeSlot.meetLink, '_blank')}
                    className="bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-blue-900 transition-all flex-1"
                    aria-label={`Join meeting at ${selectedTimeSlot.time}`}
                  >
                    🔗 Join Meeting
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selectedTimeSlot.meetLink)
                        enqueueSnackbar('Link copied to clipboard!', { variant: 'success' })
                      } catch (err) {
                        enqueueSnackbar('Failed to copy link', { variant: 'error' })
                      }
                    }}
                    className="bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-blue-900 transition-all flex-1"
                    aria-label="Copy meeting link to clipboard"
                  >
                    📋 Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setModalState(false)}
          className="mt-8 w-full text-white/70 hover:text-white underline text-lg font-bold"
          disabled={bookingState.loading}
          aria-label={bookingState.bookingConfirmed ? 'Close modal' : 'Cancel booking'}
        >
          {bookingState.bookingConfirmed ? '✨ Close' : '🚫 Cancel'}
        </button>
      </form>
    </dialog>
  )
}

export default BookingModal
