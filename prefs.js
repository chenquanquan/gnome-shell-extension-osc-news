const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const WebKit = imports.gi.WebKit2;

const Gettext = imports.gettext.domain('osc-news');

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

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

// Reference from https://www.cnblogs.com/karila/p/5991340.html
function GetRequest(url) {
    var theRequest = new Object();
    var index = url.indexOf('?');

    if (index != -1) {
        var str = url.substr(index+1);
        var strs = str.split('&');
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split('=')[0]]=unescape(strs[i].split('=')[1]);
        }
    }
    return theRequest;
}

//https://www.oschina.net/action/oauth2/authorize?response_type=code&client_id={client_id}①&redirect_uri={redirect_uri}②
function GenericOauthUri(settings) {
    let client_id = settings.get_string(KEY_CLIENT_ID);
    let redirect_uri = settings.get_string(KEY_REDIRECT_URI);

    let oauth2_uri = "https://www.oschina.net/action/oauth2/authorize?response_type=code&";
    oauth2_uri += "client_id=" + client_id;
    oauth2_uri += "&redirect_uri=" + redirect_uri;

    return oauth2_uri;
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

        let oauth2_uri = GenericOauthUri(this._Settings);
        this._webView.load_uri(oauth2_uri);

        this.add(this._webView);
        this.set_size_request(800, 640);

    },

    _onLoadChanged: function(view, loadEvent) {
        if (loadEvent == WebKit.LoadEvent.REDIRECTED) {
            let url = view.uri;
            let ret = GetRequest(url);
            for (var i in ret) {
                if (i == 'code') {
                    this._Settings.set_string(KEY_OAUTH_CODE, ret[i]);
                    this.close();
                }
            }
        }

    },
});

const App = new Lang.Class({
    Name: 'OscNew.App',
    GTypeName: 'OscNewApp',
    Extends: Gtk.Box,

    _init : function(params) {
        this.parent(params);
        this.set_orientation = Gtk.Orientation.VERTICAL;

        let loginButton = new Gtk.Button({
            label: _('Login'),
        });
        loginButton.connect('clicked', Lang.bind(this, function(object) {
            /* The webkit widget must put in window */
            let dialog = new LoginWindow({
                modal: true,
                title: "Login",
                transient_for: this.get_toplevel(),
            });

            dialog.show_all();
        }));
        this.pack_start(loginButton, false, false, 0);
    },
});

function buildPrefsWidget() {
    let widget = new App();
    widget.show_all();

    return widget;
}
