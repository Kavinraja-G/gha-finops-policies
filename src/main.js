const core = require('@actions/core')
const fs = require('fs')
const yaml = require('js-yaml')

async function run() {
  try {
    const configStr = core.getInput('config')

    const config = yaml.load(configStr)

    const opaInputContent = yaml.dump({
      config: {
        ec2: {
          enabled: config.ec2.enabled,
          allowedInstanceTypeRegEx: config.ec2.allowedInstanceTypeRegEx
        },
        tags: {
          enabled: config.tags.enabled,
          allowedBillingTags: config.tags.allowedBillingTags
        }
      }
    })

    const outputPath = 'config.yaml'

    fs.writeFileSync(outputPath, opaInputContent, 'utf8')

    core.setOutput('out-file', outputPath)
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`)
  }
}

module.exports = {
  run
}
