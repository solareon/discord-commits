import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createEmbed, getChangeLog, getWebhookUrl, send } from '../src/discord.js'

const commits = [
  {
    id: 'abcdef123456',
    message: 'First commit\nwith a multiline message',
    timestamp: '2026-08-01T10:00:00Z',
    url: 'https://github.com/example/repo/commit/abcdef123456',
    author: { username: 'octocat' },
  },
  {
    id: '123456abcdef',
    message: 'Latest commit',
    timestamp: '2026-08-02T10:00:00Z',
    url: 'https://github.com/example/repo/commit/123456abcdef',
    author: { name: 'Local Author', username: null },
  },
]

test('creates an embed using the latest commit timestamp', () => {
  const embed = createEmbed({
    url: 'https://github.com/example/repo/compare/before...after',
    commits,
    size: commits.length,
    pusher: 'octocat',
    hideCommitUrl: false,
  })

  assert.equal(embed.author.name, '⚡ octocat pushed 2 commits')
  assert.equal(embed.timestamp, '2026-08-02T10:00:00.000Z')
  assert.match(embed.description, /First commit with a multiline message/)
  assert.match(embed.description, /Local Author/)
})

test('hides commit links and reports commits omitted from the payload', () => {
  const changelog = getChangeLog(commits, 5, true)

  assert.doesNotMatch(changelog, /\/commit\//)
  assert.match(changelog, /`abcdef`/)
  assert.match(changelog, /\+ 3 more\.\.\./)
})

test('shows at most eight commits', () => {
  const manyCommits = Array.from({ length: 10 }, (_, index) => ({
    ...commits[0],
    id: `${index}`.repeat(12),
  }))

  const changelog = getChangeLog(manyCommits, manyCommits.length, false)

  assert.equal(changelog.split('\n').length, 9)
  assert.match(changelog, /\+ 2 more\.\.\./)
})

test('posts the webhook with mentions disabled', async () => {
  let request
  const fetchMock = async (url, options) => {
    request = { url, options }
    return { ok: true }
  }

  await send(
    {
      id: 'webhook/id',
      token: 'secret/token',
      repo: 'example-repo',
      url: 'https://github.com/example/repo/compare/before...after',
      commits,
      size: commits.length,
      pusher: 'octocat',
      avatarUrl: '',
      hideCommitUrl: false,
    },
    fetchMock,
  )

  const body = JSON.parse(request.options.body)
  assert.equal(request.url, 'https://discord.com/api/v10/webhooks/webhook%2Fid/secret%2Ftoken')
  assert.deepEqual(body.allowed_mentions, { parse: [] })
  assert.equal(body.embeds[0].timestamp, '2026-08-02T10:00:00.000Z')
})

test('posts using a full webhook URL', async () => {
  let request
  const fetchMock = async (url) => {
    request = { url }
    return { ok: true }
  }

  await send(
    {
      webhook: 'https://discord.com/api/webhooks/webhook-id/webhook-token?thread_id=123',
      repo: 'example-repo',
      url: 'https://github.com/example/repo/compare/before...after',
      commits,
      size: commits.length,
      pusher: 'octocat',
      hideCommitUrl: false,
    },
    fetchMock,
  )

  assert.equal(request.url, 'https://discord.com/api/webhooks/webhook-id/webhook-token?thread_id=123')
})

test('rejects malformed webhook URLs', () => {
  assert.throws(
    () => getWebhookUrl({ webhook: 'https://example.com/not-a-webhook' }),
    /full Discord webhook URL/,
  )
})
