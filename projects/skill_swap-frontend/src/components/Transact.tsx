import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const [loading, setLoading] = useState(false)
  const [receiverAddress, setReceiverAddress] = useState('')

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress, activeAccount } = useWallet()
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  // Set signer on algorand client if available
  useEffect(() => {
    if (transactionSigner) {
      algorand.setDefaultSigner(transactionSigner)
    }
  }, [transactionSigner])

  const handleClose = () => {
    if (loading) return
    setModalState(false)
    setReceiverAddress('')
  }

  const isValidAddress = (address: string) => {
    return address.length === 58 // basic Algorand address length check
  }

  const handleSubmitAlgo = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (loading) return

    if (!transactionSigner || !activeAddress || !activeAccount) {
      enqueueSnackbar('Please connect your wallet and ensure it is active.', { variant: 'warning' })
      return
    }

    if (!isValidAddress(receiverAddress)) {
      enqueueSnackbar('Please enter a valid Algorand address.', { variant: 'warning' })
      return
    }

    setLoading(true)
    try {
      enqueueSnackbar('Sending transaction...', { variant: 'info' })
      const result = await algorand.send.payment({
        sender: activeAddress,
        receiver: receiverAddress,
        amount: algo(1),
        signer: transactionSigner,
      })
      enqueueSnackbar(`Transaction sent: ${result.txIds[0]}`, { variant: 'success' })
      setReceiverAddress('')
      setModalState(false)
    } catch (error: any) {
      enqueueSnackbar(`Failed to send transaction: ${error?.message || error}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      id="transact_modal"
      className={`modal ${openModal ? 'modal-open' : ''} bg-black/50 backdrop-blur-sm`}
      style={{ display: openModal ? 'block' : 'none', background: '#1e40af' }}
      onClick={(e) => {
        // close modal if click outside modal-box
        if ((e.target as Element).id === 'transact_modal') {
          handleClose()
        }
      }}
    >
      <form
        method="dialog"
        className="modal-box max-w-md bg-transparent backdrop-blur-sm border border-white/20 shadow-lg"
        onSubmit={(e) => e.preventDefault()}
      >
        <h3 className="font-bold text-lg mb-4 text-white">Send 1 Algo Payment</h3>

        <input
          type="text"
          data-test-id="receiver-address"
          placeholder="Enter receiver's Algorand address"
          className="input input-bordered w-full mb-4 bg-blue-800/10 border-blue-800/30 text-white placeholder:text-white/50"
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value.trim())}
          disabled={loading}
        />

        <div className="modal-action flex justify-end gap-4">
          <button
            type="button"
            className="btn btn-outline text-white hover:bg-blue-800/20 border-blue-800/30 px-6 py-2 rounded-md"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            data-test-id="send-algo"
            className={`btn px-6 py-2 rounded-md font-semibold text-white ${
              isValidAddress(receiverAddress) && !loading
                ? 'bg-blue-800 hover:bg-blue-900 hover:shadow-lg transition-all'
                : 'btn-disabled cursor-not-allowed opacity-50'
            }`}
            onClick={handleSubmitAlgo}
            disabled={loading || !isValidAddress(receiverAddress)}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              'Send 1 Algo'
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default Transact
