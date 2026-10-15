import { readFileSync, writeFileSync } from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Expected input TSV and output JSON paths');

const items = readFileSync(input, 'utf8').trim().split('\n').filter(Boolean).map((line) => {
  const [id, type, sourceGroup, sourcePath, webPath, width, height, posterPath] = line.split('\t');
  return {
    id,
    type,
    sourceGroup,
    sourcePath,
    webPath,
    width: Number(width),
    height: Number(height),
    ...(posterPath ? { posterPath } : {}),
  };
});

writeFileSync(output, `${JSON.stringify({ generatedAt: '2026-10-13', items }, null, 2)}\n`);
