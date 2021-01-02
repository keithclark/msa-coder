/**
 * MSA Decoder by Keith Clark | License: MIT
 *
 * This is a JavaScript implementation of the Magic Shadow Archiver decoder. MSA
 * is used to store a single disk image into one or more files, which can be
 * spread over multiple smaller disks. The generated files can be loaded into
 * the MSA application, which will use them to rebuild the original disk image.
 * MSA also compresses disk images using Run-Length-Encoding.
 */

import { DISK_BYTES_PER_SECTOR, MSA_RLE_MARKER, MSA_FILE_HEADER } from './config.js';

/**
 * @typedef {Object} DecodedMsaData
 * @property {MsaHeader} format - The disk format
 * @property {Uint8Array} data - Decoded track data
 */

/**
 * @typedef {Object} MsaHeader
 * @property {number} sectorsPerTrack - Number of sectors per track
 * @property {number} sides - Number of sides
 * @property {number} firstEncodedTrack - Track number of the first encoded track (0-based)
 * @property {number} lastEncodedTrack - Track number of the last encoded track (0-based)
 */


/**
 * Decodes an msa file. Throws an exception if the format is invalid.
 *
 * @param {ArrayBuffer} buffer - A buffer containing msa data
 * @returns {DecodedMsaData} Decoded file
 */
export const decode = buffer => {
  const format = getFormat(buffer);
  if (!format) {
    throw new Error('Invalid file format.');
  }
  const { sectorsPerTrack, sides, firstEncodedTrack, lastEncodedTrack } = format;
  const bytesPerTrack = sectorsPerTrack * DISK_BYTES_PER_SECTOR;
  const trackCount = lastEncodedTrack - firstEncodedTrack;
  const bufferSize = bytesPerTrack * (sides + 1) * (trackCount + 1);
  const outBuffer = new Uint8Array(bufferSize);

  decodeTrackData(buffer.slice(10), outBuffer, sectorsPerTrack);

  return {
    format,
    data: outBuffer
  };
};


/**
 * Returns data for the disk format and the track data stored in the archive.
 *
 * @param {ArrayBuffer} buffer - The source buffer to read track data from
 * @returns {MsaHeader|null} Disk information or null if the data is invalid
 */
export const getFormat = buffer => {
  if (buffer.byteLength < 10) {
    return null;
  }
  const srcView = new DataView(buffer);

  const fileId = srcView.getUint16(0);
  if (fileId !== MSA_FILE_HEADER) {
    return null;
  }

  const sectorsPerTrack = srcView.getUint16(2);
  if (sectorsPerTrack < 1 || sectorsPerTrack > 11) {
    return null;
  }

  const sides = srcView.getUint16(4);
  if (sides < 0 && sides > 1) {
    return null;
  }

  const firstEncodedTrack = srcView.getUint16(6);
  if (firstEncodedTrack < 0) {
    return null;
  }

  const lastEncodedTrack = srcView.getUint16(8);
  if (lastEncodedTrack > 81) {
    return null;
  }

  if (firstEncodedTrack > lastEncodedTrack) {
    return null;
  }

  return {
    sectorsPerTrack,
    sides,
    firstEncodedTrack,
    lastEncodedTrack
  };
};


/**
 *
 * @param {ArrayBuffer} inBuffer - The buffer to read encoded track data from
 * @param {Uint8Array} outBuffer - The buffer to write decoded track data to
 * @param {number} sectorsPerTrack - Number of sectors per track of the disk format
 */
export const decodeTrackData = (inBuffer, outBuffer, sectorsPerTrack) => {
  const bytesPerTrack = sectorsPerTrack * DISK_BYTES_PER_SECTOR;
  const srcView = new DataView(inBuffer);

  let srcPos = 0;
  let destPos = 0;

  while (srcPos < srcView.byteLength) {
    const trackBlockSize = srcView.getUint16(srcPos);
    srcPos += 2;

    // If the track block size is the same as the disk bytes per track then
    // the data is uncompressed so we just copy the bytes directly to the
    // output buffer
    if (trackBlockSize === bytesPerTrack) {
      const trackBytes = srcView.buffer.slice(srcPos, srcPos + trackBlockSize);
      outBuffer.set(new Uint8Array(trackBytes), destPos);
      destPos += trackBlockSize;
      srcPos += trackBlockSize;
    }

    // If the track block size is less than the bytes-per-track value the data
    // is RLE compressed. A compression run is indicated by a 0xe5 byte. The
    // byte following it is the value to repeat and the following word is the
    // number of repeatitions. For example: 0xe54e000a would repeat the byte
    // 4e ten times.
    else {
      const endPos = srcPos + trackBlockSize;
      while (srcPos < endPos) {
        const byte = srcView.getUint8(srcPos);
        if (byte === MSA_RLE_MARKER) {
          const data = srcView.getUint8(srcPos + 1);
          const len = srcView.getUint16(srcPos + 2);
          const trackBytes = new Uint8Array(len).fill(data);
          outBuffer.set(trackBytes, destPos);
          destPos += len;
          srcPos += 4;
        } else {
          outBuffer[destPos] = byte;
          destPos++;
          srcPos++;
        }
      }
    }
  }
};
