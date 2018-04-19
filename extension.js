
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Util = imports.misc.util;
const GObject = imports.gi.GObject;
const Tweener = imports.ui.tweener;
const ModalDialog = imports.ui.modalDialog;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gdk = imports.gi.Gdk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const OscApi = Me.imports.oscsoup;
const OscWidget = Me.imports.oscwidget;

const OSC_NEWS_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.osc-news';
const KEY_OAUTH_CODE = 'oauth-code';
const KEY_ACCESS_TOKEN = 'access-token';
const KEY_CLIENT_ID = 'client-id';
const KEY_CLIENT_SECRET = 'client-secret';
const KEY_REDIRECT_URI = 'redirect-uri';

let _News;

const QueryDialog = new Lang.Class({
    Name: 'OscNew.QueryDialog',
    Extends: ModalDialog.ModalDialog,

    _init: function() {
        this.parent({ styleClass: 'run-dialog',
                      destroyOnClose: false });
        this.label = new St.Label({
            style_class: 'run-dialog-label',
            text: _('Forget message?')
        });
        this.contentLayout.add(this.label, { x_fill: false,
                                        x_align: St.Align.START,
                                        y_align: St.Align.START });
        this.setButtons([{ action: this.close.bind(this),
                           label: _('Cancel'),
                           key: Clutter.Escape },
                         { action: Lang.bind(this, function() {
                             if (this.ok_callback !== undefined)
                                 this.ok_callback();
                             this.close();
                         }),
                           label: _('OK'),
                         }]);
    },

    setMessage: function(message) {
        this.label.set_text(message);
    },

    open: function(ok_func) {
        this.ok_callback = ok_func;
        this.parent();
    }
});

const OscNew = new Lang.Class({
    Name: 'OscNew',
    Extends: PanelMenu.Button,

    _init : function() {
        this.notify = null;
        this.parent(0.0, _("OscNew"));
        this.api = new OscApi.OscApi();
        this._loadConfig();
        this.dialog = new QueryDialog("dialog message");
        this._createContainer();
    },

    _createContainer: function() {
        let hbox = new St.BoxLayout({style_class: 'panel-status-menu-box' });
        let icon = new St.Icon({style_class: 'system-status-icon osc-background-symbolic'});
        hbox.add_child(icon);

        this.actor.add_actor(hbox);
        this.actor.add_style_class_name('panel-status-button');

        this.list = new OscWidget.TweetList();
        this.menu.addMenuItem(this.list);

        this.separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this.separator);

        this.pubSect = new OscWidget.TweetPubSect();
        this.menu.addMenuItem(this.pubSect);

        this.pubSect.entry.clutter_text.connect('key-press-event', Lang.bind(this, function(obj, event) {
            let symbol = event.get_key_symbol();
            let keyname = Gdk.keyval_name(symbol);

            if (keyname === "Return") {
                this.new_tweet_text = obj.get_text();
                this.dialog.setMessage("Send:" + this.new_tweet_text);
                this.dialog.open(Lang.bind(this, function() {
                    this.showNotify(this.new_tweet_text);
                    // this.api.sendTweet(this.access_token, this.new_tweet_text);
                }));
            }
        }));

        /* Debug for oauth entry */
        this.oauthItem = new OscWidget.SimpleItem("Login");
        this.menu.addMenuItem(this.pubSect);
        this.oauthItem.connect('activate', Lang.bind(this, function(actor, event) {
            Util.spawn(["gnome-shell-extension-prefs", "osc-news@mt6276m.org"]);
        }));
        this.list.addMenuItem(this.oauthItem);
    },

    hideNotify: function() {
    },

    showNotify: function(message) {
        if (!this.notify) {
            this.notify = new St.Label({
                style_class: 'osc-notify-label',
                text: message});
            Main.uiGroup.add_actor(this.notify);
        } else {
            this.notify.set_text(message);
        }

        this.notify.opacity = 255;
        let monitor = Main.layoutManager.primaryMonitor;
        this.notify.set_position(monitor.x + Math.floor(monitor.width / 2 - this.notify.width / 2),
                          monitor.y + Math.floor(monitor.height / 2 - this.notify.height / 2));

        Tweener.addTween(this.notify,
                         { opacity: 0,
                           time: 2,
                           transition: 'easeOutQuad',
                           onComplete: Lang.bind(this, function() {
                               Main.uiGroup.remove_actor(this.notify);
                               this.notify = null;
                           }),
                         });
    },

    _loadConfig: function() {
        this._Settings = Convenience.getSettings(OSC_NEWS_SETTINGS_SCHEMA);
        this._Settings.connect("changed", Lang.bind(this, this._refreshConfig));
        this._initConfig();
    },

    _initConfig: function() {
        this.code = this._Settings.get_string(KEY_OAUTH_CODE);
        this.access_token = this._Settings.get_string(KEY_ACCESS_TOKEN);
        this.client_id = this._Settings.get_string(KEY_CLIENT_ID);
        this.client_secret = this._Settings.get_string(KEY_CLIENT_SECRET);
        this.redirect_uri = this._Settings.get_string(KEY_REDIRECT_URI);
    },

    _refreshConfig: function() {
        let code = this._Settings.get_string(KEY_OAUTH_CODE);
        let access_token = this._Settings.get_string(KEY_ACCESS_TOKEN);
        let client_id = this._Settings.get_string(KEY_CLIENT_ID);
        let client_secret = this._Settings.get_string(KEY_CLIENT_SECRET);
        let redirect_uri = this._Settings.get_string(KEY_REDIRECT_URI);

        if (code != this.code) {
            this.code = code;
            this.api.getAccessToken(code,
                                    client_id,
                                    client_secret,
                                    'authorization_code',
                                    redirect_uri,
                                    'json',
                                    Lang.bind(this, function() {
                                        if (arguments[0]) {
                                            let msg = arguments[0];

                                            for (var i in msg) {
                                                if (i == "access_token") {
                                                    this._Settings.set_string(KEY_ACCESS_TOKEN,
                                                                              msg[i]);
                                                }
                                            }
                                        }
                                    })
                                   );
        }

        if (access_token != this.access_token) {
            this.access_token = access_token;
        }
        if (client_id != this.client_id) {
            this.client_id = client_id;
        }
        if (client_secret != this.client_secret) {
            this.client_secret = client_secret;
        }
        if (redirect_uri != this.redirect_uri) {
            this.redirect_uri = redirect_uri;
        }
    },


    getTweetItemDebug: function() {
        /* Debug for tweet */
        this.api.getTweet(this.access_token, Lang.bind(this, function() {
            if (!arguments[0]) {
                let item = new OscWidget.TweetItem("No data");
                this.list.addMenuItem(item);
            } else {
                let msg = arguments[0];

                for (var i in msg) {
                    if (i == "tweetlist") {
                        for (var j in msg[i]) {
                            let item = new OscWidget.TweetItem(msg[i][j]);
                            this.list.addMenuItem(item);
                        }
                        this.showNotify("End");
                    }
                }
            }
        }));
    },

    start: function() {
        //this.getTweetItemDebug();
    },

    stop: function() {
        this.destroy();
    }
});

function init() {
    _News = new OscNew();
    Main.panel.addToStatusArea('OscNew', _News);
}

function enable() {
    _News.start();
}

function disable() {
    _News.stop();
}
