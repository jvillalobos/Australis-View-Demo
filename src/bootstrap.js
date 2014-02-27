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
Cu.import("resource://gre/modules/Services.jsm");

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
    let enumerator = Services.wm.getEnumerator("navigator:browser");
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

    while (enumerator.hasMoreElements()) {
      this.windowListener.addUI(enumerator.getNext());
    }

    Services.wm.addListener(this.windowListener);

    // create widget and add it to the main toolbar.
    CustomizableUI.createWidget(
      { id : "aus-view-button",
        type : "view",
        viewId : "aus-view-panel",
        defaultArea : CustomizableUI.AREA_NAVBAR,
        label : "Hello Button",
        tooltiptext : "Hello!",
        onViewShowing : function (aEvent) {
          let doc = aEvent.target.ownerDocument;
          let iframe = doc.getElementById("aus-view-iframe");
        },
        onViewHiding : function (aEvent) {
          let doc = aEvent.target.ownerDocument;
          let iframe = doc.getElementById("aus-view-iframe");
        }
      });
  },

  uninit : function() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");

    CustomizableUI.destroyWidget("aus-view-button");

    Services.wm.removeListener(this.windowListener);

    while (enumerator.hasMoreElements()) {
      this.windowListener.removeUI(enumerator.getNext());
    }

    if (this._ss.sheetRegistered(this._uri, this._ss.USER_SHEET)) {
      this._ss.unregisterSheet(this._uri, this._ss.USER_SHEET);
    }
  },

  windowListener : {
    /**
     * Adds the panel view for the button on all windows.
     */
    addUI : function(aWindow) {
      let doc = aWindow.document;
      let panel = doc.createElement("panelview");
      let iframe = doc.createElement("iframe");

      panel.setAttribute("id", "aus-view-panel");
      iframe.setAttribute("id", "aus-view-iframe");
      iframe.setAttribute("type", "content");
      iframe.setAttribute("src", "chrome://aus-view/content/player.html");

      panel.appendChild(iframe);
      doc.documentElement.appendChild(panel);
    },

    /**
     * Removes all added UI elements.
     */
    removeUI : function(aWindow) {
      let doc = aWindow.document;
      let panel = doc.getElementById("aus-view-panel");

      panel.parentNode.removeChild(panel);
    },

    onOpenWindow : function(aXULWindow) {
      // A new window has opened.
      let that = this;
      let domWindow =
        aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).
        getInterface(Ci.nsIDOMWindow);

      // Wait for it to finish loading
      domWindow.addEventListener(
        "load",
        function listener() {
          domWindow.removeEventListener("load", listener, false);
          // If this is a browser window then setup its UI
          if (domWindow.document.documentElement.getAttribute("windowtype") ==
              "navigator:browser") {
            that.addUI(domWindow);
          }
      }, false);
    },

    onCloseWindow : function(aXULWindow) {},
    onWindowTitleChange: function(aXULWindow, aNewTitle) {}
  }
};
