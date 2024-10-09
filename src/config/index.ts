import { ADDRESSES } from './addresses.js'
import { FUNCTION_SIGNATURES } from './functionSignatures.js'
import type { TransactionConfig } from '../types.js'
import USER_CONFIG from '../../config.json' assert { type: 'json' }

export const CONFIG: TransactionConfig = {
  addresses: ADDRESSES,
  functionSignatures: FUNCTION_SIGNATURES,
  allowed: USER_CONFIG
}
