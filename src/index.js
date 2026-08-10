import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import * as core from '@actions/core'
import { send } from './discord.js'

export function getPayload(eventPath = process.env.GITHUB_EVENT_PATH) {
  return eventPath ? JSON.parse(readFileSync(eventPath, 'utf8')) : {}
}

function getOptionalBooleanInput(name) {
  return core.getInput(name) ? core.getBooleanInput(name) : false
}

export async function run() {
  const payload = getPayload()
  const commits = payload.commits ?? []
  const size = payload.size ?? commits.length

  core.info(`Received ${commits.length}/${size} commits.`)
  if (getOptionalBooleanInput('debug')) {
    core.info(`Full payload: ${JSON.stringify(payload)}`)
  }

  if (commits.length === 0) {
    core.info('No commits, skipping.')
    return
  }
  if (payload.sender?.type === 'Bot') {
    core.info('Commit by bot, skipping.')
    return
  }

  const repository = (core.getInput('repoName') || payload.repository?.name || 'GitHub').replace(
    /discord/gi,
    '*******',
  )

  const webhook = core.getInput('webhook')

  await send({
    webhook,
    id: webhook ? undefined : core.getInput('id', { required: true }),
    token: webhook ? undefined : core.getInput('token', { required: true }),
    repo: repository,
    url: payload.compare,
    commits,
    size,
    pusher: payload.pusher?.name ?? payload.sender?.login ?? 'unknown',
    avatarUrl: core.getInput('avatarUrl'),
    hideCommitUrl: getOptionalBooleanInput('hideCommitUrl'),
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch((error) => {
    core.setFailed(error instanceof Error ? error.message : String(error))
  })
}
