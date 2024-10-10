import { utils as ethersUtils, BigNumber } from 'ethers'
import {
  type ConfigData,
  type ConfigDataTypes,
  type Transaction,
  TxType
} from './types.js'
import { CONFIG_DATA } from './config/index.js'

import CUSTOM_DATA from '../config.json' assert { type: 'json' }

interface CustomData {
  [chainId: number]: string[]
}

// Future work
// * An address cannot currently exist in multiple sections at once (protocol, erc20, native). It should be able to.
// * More modular validation of other tx values, like max gas price, etc. (EDIT: This might be a feature of a signer, not validator).
// * Tests

export class TransactionService {
  #configData: ConfigData
  #customData: CustomData

  constructor() {
    this.#configData = this.#formatDefaultConfigData(CONFIG_DATA)
    this.#customData = this.#formatCustomConfigData(CUSTOM_DATA)
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

  #formatDefaultConfigData(config: ConfigData): ConfigData {
    const formattedConfigData = { ...config }

    for (const key of Object.keys(formattedConfigData.addresses) as (keyof ConfigDataTypes)[]) {
      formattedConfigData.addresses[key] = formattedConfigData.addresses[key].map((address: string) => address.toLowerCase())
    }

    for (const key of Object.keys(formattedConfigData.functionSignatures) as (keyof ConfigDataTypes)[]) {
      formattedConfigData.functionSignatures[key] = formattedConfigData.functionSignatures[key].map((signature: string) => signature.toLowerCase())
    }

    return formattedConfigData
  }

  #formatCustomConfigData(config: CustomData): CustomData {
    const formattedCustomData: CustomData = {}

    for (const [chainId, addresses] of Object.entries(config)) {
      formattedCustomData[Number(chainId)] = addresses.map((addr: string) => addr.toLowerCase())
    }

    return formattedCustomData
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

    for (const addresses of Object.values(this.#customData)) {
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

    // TODO: Not hardcoded
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

    if (!allowedAddresses || allowedAddresses.length === 0) {
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
    if (!allowedAddresses || allowedAddresses.length === 0) {
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
