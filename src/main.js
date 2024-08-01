const core = require('@actions/core')
const exec = require('@actions/exec')
const fs = require('fs')
const yaml = require('js-yaml')

async function run() {
  try {
    const configStr = core.getInput('config')
    const tfPlanOutputPath = core.getInput('tfPlanOutputPath')

    const config = yaml.load(configStr)

    // Write config.yaml for OPA Inputs
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

    // Run conftest
    try {
      await exec.exec('conftest', [
        'test',
        tfPlanOutputPath,
        '-d',
        outputPath,
        '--policy',
        'policy/'
      ])
    } catch (error) {
      core.setFailed(`Conftest failed: ${error.message}`)
    }
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`)
  }
}

module.exports = {
  run
}
