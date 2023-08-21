"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;
exports.getWindow = getWindow;
exports.openOrFocusWindow = openOrFocusWindow;
exports.closePopouts = closePopouts;
exports.hasInit = void 0;

var _electron = require("electron");

var _securityUtils = require("../common/securityUtils");

var _appFeatures = require("./appFeatures");

const MIN_POPOUT_WIDTH = 320;
const MIN_POPOUT_HEIGHT = 180;
const DEFAULT_POPOUT_OPTIONS = {
  title: 'Discord Popout',
  backgroundColor: '#2f3136',
  minWidth: MIN_POPOUT_WIDTH,
  minHeight: MIN_POPOUT_HEIGHT,
  transparent: false,
  frame: process.platform === 'linux',
  resizable: true,
  show: true,
  webPreferences: {
    nodeIntegration: false,
    nativeWindowOpen: true,
    enableRemoteModule: false,
    contextIsolation: true
  }
};
const features = (0, _appFeatures.getFeatures)();
let hasInit = false;
exports.hasInit = hasInit;
let popoutWindows = {};

function init() {
  if (hasInit) {
    console.warn('popoutWindows: Has already init! Cancelling init.');
    return;
  }

  exports.hasInit = hasInit = true;
  features.declareSupported('popout_windows');
}

function focusWindow(window) {
  if (window == null) return; // The focus call is not always respected.
  // This uses a hack defined in https://github.com/electron/electron/issues/2867

  window.setAlwaysOnTop(true);
  window.focus();
  window.setAlwaysOnTop(false);
}

function getWindow(key) {
  return popoutWindows[key];
}
/**
 * Open a popout window with the specified key, or focus it if it's already open.
 *
 * @param {Event} e the open window event
 * @param {string} windowURL the target url to load
 * @param {string} key the window key
 * @param {Object} options a limited set of window options, all others will be ignored
 * @param {number} options.width the width of the window
 * @param {number} options.height the height of the window
 * @param {number} options.x the x position of the window
 * @param {number} options.y the y position of the window
 * @param {string} webappEndpoint the webapp endpoint that the app is running in.
 */


function openOrFocusWindow(e, windowURL, key, options, webappEndpoint) {
  // Without webContents, window will not properly signal parent
  const {
    width,
    height,
    x,
    y,
    webContents
  } = options;
  const existingWindow = popoutWindows[key];

  if (existingWindow != null) {
    e.newGuest = existingWindow;
    focusWindow(existingWindow);
    return;
  }

  const newOptions = Object.assign({}, DEFAULT_POPOUT_OPTIONS, {
    width,
    height,
    x,
    y,
    webContents
  });
  const newWindow = e.newGuest = new _electron.BrowserWindow(newOptions);
  newWindow.windowKey = key;
  popoutWindows[key] = newWindow;

  if (windowURL) {
    newWindow.loadURL(windowURL);
  }
  /**
   * Do not allow navigation to arbitrary domains.
   */


  newWindow.webContents.on('will-navigate', (evt, url) => {
    if (!(0, _securityUtils.checkUrlOriginMatches)(url, webappEndpoint)) {
      evt.preventDefault();
    }
  });
  /**
   * Any window.open or links within the popout window should just open externally.
   */

  newWindow.webContents.on('new-window', (evt, windowURL) => {
    evt.preventDefault();
    (0, _securityUtils.saferShellOpenExternal)(windowURL).catch(_err => {
      console.error('Failed to open external URL', windowURL);
    });
  });
  /**
   * Handle events for our new window
   *
   * NOTE: Wanted to handle 'always-on-top-changed' and send to client but currently
   * the event seems to not fire.
   * */

  newWindow.once('closed', () => {
    newWindow.removeAllListeners();
    delete popoutWindows[key];
  });
}

function closePopouts() {
  Object.values(popoutWindows).forEach(popoutWindow => popoutWindow.close());
  popoutWindows = {};
}