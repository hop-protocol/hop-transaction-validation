export enum ActionTypes {
  GetPublicKey = 'getPublicKey',
  Sign = 'sign'
}

export enum TxTypes {
  HOP = 'HOP',
  TOKEN = 'TOKEN',
  OTHER = 'OTHER'
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
}
