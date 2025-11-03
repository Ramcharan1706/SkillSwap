import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import SkillList from './components/SkillList'
import UserProfile from './components/UserProfile'
import BookingModal from './components/BookingModal'
import ReviewModal from './components/ReviewModal'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { SkillSwapClient } from './contracts/SkillSwap'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

const Home: React.FC = () => {
  const { role, userName } = useAuth()
  const [openBookingModal, setOpenBookingModal] = useState(false)
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null)
  const [selectedSkillRate, setSelectedSkillRate] = useState<number>(0)
  const [selectedSlot, setSelectedSlot] = useState<{ slot: string; link: string } | null>(null)
  const [feedbackSkillId, setFeedbackSkillId] = useState<number | null>(null)
  const [bookedSlots, setBookedSlots] = useState<{ skillId: number; slot: string }[]>([])
  const [algorandClient, setAlgorandClient] = useState<AlgorandClient | null>(null)
  const [appClient, setAppClient] = useState<SkillSwapClient | null>(null)

  // -------------------------------
  // 🔹 Initialize Algorand client and app client
  // -------------------------------
  useEffect(() => {
    const initClients = async () => {
      try {
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
        setAlgorandClient(algorand)

        const appId = process.env.VITE_SKILL_SWAP_APP_ID || '123456789'
        const client = new SkillSwapClient({ appId: Number(appId), algorand })
        setAppClient(client)
      } catch (error) {
        console.error('Failed to initialize clients:', error)
      }
    }
    initClients()
  }, [])

  // -------------------------------
  // 🔹 UI Event Handlers
  // -------------------------------

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

  // Registration is now handled in RegisterPage, so this callback is no longer needed
  // Users are assumed to be registered when they reach Home

  // -------------------------------
  // 🔹 Derived Values (Memoized)
  // -------------------------------
  // Simplified - always connected since no wallet required
  const isConnected = true

  // -------------------------------
  // 🔹 Render Logic
  // -------------------------------
  const renderHeader = () => (
    <header className="relative z-10 shadow-2xl py-10 px-12 flex justify-between items-center sticky top-0 border-b border-blue-800/30" style={{ background: '#1e40af' }}>
      <div className="text-center flex-1 px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          🎨 SkillSwap
        </h1>
        <p className="text-base md:text-lg text-white/90 font-medium mt-4 drop-shadow-md">
          ✨ Peer-to-peer learning platform
        </p>
      </div>

      <div className="flex items-center gap-8 md:gap-10">
        <div className="text-right bg-blue-800/20 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-blue-800/30 shadow-xl">
          <p className="font-bold text-white text-base md:text-lg">🌟 Welcome</p>
          <p className="text-white font-mono text-xs md:text-sm mt-2">
            {userName || 'User'}
          </p>
        </div>
      </div>
    </header>
  )

  const renderHero = () => (
    <section className="text-center px-8 md:px-10 py-20 md:py-24 max-w-7xl mx-auto relative" style={{ background: '#1e40af' }}>
      <h2 className="text-6xl md:text-8xl font-extrabold text-white mb-12 md:mb-14 drop-shadow-2xl leading-tight">
        🌈 SkillSwap Platform
      </h2>
          <p className="text-white text-2xl md:text-3xl font-bold leading-relaxed drop-shadow-lg mb-12 md:mb-14 px-8">
        🎯 Share your skills, learn new ones. Connect with learners worldwide in a decentralized learning community! ✨
      </p>
      <p className="text-white text-lg md:text-xl mb-14 md:mb-18 px-8 font-medium">
        Join thousands of learners and teachers in the most vibrant skill-sharing platform on blockchain.
      </p>
      <button
        className="bg-blue-800 text-white px-14 py-8 md:px-18 md:py-10 rounded-full text-2xl md:text-3xl hover:bg-blue-900 transition-all duration-700 transform hover:scale-125 shadow-2xl font-bold border-4 border-blue-800/30"
      >
        🚀 Start Your Learning Journey
      </button>
    </section>
  )

  // Removed renderLoading since no wallet initialization needed

  const renderMainApp = () => (
    <section className="px-8 md:px-10 py-12 md:py-16 w-full max-w-7xl mx-auto" style={{ background: '#1e40af' }}>
      <div className="grid lg:grid-cols-3 gap-12 md:gap-16 items-start lg:items-center">
        <div className="lg:col-span-1 flex justify-center order-2 lg:order-1">
          <div className="bg-blue-800/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 md:p-12 border-2 border-blue-800/30 transform hover:scale-105 transition-all duration-500 w-full max-w-lg">
            {appClient && <UserProfile appClient={appClient} />}
          </div>
        </div>
        <div className="lg:col-span-2 flex justify-center order-1 lg:order-2">
          <div className="bg-blue-800/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 md:p-12 border-2 border-blue-800/30 transform hover:scale-105 transition-all duration-500 w-full">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 md:mb-14 flex items-center justify-center gap-3 drop-shadow-lg">
              🎨 Available Skills
            </h2>
            {algorandClient && <SkillList onBookSkill={openBooking} onOpenReviewModal={openFeedback} algorandClient={algorandClient} userAddress={userName} bookedSlots={bookedSlots} />}
          </div>
        </div>
      </div>
    </section>
  )

  const renderFooter = () => (
    <footer className="relative z-10 border-t-2 border-blue-800/30 py-10 md:py-12 text-center text-white" style={{ background: '#1e40af' }}>
      <div className="max-w-6xl mx-auto px-8 md:px-10">
        <p className="text-xl md:text-2xl font-bold drop-shadow-lg text-white">🎉 Welcome to SkillSwap - Where Learning Meets Blockchain ✨</p>
          <p className="text-white text-lg md:text-xl font-bold drop-shadow-md mt-6">
          Empowering peer-to-peer skill exchange worldwide 🌍
        </p>
      </div>
    </footer>
  )

  // -------------------------------
  // 🔹 Final Render
  // -------------------------------
  return (
    <main className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col" style={{ background: '#1e40af' }}>
      {renderHeader()}

      <div className="flex-1 flex flex-col justify-center relative z-10 space-y-16">
        {renderMainApp()}
      </div>

      {renderFooter()}

      {/* Modals */}
      {selectedSkillId !== null && openBookingModal && selectedSlot && algorandClient && (
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
          activeAddress={userName}
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
