chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
    	if (!details.url.match(/doubleclick/gi) && !details.url.match(/adsense/gi)) {
    		return;
    	}
        // console.log("details");
        // console.log(details);
    	console.log("Url: " + details.url);
        console.log("RequestId: " + details.requestId);
        console.log("Url: " + details.timeStamp);
    	for (var i = 0; i < details.requestHeaders.length; ++i) {
    		console.log("-");
    		console.log(details.requestHeaders[i].name);
            console.log(details.requestHeaders[i].value);
    		// for (var prop in details.requestHeaders[i]) {
    		// 	console.log(prop.value);
    		// }
    	}
    	console.log("-------------------");
    	return;
    	// return {requestHeaders: details.requestHeaders};
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);

// chrome.webRequest.onBeforeRequest.addListener(
// 	function(details) {
//   		if (details.url.match(/doubleclick/gi)) {
//   			console.log(details.url);
//   		}
// 	},
// 	{urls: ["<all_urls>"]},
//     ["blocking"]
// );