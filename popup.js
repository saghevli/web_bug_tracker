if (!chrome.cookies) {
  chrome.cookies = chrome.experimental.cookies;
}

// A simple Timer class.
function Timer() {
  this.start_ = new Date();

  this.elapsed = function() {
    return (new Date()) - this.start_;
  }

  this.reset = function() {
    this.start_ = new Date();
  }
}

// Compares cookies for "key" (name, domain, etc.) equality, but not "value"
// equality.
function cookieMatch(c1, c2) {
  return (c1.name == c2.name) && (c1.domain == c2.domain) &&
         (c1.hostOnly == c2.hostOnly) && (c1.path == c2.path) &&
         (c1.secure == c2.secure) && (c1.httpOnly == c2.httpOnly) &&
         (c1.session == c2.session) && (c1.storeId == c2.storeId);
}

// Returns an array of sorted keys from an associative array.
function sortedKeys(array) {
  var keys = [];
  for (var i in array) {
    keys.push(i);
  }
  keys.sort();
  return keys;
}

// Shorthand for document.querySelector.
function select(selector) {
  return document.querySelector(selector);
}

// An object used for caching data about the browser's cookies, which we update
// as notifications come in.
function CookieCache() {
  this.cookies_ = {};

  this.reset = function() {
    this.cookies_ = {};
  }

  this.add = function(cookie) {
    var domain = cookie.domain;
    if (!this.cookies_[domain]) {
      this.cookies_[domain] = [];
    }
    this.cookies_[domain].push(cookie);
  };

  this.remove = function(cookie) {
    var domain = cookie.domain;
    if (this.cookies_[domain]) {
      var i = 0;
      while (i < this.cookies_[domain].length) {
        if (cookieMatch(this.cookies_[domain][i], cookie)) {
          this.cookies_[domain].splice(i, 1);
        } else {
          i++;
        }
      }
      if (this.cookies_[domain].length == 0) {
        delete this.cookies_[domain];
      }
    }
  };

  // Returns a sorted list of cookie domains that match |filter|. If |filter| is
  //  null, returns all domains.
  this.getDomains = function(filter) {
    var result = [];
    sortedKeys(this.cookies_).forEach(function(domain) {
      if (!filter || domain.indexOf(filter) != -1) {
        result.push(domain);
      }
    });
    return result;
  }

  this.getCookies = function(domain) {
    return this.cookies_[domain];
  };
}

var cache = new CookieCache();

function resetTable(table_id) {
  var table = select(table_id);
  while (table.rows.length > 2) {
    table.deleteRow(table.rows.length - 1);
  }
}

var reload_scheduled = false;
var reset_requests = undefined;

function scheduleReloadCookieTable() {
  if (!reload_scheduled) {
    reload_scheduled = true;
    setTimeout(reloadCookieTable, 250);
  }
}

function reloadCookieTable() {
  reload_scheduled = false;

  var filter = $('input[name="filter_opt"]:checked').val();
  if(!reset_requests) {
    reset_requests = filter;
  }

  if(filter != reset_requests) {
    reset_requests = filter;
    resetTable("#requests");    
  }
  // var filter = select("#filter").value;
  select("#filter_str").innerText = filter;

  var domains = cache.getDomains(filter);
  // console.log(domains);

  select("#filter_count").innerText = domains.length;
  // select("#total_count").innerText = cache.getDomains().length;

  // select("#delete_all_button").innerHTML = "";
  // if (domains.length) {
  //   var button = document.createElement("button");
  //   button.onclick = removeAllForFilter;
  //   button.innerText = "delete all " + domains.length;
  //   select("#delete_all_button").appendChild(button);
  // }

  resetTable("#cookies");
  var table = select("#cookies");
  var cookie_count = 0;

  domains.forEach(function(domain) {
    var cookies = cache.getCookies(domain);
    cookies.forEach(function(cookie) {
      cookie_count++;
      // console.log(cookie);  
      var row = table.insertRow(-1);
      row.insertCell(-1).innerText = domain;
      row.insertCell(-1).innerText = cookie.name;
      row.insertCell(-1).innerText = cookie.value;
      // var cell = row.insertCell(-1);
      // cell.innerText = cookies.length;
      // cell.setAttribute("class", "cookie_count");
    });

    // var button = document.createElement("button");
    // button.innerText = "delete";
    // button.onclick = (function(dom){
    //   return function() {
    //     removeCookiesForDomain(dom);
    //   };
    // }(domain));
    // var cell = row.insertCell(-1);
    // cell.appendChild(button);
    // cell.setAttribute("class", "button");
  });

  select("#cookie_count").innerText = cookie_count;
}

function addToRequestTable(dst, referer, cookie_value) {
  var table = select("#requests");
  var row = table.insertRow(2);
  row.insertCell(-1).innerText = dst;
  row.insertCell(-1).innerText = referer;
  row.insertCell(-1).innerText = cookie_value;
  select("#reqs_count").innerText = table.rows.length - 1;
}

function listener(info) {
  cache.remove(info.cookie);
  if (!info.removed) {
    cache.add(info.cookie);
  }
  scheduleReloadCookieTable();
}

function startListening() {
  chrome.cookies.onChanged.addListener(listener);
}

function stopListening() {
  chrome.cookies.onChanged.removeListener(listener);
}

function onload() {
  // focusFilter();
  var timer = new Timer();
  chrome.cookies.getAll({}, function(cookies) {
    // console.log(cookies);
    startListening();
    start = new Date();
    for (var i in cookies) {
      //console.log(cookies[i]);
      cache.add(cookies[i]);
    }
    timer.reset();
    reloadCookieTable();
  });
}

document.addEventListener('DOMContentLoaded', function() {
  console.log("Loaded Session?");
  onload();
  // document.body.addEventListener('click', focusFilter);
  // document.querySelector('#remove_button').addEventListener('click', removeAll);
  var radios = document.forms["filter_form"].elements["filter_opt"];
  for(var i = 0, max = radios.length; i < max; i++) {
      radios[i].onclick = function() {
          reloadCookieTable();
      }
  }
  // document.querySelector('#filter_div input').addEventListener(
  //     'click', reloadCookieTable);
  // document.querySelector('#filter_div button').addEventListener(
  //     'click', resetFilter);
});

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
      var filter = $('input[name="filter_opt"]:checked').val();
      // var filter = select("#filter").value;
      select("#filter_str2").innerText = filter;

      var match_url;
      if(filter == 'doubleclick')
        match_url = /doubleclick/gi;
      else 
        match_url = /advertising/gi;

      if ( !details.url.match(match_url) ) {
        return;
      }
        // console.log("details");
        // console.log(details);
      console.log("Url: " + details.url);
      console.log("RequestId: " + details.requestId);
      console.log("Time: " + details.timeStamp);
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name == "Referer") {
          referer = details.requestHeaders[i].value;
          console.log(referer);
        }
        if (details.requestHeaders[i].name == "Cookie") {
          cookie_value = details.requestHeaders[i].value;
          console.log(cookie_value);
        }
      }

      addToRequestTable(details.url, referer, cookie_value);
        // console.log(domain);
        // chrome.cookies.getAll({url: domain}, function (cookie) {
        //     console.log("Cookies matching requester url: ");
        //     console.log(cookie);
        // });
      console.log("-------------------");
      return;
      // return {requestHeaders: details.requestHeaders};
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);