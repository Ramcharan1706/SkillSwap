import React, { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from './components/ConnectWallet'
import SkillList from './components/SkillList'
import UserProfile from './components/UserProfile'
import BookingModal from './components/BookingModal'
import {
  getAlgodConfigFromViteEnvironment,
  getIndexerConfigFromViteEnvironment,
} from './utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

const Home: React.FC = () => {
  const { activeAddress, transactionSigner, disconnect } = useWallet()

  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [openBookingModal, setOpenBookingModal] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null)
  const [userRegistered, setUserRegistered] = useState(false)
  const [userName, setUserName] = useState('')
  const [algorandClient, setAlgorandClient] = useState<AlgorandClient | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Initialize Algorand client when wallet connects
  useEffect(() => {
    if (activeAddress && transactionSigner) {
      const algodConfig = getAlgodConfigFromViteEnvironment()
      const indexerConfig = getIndexerConfigFromViteEnvironment()
      const client = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
      client.setDefaultSigner(transactionSigner)
      setAlgorandClient(client)
    } else {
      // Clear Algorand client if wallet disconnected externally
      setAlgorandClient(null)
      setUserRegistered(false)
      setUserName('')
      setSelectedSkillId(null)
      setOpenBookingModal(false)
    }
  }, [activeAddress, transactionSigner])

  // Toggle wallet modal visibility
  const toggleWalletModal = useCallback(() => {
    setOpenWalletModal((prev) => !prev)
  }, [])

  // Open booking modal with selected skill
  const openBooking = useCallback((skillId: number) => {
    setSelectedSkillId(skillId)
    setOpenBookingModal(true)
  }, [])

  // Close booking modal and reset selected skill
  const closeBooking = useCallback(() => {
    setOpenBookingModal(false)
    setSelectedSkillId(null)
  }, [])

  // Update user info on registration
  const handleRegister = useCallback((name: string) => {
    setUserName(name)
    setUserRegistered(true)
  }, [])

  // Disconnect wallet and reset all related states
  const handleDisconnect = async () => {
    if (isDisconnecting) return // Prevent multiple disconnect attempts

    setIsDisconnecting(true)
    try {
      await disconnect()
    } catch (error) {
      console.error('Error during wallet disconnect:', error)
    } finally {
      // Reset app state related to wallet & user
      setUserName('')
      setUserRegistered(false)
      setAlgorandClient(null)
      setSelectedSkillId(null)
      setOpenBookingModal(false)
      setOpenWalletModal(true) // Prompt wallet connect modal after disconnect
      setIsDisconnecting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm py-5 px-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">SkillSwap</h1>
          <p className="text-sm text-gray-500">Peer-to-peer learning on Algorand</p>
        </div>

        {!activeAddress ? (
          <button
            onClick={toggleWalletModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-semibold text-green-600">Connected</p>
              <p className="text-gray-500">
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className={`px-3 py-1 rounded text-sm transition ${
                isDisconnecting
                  ? 'bg-red-200 text-red-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      {!activeAddress && (
        <section className="text-center py-24 px-6">
          <h2 className="text-5xl font-extrabold text-blue-700 mb-6">
            Decentralized Skill Exchange
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-lg">
            Share what you know. Learn what you don’t. Powered by Algorand and built for
            peer-to-peer learning with no middlemen.
          </p>
          <button
            onClick={toggleWalletModal}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
          >
            Connect Wallet to Get Started
          </button>
        </section>
      )}

      {/* Main DApp Area */}
      {activeAddress && algorandClient && (
        <section className="py-12 px-4 md:px-10 max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Profile */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
            <UserProfile
              address={activeAddress}
              registered={userRegistered}
              userName={userName}
              onRegister={handleRegister}
            />
          </div>

          {/* Skills List */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Available Skills</h2>
            <SkillList
              onBookSkill={openBooking}
              algorandClient={algorandClient}
              userAddress={activeAddress}
            />
          </div>
        </section>
      )}

      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />

      {selectedSkillId !== null && openBookingModal && algorandClient && activeAddress && (
        <BookingModal
          openModal={openBookingModal}
          setModalState={closeBooking}
          skillId={selectedSkillId}
          algorand={algorandClient}
          activeAddress={activeAddress}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-20 py-6 text-center text-sm text-gray-500">
        Built for the Algorand Hackathon 2025. Powered by{' '}
        <a
          href="https://developer.algorand.org"
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Algorand
        </a>
        .
      </footer>
    </main>
  )
}

export default Home
