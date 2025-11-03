import { useWallet, Wallet, WalletId } from '@txnlab/use-wallet-react'
import Account from './Account'

interface ConnectWalletInterface {
  openModal: boolean
  closeModal: () => void
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet()

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD
  return (
    <dialog id="connect_wallet_modal" className={`modal ${openModal ? 'modal-open' : ''}`} style={{ display: openModal ? 'block' : 'none', background: 'linear-gradient(to bottom right, #581c87, #3730a3, #000000)' }}>
      <form method="dialog" className="modal-box bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-2xl rounded-3xl p-8">
        <h3 className="font-bold text-3xl text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Select Wallet Provider</h3>

        <div className="space-y-4 mb-6">
          {activeAddress && (
            <>
              <Account />
              <div className="divider border-white/30" />
            </>
          )}

          {!activeAddress &&
            wallets?.map((wallet) => (
              <button
                data-test-id={`${wallet.id}-connect`}
                className="w-full btn bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white border-0 hover:from-cyan-500 hover:via-blue-600 hover:to-purple-600 transition-all duration-300 rounded-2xl py-4 px-6 text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                key={`provider-${wallet.id}`}
                onClick={() => {
                  return wallet.connect()
                }}
              >
                <div className="flex items-center justify-center gap-4">
                  {!isKmd(wallet) && (
                    <img
                      alt={`wallet_icon_${wallet.id}`}
                      src={wallet.metadata.icon}
                      style={{ objectFit: 'contain', width: '40px', height: '40px' }}
                    />
                  )}
                  <span className="text-xl">{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
                </div>
              </button>
            ))}
        </div>

        <div className="modal-action flex gap-4 justify-center">
          <button
            data-test-id="close-wallet-modal"
            className="btn bg-gray-600 text-white hover:bg-gray-700 rounded-2xl px-8 py-3 font-semibold transition-all duration-300"
            onClick={() => {
              closeModal()
            }}
          >
            Close
          </button>
          {activeAddress && (
            <button
              className="btn bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white hover:from-red-600 hover:via-pink-600 hover:to-purple-600 rounded-2xl px-8 py-3 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive)
                  if (activeWallet) {
                    await activeWallet.disconnect()
                  } else {
                    // Required for logout/cleanup of inactive providers
                    // For instance, when you login to localnet wallet and switch network
                    // to testnet/mainnet or vice verse.
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                  }
                }
              }}
            >
              Logout
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}
export default ConnectWallet
