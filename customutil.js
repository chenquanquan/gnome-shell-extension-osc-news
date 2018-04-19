const OSC_NEWS_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.osc-news';
const KEY_OAUTH_CODE = 'oauth-code';
const KEY_ACCESS_TOKEN = 'access-token';
const KEY_CLIENT_ID = 'client-id';
const KEY_CLIENT_SECRET = 'client-secret';
const KEY_REDIRECT_URI = 'redirect-uri';

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
