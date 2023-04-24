const ethers = require('ethers');
const kms = require('@aws-sdk/client-kms')

let addresses = require('./validationConfig/addresses')
let functionSignatures = require('./validationConfig/functionSignatures')

// Note: The values are returned as Uint8Array. Decoding is done by the caller.
exports.handler = async (event) => {
  const { keyId, actionType } = event
  const kmsClient = new kms.KMSClient()

  if (actionType === 'getPublicKey') {
    return await getPublicKey(keyId, kmsClient)
  } else if (actionType === 'sign') {
    return await sign(keyId, kmsClient, event.transaction)
  } else {
    throw new Error('Invalid action type')
  }
};

async function getPublicKey (keyId, kmsClient) {
  const command = new kms.GetPublicKeyCommand({
    KeyId: keyId
  })
  const res = await kmsClient.send(command)
  return res.PublicKey
}

async function sign (keyId, kmsClient, transaction) {
  addresses = addresses.map(x => x.toLowerCase())
  functionSignatures = functionSignatures.map(x => x.toLowerCase())

  // Sanity check data arrays
  if (!addresses || addresses.length === 0) {
    throw new Error('Invalid addresses array')
  }

  if (!functionSignatures || functionSignatures.length === 0) {
    throw new Error('Invalid function signatures array')
  }

  // Validate transaction data
  const to = transaction.to.toLowerCase()
  if (!addresses.includes(to)) {
    throw new Error(`Cannot send to address ${to}`)
  }

  const data = transaction.data.toLowerCase()
  if (!functionSignatures.includes(data.slice(0, 10))) {
    throw new Error(`Cannot send the function ${data.slice(0, 10)}`)
  }

  const value = transaction.value ?? '0x'
  if (value !== '0x') {
    throw new Error(`Cannot send with value ${value.toString()}`)
  }

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