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
  _timers : [],

  init : function() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");

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
          // since the panelview node is moved and the iframe is reset in some
          // cases, this hack ensures that the code runs once the iframe is
          // valid.
          let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

          timer.initWithCallback(
            { notify : function() { AusView.showAudioPanel(doc); } }, 100,
            Ci.nsITimer.TYPE_ONE_SHOT);
          AusView._timers.push(timer);
        },
        onViewHiding : function (aEvent) {
          let doc = aEvent.target.ownerDocument;
          // reload the iframe so that it is reset in all cases.
          doc.getElementById("aus-view-iframe").webNavigation.
            reload(Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
        }
      });
  },

  showAudioPanel : function(aDocument) {
    let contentDoc;
    let audioURLs = [];
    let links;
    let url;

    // extract audio URLs from the current page.
    contentDoc = aDocument.defaultView.gBrowser.contentDocument;

    if (null != contentDoc) {
      links = contentDoc.getElementsByTagName("a");

      for (let i = 0; i < links.length; i++) {
        url = links[i].getAttribute("href");

        if ((null != url) && (0 < url.length)) {
          if ("/" == url[0]) {
            url =
              contentDoc.location.protocol + "//" +
              contentDoc.location.host + url;
          }

          if (/^http(s)?:\/\/[^?]*\.(mp3|ogg)$/.test(url)) {
            audioURLs.push(url);
          }
        }
      }
    }

    console.log("Audio URLs found: " + audioURLs.length);

    // if we got some audio URLs, add them to the options list.
    if (0 < audioURLs.length) {
      let audioDoc =
        aDocument.getElementById("aus-view-iframe").contentDocument;
      let audioSelect = audioDoc.getElementById("tracks");
      let placeholder = audioSelect.firstElementChild;
      let optionElem;
      let trackURL;

      // remove "no tracks" placeholder.
      placeholder.parentNode.removeChild(placeholder);

      for (let i = 0; i < audioURLs.length; i++) {
        trackURL = audioURLs[i];

        console.log("Track URL: " + trackURL);

        optionElem = audioDoc.createElement("option");
        optionElem.textContent =
          trackURL.substring(trackURL.lastIndexOf("/") + 1);
        optionElem.setAttribute("value", trackURL);
        audioSelect.appendChild(optionElem);
      }

      audioSelect.disabled = false;
      audioSelect.selectedIndex = 0;
      audioDoc.getElementById("play-button").disabled = false;
    }
  },

  uninit : function() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");

    CustomizableUI.destroyWidget("aus-view-button");

    Services.wm.removeListener(this.windowListener);

    while (enumerator.hasMoreElements()) {
      this.windowListener.removeUI(enumerator.getNext());
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
      doc.getElementById("PanelUI-multiView").appendChild(panel);

      this._uri =
        Services.io.newURI("chrome://aus-view/skin/toolbar.css", null, null);
      aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
        getInterface(Ci.nsIDOMWindowUtils).loadSheet(this._uri, 1);
    },

    /**
     * Removes all added UI elements.
     */
    removeUI : function(aWindow) {
      let doc = aWindow.document;
      let panel = doc.getElementById("aus-view-panel");

      panel.parentNode.removeChild(panel);

      aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
        getInterface(Ci.nsIDOMWindowUtils).removeSheet(this._uri, 1);
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
