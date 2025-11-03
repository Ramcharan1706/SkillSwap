import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { enqueueSnackbar } from 'notistack'

interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{ trait_type: string; value: string }>
}

export const createNFT = async (
  owner: string,
  signer: any,
  client: AlgorandClient,
  skillId: number,
  sessionId?: number
): Promise<number | null> => {
  try {
    enqueueSnackbar('🎨 Creating your NFT...', { variant: 'info' })

    // List of 3 session completion images on IPFS
    const nftImages = [
      'https://ipfs.io/ipfs/bafkreifc3iyuu6awjfesdguq3wnrdogo3qhhhazbaubixeaeqdscdjzgsq', // Badge 1
      'https://ipfs.io/ipfs/bafkreicverscybyg7qclfgy7sq2kvndbzlyumiolwbj36awn2fg3vamh5a', // Badge 2
      'https://ipfs.io/ipfs/bafkreif3zcbarpibphcmtq77jsqynkn6mr3uuftxaqyqfitfenibuie7li', // Badge 3
    ]

    // Pick a random image
    const randomIndex = Math.floor(Math.random() * nftImages.length)
    const selectedImage = nftImages[randomIndex]

    const nftMetadata: NFTMetadata = {
      name: `SkillSwap Session #${sessionId || skillId}`,
      description: `NFT Reward for ${sessionId ? 'completing' : 'booking'} a session`,
      image: selectedImage,
      attributes: [
        { trait_type: 'Skill ID', value: skillId.toString() },
        { trait_type: 'Date', value: new Date().toISOString() },
        { trait_type: 'Type', value: sessionId ? 'Completion' : 'Booking' },
      ],
    }

    // Convert metadata to JSON and hash it
    const metadataJSON = JSON.stringify(nftMetadata)
    const metadataHash = new Uint8Array(algosdk.encodeObj(metadataJSON).slice(0, 32)) // 32-byte hash

    // Create NFT ASA
    const result = await client.send.assetCreate({
      sender: owner,
      assetName: `SkillSwap Session #${sessionId || skillId}`,
      unitName: `SS${(sessionId || skillId).toString().slice(-3)}`,
      total: BigInt(1),
      decimals: 0,
      defaultFrozen: false,
      manager: owner,
      reserve: owner,
      freeze: owner,
      clawback: owner,
      url: selectedImage,
      metadataHash,
      signer,
    })

    const assetId = Number(result.assetId)
    enqueueSnackbar(`🎨 NFT Created with Asset ID: ${assetId}`, { variant: 'success' })

    return assetId
  } catch (error: any) {
    enqueueSnackbar(`⚠️ NFT creation failed: ${error.message}`, { variant: 'warning' })
    console.error(error)
    return null
  }
}


export const transferNFT = async (
  assetId: number,
  from: string,
  to: string,
  signer: any,
  client: AlgorandClient
): Promise<boolean> => {
  try {
    enqueueSnackbar(`🔄 Transferring NFT ${assetId} to ${to.slice(0, 10)}...`, { variant: 'info' })

    await client.send.assetTransfer({
      sender: from,
      receiver: to,
      assetId: BigInt(assetId),
      amount: BigInt(1),
      signer,
    })

    enqueueSnackbar(`✅ NFT ${assetId} transferred successfully!`, { variant: 'success' })
    return true
  } catch (error: any) {
    enqueueSnackbar(`❌ NFT transfer failed: ${error.message}`, { variant: 'error' })
    console.error(error)
    return false
  }
}

export const checkNFTOwnership = async (
  assetId: number,
  walletAddress: string,
  client: AlgorandClient
): Promise<boolean> => {
  try {
    const indexer = client.client.indexer
    const accountAssets = await indexer.lookupAccountAssets(walletAddress).do()
    return accountAssets.assets.some((asset: any) => asset['asset-id'] === assetId)
  } catch (error) {
    console.error('Error checking NFT ownership:', error)
    return false
  }
}
