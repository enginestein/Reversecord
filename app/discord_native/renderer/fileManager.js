"use strict";

var _electron = _interopRequireDefault(require("electron"));

var _fs = _interopRequireDefault(require("fs"));

var _originalFs = _interopRequireDefault(require("original-fs"));

var _path = _interopRequireDefault(require("path"));

var _util = _interopRequireDefault(require("util"));

var _paths = require("../common/paths");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  FILE_MANAGER_GET_MODULE_PATH,
  FILE_MANAGER_GET_MODULE_DATA_PATH_SYNC,
  FILE_MANAGER_SHOW_SAVE_DIALOG,
  FILE_MANAGER_SHOW_OPEN_DIALOG,
  FILE_MANAGER_SHOW_ITEM_IN_FOLDER
} = require('../common/constants').IPCEvents;

const INVALID_FILENAME_CHAR_REGEX = /[^a-zA-Z0-9-_.]/g;

const readdir = _util.default.promisify(_originalFs.default.readdir);

async function saveWithDialog(fileContents, fileName) {
  if (INVALID_FILENAME_CHAR_REGEX.test(fileName)) {
    throw new Error('fileName has invalid characters');
  }

  const defaultPath = _path.default.join(await (0, _paths.getPath)('downloads'), fileName);

  const results = await _electron.default.ipcRenderer.invoke(FILE_MANAGER_SHOW_SAVE_DIALOG, {
    defaultPath
  });

  if (results && results.filePath) {
    _fs.default.writeFileSync(results.filePath, fileContents);
  }
}

async function showOpenDialog({
  filters,
  properties
}) {
  const results = await _electron.default.ipcRenderer.invoke(FILE_MANAGER_SHOW_OPEN_DIALOG, {
    filters,
    properties
  });
  return results.filePaths;
}

async function readLogFiles(maxSize) {
  // MAX_DEBUG_LOG_FILES may need to be increased as more files are added.
  const modulePath = await getModulePath();

  const voicePath = _path.default.join(modulePath, 'discord_voice');

  const hookPath = _path.default.join(modulePath, 'discord_hook');

  const filesToUpload = [_path.default.join(voicePath, 'discord-webrtc_0'), _path.default.join(voicePath, 'discord-webrtc_1'), _path.default.join(voicePath, 'discord-last-webrtc_0'), _path.default.join(voicePath, 'discord-last-webrtc_1'), _path.default.join(voicePath, 'audio_state.json'), _path.default.join(hookPath, 'hook.log')];

  for (const file of await readdir(voicePath)) {
    if (/\.(?:tsi|tsd)$/.test(file)) {
      filesToUpload.push(_path.default.join(voicePath, file));
    }
  }

  const crashFiles = await (0, _paths.getCrashFiles)();

  if (crashFiles.length > 0) {
    filesToUpload.push(crashFiles[0]);
  }

  const files = await readFiles(filesToUpload, maxSize);
  return files.filter(result => result.status === 'fulfilled').map(result => result.value);
}

async function showItemInFolder(path) {
  _electron.default.ipcRenderer.invoke(FILE_MANAGER_SHOW_ITEM_IN_FOLDER, path);
}

async function openFiles(dialogOptions, maxSize) {
  const filenames = await showOpenDialog(dialogOptions);

  if (filenames == null) {
    return;
  }

  const files = await readFiles(filenames, maxSize);
  files.forEach(result => {
    if (result.status === 'rejected') {
      throw result.reason;
    }
  });
  return files.map(result => result.value);
}

function readFiles(filenames, maxSize) {
  return Promise.allSettled(filenames.map(filename => new Promise((resolve, reject) => {
    _originalFs.default.stat(filename, (err, stats) => {
      if (err) return reject(err);

      if (stats.size > maxSize) {
        // Used to help determine why openFiles failed.
        // Cannot use an error here because context bridge will remove the code field.
        // eslint-disable-next-line prefer-promise-reject-errors
        return reject({
          code: 'ETOOLARGE',
          message: 'upload too large',
          filesize: stats.size,
          maxSize
        });
      }

      _originalFs.default.readFile(filename, (err, data) => {
        if (err) return reject(err);
        return resolve({
          data: data.buffer,
          filename: _path.default.basename(filename)
        });
      });
    });
  })));
}

async function getModulePath() {
  return _electron.default.ipcRenderer.invoke(FILE_MANAGER_GET_MODULE_PATH);
}

function getModuleDataPathSync() {
  return _electron.default.ipcRenderer.sendSync(FILE_MANAGER_GET_MODULE_DATA_PATH_SYNC);
}

module.exports = {
  readLogFiles,
  saveWithDialog,
  openFiles,
  showOpenDialog,
  showItemInFolder,
  getModulePath,
  getModuleDataPathSync,
  getCrashFiles: _paths.getCrashFiles,
  extname: _path.default.extname,
  basename: _path.default.basename,
  dirname: _path.default.dirname,
  join: _path.default.join
};