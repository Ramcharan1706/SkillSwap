import React, { useState, useEffect } from 'react'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import { SkillSwapClient } from '../contracts/SkillSwap'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { createNFT } from '../utils/nftUtils'

interface SessionCompletionModalProps {
  openModal: boolean
  setModalState: (value: boolean) => void
  sessionId: number
  studentAddress: string
  onSessionCompleted?: (sessionId: number) => void
}

const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  openModal,
  setModalState,
  sessionId,
  studentAddress,
  onSessionCompleted,
}) => {
  const [loading, setLoading] = useState(false)
  const [appClient, setAppClient] = useState<SkillSwapClient | null>(null)
  const [algorand, setAlgorand] = useState<AlgorandClient | null>(null)

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()

  useEffect(() => {
    const initClient = async () => {
      if (!transactionSigner) return
      try {
        const algorandClient = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        algorandClient.setDefaultSigner(transactionSigner)
        setAlgorand(algorandClient)

        const appId = process.env.VITE_SKILL_SWAP_APP_ID || '123456789'
        const client = new SkillSwapClient({ appId: Number(appId), algorand: algorandClient })
        setAppClient(client)
      } catch (error) {
        console.error('Failed to initialize app client:', error)
      }
    }

    if (openModal) {
      initClient()
    }
  }, [transactionSigner, openModal, algodConfig, indexerConfig])

  const handleCompleteSession = async () => {
    if (!appClient || !activeAddress || !transactionSigner || !algorand) {
      enqueueSnackbar('Please connect your wallet and ensure it is active.', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      // Complete the session and award NFT to student
      const result = await appClient.complete_session(activeAddress, sessionId, transactionSigner)
      enqueueSnackbar('✅ Session completed successfully!', { variant: 'success' })

      if (result.return.nftId) {
        enqueueSnackbar(`🎨 NFT #${result.return.nftId} awarded to student!`, { variant: 'success' })
      } else {
        enqueueSnackbar('Session completed, but NFT creation failed.', { variant: 'warning' })
      }

      if (onSessionCompleted) {
        onSessionCompleted(sessionId)
      }

      setModalState(false)
    } catch (error: any) {
      console.error('Session completion error:', error)
      enqueueSnackbar(`❌ Failed to complete session: ${error.message || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }



  return (
    <dialog
      id="session_completion_modal"
      className={`modal ${openModal ? 'modal-open' : ''} bg-black/70 backdrop-blur-md`}
      onClose={() => setModalState(false)}
      aria-modal="true"
      role="dialog"
      style={{ background: '#1e40af' }}
    >
      <form
        method="dialog"
        className="modal-box bg-blue-800/10 border-2 border-blue-800/30 shadow-3xl max-w-lg p-8 rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault()
          if (!loading) handleCompleteSession()
        }}
        aria-labelledby="session_completion_title"
      >
        <h3
          id="session_completion_title"
          className="text-3xl font-bold mb-6 flex items-center justify-center text-white"
        >
          🎓 Complete Session & Award NFT
        </h3>

        <div className="mb-6">
          <label className="text-lg font-bold text-white mb-3 block">
            📋 Session ID
          </label>
          <div className="bg-blue-800/10 px-4 py-3 rounded-2xl font-bold text-white border-2 border-blue-800/30 text-lg">
            {sessionId}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-lg font-bold text-white mb-3 block">
            👨‍🎓 Student Address
          </label>
          <div className="bg-blue-800/10 px-4 py-3 rounded-2xl font-mono text-white border-2 border-blue-800/30 text-sm break-all">
            {studentAddress}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg text-white">
            🎨 A new NFT will be created and awarded to the student upon session completion.
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-blue-900 transition-all disabled:opacity-50"
            aria-label="Complete session and award NFT"
          >
            {loading ? '🔄 Completing...' : '✅ Complete & Award NFT'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setModalState(false)}
          className="w-full text-white/70 hover:text-white underline text-lg font-bold"
          disabled={loading}
          aria-label="Cancel session completion"
        >
          🚫 Cancel
        </button>
      </form>
    </dialog>
  )
}

export default SessionCompletionModal
