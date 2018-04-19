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

const _ = Gettext.gettext;
const N_ = function (e) {
    return e;
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

        this.pack_start(this.MainWidget, true, true, 0);
    },

    Window: new Gtk.Builder(),

    _initWindow: function() {
        this.Window.set_translation_domain('gnome-shell-extension-osc-news');
        this.Window.add_from_file(EXTENSIONDIR + "/osc-news-settings.ui");
        this.MainWidget = this.Window.get_object("main-widget");
        this.loginButton = this.Window.get_object('login-button');

        this.loginButton.connect('clicked', Lang.bind(this, this._login));
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

});

function buildPrefsWidget() {
    let widget = new App();
    widget.show_all();

    return widget;
}
