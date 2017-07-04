function getTimestamp() {
    return Math.floor(new Date().getTime() / 1000);
}

function getMethod() {
    return request.method;
}

function getBaseUrl() {
    return request.url.replace('{{url}}', environment['url']);
}

function getContentType() {
    return request.headers['Content-Type'];
}

function getQueryParams() {
    var queryString = request.url.split('?')[1];

    if (queryString === undefined || queryString.length === 0) {
        return {};
    }

    var querys = _.chain(queryString.split('&'))
        .map(function (item) {
            if (item) {
                return item.split('=');
            }
        })
        .compact()
        .object()
        .value();

    return querys;
}

function getData() {
    return request.data;
}

function fixedEncodeURIComponent(str) {
    return encodeURIComponent(str)
        .replace(/[!'()]/g, escape) // i.e., %21 %27 %28 %29
        .replace(/\*/g, '%2A');
}

function removeQueryString(url) {
    return url.replace(/\?.*/, '').replace(/\/+$/, '');
}

function urlEncode(url) {
    return fixedEncodeURIComponent(url);
}

function buildParameterString(parameters) {
    var encodeParameters = [];

    Object.keys(parameters).sort().forEach(function (key) {
        encodeParameters.push(fixedEncodeURIComponent(key) + '=' + fixedEncodeURIComponent(parameters[key]));
    });

    return encodeParameters.join('&');
}

function buildSignatureBaseString(appId, timestamp, method, baseUrl, parameters, content) {
    method = method.toUpperCase();
    baseUrl = urlEncode(removeQueryString(baseUrl));

    var parameterString = buildParameterString(parameters);

    return appId + '&' + timestamp + '&' + method + '&' + baseUrl + '&' + parameterString + '&' + content;
}

function hmacHash(data, key) {
    var hash = CryptoJS.HmacSHA256(data, key);

    return hash.toString(CryptoJS.enc.Base64);
}

var appId = environment['appId'];
var appSecret = environment['appSecret'];
var timestamp = getTimestamp();
var method = getMethod();
var baseUrl = getBaseUrl();
var parameters = {};
var content = '';

if (getContentType() === 'application/json') {
    parameters = getQueryParams();
    content = getData();
} else {
    parameters = Object.assign(parameters, getQueryParams(), getData());
}

var baseString = buildSignatureBaseString(appId, timestamp, method, baseUrl, parameters, content);
var signature = hmacHash(baseString, appSecret);

console.log('timestamp:', timestamp);
console.log('method:', method);
console.log('baseUrl:', baseUrl);
console.log('parameters:', parameters);
console.log('content:', content);
console.log('baseString:', baseString);
console.log('signature:', signature);

postman.setEnvironmentVariable('timestamp', timestamp);
postman.setEnvironmentVariable('signature', signature);
