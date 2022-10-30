export default {
  // Image format
  width: 128,
  height: 96,
  // Metadata
  dataMode: 0, // UTF-8
  majorVersion: 3,
  minorVersion: 0,
  encoderMode: 0, // Patreon encoder
  // Others
  maxBytesPerAvatar: (12288/*width*length*/ - 7/*header*/) * 4,
  emptyAvatarId: "avtr_ffffffff-ffff-ffff-ffff-ffffffffffff"
}