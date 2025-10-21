import React, { useState, useMemo, useEffect } from 'react'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import algosdk from 'algosdk'

const PAYMENT_RECEIVER_ADDRESS =
  '2ZTFJNDXPWDETGJQQN33HAATRHXZMBWESKO2AUFZUHERH2H3TG4XTNPL4Y' // Replace with actual receiver address

interface BookingModalProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  skillId: number
  initialSkillRate: number
  algorand: AlgorandClient
  activeAddress: string | undefined
}

const BookingModal: React.FC<BookingModalProps> = ({
  openModal,
  setModalState,
  skillId,
  initialSkillRate,
  algorand,
  activeAddress,
}) => {
  const [skillRate, setSkillRate] = useState<number>(initialSkillRate || 0)
  const [hours, setHours] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner } = useWallet()

  const totalPayment = skillRate * hours

  const isSkillRateValid = skillRate > 0
  const isHoursValid = hours >= 1

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()

  const client = useMemo(() => {
    const client = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    if (transactionSigner) {
      client.setDefaultSigner(transactionSigner)
    }
    return client
  }, [transactionSigner])

  const sendPayment = async (): Promise<string> => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet to proceed.', { variant: 'warning' })
      return Promise.reject('Wallet not connected or signer not available')
    }

    try {
      enqueueSnackbar(`Sending payment of ${totalPayment.toFixed(6)} ALGO...`, { variant: 'info' })

      // Attempt to send payment using the wallet's signer
      const result = await client.send.payment({
        sender: activeAddress,
        receiver: PAYMENT_RECEIVER_ADDRESS,
        amount: algo(totalPayment),
        signer: transactionSigner,
      })

      enqueueSnackbar(`Payment successful! TxID: ${result.txId}`, { variant: 'success' })

      return result.txId
    } catch (error: any) {
      // Fallback if the signer is unavailable or an error occurs
      enqueueSnackbar('Signer unavailable or error in transaction. Trying alternative method.', { variant: 'warning' })

      return fallbackPayment()
    }
  }

  // Fallback method: Using Algorand's algosdk to manually sign the transaction
  const fallbackPayment = async (): Promise<string> => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet to proceed.', { variant: 'warning' })
      return Promise.reject('Wallet not connected')
    }

    try {
      const algodClient = new algosdk.Algodv2('', algodConfig.host, algodConfig.port)
      const senderAccount = algosdk.mnemonicToSecretKey(localStorage.getItem('mnemonic') || '')
      const params = await algodClient.getTransactionParams().do()

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: PAYMENT_RECEIVER_ADDRESS,
        amount: Math.floor(totalPayment * 1e6), // Convert to microAlgos
        suggestedParams: params,
      })

      const signedTxn = txn.signTxn(senderAccount.sk)
      const txId = await algodClient.sendRawTransaction(signedTxn).do()

      enqueueSnackbar(`Payment successful! TxID: ${txId}`, { variant: 'success' })
      return txId
    } catch (error: any) {
      enqueueSnackbar(`Payment failed: ${error.message || error}`, { variant: 'error' })
      throw error
    }
  }

  const handleBookSession = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Please connect your wallet.', { variant: 'warning' })
      return
    }

    if (!isSkillRateValid) {
      enqueueSnackbar('Please enter a valid skill rate greater than 0.', { variant: 'warning' })
      return
    }

    if (!isHoursValid) {
      enqueueSnackbar('Please enter at least 1 hour.', { variant: 'warning' })
      return
    }

    setLoading(true)

    try {
      // Send payment transaction
      await sendPayment()

      // Now book session on the blockchain (assuming `bookSession` is part of your contract interaction)
      enqueueSnackbar(`Booking your session now...`, { variant: 'info' })

      // Simulate booking process (replace with actual contract interaction)
      const sessionBooked = await new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true) // Simulate booking success
        }, 2000)
      })

      if (sessionBooked) {
        enqueueSnackbar(`✅ Session booked successfully!`, { variant: 'success' })
        setModalState(false) // Close the modal after successful booking
      } else {
        enqueueSnackbar(`❌ Booking failed! Please try again.`, { variant: 'error' })
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error)
      enqueueSnackbar(`❌ Error: ${message}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      id="booking_modal"
      className={`modal ${openModal ? 'modal-open' : ''} bg-black/50 backdrop-blur-sm`}
      onClose={() => setModalState(false)}
      aria-modal="true"
      role="dialog"
    >
      <form
        method="dialog"
        className="modal-box bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl max-w-md"
        onSubmit={(e) => {
          e.preventDefault()
          if (!loading) handleBookSession()
        }}
        aria-labelledby="booking_modal_title"
      >
        <div className="flex items-center mb-6">
          <div className="text-2xl mr-4" role="img" aria-label="Calendar">
            📅
          </div>
          <h3 id="booking_modal_title" className="font-bold text-xl text-gray-800">
            Book a Session
          </h3>
        </div>

        <div className="space-y-5">
          <section>
            <label
              htmlFor="skill_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Skill ID
            </label>
            <div
              id="skill_id"
              className="bg-gray-100 px-4 py-2 rounded-lg text-gray-800 font-semibold select-all"
            >
              {skillId}
            </div>
          </section>

          <section>
            <label
              htmlFor="skill_rate_input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Skill Rate (ALGO per hour)
            </label>
            <input
              id="skill_rate_input"
              type="number"
              min="0.000001"
              step="0.000001"
              value={skillRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setSkillRate(val)
              }}
              className={`w-full rounded-md border-2 focus:ring-2 focus:ring-purple-500 transition ${
                !isSkillRateValid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </section>

          <section>
            <label
              htmlFor="hours_input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Number of hours
            </label>
            <input
              id="hours_input"
              type="number"
              min="1"
              value={hours}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value))
                setHours(val)
              }}
              className={`w-full rounded-md border-2 focus:ring-2 focus:ring-purple-500 transition ${
                !isHoursValid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </section>
        </div>

        <div className="flex items-center justify-between mt-8">
          <div>
            <strong>Total: {totalPayment.toFixed(6)} ALGO</strong>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary text-white py-2 px-5 rounded-md bg-blue-600 hover:bg-blue-700 transition"
          >
            {loading ? 'Processing...' : `Pay & Book`}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default BookingModal
