
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const Ellipsize = imports.gi.Pango.EllipsizeMode;
const Gdk = imports.gi.Gdk;

const SimpleItem = new Lang.Class({
    Name: 'OscNew.SimpleItem',
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

    _init: function(item, token, soup_api, reply_func) {
        this.parent(0.0, item);

        this.item = item;
        this.token = token;
        this.soup_api = soup_api;
        this.reply_func = reply_func;

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

        this.connect('activate', Lang.bind(this, function() {
            if (this.commentList !== undefined)
                return;

            this.commentList = '';
            this.com_box =  new St.BoxLayout({vertical:true});
            let msg_id = item.id+"";
            let author_id = item.authorid+"";

            if (item.commentCount != 0) {
                let here = this;
                this.soup_api.getTweetComment(
                    this.token,
                    msg_id,
                    Lang.bind(this, function() {
                        here.commentList = arguments[0];
                        for (var i in here.commentList) {
                            if (i == "commentList") {
                                for (var j in here.commentList[i]) {
                                    let comment = here.commentList[i][j];
                                    here._addComment(here, comment);
                                }
                            }
                        };
                        here._addCommentReplyEntry(msg_id, author_id);
                    })
                );
            } else {
                this._addCommentReplyEntry(msg_id, author_id);
            }

        }));
    },

    _addComment: function(here, comment) {
        let commentItem = new St.Button({
            child: new St.Label({
                text: comment.commentAuthor + ":" +
                    comment.content})
        });
        here.com_box.add(commentItem);

        commentItem.connect('clicked', Lang.bind(here, function() {
            if (here.com_entry !== undefined) {
                let entryText = here.com_entry.clutter_text;
                let text = entryText.get_text();

                text += '@'+comment.commentAuthor+' ';
                entryText.set_text(text);
            }
        }));
    },

    _addCommentReplyEntry: function(msg_id, author_id) {
        this.com_entry = new St.Entry({
            name: 'tweetCommentEntry',
            hint_text: _('reply...'),
            style_class:'run-dialog-entry',
            track_hover: true,
            can_focus: true
        });
        this.com_box.add(this.com_entry);
        this.box.add(this.com_box);

        let here = this;

        this.com_entry.clutter_text.connect(
            'key-press-event',
            Lang.bind(this, function(obj, event) {
                let symbol = event.get_key_symbol();
                let keyname = Gdk.keyval_name(symbol);

                if (keyname === "Return") {
                    here.reply_func.call(this, here.token, msg_id, author_id, obj.get_text());
                }
            }));
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
        this.scrollView = new St.ScrollView({
            x_fill: true,
            y_fill: true,
            y_align: St.Align.START,
            overlay_scrollbars: true,
            style_class: "osc-scroll-view-section"
        });
        this.innerMenu = new PopupMenu.PopupMenuSection();
        this.scrollView.add_actor(this.innerMenu.actor);
        this.actor.add_actor(this.scrollView);
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

const OscAccountSect = new Lang.Class({
    Name: 'OscNew.OscAccountSect',
    Extends: PopupMenu.PopupMenuSection,

    _init: function() {
        this.parent();

        this.user = new PopupMenu.PopupMenuItem("Login");
        this.addMenuItem(this.user);
    },

    setUser: function(user, reply, msg, fans, refer) {
        this.user.label.set_text(user);
    }
});
