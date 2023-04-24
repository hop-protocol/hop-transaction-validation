const ethers = require('ethers');
const kms = require('@aws-sdk/client-kms')

// system transactions
// exit transactions
// etc...

const expectedAddresses = [

]

const expectedFunctionSigs = [

]
const expectedValue = '0x'

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
  const { to, data, value } = transaction
  // if (!to || !data || !value) {
  //   throw new Error('Missing transaction data')
  // }

  // if (!expectedAddresses.includes(to)) {
  //   throw new Error('Cannot send to this address')
  // }

  // if (!expectedFunctionSigs.includes(data.slice(0, 10))) {
  //   throw new Error('Cannot call this function')
  // }

  // if (value !== expectedValue) {
  //   throw new Error('Cannot send this value')
  // }


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