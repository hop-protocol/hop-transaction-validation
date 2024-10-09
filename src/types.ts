export enum ActionTypes {
  GetPublicKey = 'getPublicKey',
  Sign = 'sign'
}

export enum TxType {
  Protocol = 'protocol',
  ERC20 = 'erc20',
  Allowed = 'allowed'
}

export interface Event {
  keyId: string
  actionType: ActionTypes
  transaction?: Transaction
}

export interface Transaction {
  to: string
  data: string
  value?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  chainId: number
}

export interface AllowlistConfig {
  [chainId: number]: string[]
}

export interface GeneralizedConfig {
  protocol: string[]
  erc20: string[]
}

export interface TransactionConfig {
  addresses: GeneralizedConfig
  functionSignatures: GeneralizedConfig
  allowed: AllowlistConfig
}
