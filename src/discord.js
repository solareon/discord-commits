import * as core from '@actions/core'

const MAX_MESSAGE_LENGTH = 72
const MAX_COMMITS = 8
const DEFAULT_AVATAR_URL = 'https://slrn.dev/SLRN_Development.png'

export async function send(
  { id, token, repo, url, commits, size, pusher, avatarUrl, hideCommitUrl },
  fetchImpl = fetch,
) {
  core.info('Preparing webhook...')
  const response = await fetchImpl(
    `https://discord.com/api/v10/webhooks/${encodeURIComponent(id)}/${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        avatar_url: avatarUrl || DEFAULT_AVATAR_URL,
        username: repo,
        embeds: [createEmbed({ url, commits, size, pusher, hideCommitUrl })],
        allowed_mentions: { parse: [] },
      }),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Discord webhook failed (${response.status}): ${details || response.statusText}`)
  }

  core.info('Successfully sent the message!')
}

export function createEmbed({ url, commits, size, pusher, hideCommitUrl }) {
  const latest = commits.at(-1)

  return {
    color: 0xff6228,
    author: {
      name: `⚡ ${pusher} pushed ${size} commit${size === 1 ? '' : 's'}`,
      icon_url: `https://github.com/${pusher}.png?size=64`,
      url: hideCommitUrl ? `https://github.com/${pusher}` : url,
    },
    description: getChangeLog(commits, size, hideCommitUrl),
    timestamp: new Date(latest.timestamp).toISOString(),
  }
}

export function getChangeLog(commits, size, hideCommitUrl) {
  const lines = commits.slice(0, MAX_COMMITS).map((commit) => {
    const sha = commit.id.slice(0, 6)
    const normalizedMessage = commit.message.replace(/\s+/g, ' ').trim()
    const message =
      normalizedMessage.length > MAX_MESSAGE_LENGTH
        ? `${normalizedMessage.slice(0, MAX_MESSAGE_LENGTH)}...`
        : normalizedMessage
    const author = commit.author?.username
      ? `[\`${commit.author.username}\`](https://github.com/${commit.author.username})`
      : `\`${commit.author?.name ?? 'unknown'}\``
    const commitLink = hideCommitUrl ? `\`${sha}\`` : `[\`${sha}\`](${commit.url})`

    return `${commitLink} — ${message} (${author})`
  })

  const remaining = Math.max(0, size - lines.length)
  if (remaining > 0) {
    lines.push(`+ ${remaining} more...`)
  }

  return lines.join('\n')
}
