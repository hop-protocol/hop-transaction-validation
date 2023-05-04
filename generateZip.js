const path = require('path')
const fs = require('fs')

const validationConfigFilepath = path.resolve(__dirname, './validationConfig')
const addressesFilepath = path.resolve(__dirname, './validationConfig/addresses.json')

function main() {
  // Remove address file if exists
  if (fs.existsSync(addressesFilepath)) {
    fs.unlinkSync(addressesFilepath)
  }

  // Generate new address file based on input and templates
  const network = process.argv[2].toLowerCase()
  const token = process.argv[3].toLowerCase()

  if (!network || !token) {
    throw new Error('invalid network or token')
  }

  const addressTemplateFilepath = validationConfigFilepath + `/addressTemplates/${network}_${token}.json`
  const res = fs.readFileSync(addressTemplateFilepath)
  let addressesJson = JSON.parse(res)
  delete addressesJson['_comment']
  fs.writeFileSync(addressesFilepath, JSON.stringify(addressesJson, null, 2), 'utf-8')
}

main()