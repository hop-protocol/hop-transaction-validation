const ethers = require('ethers');
const kms = require('@aws-sdk/client-kms')

let addresses = require('./validationConfig/addresses.json')
let functionSignatures = require('./validationConfig/functionSignatures.json')

const ActionTypes = {
  GetPublicKey: 'getPublicKey',
  Sign: 'sign'
}

const TxTypes = {
  HOP: 'HOP',
  TOKEN: 'TOKEN',
  OTHER: 'OTHER'
}

// Note: The values are returned as Uint8Array. Decoding is done by the caller.
exports.handler = async (event) => {
  const { keyId, actionType } = event
  const kmsClient = new kms.KMSClient()

  // Normalize data
  addresses = validationConfigToLower(addresses)
  functionSignatures = validationConfigToLower(functionSignatures)

  // Perform action
  if (actionType === ActionTypes.GetPublicKey) {
    return await getPublicKey(keyId, kmsClient)
  } else if (actionType === ActionTypes.Sign) {
    return await sign(keyId, kmsClient, event.transaction)
  } else {
    throw new Error('Invalid action type')
  }
}

async function getPublicKey (keyId, kmsClient) {
  const command = new kms.GetPublicKeyCommand({
    KeyId: keyId
  })
  const res = await kmsClient.send(command)
  return res.PublicKey
}

async function sign (keyId, kmsClient, transaction) {
  const txType = getTxTypeFromTo(transaction.to)
  validateData(txType, transaction)

  // Sign the transaction
  const unsignedTx = await ethers.utils.resolveProperties(transaction)
  const serializedTx = ethers.utils.serializeTransaction(unsignedTx)
  const hash = ethers.utils.keccak256(serializedTx)
  const msg = Buffer.from(ethers.utils.arrayify(hash))
  const params = {
    KeyId: keyId,
    Message: msg,
    SigningAlgorithm: 'ECDSA_SHA_256',
    MessageType: 'DIGEST'
  }
  const command = new kms.SignCommand(params)
  const res = await kmsClient.send(command)

  return res.Signature
}

function validateData(txType, transaction) {
  // Validate expected params
  if (!addresses || addresses.length === 0) {
    throw new Error('Invalid addresses array')
  }

  if (!functionSignatures || functionSignatures.length === 0) {
    throw new Error('Invalid function signatures array')
  }

  // Validate transaction
  const { to, data } = transaction
  if (!addresses[txType].includes(to.toLowerCase())) {
    throw new Error(`Cannot send to address ${to}`)
  }

  if (txType !== TxTypes.OTHER) {
    if (!functionSignatures[txType].includes(data.toLowerCase().slice(0, 10))) {
      throw new Error(`Cannot send the function ${data.slice(0, 10)}`)
    }
  }

  if (txType !== TxTypes.OTHER) {
    if (!data) {
      throw new Error(`Expected 'data' field`)
    }
  }

  if (!to) {
    throw new Error(`Expected 'to' field`)
  }

  if (txType === TxTypes.HOP) {
    validateHopTxData(transaction)
  } else if (txType === TxTypes.TOKEN) {
    validateTokenTxData(transaction)
  } else if (txType === TxTypes.OTHER) {
    validateOtherTxData(transaction)
  } else {
    throw new Error('Invalid tx type')
  }
}

function validateHopTxData (transaction) {
  const { value } = transaction

  if (
    value &&
    value !== '0x' &&
    !BigNumber.from(value.toString()).eq(0)
  ) {
    throw new Error(`Cannot send with value ${value.toString()}`)
  }
}

function validateTokenTxData (transaction) {
  const { value, data } = transaction

  if (
    value &&
    value !== '0x' &&
    !BigNumber.from(value.toString()).eq(0)
  ) {
    throw new Error(`Cannot send with value ${value.toString()}`)
  }

  // Only allow a transfer to known address
  const transferRecipient = '0x' + data.slice(34,74)
  if (!addresses[TxTypes.OTHER].includes(transferRecipient.toLowerCase())) {
    throw new Error(`Invalid transfer recipient ${transferRecipient}`)
  }
}

function validateOtherTxData (transaction) {
  const { to } = transaction

  // Only allow a send to known address
  if (!addresses[TxTypes.OTHER].includes(to.toLowerCase())) {
    throw new Error(`Invalid send recipient ${transferRecipient}`)
  }
}

function validationConfigToLower(validationObject) {
  const lowerRes = {}
  for (const validationType in validationObject) {
    const lowerValidationPerType = validationObject[validationType].map(x => x.toLowerCase())
    lowerRes[validationType] = lowerValidationPerType
  }
  return lowerRes
}

function getTxTypeFromTo (to) {
  let txType
  for (const type in addresses) {
    const addressesPerType = addresses[type]
    if (!addressesPerType.includes(to.toLowerCase())) continue

    if (txType) {
      throw new Error('The same address should not exist in multiple types')
    }
    txType = type
  }

  if (!txType) {
    throw new Error('Invalid tx type')
  }
  return txType
}
