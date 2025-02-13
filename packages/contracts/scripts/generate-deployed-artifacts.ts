import path from 'path'
import glob from 'glob'
import fs from 'fs'

/**
 * Script for automatically generating a TypeScript file for retrieving deploy artifact JSON files.
 * We do this to make sure that this package remains browser compatible.
 */
const main = async () => {
  let content = `
  /* eslint-disable */
  /*
  THIS FILE IS AUTOMATICALLY GENERATED.
  DO NOT EDIT.
  */
  `

  const deploymentNames = fs
    .readdirSync(path.resolve(__dirname, '../deployments'), {
      withFileTypes: true,
    })
    .filter((entry) => {
      return entry.isDirectory()
    })
    .map((entry) => {
      return entry.name
    })

  const artifactNames = []
  for (const deploymentName of deploymentNames) {
    const deploymentArtifacts = glob.sync(
      path.join(
        path.resolve(__dirname, '../deployments'),
        deploymentName,
        '/*.json'
      )
    )

    for (const artifactPath of deploymentArtifacts) {
      const relPath = path.relative(__dirname, artifactPath)
      const contractName = path.basename(artifactPath, '.json')
      const artifactName = `${deploymentName}__${contractName}`.replace(
        /-/g,
        '_'
      )
      artifactNames.push(artifactName)

      content += `const ${artifactName} = require('${relPath}')\n`
    }
  }

  content += `
  export const getDeployedContractArtifact = (name: string, network: string): any => {
    return {
      ${artifactNames.join(',\n')}
    }[(network + '__' + name).replace(/-/g, '_')]
  }
  `

  fs.writeFileSync(`./src/contract-deployed-artifacts.ts`, content)
}

main()
