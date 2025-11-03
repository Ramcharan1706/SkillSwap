import React, { useState, useEffect, useCallback } from 'react'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SkillSwapClient } from '../contracts/SkillSwap'
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from './ConnectWallet'


interface UserProfileProps {
  appClient: SkillSwapClient
}

const UserProfile: React.FC<UserProfileProps> = ({ appClient }) => {
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const { role, setRole } = useAuth()
  const { activeAccount, activeAddress, wallets, transactionSigner } = useWallet()
  const walletAddress = activeAccount?.address

  const [registered, setRegistered] = useState(false)
  const [reputation, setReputation] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [teacherTokens, setTeacherTokens] = useState<number | null>(null)
  const [learnerNFTs, setLearnerNFTs] = useState<number | null>(null)
  const [nftAssetIds, setNftAssetIds] = useState<string[]>([])
  const [skillTokenId, setSkillTokenId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [bookingId, setBookingId] = useState<string>('') // For claiming NFT
  const [claiming, setClaiming] = useState(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('') // For sending NFT
  const [sending, setSending] = useState(false)

  /** ------------------------------------------------
   * 🧾 Register user (wallet = username)
   * ------------------------------------------------ */
  const registerUser = useCallback(async () => {
    if (!walletAddress) {
      enqueueSnackbar('Please connect your wallet first.', { variant: 'warning' })
      return
    }
    setLoading(true)
    try {
      const res = await appClient.register_user(walletAddress, role || 'learner')
      enqueueSnackbar(res.return || 'Registration successful!', { variant: 'success' })
      setRegistered(true)
      await fetchUserData()
    } catch (error: any) {
      console.error('Registration error:', error)
      enqueueSnackbar(`❌ Registration failed: ${error.message || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [walletAddress, appClient, role, enqueueSnackbar])

  /** ------------------------------------------------
   * 📊 Fetch user data from blockchain
   * ------------------------------------------------ */
  const fetchUserData = useCallback(async () => {
    if (!walletAddress || !appClient) return
    setFetching(true)
    try {
      const balanceRes = await appClient.get_user_balance(walletAddress)
      const repRes = await appClient.get_reputation(walletAddress)
      const tokenRes = await appClient.get_skill_token_id(walletAddress)
      const nftRes = await appClient.get_user_nft_asset_ids(walletAddress)

      const nfts = nftRes.return || []
      setBalance(balanceRes.return || 0)
      setReputation(repRes.return || 0)
      setSkillTokenId(tokenRes.return || null)
      setNftAssetIds(nfts.map(String))
      setLearnerNFTs(nfts.length)
      setTeacherTokens(balanceRes.return || 0)
      setRegistered(true)
    } catch (error) {
      console.error('Error fetching user data:', error)
      enqueueSnackbar('Failed to fetch user data', { variant: 'error' })
    } finally {
      setFetching(false)
    }
  }, [walletAddress, appClient, enqueueSnackbar])

  /** ------------------------------------------------
   * 🎁 Claim NFT after booking
   * ------------------------------------------------ */
  const claimNFT = useCallback(async () => {
    if (!walletAddress || !activeAccount || !transactionSigner) {
      enqueueSnackbar('Please connect and activate your wallet first.', { variant: 'warning' })
      return
    }
    if (!bookingId) {
      enqueueSnackbar('Please enter your NFT Asset ID.', { variant: 'warning' })
      return
    }

    const assetIdNum = parseInt(bookingId)
    if (isNaN(assetIdNum)) {
      enqueueSnackbar('Please enter a valid NFT Asset ID.', { variant: 'warning' })
      return
    }

    setClaiming(true)
    try {
      const res = await appClient.claim_nft(walletAddress, assetIdNum, transactionSigner)
      if (res.return) {
        enqueueSnackbar('NFT claimed successfully!', { variant: 'success' })
        setBookingId('')
        await fetchUserData()
      } else {
        enqueueSnackbar('NFT claim failed. Please check the Asset ID and try again.', { variant: 'error' })
      }
    } catch (error: any) {
      console.error('Error claiming NFT:', error)
      enqueueSnackbar(`❌ Claim failed: ${error.message || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setClaiming(false)
    }
  }, [walletAddress, activeAccount, transactionSigner, bookingId, appClient, enqueueSnackbar, fetchUserData])



  /** ------------------------------------------------
   * 📤 Send NFT to another address (Mock Implementation)
   * ------------------------------------------------ */
  const sendNFT = useCallback(async () => {
    if (!walletAddress) {
      enqueueSnackbar('Please connect your wallet first.', { variant: 'warning' })
      return
    }
    if (!bookingId) {
      enqueueSnackbar('Please enter your NFT Asset ID.', { variant: 'warning' })
      return
    }
    if (!receiverAddress) {
      enqueueSnackbar('Please enter the receiver address.', { variant: 'warning' })
      return
    }

    const assetIdNum = parseInt(bookingId)
    if (isNaN(assetIdNum)) {
      enqueueSnackbar('Please enter a valid NFT Asset ID.', { variant: 'warning' })
      return
    }

    // Basic validation for receiver address (should be 58 characters for Algorand)
    if (receiverAddress.length !== 58) {
      enqueueSnackbar('Please enter a valid Algorand address (58 characters).', { variant: 'warning' })
      return
    }

    setSending(true)
    try {
      // Mock NFT transfer - simulate success
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network delay

      enqueueSnackbar(`NFT ${assetIdNum} sent successfully to ${receiverAddress.slice(0, 10)}...!`, { variant: 'success' })
      setBookingId('')
      setReceiverAddress('')
      await fetchUserData()
    } catch (error: any) {
      console.error('Error sending NFT:', error)
      enqueueSnackbar(`❌ Send failed: ${error.message || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setSending(false)
    }
  }, [walletAddress, bookingId, receiverAddress, enqueueSnackbar, fetchUserData])

  /** ------------------------------------------------
   * 🔄 Auto load on wallet connect
   * ------------------------------------------------ */
  useEffect(() => {
    if (walletAddress) {
      fetchUserData()
    }
  }, [walletAddress, fetchUserData])

  /** ------------------------------------------------
   * 🧱 UI Render
   * ------------------------------------------------ */
  if (!walletAddress) {
    return (
      <div className="p-6 text-center bg-gray-900 text-white rounded-lg">
        <p className="mb-4">Please connect your Algorand wallet to view your profile and access all functionalities.</p>
        <ConnectWallet openModal={true} closeModal={() => {}} />
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] px-4" style={{ background: '#1e40af' }}>
      <h2 className="text-5xl font-bold text-white mb-10">
        🎨 Your Profile
      </h2>

      {!registered ? (
        <div className="card bg-blue-800/10 text-center p-8 border border-blue-800/30 rounded-2xl">
          <p className="text-xl text-white mb-4">Register using your wallet address:</p>
          <div className="flex flex-col items-center gap-4">
            <select
              className="bg-gray-800 text-white rounded px-4 py-2"
              value={role || 'learner'}
              onChange={(e) => setRole(e.target.value as 'teacher' | 'learner')}
            >
              <option value="learner">Learner</option>
              <option value="teacher">Teacher</option>
            </select>
            <button
              onClick={registerUser}
              disabled={loading}
              className="btn btn-large text-lg px-8 py-3 bg-blue-800 hover:bg-blue-900 transition-all duration-300"
            >
              {loading ? '🔄 Registering...' : '✨ Register Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10 w-full max-w-2xl">
          <div className="text-center text-white">
            <h3 className="text-3xl font-bold mb-2">👋 Welcome Back</h3>
            <p className="text-white break-all">{walletAddress}</p>
            {skillTokenId && (
              <p className="text-sm text-white mt-2">Skill Token ID: {skillTokenId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="bg-blue-800/10 p-6 rounded-xl shadow-lg border border-blue-800/30">
              <p className="text-5xl font-bold text-white">{reputation ?? '—'}</p>
              <p className="text-lg text-white">⏰ Reputation</p>
            </div>
            <div className="bg-blue-800/10 p-6 rounded-xl shadow-lg border border-blue-800/30">
              <p className="text-5xl font-bold text-white">{balance ?? '—'}</p>
              <p className="text-lg text-white">💎 Skill Tokens</p>
            </div>
            <div className="bg-blue-800/10 p-6 rounded-xl shadow-lg border border-blue-800/30">
              <p className="text-5xl font-bold text-white">{teacherTokens ?? '—'}</p>
              <p className="text-lg text-white">🎓 Teacher Tokens</p>
            </div>
            <div className="bg-blue-800/10 p-6 rounded-xl shadow-lg border border-blue-800/30">
              <p className="text-5xl font-bold text-white">{learnerNFTs ?? '—'}</p>
              <p className="text-lg text-white">🏆 Learner NFTs</p>
            </div>
          </div>

          {nftAssetIds.length > 0 && (
            <div className="text-center mt-6">
              <h4 className="text-xl text-white font-bold mb-3">Your NFTs:</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {nftAssetIds.map((id) => (
                  <span
                    key={id}
                    className="bg-blue-800/10 px-4 py-2 rounded-lg text-xs font-mono text-white border border-blue-800/30 shadow-lg"
                  >
                    #{id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Send NFT Section */}
          <div className="card bg-blue-800/10 p-6 rounded-xl text-center border border-blue-800/30 mt-8">
            <h4 className="text-lg text-white font-semibold mb-2">📤 Send NFT</h4>
            <input
              type="text"
              placeholder="Enter NFT Asset ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="px-4 py-2 rounded w-full max-w-xs mb-2 text-black"
            />
            <input
              type="text"
              placeholder="Enter Receiver Address"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              className="px-4 py-2 rounded w-full max-w-xs mb-4 text-black"
            />
            <button
              onClick={sendNFT}
              disabled={sending || !transactionSigner || !bookingId || !receiverAddress}
              className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded transition disabled:opacity-50"
            >
              {sending ? '🔄 Sending...' : 'Send NFT'}
            </button>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => navigate('/')}
              className="btn btn-large text-xl px-8 py-3 bg-blue-800 hover:bg-blue-900 transition-all duration-300"
            >
              🏠 Back to Home
            </button>
            <button
              onClick={fetchUserData}
              className="btn btn-large text-xl px-8 py-3 bg-blue-800 hover:bg-blue-900 transition-all duration-300"
            >
              🔄 Refresh Data
            </button>
            {activeAddress && (
              <button
                onClick={async () => {
                  if (wallets) {
                    const activeWallet = wallets.find((w) => w.isActive)
                    if (activeWallet) {
                      await activeWallet.disconnect()
                    } else {
                      localStorage.removeItem('@txnlab/use-wallet:v3')
                      window.location.reload()
                    }
                  }
                }}
              className="btn btn-large text-xl px-8 py-3 bg-blue-800 hover:bg-blue-900 transition-all duration-300"
              >
                🚪 Disconnect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile

