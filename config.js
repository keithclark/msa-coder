// Number of bytes per sector used by an MSA disk. This is always 512 bytes,
// which is the standard IBM/Atari 3.5" disk format.
export const DISK_BYTES_PER_SECTOR = 512;

// The Run-Length encoded data marker byte
export const MSA_RLE_MARKER = 0xe5;

// The file header identifier word
export const MSA_FILE_HEADER = 0x0e0f;
