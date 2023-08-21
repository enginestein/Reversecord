"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exposeModuleResource = exposeModuleResource;
exports.isLinux = exports.isOSX = exports.isWindows = exports.platform = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

var paths = _interopRequireWildcard(require("./paths"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Miscellaneous utility functions.
function exposeModuleResource(asarPath, fileName) {
  const appPath = _path.default.resolve(__dirname, '..');

  const fullPathToAsarFile = _path.default.join(appPath, asarPath, fileName);

  const data = _fs.default.readFileSync(fullPathToAsarFile);

  const nativeFilePath = _path.default.join(paths.getUserData(), fileName);

  _fs.default.writeFileSync(nativeFilePath, data);

  return nativeFilePath;
}

const platform = _os.default.platform();

exports.platform = platform;
const isWindows = /^win/.test(platform);
exports.isWindows = isWindows;
const isOSX = platform === 'darwin';
exports.isOSX = isOSX;
const isLinux = platform === 'linux';
exports.isLinux = isLinux;