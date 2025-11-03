import { useState } from 'react'
import { useSnackbar } from 'notistack'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import {
  getAlgodConfigFromViteEnvironment,
} from '../utils/network/getAlgoClientConfigs'

interface UsePaymentProps {
  algorand: AlgorandClient
  activeAddress: string | undefined
}

export const usePayment = ({ algorand, activeAddress }: UsePaymentProps) => {
  const [loading, setLoading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAccount } = useWallet()

  const sendPayment = async (amount: number, receiver: string): Promise<string> => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet and ensure it is active.', { variant: 'warning' })
      throw new Error('Wallet not connected or inactive')
    }

    setLoading(true)
    try {
      enqueueSnackbar(`Sending ${amount.toFixed(3)} ALGO...`, { variant: 'info' })

      const result = await algorand.send.payment({
        sender: activeAddress,
        receiver,
        amount: algo(amount),
        signer: transactionSigner,
      })

      enqueueSnackbar(`✅ Payment successful! TxID: ${result.txIds[0]}`, { variant: 'success' })
      return result.txIds[0]
    } catch (error: any) {
      enqueueSnackbar(`❌ Payment failed: ${error.message || error}`, { variant: 'error' })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { sendPayment, loading }
}
