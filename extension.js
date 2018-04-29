
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

const Mainloop = imports.mainloop;

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
const KEY_UID = 'uid';
const KEY_USER_NAME = 'user-name';
const KEY_USER_PLACE = 'user-place';
const KEY_USER_PLATFORMS = 'user-platforms';
const KEY_USER_EXPERTISE = 'user-expertise';
const KEY_JOIN_TIME = 'join-time';
const KEY_LAST_LOGIN_TIME = 'last-login-time';
const KEY_PORTRAIT = 'portrait';
const KEY_FANS_COUNT = 'fans-count';
const KEY_FAVORITE_COUNT = 'favorite-count';
const KEY_FOLLOWERS_COUNT = 'followers-count';

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
        this._refreshUI();

        this._initTimer();
    },

    _initTimer: function() {
        this.timeout = Mainloop.timeout_add_seconds(60 * 5, Lang.bind(this, function() {
            //this.getTweetItemDebug();
            return true; // repeating
        }));

    },

    _createContainer: function() {
        let hbox = new St.BoxLayout({style_class: 'panel-status-menu-box' });
        let icon = new St.Icon({style_class: 'system-status-icon osc-background-symbolic'});
        hbox.add_child(icon);

        this.actor.add_actor(hbox);
        this.actor.add_style_class_name('panel-status-button');

        this.userItem = new OscWidget.OscAccountSect();
        this.menu.addMenuItem(this.userItem);
        this.userItem.user.connect('activate', Lang.bind(this, function() {
                 Util.spawn(["gnome-shell-extension-prefs", Me.metadata.uuid]);
        }));

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
                this.sendTweet(this.access_token, obj.get_text());
            }
        }));
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

    sendTweet: function(token, tweet) {
        this.dialog.setMessage("Send:" + tweet + "?");
        this.dialog.open(Lang.bind(this, function() {
            this.showNotify(tweet);
            this.api.sendTweet(token, tweet, Lang.bind(this, this.messageErrorCheck));
        }));
    },

    replyTweet: function(token, id, tweet) {
        this.dialog.setMessage("Send:" + tweet + "?");
        this.dialog.open(Lang.bind(this, function() {
            this.showNotify(tweet);
            this.api.sendTweetComment(token, id, tweet, Lang.bind(this, this.messageErrorCheck));
        }));
    },

    messageErrorCheck: function() {
        let msg = arguments[0];
    },

    _loadConfig: function() {
        this._Settings = Convenience.getSettings(OSC_NEWS_SETTINGS_SCHEMA);
        this._Settings.connect("changed", Lang.bind(this, this._refreshConfig));
        this._initConfig();
    },

    _refreshUI: function() {
        if (this.userItem)
            this.userItem.setUser(this.user_name, '0', '0', '0', '0');
    },

    _writeUserData: function() {
        this._Settings.delay();
        this._Settings.set_string(KEY_UID, this.uid);
        this._Settings.set_string(KEY_USER_NAME, this.user_name);
        this._Settings.set_string(KEY_USER_PLACE, this.user_place);
        this._Settings.set_string(KEY_USER_PLATFORMS, this.platforms);
        this._Settings.set_string(KEY_USER_EXPERTISE, this.expertise);
        this._Settings.set_string(KEY_JOIN_TIME, this.join_time);
        this._Settings.set_string(KEY_LAST_LOGIN_TIME, this.last_login_time);
        this._Settings.set_string(KEY_PORTRAIT, this.portrait);
        this._Settings.set_string(KEY_FANS_COUNT, this.fans_count);
        this._Settings.set_string(KEY_FAVORITE_COUNT, this.favorite_count);
        this._Settings.set_string(KEY_FOLLOWERS_COUNT, this.followers_count);
        this._Settings.apply();
    },

    _updateUserData: function() {
        this.api.getMyInfomation(
            this.access_token,
            Lang.bind(this, function(msg) {
                for (var i in msg) {
                    if (!msg[i])
                        msg[i] = "None";

                    switch (i) {
                    case 'uid':
                        this.uid = msg[i].toString();
                        break;
                    case 'name':
                        this.user_name = msg[i];
                        break;
                    case 'city':
                        this.user_place = msg[i];
                        break;
                    case 'platforms':
                        let plat = '';
                        for (var p in msg[i]) {
                            plat += msg[i][p] + ',';
                        }
                        if (plat)
                            this.platforms = plat;
                        else
                            this.platforms = "None";
                        break;
                    case 'expertise':
                        let exper = '';
                        for (var e in msg[i]) {
                            exper += msg[i][e] + ',';
                        }
                        if (exper)
                            this.expertise = exper;
                        else
                            this.expertise = "None";
                        break;
                    case 'joinTime':
                        this.join_time = msg[i];
                        break;
                    case 'lastLoginTime':
                        this.last_login_time = msg[i];
                        break;
                    case 'portrait':
                        this.portrait = msg[i];
                        break;
                    case 'fansCount':
                        this.fans_count = msg[i].toString();
                        break;
                    case 'favoriteCount':
                        this.favorite_count = msg[i].toString();
                        break;
                    case 'followersCount':
                        this.followers_count = msg[i].toString();
                        break;
                    default:
                        break;
                    }
                }
                this._writeUserData();
                this._refreshUI();
            })
        );
    },

    _initConfig: function() {
        this.code = this._Settings.get_string(KEY_OAUTH_CODE);
        this.access_token = this._Settings.get_string(KEY_ACCESS_TOKEN);
        this.client_id = this._Settings.get_string(KEY_CLIENT_ID);
        this.client_secret = this._Settings.get_string(KEY_CLIENT_SECRET);
        this.redirect_uri = this._Settings.get_string(KEY_REDIRECT_URI);

        this.uid = this._Settings.get_string(KEY_UID);
        this.user_name = this._Settings.get_string(KEY_USER_NAME);
        this.user_place = this._Settings.get_string(KEY_USER_PLACE);
        this.platforms = this._Settings.get_string(KEY_USER_PLATFORMS);
        this.expertise = this._Settings.get_string(KEY_USER_EXPERTISE);
        this.join_time = this._Settings.get_string(KEY_JOIN_TIME);
        this.last_login_time = this._Settings.get_string(KEY_LAST_LOGIN_TIME);
        this.portrait = this._Settings.get_string(KEY_PORTRAIT);
        this.fans_count = this._Settings.get_string(KEY_FANS_COUNT);
        this.favorite_count = this._Settings.get_string(KEY_FAVORITE_COUNT);
        this.followers_count = this._Settings.get_string(KEY_FOLLOWERS_COUNT);

        this._updateUserData();
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
            this._updateUserData();
            this.getTweetItemDebug();
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
            this.list.removeAll();
            if (!arguments[0]) {
                let item = new OscWidget.SimpleItem("No data");
                this.list.addMenuItem(item);
            } else {
                let msg = arguments[0];

                for (var i in msg) {
                    if (i == "tweetlist") {
                        for (var j in msg[i]) {
                            let item = new OscWidget.TweetItem(
                                msg[i][j],
                                this.access_token,
                                this.api,
                                Lang.bind(this, this.replyTweet));
                            this.list.addMenuItem(item);
                        }
                    }
                }
            }
        }));
    },

    start: function() {
        this.getTweetItemDebug();
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
