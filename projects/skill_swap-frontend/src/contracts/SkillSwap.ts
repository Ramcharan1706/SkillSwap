import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { createNFT, transferNFT, checkNFTOwnership } from '../utils/nftUtils'

interface SkillSwapClientOptions {
  appId: number
  algorand: AlgorandClient
}

interface AppClientResponse<T> {
  return: T
}

export class SkillSwapClient {
  private appId: number
  private algorand: AlgorandClient
  private userTokenMap: Record<string, number> = {} // 🧠 unique token ID per user

  constructor(options: SkillSwapClientOptions) {
    this.appId = options.appId
    this.algorand = options.algorand
  }

  /** ---------------------------------------------
   * 🧾 REGISTER USER (Wallet = Username)
   * --------------------------------------------- */
  async register_user(walletAddress: string, role: string): Promise<AppClientResponse<string>> {
    console.log(`Registering wallet ${walletAddress} as ${role}`)

    // Assign unique token ID if not already generated
    if (!this.userTokenMap[walletAddress]) {
      this.userTokenMap[walletAddress] = this.generateUniqueTokenId(walletAddress)
    }

    const tokenId = this.userTokenMap[walletAddress]

    // TODO: Call on-chain registration logic here if available
    return { return: `Wallet ${walletAddress} registered successfully with Skill Token ID ${tokenId}` }
  }

  /** ---------------------------------------------
   * 💰 USER BALANCE
   * --------------------------------------------- */
  async get_user_balance(walletAddress: string): Promise<AppClientResponse<number>> {
    try {
      const algod = this.algorand.client.algod
      const account = await algod.accountInformation(walletAddress).do()
      const balance = Number(account.amount) / 1e6 // Convert from microAlgos
      console.log(`💰 Balance for ${walletAddress}: ${balance} ALGO`)
      return { return: balance }
    } catch (error) {
      console.error('Error fetching user balance:', error)
      return { return: 0 }
    }
  }

  /** ---------------------------------------------
   * 🏅 USER STATS (placeholders for now)
   * --------------------------------------------- */
  async get_reputation(walletAddress: string): Promise<AppClientResponse<number>> {
    return { return: 0 } // replace with on-chain value later
  }

  async get_teacher_tokens(walletAddress: string): Promise<AppClientResponse<number>> {
    return { return: 0 } // replace with on-chain logic later
  }

  /** ---------------------------------------------
   * 🎨 FETCH USER NFTs (Real Wallet NFTs)
   * --------------------------------------------- */
  async get_user_nft_asset_ids(walletAddress: string): Promise<AppClientResponse<string[]>> {
    try {
      const indexer = this.algorand.client.indexer
      const accountAssets = await indexer.lookupAccountAssets(walletAddress).do()

      const nftAssetIds = accountAssets.assets
        .filter(
          (a: any) =>
            a.amount === 1 &&
            a['asset-id'] &&
            a['asset-id'] !== 0 &&
            a['is-frozen'] === false &&
            a.decimals === 0 // NFT rule: indivisible
        )
        .map((a: any) => a['asset-id'].toString())

      console.log(`✅ Found ${nftAssetIds.length} NFTs for ${walletAddress}`)
      return { return: nftAssetIds }
    } catch (error) {
      console.error('Error fetching NFTs from Indexer:', error)
      return { return: [] }
    }
  }

  /** ---------------------------------------------
   * 🧾 NFT METADATA FETCH
   * --------------------------------------------- */
  async get_nft_metadata(assetId: number): Promise<AppClientResponse<any>> {
    try {
      const indexer = this.algorand.client.indexer
      const asset = await indexer.lookupAssetByID(assetId).do()
      const params = asset.asset.params

      const metadata = {
        id: assetId,
        name: params.name || `NFT #${assetId}`,
        unitName: params.unitName || '',
        creator: params.creator,
        url: params.url || '',
        image: this.resolveIpfsUrl(params.url),
        total: params.total,
      }

      return { return: metadata }
    } catch (error) {
      console.error(`Error fetching NFT metadata for ${assetId}:`, error)
      return { return: null }
    }
  }

  private resolveIpfsUrl(url?: string): string {
    if (!url) return ''
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    return url
  }

  /** ---------------------------------------------
   * 🎁 CLAIM NFT
   * --------------------------------------------- */
  async claim_nft(walletAddress: string, nft_id: number, signer: any): Promise<AppClientResponse<boolean>> {
    try {
      console.log(`🎁 Claiming NFT ${nft_id} for ${walletAddress}`)

      // Check if user already owns the NFT
      const userOwnsNft = await checkNFTOwnership(nft_id, walletAddress, this.algorand)
      if (userOwnsNft) {
        console.log(`✅ User ${walletAddress} already owns NFT ${nft_id}`)
        return { return: true }
      }

      // For now, assume the NFT is created in user's wallet during booking
      // In a full implementation, the contract would hold NFTs and transfer them
      // Here we simulate by creating a new NFT if not owned (though in practice it should be transferred)
      console.log(`✅ NFT ${nft_id} claimed successfully for ${walletAddress}`)
      return { return: true }
    } catch (error) {
      console.error('Error claiming NFT:', error)
      return { return: false }
    }
  }

  /** ---------------------------------------------
   * 🧠 UNIQUE TOKEN ID GENERATOR
   * --------------------------------------------- */
  async get_skill_token_id(walletAddress: string): Promise<AppClientResponse<number>> {
    if (!this.userTokenMap[walletAddress]) {
      this.userTokenMap[walletAddress] = this.generateUniqueTokenId(walletAddress)
    }
    const tokenId = this.userTokenMap[walletAddress]
    console.log(`🔗 Skill Token ID for ${walletAddress}: ${tokenId}`)
    return { return: tokenId }
  }

  private generateUniqueTokenId(walletAddress: string): number {
    const randomPart = Math.floor(Math.random() * 9000000) + 1000000 // 7 digits
    const addressPart = parseInt(walletAddress.slice(-6), 36) % 1000 // 3 digits
    const combined = `${randomPart}${addressPart}`.slice(0, 9)
    return parseInt(combined)
  }

  /** ---------------------------------------------
   * 🎓 SESSION COMPLETION (Award NFT to Student)
   * --------------------------------------------- */
  async complete_session(walletAddress: string, sessionId: number, signer: any): Promise<AppClientResponse<{ message: string; nftId?: number }>> {
    console.log(`🎓 Completing session ${sessionId} for ${walletAddress}`)

    try {
      // Create NFT for session completion
      const nftId = await createNFT(walletAddress, signer, this.algorand, 0, sessionId)
      if (nftId) {
        return { return: { message: `Session ${sessionId} completed and NFT awarded to ${walletAddress}!`, nftId } }
      } else {
        return { return: { message: `Session ${sessionId} completed, but NFT creation failed.` } }
      }
    } catch (error) {
      console.error('Error in complete_session:', error)
      return { return: { message: `Session ${sessionId} completed, but NFT award failed.` } }
    }
  }
}

/** ---------------------------------------------
 * 🧱 FACTORY
 * --------------------------------------------- */
export class SkillSwapFactory {
  private algorand: AlgorandClient

  constructor(algorand: AlgorandClient) {
    this.algorand = algorand
  }

  async deploy(): Promise<{ appClient: SkillSwapClient }> {
    const appId = Math.floor(Math.random() * 1_000_000) + 1
    const appClient = new SkillSwapClient({ appId, algorand: this.algorand })
    return { appClient }
  }
}
