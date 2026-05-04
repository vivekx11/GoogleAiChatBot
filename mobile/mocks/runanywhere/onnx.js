/**
 * Mock for @runanywhere/onnx
 */
const ModelArtifactType = {
  TarGzArchive: 'tar_gz_archive',
  ZipArchive: 'zip_archive',
  SingleFile: 'single_file',
};

const ONNX = {
  register: () => {},
  addModel: async (_config) => {},
};

module.exports = { ONNX, ModelArtifactType };
