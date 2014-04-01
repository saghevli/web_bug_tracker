var domain = '';


chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
    	if (!details.url.match(/doubleclick/gi) && !details.url.match(/adsense/gi)) {
    		return;
    	}
        // console.log("details");
        // console.log(details);
    	console.log("Url: " + details.url);
        console.log("RequestId: " + details.requestId);
        console.log("Time: " + details.timeStamp);
    	for (var i = 0; i < details.requestHeaders.length; ++i) {
    		if (details.requestHeaders[i].name == "Referer") {
                domain = details.requestHeaders[i].value;
            }
            if (details.requestHeaders[i].name == "Cookie") {

            }
    	}
        console.log(domain);
        chrome.cookies.getAll({url: domain}, function (cookie) {
            console.log("Cookies matching requester url: ");
            console.log(cookie);
        });
        console.log("-------------------");
    	return;
    	// return {requestHeaders: details.requestHeaders};
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);

chrome.cookies.onChanged.addListener(function(info) {
    var domain_re = domain.substring(domain.indexOf(".") + 1).replace('/', '');
    var re = new RegExp(domain_re, 'gi');
    if (info.cookie.domain.match(re)) {
        console.log("Cookie onChanged:" + JSON.stringify(info));
    }
});

// chrome.webRequest.onBeforeRequest.addListener(
// 	function(details) {
//   		if (details.url.match(/doubleclick/gi)) {
//   			console.log(details.url);
//   		}
// 	},
// 	{urls: ["<all_urls>"]},
//     ["blocking"]
// );