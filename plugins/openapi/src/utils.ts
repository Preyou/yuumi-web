import type { Config } from './config'
import { writeFile } from 'node:fs/promises'
import openapiTS, { astToString } from 'openapi-typescript'

export async function generaDts(config: Config) {
  try {
    const ast = await openapiTS(config.uri)
    const contents = astToString(ast)
    writeFile(config.writeTo, contents)
  }
  catch (error) {
    console.error(error)
  }
}
