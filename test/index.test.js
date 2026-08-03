import assert from 'node:assert/strict'
import { unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { getPayload } from '../src/index.js'

test('reads the GitHub event payload', async (context) => {
  const eventPath = join(tmpdir(), `discord-commits-${process.pid}.json`)
  const payload = { commits: [{ id: 'abcdef' }] }
  await writeFile(eventPath, JSON.stringify(payload))
  context.after(() => unlink(eventPath))

  assert.deepEqual(getPayload(eventPath), payload)
})
