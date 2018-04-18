const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const WebKit = imports.gi.WebKit2;

const Gettext = imports.gettext.domain('osc-news');

let client_id = "q93z5JTP7uDt3h6ca3k8";
let redirect_uri = "https://extensions.gnome.org";
//https://www.oschina.net/action/oauth2/authorize?response_type=code&client_id={client_id}①&redirect_uri={redirect_uri}②
//let oauth2_uri = "https://www.oschina.net/action/oauth2/authorize";
let oauth2_uri = "https://www.oschina.net/action/oauth2/authorize?response_type=code&" + "client_id=" + client_id + "&redirect_uri=" + redirect_uri;

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

        this._webContext = WebKit.WebContext.new_ephemeral();
        this._webContext.set_cache_model(WebKit.CacheModel.DOCUMENT_VIEWER);
        this._webContext.set_network_proxy_settings(WebKit.NetworkProxyMode.NO_PROXY, null);

        this._webView = WebKit.WebView.new_with_context(this._webContext);
        this._webView.connect('load-changed', Lang.bind(this, this._onLoadChanged));

        this._webView.load_uri(oauth2_uri);

        this.add(this._webView);
        this.set_size_request(800, 640);

    },

    _onLoadChanged: function(view, loadEvent) {
        if (loadEvent == WebKit.LoadEvent.REDIRECTED) {
            log(view.uri);
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
    }
});

function buildPrefsWidget() {
    let widget = new App();
    widget.show_all();

    return widget;
}
