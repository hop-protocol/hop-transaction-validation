import { utils as ethersUtils, BigNumber } from 'ethers'
import {
  type AllowlistConfig,
  type Event,
  type GeneralizedConfig,
  type Transaction,
  type TransactionConfig,
  TxType
} from './types.js'
import { CONFIG } from './config/index.js'


export class TransactionService {
  #config: TransactionConfig

  constructor() {
    const aggregatedConfig: TransactionConfig = {
      addresses: CONFIG.addresses,
      functionSignatures: CONFIG.functionSignatures,
      allowed: CONFIG.allowed
    }
    this.#config = this.#normalizeConfig(aggregatedConfig)
  }

  async signTransaction(transaction: Transaction): Promise<Buffer> {
    const isValid = this.#isValidTransaction(transaction)
    if (!isValid) {
      throw new Error('Invalid transaction')
    }

    const formattedTx = this.#formatTransactionHexValues(transaction)
    const unsignedTx = await ethersUtils.resolveProperties(formattedTx)
    const serializedTx = ethersUtils.serializeTransaction(unsignedTx)
    const txHash = ethersUtils.keccak256(serializedTx)
    return Buffer.from(ethersUtils.arrayify(txHash))
  }

  #normalizeConfig(config: TransactionConfig): TransactionConfig {
    for (const key of Object.keys(config.addresses) as (keyof GeneralizedConfig)[]) {
      config.addresses[key] = config.addresses[key].map((address: string) => address.toLowerCase())
    }

    for (const key of Object.keys(config.functionSignatures) as (keyof GeneralizedConfig)[]) {
      config.functionSignatures[key] = config.functionSignatures[key].map((signature: string) => {
        if (signature.length !== 10) {
          throw new Error(`Invalid function signature: ${signature}`)
        }
        return signature.toLowerCase()
      })
    }

    for (const chainId of Object.keys(config.allowed)) {
      const chainIdNum = parseInt(chainId)
      config.allowed[chainIdNum] = config.allowed[chainIdNum]!.map((address: string) => address.toLowerCase())
    }

    return config
  }

  #formatTransactionHexValues(transaction: Transaction): Transaction {
    const formattedTx = { ...transaction }

    if (transaction.gasLimit) formattedTx.gasLimit = BigNumber.from(transaction.gasLimit).toHexString()
    if (transaction.gasPrice) formattedTx.gasPrice = BigNumber.from(transaction.gasPrice).toHexString()
    if (transaction.value) formattedTx.value = BigNumber.from(transaction.value).toHexString()
    if (transaction.maxFeePerGas) formattedTx.maxFeePerGas = BigNumber.from(transaction.maxFeePerGas).toHexString()
    if (transaction.maxPriorityFeePerGas) formattedTx.maxPriorityFeePerGas = BigNumber.from(transaction.maxPriorityFeePerGas).toHexString()

    return formattedTx
  }

  /**
   * Validation
   */

  #isValidTransaction (transaction: Transaction): boolean {
    const txType = this.#determineTxType(transaction.to.toLowerCase())

    switch (txType) {
      case TxType.Protocol:
        return this.#isValidProtocolTx(transaction)

      case TxType.ERC20:
        return this.#isValidERC20Tx(transaction)

      case TxType.Allowed:
        return this.#isValidNativeTransferTx(transaction)

      default:
        throw new Error('Unknown transaction type')
    }
  }

  #determineTxType (to: string): TxType {
    for (const [type, addresses] of Object.entries(this.#config.addresses)) {
      if (addresses.includes(to.toLowerCase())) {
        return type as TxType
      }
    }

    for (const [, addresses] of Object.entries(this.#config.allowed)) {
      if (addresses.includes(to.toLowerCase())) {
        return TxType.Allowed
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

    if (!this.#config.addresses[TxType.Protocol].includes(to.toLowerCase())) {
      console.log(`Invalid ERC20 contract: ${to}`)
      return false
    }

    const functionSignature = data.slice(0, 10).toLowerCase()
    if (!this.#config.functionSignatures[TxType.Protocol].includes(functionSignature)) {
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

    if (!this.#config.addresses[TxType.ERC20].includes(to.toLowerCase())) {
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
    const tokenFunctionSig = data.toLowerCase().slice(0, 10)
    const spenderOrRecipient = '0x' + data.toLowerCase().slice(34, 74)

    const ERC20FunctionSignatures = {
      Approve: '0x095ea7b3',
      Transfer: '0xa9059cbb'
    }
    let allowedAddresses: string[] | undefined
    if (tokenFunctionSig === ERC20FunctionSignatures.Approve) {
      allowedAddresses = this.#config.addresses[TxType.Protocol]
    } else if (tokenFunctionSig === ERC20FunctionSignatures.Transfer) {
      allowedAddresses = this.#config.allowed[chainId]
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

    const allowedAddresses = this.#config.allowed[chainId]
    if (
      !allowedAddresses ||
      allowedAddresses.length === 0
    ) {
      console.log(`Chain ID ${chainId} has no allowed recipients`)
      return false
    }
    
    if (!allowedAddresses.includes(to.toLowerCase())) {
      console.log(`Invalid recipient: ${to}`)
      return false
    }

    return true
  }

}
