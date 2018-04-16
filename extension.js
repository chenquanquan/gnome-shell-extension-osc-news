
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Tweener = imports.ui.tweener;
const ModalDialog = imports.ui.modalDialog;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Ellipsize = imports.gi.Pango.EllipsizeMode;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const WebKit2 = imports.gi.WebKit2;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const OscApi = Me.imports.oscsoup;
const OscWidget = Me.imports.oscwidget;

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
                           label: _('Ok'),
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

const Oauth2Dialog = new Lang.Class({
    Name: 'OscNew.QueryDialog',
    //Extends: Gtk.Dialog,
    Extends: ModalDialog.ModalDialog,

    _init: function() {
        this.parent({ styleClass: 'run-dialog',
                      destroyOnClose: false });
        this.label = new St.Label({
            style_class: 'run-dialog-label',
            text: _('OSC authorization')
        });
        this.contentLayout.add(this.label, { x_fill: false,
                                        x_align: St.Align.START,
                                        y_align: St.Align.START });


        this.webkit = WebKit2.WebView.new();
        this.contentLayout.add(this.webkit);

        this.setButtons([{ action: this.close.bind(this),
                           label: _('Cancel'),
                           key: Clutter.Escape },
                        ]);
    },

    open: function() {
        this.parent();
    }
});

const OscNew = new Lang.Class({
    Name: 'OscNew',
    Extends: PanelMenu.Button,

    _init : function() {
        this.notify = null;
        this.parent(0.0, _("OscNew"));
        this.dialog = new QueryDialog("dialog message");
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

        this.pubSect.entry.clutter_text.connect('key-press-event', Lang.bind(this, function(obj, event) {
            let symbol = event.get_key_symbol();
            let keyname = Gdk.keyval_name(symbol);

            if (keyname === "Return") {
                this.new_tweet_text = obj.get_text();
                this.dialog.setMessage("Send:" + this.new_tweet_text);
                this.dialog.open(Lang.bind(this, function() {
                    this.showNotify(this.new_tweet_text);
                    // this.api.sendTweet(1, this.new_tweet_text);
                }));
            }
        }));

        /* Debug for oauth entry */
        this.oauthItem = new PopupMenu.PopupBaseMenuItem();
        this.oauthItem.connect('activate', Lang.bind(this, function(actor, event) {
            let dialog = new Oauth2Dialog();
            dialog.open();
        }));
        this.list.addMenuItem(this.oauthItem);


        /* Debug for oauth */
        this.api.getAccessToken(Lang.bind(this, function() {
            let msg = arguments[0];

            let item = new OscWidget.SimpleItem("New data");
            this.list.addMenuItem(item);

            if (!arguments[0]) {
                let item = new OscWidget.SimpleItem("No data");
                this.list.addMenuItem(item);
            } else {
                for (var a in msg) {
                            let item = new OscWidget.SimpleItem(a + ":" +
                                                                msg[a]);
                            this.list.addMenuItem(item);
                }
            }

            let item2 = new OscWidget.SimpleItem("Data end");
            this.list.addMenuItem(item2);
        }));

        /* Debug for tweet */
        // this.api.getMessageDebug(0, Lang.bind(this, function() {
        //     if (!arguments[0]) {
        //         let item = new OscWidget.TweetItem("No data");
        //         this.list.addMenuItem(item);
        //     } else {
        //         let msg = arguments[0];

        //         for (var i in msg) {
        //             if (i == "tweetlist") {
        //                 for (var j in msg[i]) {
        //                     let item = new OscWidget.TweetItem(msg[i][j]);
        //                     this.list.addMenuItem(item);
        //                 }
        //                 this.showNotify("End");
        //             }
        //         }
        //     }
        // }));
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
