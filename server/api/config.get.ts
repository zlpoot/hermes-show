import { defineEventHandler } from 'h3'
import { getHermesConfig, getHermesPath } from '../utils/hermes'
import { createDefaultConfigResponse, mapHermesConfigToResponse } from '../utils/config-transform'

export default defineEventHandler(async (event) => {
  const config = getHermesConfig()

  if (config) {
    return mapHermesConfigToResponse(config, getHermesPath() + '/config.yaml')
  }

  console.log('[config] No config.yaml found, returning defaults')
  return createDefaultConfigResponse(false, null)
})
