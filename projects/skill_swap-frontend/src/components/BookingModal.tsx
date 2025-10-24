import React, { useState, useMemo, useEffect } from 'react'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'
import algosdk from 'algosdk'

interface BookingModalProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  skillId: number
  initialSkillRate: number
  selectedSlot: { slot: string; link: string }
  algorand: AlgorandClient
  activeAddress: string | undefined
  onBookingSuccess?: (skillId: number, slot: string) => void
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
}) => {
  const [skillRate, setSkillRate] = useState<number>(initialSkillRate || 0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ time: string; meetLink: string } | null>(null)
  const [receiverAddress, setReceiverAddress] = useState<string>(DEFAULT_RECEIVER)
  const [loading, setLoading] = useState<boolean>(false)
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner } = useWallet()

  const totalPayment = skillRate
  const isSkillRateValid = skillRate > 0
  const isReceiverValid = algosdk.isValidAddress(receiverAddress)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()

  const client = useMemo(() => {
    const c = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    if (transactionSigner) c.setDefaultSigner(transactionSigner)
    return c
  }, [transactionSigner, algodConfig, indexerConfig])

  /** ---------------- UPDATED TIME SLOTS ---------------- */
  const timeSlots = [
    { time: '10:00 AM', meetLink: 'https://meet.google.com/new-1010-session' },
    { time: '12:00 PM', meetLink: 'https://meet.google.com/new-1200-session' },
    { time: '2:00 PM', meetLink: 'https://meet.google.com/new-1400-session' },
    { time: '4:00 PM', meetLink: 'https://meet.google.com/new-1600-session' },
  ]

  // Automatically assign a default slot once booking is confirmed
  useEffect(() => {
    if (bookingConfirmed && !selectedTimeSlot) {
      setSelectedTimeSlot(timeSlots[0])
    }
  }, [bookingConfirmed])

  // Reset state when modal opens
  useEffect(() => {
    if (openModal) {
      setSelectedTimeSlot(null)
      setBookingConfirmed(false)
      setBookingError(null)
    }
  }, [openModal])

  /** ---------------- PAYMENT METHODS ---------------- */
  const sendPayment = async (): Promise<string> => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet.', { variant: 'warning' })
      return Promise.reject('Wallet not connected')
    }

    try {
      enqueueSnackbar(`Sending ${totalPayment.toFixed(3)} ALGO...`, { variant: 'info' })

      const result = await client.send.payment({
        sender: activeAddress,
        receiver: receiverAddress,
        amount: algo(totalPayment),
        signer: transactionSigner,
      })

      enqueueSnackbar(`✅ Payment successful! TxID: ${result.txIds[0]}`, { variant: 'success' })
      return result.txIds[0]
    } catch (error: any) {
      enqueueSnackbar('Signer unavailable or error occurred. Trying fallback...', {
        variant: 'warning',
      })
      return fallbackPayment()
    }
  }

  const fallbackPayment = async (): Promise<string> => {
    try {
      const algodClient = new algosdk.Algodv2(
        algodConfig.token as string,
        algodConfig.server,
        algodConfig.port as number
      )
      const mnemonic = localStorage.getItem('mnemonic') || ''
      const senderAccount = algosdk.mnemonicToSecretKey(mnemonic)
      const params = await algodClient.getTransactionParams().do()

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAccount.addr,
        receiver: receiverAddress,
        amount: Math.floor(totalPayment * 1e6),
        suggestedParams: params,
      })

      const signedTxn = txn.signTxn(senderAccount.sk)
      const sendResponse = await algodClient.sendRawTransaction(signedTxn).do()
      const txId = sendResponse.txid

      enqueueSnackbar(`✅ Payment successful! TxID: ${txId}`, { variant: 'success' })
      return txId
    } catch (error: any) {
      enqueueSnackbar(`❌ Payment failed: ${error.message || error}`, { variant: 'error' })
      throw error
    }
  }

  /** ---------------- HANDLE BOOKING ---------------- */
  const handleBookSession = async () => {
    if (!activeAddress) {
      setBookingError('Please connect your wallet.')
      return
    }
    if (!isReceiverValid) {
      setBookingError('Invalid receiver address.')
      return
    }
    if (!isSkillRateValid) {
      setBookingError('Please enter a valid skill rate.')
      return
    }

    setLoading(true)
    setBookingError(null)
    try {
      await sendPayment()
      enqueueSnackbar('Booking your session...', { variant: 'info' })
      await new Promise((res) => setTimeout(res, 1500))

      setBookingConfirmed(true)
      enqueueSnackbar(`🎉 Your session has been successfully booked!`, {
        variant: 'success',
      })
      if (onBookingSuccess) {
        onBookingSuccess(skillId, selectedSlot.slot)
      }
    } catch (error: any) {
      const errorMessage = error.message || error || 'Unknown error occurred'
      setBookingError(`Booking failed: ${errorMessage}`)
      enqueueSnackbar(`❌ Booking failed: ${errorMessage}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      id="booking_modal"
      className={`modal ${openModal ? 'modal-open' : ''} bg-black/70 backdrop-blur-md`}
      onClose={() => setModalState(false)}
      aria-modal="true"
      role="dialog"
    >
      <form
        method="dialog"
        className="modal-box bg-gradient-to-br from-white via-purple-50 to-pink-50 border-2 border-purple-200 shadow-3xl max-w-2xl p-10 rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault()
          if (!loading) handleBookSession()
        }}
        aria-labelledby="booking_modal_title"
      >
        <h3
          id="booking_modal_title"
          className="text-4xl font-bold mb-8 flex items-center justify-center text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text"
        >
          🚀 Book a Session
        </h3>

        {/* Skill Info */}
        <div className="mb-8 text-center">
          <label className="text-xl font-bold text-gray-700 mb-3 block">🎯 Skill ID</label>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-4 rounded-2xl font-bold text-purple-700 border-2 border-purple-200 text-xl shadow-lg">
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
          <label className="text-xl font-bold text-gray-700 mb-3 block">🏠 Receiver Address</label>
          <input
            type="text"
            value={receiverAddress}
            onChange={(e) => {
              setReceiverAddress(e.target.value.trim())
              setBookingError(null)
            }}
            className={`w-full px-6 py-4 rounded-2xl border-2 text-xl transition-all duration-500 ${
              isReceiverValid || receiverAddress === ''
                ? 'border-purple-200 focus:ring-4 focus:ring-purple-300'
                : 'border-red-400 focus:ring-4 focus:ring-red-300'
            }`}
            disabled={loading || bookingConfirmed}
            placeholder="Enter Algorand address"
          />
        </div>

        {/* Skill Rate (Fixed) */}
        <div className="mb-8">
          <label className="text-xl font-bold text-gray-700 mb-3 block">💰 Skill Rate (ALGO/hr)</label>
          <div className="w-full px-6 py-4 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 text-xl font-bold text-purple-700">
            {skillRate.toFixed(3)}
          </div>
        </div>

        {/* Error Message */}
        {bookingError && (
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-red-700 font-bold">❌ {bookingError}</p>
          </div>
        )}

        {/* Total and Book Button */}
        <div className="flex justify-between items-center mt-10 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 rounded-3xl border-2 border-purple-200 shadow-xl">
          <strong className="text-2xl text-gray-800">💎 Total: {totalPayment.toFixed(3)} ALGO</strong>
          <button
            type="submit"
            disabled={loading || bookingConfirmed}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-8 py-4 rounded-2xl font-bold text-xl hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? '🔄 Processing...' : bookingConfirmed ? '✅ Booked' : '✨ Pay & Book'}
          </button>
        </div>

        {/* ---------------- SHOW SLOTS ONLY AFTER BOOKING CONFIRMATION ---------------- */}
        {bookingConfirmed && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl border-2 border-green-200 shadow-lg">
            <h4 className="text-2xl font-bold text-green-700 mb-4">🎉 Booking Confirmed!</h4>
            <p className="text-lg text-gray-700 mb-4">
              You can now select your session time or join directly:
            </p>

            {/* Time Slots (now visible only after booking) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`px-6 py-3 rounded-2xl border-2 font-bold text-lg transition-all duration-500 ${
                    selectedTimeSlot?.time === slot.time
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white border-green-500 shadow-xl'
                      : 'bg-white hover:bg-green-50 border-green-200 text-gray-700'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>

            {selectedTimeSlot && (
              <div className="p-4 bg-white rounded-2xl border-2 border-green-100">
                <p className="text-lg text-gray-700 mb-2">
                  ✅ Selected Slot: <strong>{selectedTimeSlot.time}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Your meeting link is ready. You can join the session or share the link below.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => window.open(selectedSlot.link, '_blank')}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:scale-105 transition-all flex-1"
                  >
                    🔗 Join Meeting
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selectedSlot.link)
                        enqueueSnackbar('Link copied to clipboard!', { variant: 'success' })
                      } catch (err) {
                        enqueueSnackbar('Failed to copy link', { variant: 'error' })
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:scale-105 transition-all flex-1"
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
          className="mt-8 w-full text-gray-500 hover:text-gray-700 underline text-lg font-bold"
          disabled={loading}
        >
          {bookingConfirmed ? '✨ Close' : '🚫 Cancel'}
        </button>
      </form>
    </dialog>
  )
}

export default BookingModal
