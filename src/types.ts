export enum ActionTypes {
  GetPublicKey = 'getPublicKey',
  Sign = 'sign'
}

export interface Event {
  keyId: string
  actionType: ActionTypes
  transaction?: Transaction
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
