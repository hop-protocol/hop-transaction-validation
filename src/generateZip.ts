import path from 'node:path'
import fs from 'node:fs'

const validationConfigFilepath: string = path.resolve(__dirname, './validationConfig')
const addressesFilepath: string = path.resolve(__dirname, './validationConfig/addresses.json')

function main(): void {
  // Remove address file if exists
  if (fs.existsSync(addressesFilepath)) {
    fs.unlinkSync(addressesFilepath)
  }

  // Generate new address file based on input and templates
  const network: string | undefined = process.argv[2]?.toLowerCase()
  const token: string | undefined = process.argv[3]?.toLowerCase()

  if (!network || !token) {
    throw new Error('invalid network or token')
  }

  const addressTemplateFilepath: string = path.join(validationConfigFilepath, 'addressTemplates', `${network}_${token}.json`)
  const res: Buffer = fs.readFileSync(addressTemplateFilepath)
  let addressesJson: Record<string, any> = JSON.parse(res.toString())
  delete addressesJson['_comment']

  fs.writeFileSync(addressesFilepath, JSON.stringify(addressesJson, null, 2), 'utf-8')
}

main()
