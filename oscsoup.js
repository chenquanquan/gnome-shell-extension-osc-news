
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Goa = imports.gi.Goa;

let _httpSession;

let client_id = "q93z5JTP7uDt3h6ca3k8";
let client_secret = "XcSSY7gOwOCN2ZZBDdRje5u0BI8KSzzt";
let redirect_uri = "https://extensions.gnome.org";
let access_token = "457bb1e6-c6df-43eb-98d8-1bfb54491c03";

let oauth2_uri = "https://www.oschina.net/action/oauth2/authorize";

//let debug_uri = "https://www.oschina.net/action/openapi/tweet_list?access_token=457bb1e6-c6df-43eb-98d8-1bfb54491c03&pagesize=10&page=1&datatype=json";
let debug_uri = "https://www.oschina.net/action/openapi/tweet_list";
let tweet_pub_uri = "https://www.oschina.net/action/openapi/tweet_pub";

let agent = 'gnome-shell-extension-osc-news via libsoup';

var token;

const OscApi = new Lang.Class({
    Name: 'OscNew.OscApi',

    _init: function() {
        _httpSession = new Soup.Session();
        _httpSession.user_agent = agent;
    },

    getAccessToken: function(func) {
        let here = this;

        var client = Goa.Client.new_sync(null);
        let accounts = client.get_accounts();

        func.call(here, accounts);
        return 0;
    },

    sendMessage: function(id, uri, params, func) {
        let here = this;
        let message = Soup.form_request_new_from_hash('GET', uri, params);

        if (this.asyncSession === undefined)
            this.asyncSession = {};

        if (this.asyncSession[id] !== undefined && this.asyncSession[id]) {
            _httpSession.abort();
            this.asyncSession[id] = 0;
        }

        this.asyncSession[id] = 1;
        _httpSession.queue_message(message, function(_httpSession, message) {
            here.asyncSession[id] = 0;
            if (!message.response_body.data) {
                func.call(here, 0);
                return 0;
            }

            try {
                let jp = JSON.parse(message.response_body.data);
                func.call(here, jp);
            } catch (e) {
                func.call(here, 0);
                return 0;
            }
            return 0;
        });
    },

    sendTweet: function(id, message, func) {
        let params = {
            access_token: access_token,
            msg: message
        };
        this.sendMessage(id, tweet_pub_uri, params, func);
    },

    getMessageDebug: function(id, func) {
        let params = {
            access_token: access_token,
            pagesize: "2",
            page: "1",
            datatype: "json"
        };
        this.sendMessage(id, debug_uri, params, func);
    },
});
