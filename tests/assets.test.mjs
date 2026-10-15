import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(root, 'assets/data/asset-manifest.json');

test('all supplied portfolio media has an optimized web asset', () => {
  assert.ok(existsSync(manifestPath), 'asset manifest must exist');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.items.length, 58);
  assert.equal(new Set(manifest.items.map((item) => item.id)).size, 58);
  assert.equal(new Set(manifest.items.map((item) => item.sourcePath)).size, 45);

  for (const item of manifest.items) {
    assert.match(item.webPath, /^assets\/(images|video)\/[a-z0-9-]+\.(webp|mp4)$/);
    const filePath = resolve(root, item.webPath);
    assert.ok(existsSync(filePath), `${item.webPath} must exist`);
    assert.ok(statSync(filePath).size < 100 * 1024 * 1024, `${item.webPath} must stay below 100 MB`);
    assert.ok(item.width > 0 && item.height > 0);
    assert.ok(item.sourceGroup);
  }
});

test('videos use H.264 and include local poster images', () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const videos = manifest.items.filter((item) => item.type === 'video');
  assert.equal(videos.length, 2);

  for (const video of videos) {
    const codec = execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name',
      '-of', 'default=noprint_wrappers=1:nokey=1', resolve(root, video.webPath),
    ], { encoding: 'utf8' }).trim();
    assert.equal(codec, 'h264');
    assert.match(video.posterPath, /^assets\/images\/[a-z0-9-]+\.webp$/);
    assert.ok(existsSync(resolve(root, video.posterPath)));
  }
});
