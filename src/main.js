const core = require('@actions/core')
const exec = require('@actions/exec')
const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

async function run() {
  try {
    const configStr = core.getInput('config')
    const inputPath = core.getInput('tfPlanOutputPath')
    let policyPath = path.join(__dirname, 'aws-policies')
    let outputPath = 'config.yaml'

    const config = yaml.load(configStr)

    // Write config.yaml for OPA Inputs
    const opaInputContent = {
      config: {}
    }

    // AWS policies config
    if (config.aws && config.aws.enabled) {
      opaInputContent.config.aws = {
        enabled: config.aws.enabled,
        ec2: {
          enabled: config.aws.ec2.enabled,
          allowedInstanceTypeRegEx: config.aws.ec2.allowedInstanceTypeRegEx
        },
        tags: {
          enabled: config.aws.tags.enabled,
          allowedBillingTags: config.aws.tags.allowedBillingTags
        }
      }
    }

    // Kubernetes policies config
    if (config.kubernetes && config.kubernetes.enabled) {
      policyPath = path.join(__dirname, 'k8s-policies')
      outputPath = 'k8s-config.yaml'
      opaInputContent.config.kubernetes = {
        enabled: config.kubernetes.enabled
      }
    }

    fs.writeFileSync(outputPath, yaml.dump(opaInputContent), 'utf8')

    core.setOutput('out-file', outputPath)

    // Run conftest
    try {
      await exec.exec('conftest', [
        'test',
        inputPath,
        '-d',
        outputPath,
        '--policy',
        policyPath
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
