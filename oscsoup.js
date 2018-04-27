
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Goa = imports.gi.Goa;

let _httpSession;
let osc_url = "https://www.oschina.net";
let tweet_uri = "https://www.oschina.net/action/openapi/tweet_list";
let tweet_pub_uri = "https://www.oschina.net/action/openapi/tweet_pub";
let token_uri = "https://www.oschina.net/action/openapi/token";
let get_my_info_uri = osc_url + "/action/openapi/my_information";
let comment_list_uri = osc_url + "/action/openapi/comment_list";
let comment_reply_uri = osc_url + "/action/openapi/comment_reply";

let agent = 'gnome-shell-extension-osc-news via lib soup';

const OscApi = new Lang.Class({
    Name: 'OscNew.OscApi',

    _init: function() {
        _httpSession = new Soup.Session();
        _httpSession.user_agent = agent;
    },

    _parseSessionWithJson: function(_httpSession, message, func) {
        if (!message.response_body.data) {
            func.call(this, 0);
            return 0;
        }

        try {
            let jp = JSON.parse(message.response_body.data);
            func.call(this, jp);
        } catch (e) {
            func.call(this, 0);
            return 0;
        }
        return 0;
    },

    _sendMessage: function(id, uri, params, func) {
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
            here._parseSessionWithJson(_httpSession, message, func);
            return 0;
        });
    },

    getAccessToken: function(code, client_id, client_secret, grant_type,
                             redirect_uri, data_type, func) {
        let params = {
            client_id: client_id,
            client_secret: client_secret,
            grant_type: grant_type,
            redirect_uri: redirect_uri,
            code:code,
            dataType:data_type
        };

        this._sendMessage('access-token', token_uri, params, func);

        return 0;
    },

    sendTweet: function(token, message, func) {
        let params = {
            access_token: token,
            msg: message
        };
        this._sendMessage('sendTweet', tweet_pub_uri, params, func);
    },

    getTweet: function(token, func) {
        let params = {
            access_token: token,
            pagesize: "20",
            page: "1",
            datatype: "json"
        };
        this._sendMessage('getTweet', tweet_uri, params, func);
    },

    getTweetComment: function(token, id, func) {
        let params = {
            id: id,
            catalog: "3", // 1-新闻/翻译|2-帖子|3-动弹|4-消息(私信 必须access_token)|5-博客 	-1
            //access_token: token,
            pagesize: "20",
            page: "1",
            datatype: "json"
        };
        this._sendMessage('getTweetComment', comment_list_uri, params, func);
    },

    sendTweetComment: function(token, id, content, func) {
        let params = {
            access_token: token,
            id: id,
            catalog: 3, // catalog 	true 	long 	评论对象类型：1-新闻或翻译，2-帖子、问答，3-动弹，4-私信
            content: content,
            isPostToMyZone: 0, // 动弹是否转发到我的空间，1-转发，0-不转发。catalog 为 3 使用
            datatype: "json"
        };
        this._sendMessage('sendTweetComment', comment_list_uri, params, func);
    },

    getMyInfomation: function(token, func) {
        let params = {
            access_token: token,
            datatype: "json"
        };
        this._sendMessage('getMyInformation', get_my_info_uri, params, func);
    }
});
