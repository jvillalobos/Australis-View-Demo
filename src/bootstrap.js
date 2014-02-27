/**
 * Copyright 2014 Jorge Villalobos
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource:///modules/CustomizableUI.jsm");

var console =
  Cu.import("resource://gre/modules/devtools/Console.jsm", {}).console;

function install(aData, aReason) {}

function uninstall(aData, aReason) {}

function startup(aData, aReason) {
  AusView.init();
}

function shutdown(aData, aReason) {
  AusView.uninit();
}

let AusView = {
  init : function() {
    let io =
      Cc["@mozilla.org/network/io-service;1"].
        getService(Ci.nsIIOService);

    // the 'style' directive isn't supported in chrome.manifest for boostrapped
    // extensions, so this is the manual way of doing the same.
    this._ss =
      Cc["@mozilla.org/content/style-sheet-service;1"].
        getService(Ci.nsIStyleSheetService);
    this._uri = io.newURI("chrome://aus-view/skin/toolbar.css", null, null);
    this._ss.loadAndRegisterSheet(this._uri, this._ss.USER_SHEET);

    // create widget and add it to the main toolbar.
    CustomizableUI.createWidget(
      { id : "aus-hello-button",
        defaultArea : CustomizableUI.AREA_NAVBAR,
        label : "Hello Button",
        tooltiptext : "Hello!",
        onCommand : function(aEvent) {
          let win = aEvent.target.ownerDocument.defaultView;

          win.alert("Hello!");
        }
      });
  },

  uninit : function() {
    CustomizableUI.destroyWidget("aus-hello-button");

    if (this._ss.sheetRegistered(this._uri, this._ss.USER_SHEET)) {
      this._ss.unregisterSheet(this._uri, this._ss.USER_SHEET);
    }
  }
};
