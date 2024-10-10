/**
 * AWS
 */

export enum ActionTypes {
  GetPublicKey = 'getPublicKey',
  Sign = 'sign'
}

export interface Event {
  keyId: string
  actionType: ActionTypes
  transaction?: Transaction
}

/**
 * Transaction
 */

export enum TxType {
  Protocol = 'protocol',
  ERC20 = 'erc20',
  Native = 'native'
}

export interface Transaction {
  to: string
  data?: string
  value?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  chainId: number
}

/**
 * Config
 */

export interface ConfigDataTypes {
  protocol: string[]
  erc20: string[]
}

export interface ConfigData {
  addresses: ConfigDataTypes
  functionSignatures: ConfigDataTypes
}
