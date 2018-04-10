
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;

let client_id = "q93z5JTP7uDt3h6ca3k8";
let client_secret = "XcSSY7gOwOCN2ZZBDdRje5u0BI8KSzzt";

const OscApi = new Lang.Class({
    Name: 'OscNew.OscApi',

    _init: function() {
        this.initHttp();
    },

    initHttp: function() {
        this.authUri = new Soup.URI('https://www.oschina.net/action/oauth2/authorize');

    }
});

const TweetItem = new Lang.Class({
    Name: 'OscNew.TweetItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(text) {
        this.parent(0.0, text);

        this.label = new St.Label({text: text});
        this.actor.add_child(this.label);
    },

    destroy: function() {
        this.parent();
    }
});

const TweetList = new Lang.Class({
    Name: 'OscNew.TweetList',
    Extends: PopupMenu.PopupMenuSection,

    _init: function() {
        this.parent();
        let scrollView = new St.ScrollView({
            x_fill: true,
            y_fill: false,
            y_align: St.Align.START,
            overlay_scrollbars: true,
            style_class: 'vfade'
        });
        this.innerMenu = new PopupMenu.PopupMenuSection();
        scrollView.add_actor(this.innerMenu.actor);
        this.actor.add_actor(scrollView);
    },

    addMenuItem: function(item) {
        this.innerMenu.addMenuItem(item);
    },

    removeAll: function() {
        this.innerMenu.removeAll();
    }
});

const OscNew = new Lang.Class({
    Name: 'OscNew',
    Extends: PanelMenu.Button,

    _init : function() {
        this.parent(0.0, _("OscNew"));
        this._createContainer();

        this.api = new OscApi();
    },

    _createContainer: function() {
        let hbox = new St.BoxLayout({style_class: 'panel-status-menu-box' });
        let icon = new St.Icon({style_class: 'system-status-icon osc-background-symbolic'});
        hbox.add_child(icon);

        this.actor.add_actor(hbox);
        this.actor.add_style_class_name('panel-status-button');

        this.list = new TweetList();
        this.menu.addMenuItem(this.list);
    },

    start: function() {
    },

    stop: function() {
        this.destroy();
    }
});

let _News;

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
