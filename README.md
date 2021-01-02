# msa-coder

A JavaScript module for decoding files created using the Magic Shadow Archiver.

## Install

```
npm install git+https://github.com/keithclark/msa-coder.git
```

## Usage

```js
import { decode } from 'msa-coder';
import { readFile, writeFile } from 'fs';

readFile('mydisk.msa', (err, buffer) => {
  const disk = decode(buffer);
  console.log(disk.format);
  writeFile('my-disk.st', disk.data, (err) => {
    console.log('Done');
  });
});
```

## `decode()`

Parses an `arrayBuffer` containing MSA data structure and returns an object describing the original disk format and the decoded data in a `Uint8Array`.

### Syntax
```js
const disk = decode(inputBuffer);
```

### Arguments
Argument | Type | Description
-|-|-
 `inputBuffer` | arrayBuffer | A buffer containing MSA encoded data.

### Result

```js
{
  format: {
    sectorsPerTrack: 10,
    sides: 1,
    firstEncodedTrack: 0,
    lastEncodedTrack: 81
  },
  data: [90, 0, ...]
}
```

Property | Type | Description
-|-|-
`format` | Object | The disk format.
`format.sectorsPerTrack` | Number | Number of sectors on the original disk.
`format.sides` | Number | Number of sides (0-based) on the original disk.
`format.firstEncodedTrack` | Number | The first track on the original disk that this archive was read from.
`format.lastEncodedTrack` | Number | The last track on the original disk that this archive was read from.
`data` | Uint8Array | Decoded data.