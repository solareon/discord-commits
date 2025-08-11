const core = require('@actions/core')
const { MessageEmbed, WebhookClient } = require('discord.js')
const MAX_MESSAGE_LENGTH = 72
const avatarUrl = core.getInput('avatarUrl')
const hideCommitUrl = core.getInput('hideCommitUrl') === 'true'

module.exports.send = (id, token, repo, url, commits, size, pusher) =>
  new Promise((resolve, reject) => {
    let client
    console.log('Preparing Webhook...')
    try {
      client = new WebhookClient({
        id: id,
        token: token,
      })
      client
        .send({
          avatarURL: avatarUrl || 'https://slrn.dev/SLRN_Development.png',
          username: repo,
          embeds: [createEmbed(url, commits, size, pusher)],
        })
        .then(() => {
          console.log('Successfully sent the message!')
          resolve()
        }, reject)
    } catch (error) {
      console.log('Error creating Webhook')
      reject(error.message)
      return
    }
  })

function createEmbed(url, commits, size, pusher) {
  console.log('Constructing Embed...')
  console.log('Commits :')
  console.log(commits)
  if (!commits) {
    console.log('No commits, skipping...')
    return
  }
  const latest = commits[0]
  return new MessageEmbed()
    .setColor(0xff6228)
    .setAuthor({
      name: `⚡ ${pusher} pushed ${size} commit${
        size === 1 ? '' : 's'
      }`,
      iconURL: `https://github.com/${pusher}.png?size=64`,
      url: hideCommitUrl ? `https://github.com/${pusher}` : url,
    })
    .setDescription(`${getChangeLog(commits, size)}`)
    .setTimestamp(Date.parse(latest.timestamp))
}

function getChangeLog(commits, size) {
  let changelog = ''
  for (const i in commits) {
    if (i > 7) {
      changelog += `+ ${size - i} more...\n`
      break
    }

    const commit = commits[i]
    const sha = commit.id.substring(0, 6)
    const message =
      commit.message.length > MAX_MESSAGE_LENGTH
        ? commit.message.substring(0, MAX_MESSAGE_LENGTH) + '...'
        : commit.message
    changelog += hideCommitUrl
      ? `\`${sha}\` — ${message} ([\`${commit.author.username}\`](https://github.com/${commit.author.username}))\n`
      : `[\`${sha}\`](${commit.url}) — ${message} ([\`${commit.author.username}\`](https://github.com/${commit.author.username}))\n`
  }

  return changelog
}
