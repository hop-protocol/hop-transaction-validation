import { ethers } from 'ethers'
import { KMSClient, GetPublicKeyCommand, SignCommand } from '@aws-sdk/client-kms'
import {
  type Event,
  type Transaction,
  ActionTypes,
  TxTypes
} from './types.js'

import addressConfig from './config/addresses.json' assert { type: 'json' }
import functionSignatureConfig from './config/functionSignatures.json' assert { type: 'json' }

const allowedTokenFunctions = {
  Transfer: '0xa9059cbb',
  Approve: '0x095ea7b3'
}

class KMSService {
  #kmsClient: KMSClient

  constructor() {
    this.#kmsClient = new KMSClient()
  }

  async getPublicKey(keyId: string): Promise<Uint8Array> {
    const command = new GetPublicKeyCommand({ KeyId: keyId })
    const res = await this.#kmsClient.send(command)
    if (!res.PublicKey) {
      throw new Error('Public key not found')
    }
    return res.PublicKey
  }

  async sign(keyId: string, message: Buffer): Promise<Uint8Array> {
    const command = new SignCommand({
      KeyId: keyId,
      Message: message,
      SigningAlgorithm: 'ECDSA_SHA_256',
      MessageType: 'DIGEST'
    })
    const res = await this.#kmsClient.send(command)
    if (!res.Signature) {
      throw new Error('Signature not found')
    }
    return res.Signature
  }
}

class TransactionService {
  #addresses: Record<string, string[]>
  #functionSignatures: Record<string, string[]>

  constructor() {
    this.#addresses = this.normalizeConfig(addressConfig)
    this.#functionSignatures = this.normalizeConfig(functionSignatureConfig)
  }

  private normalizeConfig(config: Record<string, string[]>): Record<string, string[]> {
    return Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.map((addr) => addr.toLowerCase())])
    )
  }

  validateTransaction(txType: TxTypes, transaction: Transaction): void {
    const { to, data } = transaction
    if (!this.#addresses[txType]?.includes(to.toLowerCase())) {
      throw new Error(`Invalid recipient: ${to}`)
    }

    const functionSignature = data.slice(0, 10).toLowerCase()
    if (txType !== TxTypes.OTHER && !this.#functionSignatures[txType]?.includes(functionSignature)) {
      throw new Error(`Invalid function signature: ${functionSignature}`)
    }
  }

  formatTransactionHexValues(transaction: Transaction): Transaction {
    const formattedTx = { ...transaction }

    if (transaction.gasLimit) formattedTx.gasLimit = ethers.BigNumber.from(transaction.gasLimit).toHexString()
    if (transaction.gasPrice) formattedTx.gasPrice = ethers.BigNumber.from(transaction.gasPrice).toHexString()
    if (transaction.value) formattedTx.value = ethers.BigNumber.from(transaction.value).toHexString()
    if (transaction.maxFeePerGas) formattedTx.maxFeePerGas = ethers.BigNumber.from(transaction.maxFeePerGas).toHexString()
    if (transaction.maxPriorityFeePerGas) formattedTx.maxPriorityFeePerGas = ethers.BigNumber.from(transaction.maxPriorityFeePerGas).toHexString()

    return formattedTx
  }

  determineTxType(to: string): TxTypes {
    for (const [type, addresses] of Object.entries(this.#addresses)) {
      if (addresses.includes(to.toLowerCase())) {
        return type as TxTypes
      }
    }
    throw new Error(`Unknown recipient: ${to}`)
  }
}

export const handler = async (event: Event) => {
  const { keyId, actionType, transaction } = event
  const kmsService = new KMSService()
  const txService = new TransactionService()

  switch (actionType) {
    case ActionTypes.GetPublicKey:
      return await kmsService.getPublicKey(keyId)

    case ActionTypes.Sign:
      if (!transaction) {
        throw new Error('Transaction data is required for signing')
      }
      const txType = txService.determineTxType(transaction.to)
      txService.validateTransaction(txType, transaction)
      const formattedTx = txService.formatTransactionHexValues(transaction)
      const unsignedTx = await ethers.utils.resolveProperties(formattedTx)
      const serializedTx = ethers.utils.serializeTransaction(unsignedTx)
      const txHash = ethers.utils.keccak256(serializedTx)
      const message = Buffer.from(ethers.utils.arrayify(txHash))
      return await kmsService.sign(keyId, message)

    default:
      throw new Error('Invalid action type')
  }
}
