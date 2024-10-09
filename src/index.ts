import { KMSService } from './KMSService.js'
import { TransactionService } from './transactionService.js'
import { type Event, ActionTypes } from './types.js'

// The method name `handler` is required for lambda function
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

      const message: Buffer = await txService.signTransaction(transaction)
      return await kmsService.sign(keyId, message)

    default:
      throw new Error('Invalid action type')
  }
}
