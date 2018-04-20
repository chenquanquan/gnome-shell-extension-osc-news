const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const WebKit = imports.gi.WebKit2;
const GtkBuilder = Gtk.Builder;

const Gettext = imports.gettext.domain('osc-news');

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const CustomUtil = Me.imports.customutil;
const EXTENSIONDIR = Me.dir.get_path();

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


const _ = Gettext.gettext;
const N_ = function (e) {
    return e;
};

let widget_config_list = {
    'user-name': KEY_USER_NAME,
    'user-place': KEY_USER_PLACE,
    'user-platforms': KEY_USER_PLATFORMS,
    "user-expertise": KEY_USER_EXPERTISE,
    "user-join-time": KEY_JOIN_TIME,
    "user-last-login-time":  KEY_LAST_LOGIN_TIME,
    "user-fans-count":KEY_FANS_COUNT,
    "user-favorite-count":KEY_FAVORITE_COUNT,
    "user-followers-count":KEY_FOLLOWERS_COUNT,
};

function init() {
}

const LoginWindow = new Lang.Class({
    Name: 'OscNew.LoginWindow',
    GTypeName: 'OscNewLoginWindow',
    Extends: Gtk.ApplicationWindow,

    _init: function(params) {
        this.parent(params);

        this._Settings = Convenience.getSettings(OSC_NEWS_SETTINGS_SCHEMA);

        this._webContext = WebKit.WebContext.new_ephemeral();
        this._webContext.set_cache_model(WebKit.CacheModel.DOCUMENT_VIEWER);
        this._webContext.set_network_proxy_settings(WebKit.NetworkProxyMode.NO_PROXY, null);

        this._webView = WebKit.WebView.new_with_context(this._webContext);
        this._webView.connect('load-changed', Lang.bind(this, this._onLoadChanged));

        let oauth2_uri = CustomUtil.GenericOauthUri(this._Settings);
        this._webView.load_uri(oauth2_uri);

        this.add(this._webView);
        this.set_size_request(800, 640);

    },

    _onLoadChanged: function(view, loadEvent) {
        if (loadEvent == WebKit.LoadEvent.REDIRECTED) {
            let url = view.uri;
            let ret = CustomUtil.GetRequest(url);
            for (var i in ret) {
                if (i == 'code') {
                    this._Settings.set_string(KEY_OAUTH_CODE, ret[i]);
                    this.close();
                }
            }
        }

    },
});

const App = new GObject.Class({
    Name: 'OscNew.App',
    GTypeName: 'OscNewApp',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);

        this._initWindow();
        this._loadConfig();

        this.pack_start(this.MainWidget, true, true, 0);
    },

    Window: new Gtk.Builder(),

    _initWindow: function() {

        this.Window.set_translation_domain('gnome-shell-extension-osc-news');
        this.Window.add_from_file(EXTENSIONDIR + "/osc-news-settings.ui");
        this.MainWidget = this.Window.get_object("main-widget");
        this.loginButton = this.Window.get_object('login-button');
        this.cancelButton = this.Window.get_object('cancel-button');

        this.loginButton.connect('clicked', Lang.bind(this, this._login));
        //this.cancelButton.connect('clicked', Lang.bind(this, this.close));
    },

    _login: function(object) {
        /* The webkit widget must put in window */
        let dialog = new LoginWindow({
            modal: true,
            title: "Login",
            transient_for: this.get_toplevel(),
        });

        dialog.show_all();
    },

    _loadConfig: function() {
        this._Settings = Convenience.getSettings(OSC_NEWS_SETTINGS_SCHEMA);
        this._Settings.connect("changed", Lang.bind(this, this._refreshConfig));
        this._refreshConfig();
    },

    _refreshConfig: function() {
        for (var name in widget_config_list) {
            let widget = this.Window.get_object(name);
            let value = this._Settings.get_string(widget_config_list[name]);

            if (value && widget) {
                widget.set_text(value);
            } else {
                log("Error:" + name + "," + widget_config_list);
            }
        }
        let icon = this.Window.get_object('user-icon');
        let portrait = this._Settings.get_string(KEY_PORTRAIT);
        icon.set_from_resource(portrait);
    },
});

function buildPrefsWidget() {
    let widget = new App();
    widget.show_all();

    return widget;
}
