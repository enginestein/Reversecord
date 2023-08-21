"use strict";

var _electron = _interopRequireDefault(require("electron"));

var _process = _interopRequireDefault(require("process"));

var _minidump = require("./minidump");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  PROCESS_UTILS_GET_CPU_USAGE,
  PROCESS_UTILS_GET_MEMORY_INFO,
  PROCESS_UTILS_FLUSH_DNS_CACHE,
  PROCESS_UTILS_FLUSH_COOKIES,
  PROCESS_UTILS_FLUSH_STORAGE_DATA,
  PROCESS_UTILS_GET_MAIN_ARGV_SYNC,
  PROCESS_UTILS_GET_LAST_CRASH
} = require('../common/constants').IPCEvents; // Note: CPU interval should be kept insync with Android's DeviceResourceUsageMonitor interval.


const CPU_USAGE_GATHER_INTERVAL = 1000;
const MEMORY_USAGE_GATHER_INTERVAL = 5000;

const mainArgv = _electron.default.ipcRenderer.sendSync(PROCESS_UTILS_GET_MAIN_ARGV_SYNC);

let totalProcessorUsagePercent = 0;
let totalMemoryUsageKB = 0;
setInterval(() => {
  _electron.default.ipcRenderer.invoke(PROCESS_UTILS_GET_CPU_USAGE).then(usage => totalProcessorUsagePercent = usage);
}, CPU_USAGE_GATHER_INTERVAL);
setInterval(() => {
  Promise.all([_process.default.getProcessMemoryInfo(), _electron.default.ipcRenderer.invoke(PROCESS_UTILS_GET_MEMORY_INFO)].map(x => x.catch(() => 0))).then(usages => {
    totalMemoryUsageKB = usages.reduce((total, usage) => total + usage.private, 0);
  });
}, MEMORY_USAGE_GATHER_INTERVAL);

async function flushDNSCache() {
  _electron.default.ipcRenderer.invoke(PROCESS_UTILS_FLUSH_DNS_CACHE);
}

async function getLastCrash() {
  const lastCrash = await _electron.default.ipcRenderer.invoke(PROCESS_UTILS_GET_LAST_CRASH);
  const minidumpExceptionType = lastCrash.id != null ? await (0, _minidump.findNewestCrashFileExceptionType)() : null;
  return {
    date: lastCrash.date,
    id: lastCrash.id,
    rendererCrashReason: lastCrash.rendererCrashReason,
    minidumpExceptionType: minidumpExceptionType
  };
}

async function flushCookies(callback) {
  try {
    await _electron.default.ipcRenderer.invoke(PROCESS_UTILS_FLUSH_COOKIES);
    callback();
  } catch (err) {
    callback(err);
  }
}

async function flushStorageData(callback) {
  try {
    await _electron.default.ipcRenderer.invoke(PROCESS_UTILS_FLUSH_STORAGE_DATA);
    callback();
  } catch (err) {
    callback(err);
  }
}

async function purgeMemory() {
  _electron.default.webFrame.clearCache();
}

function getCurrentCPUUsagePercent() {
  return totalProcessorUsagePercent;
}

function getCurrentMemoryUsageKB() {
  return totalMemoryUsageKB;
}

function getMainArgvSync() {
  return mainArgv;
}

module.exports = {
  flushDNSCache,
  flushCookies,
  getLastCrash,
  flushStorageData,
  purgeMemory,
  getCurrentCPUUsagePercent,
  getCurrentMemoryUsageKB,
  getMainArgvSync
};