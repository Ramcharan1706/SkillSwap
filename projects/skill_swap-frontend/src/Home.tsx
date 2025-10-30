import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from './components/ConnectWallet'
import SkillList from './components/SkillList'
import UserProfile from './components/UserProfile'
import BookingModal from './components/BookingModal'
import ReviewModal from './components/ReviewModal'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from './utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

const Home: React.FC = () => {
  const { activeAddress, transactionSigner } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [openBookingModal, setOpenBookingModal] = useState(false)
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null)
  const [selectedSkillRate, setSelectedSkillRate] = useState<number>(0)
  const [selectedSlot, setSelectedSlot] = useState<{ slot: string; link: string } | null>(null)
  const [feedbackSkillId, setFeedbackSkillId] = useState<number | null>(null)
  const [bookedSlots, setBookedSlots] = useState<{ skillId: number; slot: string }[]>([])
  const [userRegistered, setUserRegistered] = useState(false)
  const [userName, setUserName] = useState('')
  const [algorandClient, setAlgorandClient] = useState<AlgorandClient | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isLoadingClient, setIsLoadingClient] = useState(false)

  // -------------------------------
  // 🔹 Initialize Algorand Client
  // -------------------------------
  useEffect(() => {
    const initClient = async () => {
      if (!activeAddress || !transactionSigner) {
        setAlgorandClient(null)
        setUserRegistered(false)
        setUserName('')
        return
      }

      setIsLoadingClient(true)
      try {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const client = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        client.setDefaultSigner(transactionSigner)
        setAlgorandClient(client)
      } catch (error) {
        console.error('Error initializing Algorand client:', error)
      } finally {
        setIsLoadingClient(false)
      }
    }

    initClient()
  }, [activeAddress, transactionSigner])

  // -------------------------------
  // 🔹 UI Event Handlers
  // -------------------------------
  const toggleWalletModal = useCallback(() => {
    setOpenWalletModal((prev) => !prev)
  }, [])

  const openBooking = useCallback((skillId: number, skillRate: number, selectedSlot: { slot: string; link: string }) => {
    setSelectedSkillId(skillId)
    setSelectedSkillRate(skillRate)
    setSelectedSlot(selectedSlot)
    setOpenBookingModal(true)
  }, [])

  const handleBookingSuccess = useCallback((skillId: number, slot: string) => {
    setBookedSlots(prev => [...prev, { skillId, slot }])
  }, [])

  const closeBooking = useCallback(() => {
    setOpenBookingModal(false)
    setSelectedSkillId(null)
    setSelectedSkillRate(0)
    setSelectedSlot(null)
  }, [])

  const openFeedback = useCallback((skillId: number) => {
    setFeedbackSkillId(skillId)
    setOpenFeedbackModal(true)
  }, [])

  const closeFeedback = useCallback(() => {
    setOpenFeedbackModal(false)
    setFeedbackSkillId(null)
  }, [])

  const handleRegister = useCallback((name: string) => {
    setUserName(name)
    setUserRegistered(true)
  }, [])

  // -------------------------------
  // 🔹 Disconnect Wallet
  // -------------------------------
  const handleDisconnect = useCallback(async () => {
    if (isDisconnecting) return
    setIsDisconnecting(true)

    try {
      console.log('🔌 Disconnecting wallet...')
      // Note: disconnect function may not be available in this version, handle gracefully
    } catch (error) {
      console.error('Error during wallet disconnect:', error)
    } finally {
      // Reset app state after disconnect
      setUserName('')
      setUserRegistered(false)
      setAlgorandClient(null)
      setSelectedSkillId(null)
      setSelectedSkillRate(0)
      setSelectedSlot(null)
      setFeedbackSkillId(null)
      setBookedSlots([])
      setOpenBookingModal(false)
      setOpenFeedbackModal(false)
      setOpenWalletModal(true)
      setIsDisconnecting(false)
    }
  }, [isDisconnecting])

  // -------------------------------
  // 🔹 Derived Values (Memoized)
  // -------------------------------
  const isConnected = useMemo(() => !!activeAddress, [activeAddress])

  // -------------------------------
  // 🔹 Render Logic
  // -------------------------------
  const renderHeader = () => (
    <header className="relative z-10 bg-white/10 backdrop-blur-lg shadow-2xl py-8 px-6 flex justify-between items-center sticky top-0 border-b border-white/20">
      <div className="text-center flex-1">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent animate-pulse drop-shadow-lg">
          🎨 SkillSwap
        </h1>
        <p className="text-lg text-white/90 font-medium mt-2 drop-shadow-md">
          ✨ Peer-to-peer learning platform
        </p>
      </div>

      {!isConnected ? (
        <button
          onClick={toggleWalletModal}
          className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-8 py-4 rounded-full hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 transition-all duration-500 transform hover:scale-110 shadow-2xl font-bold text-lg animate-bounce"
        >
          🚀 Connect Wallet
        </button>
      ) : (
        <div className="flex items-center gap-6">
          <div className="text-right bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-xl">
            <p className="font-bold text-green-300 animate-pulse text-lg">🌟 Connected</p>
            <p className="text-white font-mono text-sm mt-1">
              {activeAddress?.slice(0, 6)}...{activeAddress?.slice(-4)}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className={`px-6 py-3 rounded-full text-lg transition-all duration-500 transform hover:scale-110 font-bold shadow-2xl ${
              isDisconnecting
                ? 'bg-red-500 text-white cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white hover:from-red-600 hover:via-pink-600 hover:to-purple-600'
            }`}
          >
            {isDisconnecting ? '🔄 Disconnecting...' : '👋 Disconnect'}
          </button>
        </div>
      )}
    </header>
  )

  const renderHero = () => (
    <section className="text-center px-6 max-w-6xl mx-auto">
      <h2 className="text-7xl font-extrabold bg-gradient-to-r from-yellow-300 via-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-8 animate-bounce drop-shadow-2xl leading-tight">
        🌈 SkillSwap Platform
      </h2>
      <p className="text-white/95 text-2xl font-medium leading-relaxed drop-shadow-lg mb-8">
        🎯 Share your skills, learn new ones. Connect with learners worldwide in a decentralized learning community! ✨
      </p>
      <p className="text-white/80 text-lg mb-12">
        Join thousands of learners and teachers in the most vibrant skill-sharing platform on blockchain.
      </p>
      <button
        onClick={toggleWalletModal}
        className="bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 text-white px-12 py-6 rounded-full text-2xl hover:from-cyan-500 hover:via-blue-600 hover:to-pink-600 transition-all duration-700 transform hover:scale-125 shadow-2xl font-bold animate-pulse border-4 border-white/30"
      >
        🚀 Start Your Learning Journey
      </button>
    </section>
  )

  const renderLoading = () => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
      <p className="text-xl text-white/90">Initializing SkillSwap...</p>
    </div>
  )

  const renderMainApp = () => (
    <section className="px-6 w-full max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-12 items-center">
        <div className="lg:col-span-1 flex justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-white/40 transform hover:scale-105 transition-all duration-500 w-full max-w-md">
            <UserProfile address={activeAddress!} registered={userRegistered} onRegister={handleRegister} />
          </div>
        </div>
        <div className="lg:col-span-2 flex justify-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-white/40 transform hover:scale-105 transition-all duration-500 w-full">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-8 flex items-center justify-center gap-3 drop-shadow-lg">
              🎨 Available Skills
            </h2>
            <SkillList onBookSkill={openBooking} onOpenReviewModal={openFeedback} algorandClient={algorandClient!} userAddress={activeAddress!} bookedSlots={bookedSlots} />
          </div>
        </div>
      </div>
    </section>
  )

  const renderFooter = () => (
    <footer className="relative z-10 bg-gradient-to-r from-purple-800 via-pink-800 to-red-800 border-t-2 border-white/30 py-8 text-center text-white">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xl font-bold drop-shadow-lg">🎉 Welcome to SkillSwap - Where Learning Meets Blockchain ✨</p>
        <p className="text-white/80 text-lg font-medium drop-shadow-md mt-2">
          Empowering peer-to-peer skill exchange worldwide 🌍
        </p>
      </div>
    </footer>
  )

  // -------------------------------
  // 🔹 Final Render
  // -------------------------------
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 via-cyan-900 to-blue-900 text-white font-sans relative overflow-hidden flex flex-col">
      {renderHeader()}

      <div className="flex-1 flex items-center justify-center relative z-10">
        {!isConnected ? renderHero() : isLoadingClient ? renderLoading() : renderMainApp()}
      </div>

      {renderFooter()}

      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />

      {selectedSkillId !== null && openBookingModal && algorandClient && activeAddress && selectedSlot && (
        <BookingModal
          openModal={openBookingModal}
          setModalState={(value: boolean) => {
            closeBooking()
            if (!value) {
              // Booking completed, open review modal after a short delay
              setTimeout(() => {
                openFeedback(selectedSkillId!)
              }, 1000)
            }
          }}
          skillId={selectedSkillId}
          initialSkillRate={selectedSkillRate}
          selectedSlot={selectedSlot}
          algorand={algorandClient}
          activeAddress={activeAddress}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
      {feedbackSkillId !== null && openFeedbackModal && (
        <ReviewModal
          skillId={feedbackSkillId}
          onClose={closeFeedback}
          onSubmit={(skillId: number, review: { rating: number; comment: string }) => {
            // Review submission is handled in SkillList component
            closeFeedback()
          }}
        />
      )}
    </main>
  )
}

export default Home
