
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Ellipsize = imports.gi.Pango.EllipsizeMode;

const SimpleItem = new Lang.Class({
    Name: 'OscNew.TweetItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(item) {
        this.parent(0.0, item);

        this.box =  new St.BoxLayout({vertical:true});

        this.label = new St.Label({text:item});

        this.label.clutter_text.set_ellipsize(Ellipsize.NONE);
        this.label.clutter_text.set_line_wrap(true);
        this.label.clutter_text.set_line_wrap_mode(imports.gi.Pango.WrapMode.WORD_CHAR);

        this.box.add(this.label);
        this.actor.add_child(this.box);
    },

    destroy: function() {
        this.parent();
    }
});

/* the tweet item
 * @item:
 *     author	"xxx"
 *     id	12345678
 *     portrait	"https://xxx.jpeg?t=xxxx"
 *     authorid	0000000
 *     body	"abcdefg"
 *     pubDate	"2018-04-11 15:46:23"
 *     commentCount	n
 */
const TweetItem = new Lang.Class({
    Name: 'OscNew.TweetItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(item) {
        this.parent(0.0, item);

        this.box =  new St.BoxLayout({vertical:true});

        this.label = new St.Label({text:
                                   item.author + " : " +
                                   item.body,
                                  });

        this.label.clutter_text.set_ellipsize(Ellipsize.NONE);
        this.label.clutter_text.set_line_wrap(true);
        this.label.clutter_text.set_line_wrap_mode(imports.gi.Pango.WrapMode.WORD_CHAR);

        this.comment = new St.Label({text:
                                    "(" + item.commentCount + "评)",
                                   });

        this.box.add(this.label);
        this.box.add(this.comment);

        this.actor.add_child(this.box);
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
            y_fill: true,
            y_align: St.Align.START,
            overlay_scrollbars: true,
            style_class: "osc-scroll-view-section"
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

const TweetPubSect = new Lang.Class({
    Name: 'OscNew.TweetPubSect',
    Extends: PopupMenu.PopupMenuSection,

    _init: function() {
        this.parent();
        this.entry = new St.Entry({
            name: 'tweetEntry',
            hint_text: _('tweet...'),
            style_class:'run-dialog-entry',
            track_hover: true,
            can_focus: true
        });
        this.actor.add_child(this.entry);
    },
});
