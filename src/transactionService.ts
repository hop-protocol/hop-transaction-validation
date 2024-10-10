import { utils as ethersUtils, BigNumber } from 'ethers'
import {
  type ConfigData,
  type ConfigDataTypes,
  type Transaction,
  TxType
} from './types.js'
import { CONFIG } from './config/index.js'

import USER_CONFIG from '../config.json' assert { type: 'json' }

interface CustomData {
  [chainId: number]: string[]
}

export class TransactionService {
  #configData: ConfigData
  #customData: CustomData

  constructor() {
    this.#configData = this.#formatDefaultConfig(CONFIG)
    this.#customData = this.#formatCustomConfig(USER_CONFIG)
  }

  async signTransaction(transaction: Transaction): Promise<Buffer> {
    const formattedTx = this.#formatTransaction(transaction)
    const isValid = this.#isValidTransaction(formattedTx)
    if (!isValid) {
      throw new Error('Invalid transaction')
    }

    const unsignedTx = await ethersUtils.resolveProperties(formattedTx)
    const serializedTx = ethersUtils.serializeTransaction(unsignedTx)
    const txHash = ethersUtils.keccak256(serializedTx)
    return Buffer.from(ethersUtils.arrayify(txHash))
  }

  /**
   * Internal - format
   */

  #formatDefaultConfig(config: ConfigData): ConfigData {
    for (const key of Object.keys(config.addresses) as (keyof ConfigDataTypes)[]) {
      config.addresses[key] = config.addresses[key].map((address: string) => address.toLowerCase())
    }

    for (const key of Object.keys(config.functionSignatures) as (keyof ConfigDataTypes)[]) {
      config.functionSignatures[key] = config.functionSignatures[key].map((signature: string) => signature.toLowerCase())
    }

    return config
  }

  #formatCustomConfig(config: CustomData): CustomData {
    for (const chainId of Object.keys(config)) {
      const chainIdNum = parseInt(chainId)
      config[chainIdNum] = config[chainIdNum]!.map((address: string) => address.toLowerCase())
    }

    return config
  }

  #formatTransaction(transaction: Transaction): Transaction {
    const formattedTx = { ...transaction }

    // Lowercase
    formattedTx.to = transaction.to.toLowerCase()
    formattedTx.data = transaction.data?.toLowerCase()

    // Hex Values
    if (transaction.gasLimit) formattedTx.gasLimit = BigNumber.from(transaction.gasLimit).toHexString()
    if (transaction.gasPrice) formattedTx.gasPrice = BigNumber.from(transaction.gasPrice).toHexString()
    if (transaction.value) formattedTx.value = BigNumber.from(transaction.value).toHexString()
    if (transaction.maxFeePerGas) formattedTx.maxFeePerGas = BigNumber.from(transaction.maxFeePerGas).toHexString()
    if (transaction.maxPriorityFeePerGas) formattedTx.maxPriorityFeePerGas = BigNumber.from(transaction.maxPriorityFeePerGas).toHexString()

    return formattedTx
  }

  /**
   * Internal - Validation
   */

  #isValidTransaction (transaction: Transaction): boolean {
    const txType = this.#determineTxType(transaction.to)

    switch (txType) {
      case TxType.Protocol:
        return this.#isValidProtocolTx(transaction)

      case TxType.ERC20:
        return this.#isValidERC20Tx(transaction)

      case TxType.Native:
        return this.#isValidNativeTransferTx(transaction)

      default:
        throw new Error('Unknown transaction type')
    }
  }

  #determineTxType (to: string): TxType {
    for (const [type, addresses] of Object.entries(this.#configData.addresses)) {
      if (addresses.includes(to)) {
        return type as TxType
      }
    }

    for (const [, addresses] of Object.entries(this.#customData)) {
      if (addresses.includes(to)) {
        return TxType.Native
      }
    }

    throw new Error(`Unknown recipient: ${to}`)
  }


  #isValidProtocolTx = (transaction: Transaction): boolean => {
    const { to, data } = transaction

    if (!data || data.length === 0) {
      console.log('Invalid data length for ERC20 transaction')
      return false
    }

    if (!this.#configData.addresses[TxType.Protocol].includes(to)) {
      console.log(`Invalid ERC20 contract: ${to}`)
      return false
    }

    const functionSignature = data.slice(0, 10)
    if (!this.#configData.functionSignatures[TxType.Protocol].includes(functionSignature)) {
      console.log(`Unknown function signature: ${functionSignature}`)
      return false
    }

    return true
  }

  
  #isValidERC20Tx = (transaction: Transaction): boolean => {
    const { to, data, value, chainId } = transaction

    if (value && !BigNumber.from(value).isZero()) {
      console.log('Cannot send value in ERC20 transaction')
      return false
    }

    if (!data || data.length !== 138) {
      console.log('Invalid data length for ERC20 transaction')
      return false
    }

    if (!this.#configData.addresses[TxType.ERC20].includes(to)) {
      console.log(`Invalid ERC20 contract: ${to}`)
      return false
    }

    if (!this.#isValidERC20Recipient(data, chainId)) {
      console.log('Invalid ERC20 recipient')
      return false
    }

    return true
  }

  #isValidERC20Recipient = (data: string, chainId: number): boolean => {
    // TODO: More native recipient retrieval with ethers decoder
    const tokenFunctionSig = data.slice(0, 10)
    const spenderOrRecipient = '0x' + data.slice(34, 74)

    const ERC20FunctionSignatures = {
      Approve: '0x095ea7b3',
      Transfer: '0xa9059cbb'
    }
    let allowedAddresses: string[] | undefined
    if (tokenFunctionSig === ERC20FunctionSignatures.Approve) {
      allowedAddresses = this.#configData.addresses[TxType.Protocol]
    } else if (tokenFunctionSig === ERC20FunctionSignatures.Transfer) {
      allowedAddresses = this.#customData[chainId]
    } else {
      console.log(`Unknown function signature: ${tokenFunctionSig}`)
      return false
    }

    if (
      !allowedAddresses ||
      allowedAddresses.length === 0
    ) {
      console.log(`Chain ID ${chainId} has no allowed recipients`)
      return false
    }

    if (!allowedAddresses.includes(spenderOrRecipient)) {
      console.log(`Invalid approval or transfer to ${spenderOrRecipient}`)
      return false
    }

    return true
  }


  #isValidNativeTransferTx = (transaction: Transaction): boolean => {
    const { to, data, value, chainId } = transaction

    if (!value) {
      console.log('Value is required for native transfer transaction')
      return false
    }

    if (BigNumber.from(value).isZero()) {
      console.log('Cannot send zero value to non-protocol contract')
      return false
    }

    if (data) {
      console.log('Cannot send data in a native transfer transaction')
      return false
    }

    const allowedAddresses = this.#customData[chainId]
    if (
      !allowedAddresses ||
      allowedAddresses.length === 0
    ) {
      console.log(`Chain ID ${chainId} has no allowed recipients`)
      return false
    }
    
    if (!allowedAddresses.includes(to)) {
      console.log(`Invalid recipient: ${to}`)
      return false
    }

    return true
  }
}
