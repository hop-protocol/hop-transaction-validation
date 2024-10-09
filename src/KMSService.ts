import { KMSClient, GetPublicKeyCommand, SignCommand } from '@aws-sdk/client-kms'

export class KMSService {
  #kmsClient: KMSClient

  constructor() {
    this.#kmsClient = new KMSClient()
  }

  async getPublicKey(keyId: string): Promise<Uint8Array> {
    const command = new GetPublicKeyCommand({ KeyId: keyId })
    const res = await this.#kmsClient.send(command)
    if (!res.PublicKey) {
      throw new Error('Public key not found')
    }
    return res.PublicKey
  }

  async sign(keyId: string, message: Buffer): Promise<Uint8Array> {
    const command = new SignCommand({
      KeyId: keyId,
      Message: message,
      SigningAlgorithm: 'ECDSA_SHA_256',
      MessageType: 'DIGEST'
    })
    const res = await this.#kmsClient.send(command)
    if (!res.Signature) {
      throw new Error('Signature not found')
    }
    return res.Signature
  }
}
