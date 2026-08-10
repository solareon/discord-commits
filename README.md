# Discord Webhook
This GitHub Action can produce fancy and **more meaningful Discord messages for your commits**.

## Setup
Setup this code on your repository's `.github/workflows/` in a file like `discord-push.yml` and push the changes:

```yml
name: Discord Webhook
on: [push]
jobs:
  Discord_notification:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Run Discord Webhook
      uses: solareon/discord-commits@v1
      with:
        webhook: ${{ secrets.DISCORD_WEBHOOK }}
        repoName: "discord-commits"
        avatarUrl: "https://slrn.dev/SLRN_Development.png"
        hideCommitUrl: false
        debug: false

```

You can see the example file at [/.github/workflows/discord-push.yml](/.github/workflows/discord-push.yml)
## Inputs
- `webhook`: the full Discord webhook URL. Use this or the legacy `id` and `token` inputs.
- `id`: the Discord webhook ID (legacy configuration)
- `token`: the Discord webhook token (legacy configuration)
- `repoName`: overrides the repo name for the embed
- `avatarUrl`: sets the url for the embed avatar. Defaults to https://slrn.dev/SLRN_Development.png
- `hideCommitUrl`: hides the commit url (useful for private repos)
- `debug`: enables debug prints

If both configurations are provided, `webhook` takes precedence.


In your **Settings > Security > Secrets and variables > Actions > Secrets** (/settings/secrets/actions) on GitHub, you can add one secret containing the complete webhook URL:
- `DISCORD_WEBHOOK`

The previous two-secret configuration remains supported:
- `DISCORD_WEBHOOK_ID`
- `DISCORD_WEBHOOK_TOKEN`


| `DISCORD_WEBHOOK` | `DISCORD_WEBHOOK_ID` + `DISCORD_WEBHOOK_TOKEN` |
|:---|:---|
| Recommended — the complete Discord webhook URL | Legacy configuration, still supported |

## Development

This action targets Node.js 24. Install the pinned runtime from `.nvmrc`, then run:

```sh
npm ci
npm test
```
