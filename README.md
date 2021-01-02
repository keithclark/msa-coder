# msa-coder

A JavaScript module for decoding files created using the Magic Shadow Archiver.

## Install

```
npm install git+https://github.com/keithclark/msa-coder.git
```

## Usage

```js
import { decode } from 'msa-coder';
import { readFile } from 'fs';

readFile('mydisk.msa', (err, buffer) => {
  const disk = decode(buffer);
  console.log(disk.format);
  writeFile('my-disk.st', disk.data, (err) => {
    console.log('Done');
  });
});
```

