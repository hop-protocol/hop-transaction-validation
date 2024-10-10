export enum TxType {
  Protocol = 'protocol',
  ERC20 = 'erc20',
  Native = 'native'
}

export interface ConfigDataTypes {
  protocol: string[]
  erc20: string[]
}

export interface ConfigData {
  addresses: ConfigDataTypes
  functionSignatures: ConfigDataTypes
}
