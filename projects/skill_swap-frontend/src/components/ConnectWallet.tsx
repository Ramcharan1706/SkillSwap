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
    <dialog id="connect_wallet_modal" className={`modal ${openModal ? 'modal-open' : ''}`} style={{ display: openModal ? 'block' : 'none' }}>
      <form method="dialog" className="modal-box bg-gradient-to-br from-purple-900 via-indigo-900 to-black text-white border border-white/20 shadow-2xl">
        <h3 className="font-bold text-2xl text-center mb-4">Select Wallet Provider</h3>

        <div className="grid m-2 pt-5">
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
                className="btn bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white border-0 m-2 hover:from-cyan-500 hover:via-blue-600 hover:to-purple-600 transition-all duration-300"
                key={`provider-${wallet.id}`}
                onClick={() => {
                  return wallet.connect()
                }}
              >
                {!isKmd(wallet) && (
                  <img
                    alt={`wallet_icon_${wallet.id}`}
                    src={wallet.metadata.icon}
                    style={{ objectFit: 'contain', width: '30px', height: 'auto' }}
                  />
                )}
                <span>{isKmd(wallet) ? 'LocalNet Wallet' : wallet.metadata.name}</span>
              </button>
            ))}
        </div>

        <div className="modal-action grid gap-2">
          <button
            data-test-id="close-wallet-modal"
            className="btn bg-gray-600 text-white hover:bg-gray-700"
            onClick={() => {
              closeModal()
            }}
          >
            Close
          </button>
          {activeAddress && (
            <button
              className="btn bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white hover:from-red-600 hover:via-pink-600 hover:to-purple-600"
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
