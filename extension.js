
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Ellipsize = imports.gi.Pango.EllipsizeMode;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const OscApi = Me.imports.oscsoup;
const OscWidget = Me.imports.oscwidget;

const OscNew = new Lang.Class({
    Name: 'OscNew',
    Extends: PanelMenu.Button,

    _init : function() {
        this.parent(0.0, _("OscNew"));
        this.api = new OscApi.OscApi();
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
        this.pubSect.entry.connect('enter-event', Lang.bind(this, this.tweetEntry));

        /* Debug for tweet */
        this.api.getMessageDebug(0, Lang.bind(this, function() {
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
                    }
                }
            }
        }));
    },

    tweetEntry: function() {
        /* Debug to send tweet */
        //this.api.sendTweet(1, this.pubSect.entry.get_text());
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
