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
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] px-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-black" style={{ background: 'linear-gradient(to bottom right, #581c87, #3730a3, #000000)' }}>
      <h2 className="text-5xl font-bold text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text mb-10">
        🎨 Your Profile
      </h2>

      {!registered ? (
        <div className="card bg-transparent glowing text-center p-8 border border-white/10 rounded-2xl">
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
              className="btn btn-large glowing text-lg px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 transition-all duration-300"
            >
              {loading ? '🔄 Registering...' : '✨ Register Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10 w-full max-w-2xl">
          <div className="text-center text-white">
            <h3 className="text-3xl font-bold mb-2">👋 Welcome Back</h3>
            <p className="text-cyan-300 break-all">{walletAddress}</p>
            {skillTokenId && (
              <p className="text-sm text-purple-300 mt-2">Skill Token ID: {skillTokenId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="bg-gradient-to-br from-purple-800 to-indigo-900 p-6 rounded-xl shadow-lg border border-white/10">
              <p className="text-5xl font-bold text-green-300">{reputation ?? '—'}</p>
              <p className="text-lg text-green-200">⏰ Reputation</p>
            </div>
            <div className="bg-gradient-to-br from-blue-800 to-indigo-900 p-6 rounded-xl shadow-lg border border-white/10">
              <p className="text-5xl font-bold text-blue-300">{balance ?? '—'}</p>
              <p className="text-lg text-blue-200">💎 Skill Tokens</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-800 to-orange-900 p-6 rounded-xl shadow-lg border border-white/10">
              <p className="text-5xl font-bold text-yellow-300">{teacherTokens ?? '—'}</p>
              <p className="text-lg text-yellow-200">🎓 Teacher Tokens</p>
            </div>
            <div className="bg-gradient-to-br from-pink-800 to-purple-900 p-6 rounded-xl shadow-lg border border-white/10">
              <p className="text-5xl font-bold text-pink-300">{learnerNFTs ?? '—'}</p>
              <p className="text-lg text-pink-200">🏆 Learner NFTs</p>
            </div>
          </div>

          {nftAssetIds.length > 0 && (
            <div className="text-center mt-6">
              <h4 className="text-xl text-cyan-300 font-bold mb-3">Your NFTs:</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {nftAssetIds.map((id) => (
                  <span
                    key={id}
                    className="bg-gradient-to-r from-cyan-600/30 to-purple-600/30 px-4 py-2 rounded-lg text-xs font-mono text-cyan-200 border border-cyan-400/50 shadow-lg"
                  >
                    #{id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Claim NFT Section */}
          <div className="card bg-gray-800/50 p-6 rounded-xl text-center border border-white/10 mt-8">
            <h4 className="text-lg text-white font-semibold mb-2">🎁 Claim NFT</h4>
            <input
              type="text"
              placeholder="Enter NFT Asset ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="px-4 py-2 rounded w-full max-w-xs mb-4 text-black"
            />
            <button
              onClick={claimNFT}
              disabled={claiming || !transactionSigner}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition disabled:opacity-50"
            >
              {claiming ? '🔄 Claiming...' : 'Claim NFT'}
            </button>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => navigate('/')}
              className="btn btn-large glowing text-xl px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 transition-all duration-300"
            >
              🏠 Back to Home
            </button>
            <button
              onClick={fetchUserData}
              className="btn btn-large glowing text-xl px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 transition-all duration-300"
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
                className="btn btn-large glowing text-xl px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 transition-all duration-300"
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
