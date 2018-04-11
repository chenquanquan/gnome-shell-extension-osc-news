
const Lang = imports.lang;
const Soup = imports.gi.Soup;

let _httpSession;

let client_id = "q93z5JTP7uDt3h6ca3k8";
let client_secret = "XcSSY7gOwOCN2ZZBDdRje5u0BI8KSzzt";
let redirect_uri = "https://extensions.gnome.org";

let oauth2_uri = "https://www.oschina.net/action/oauth2/authorize";

//let debug_uri = "https://www.oschina.net/action/openapi/tweet_list?access_token=457bb1e6-c6df-43eb-98d8-1bfb54491c03&pagesize=10&page=1&datatype=json";
let debug_uri = "https://www.oschina.net/action/openapi/tweet_list";
let tweet_pub_uri = "https://www.oschina.net/action/openapi/tweet_pub";

const OscApi = new Lang.Class({
    Name: 'OscNew.OscApi',

    _init: function() {
        //this.initHttp();
    },

    initHttp: function() {
        this.authUri = new Soup.URI('https://www.oschina.net/action/oauth2/authorize');

    },

    sendTweet: function(id, message) {
         if (_httpSession === undefined) {
            _httpSession = new Soup.Session();
            //_httpSession.user_agent = this.user_agent;
        }
        let params = {
            access_token: "457bb1e6-c6df-43eb-98d8-1bfb54491c03",
            msg: message
        };
        let here = this;

        let message = Soup.form_request_new_from_hash('GET', tweet_pub_uri, params);
        if (this.asyncSession === undefined)
            this.asyncSession = {};

        if (this.asyncSession[id] !== undefined && this.asyncSession[id]) {
            _httpSession.abort();
            this.asyncSession[id] = 0;
        }

        this.asyncSession[id] = 1;
        _httpSession.queue_message(message, function(_httpSession, message) {
            here.asyncSession[id] = 0;
            /* error check */
            return 0;
        });
    },

    getMessageDebug: function(id, fun) {
        if (_httpSession === undefined) {
            _httpSession = new Soup.Session();
            //_httpSession.user_agent = this.user_agent;
        }
        let params = {
            access_token: "457bb1e6-c6df-43eb-98d8-1bfb54491c03",
            pagesize: "2",
            page: "1",
            datatype: "json"
        };
        let here = this;

        let message = Soup.form_request_new_from_hash('GET', debug_uri, params);
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
                fun.call(here, 0);
                return 0;
            }

            try {
                let jp = JSON.parse(message.response_body.data);
                fun.call(here, jp);
            } catch (e) {
                fun.call(here, 0);
                return 0;
            }
            return 0;
        });
    },
});
