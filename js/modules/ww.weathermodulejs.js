var weatherScroll = new iScroll('weather-widget',  { snap: true, checkDOMChanges: false, hScrollbar: false, vScrollbar: false, vScroll: false });

ww.mod['weathermodulejs'] = {
	settings:{
		$weatherContainer		: $("#weather-results"),
		$warningContainer		: $("#weather-warning"),
		$scroller			: $("#scroller"),
		accuweatherUrl		: 'http://m.accuweather.com/',
		USOnly			: true,
		zipUrl			: 'http://uscellularmobileweb.accu-weather.com/widget/uscellularmobileweb/weather-data.asp?location=',
		cityUrl			: 'http://uscellularmobileweb.accu-weather.com/widget/uscellularmobileweb/city-find.asp?location='
	},
	init: function(option){
		$.extend(this.settings, option);
		ww.log('weathermodulejs.init');
		ww.mod['weathermodulejs'].binding();
		this.setLocation();
	},
	binding: function(data) {
		var self = this;

		$('body').on('click.ww', '#location-change-trigger', function (event) {
			event.preventDefault();
			self.showLocationForm();
		}).on('click.ww', '#search_loc_btn', function (event) {
			event.preventDefault();
			var searchVal = $('#search_loc_text').val();
			
			//check if field is blank
			if(searchVal.length > 0) {
				
				var citytest = /[a-zA-Z]+[[ -]?[a-zA-Z]+]*/,
				ziptest = /^[0-9]{5}(?:-[0-9]{4})?$/,
				citystatetest = /([^,]+),\s*(\w{2})/,
				citystateziptest = /([^,]+),\s*(\w{2})\s*(\d{5}(?:-\d{4})?)/;
				
				if ( ziptest.test(searchVal) != false ) {
					$.cookie('loc_zipcode', searchVal, {expires: 7});
					self.readFeed(4, searchVal);
				}
				else if ( citytest.test(searchVal) != false ) {
					self.readCityFeed(4, searchVal);
				}
				else if ( citystateziptest.test(searchVal) != false ) {
					self.readCityFeed(4, searchVal);
				}				
				else if ( citystatetest.test(searchVal) != false ) {
					self.readCityFeed(4, searchVal);
				}
				else {
					var errorMsg = "Please enter a valid City or ZIP Code";
					self.formErrorState(errorMsg);
				}
			}
			else {
				var errorMsg = "Please enter a valid City or ZIP Code";
				self.formErrorState(errorMsg);
			}
			return false;
		});
	},
	
	formErrorState: function (errorMsg) {
		this.settings.$weatherContainer.find('#ww-weather-location').addClass('ww-form-error').find('#search_loc_label').text(errorMsg);
		this.settings.$weatherContainer.find('#search_loc_text').val('');
	},

	readCityFeed: function(limit, city) {
		
		var city = escape(city),
		url = this.settings.cityUrl + city;

		//$.mobile.loading('show');		
		requestCrossDomain(url, function (result) {

			var browserName = navigator.appName;
			var doc;
			if (browserName == 'Microsoft Internet Explorer') {
				doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.async = 'false'
				doc.loadXML(result.results);
			} else {
				doc = (new DOMParser()).parseFromString(result.results, 'text/xml');

			}
			var $xml = $(doc);
			ww.mod['weathermodulejs'].setCityFeed(limit, $xml);
		});		
	},
	
	setCityFeed: function (limit, $xml) {
		var city = $xml.find('location')
		cities=[];
		
		// check for US only flag
		if (this.settings.USOnly == true) {
			$.each(city, function() {
				var countryCode = $(this).attr('countryCode');
				if (countryCode == "US") {
					cities.push($(this));
				}
			});
		}
		else {
			$.each(city, function() {
				cities.push($(this));
			});
		}
		// if one city is returns, send to readFeed
		if (cities.length == 1) {
			$.each(cities, function() {
				zip = $(this).attr('primaryPostalCode');
			});
			$.cookie('loc_zipcode', zip, {expires: 7});
			this.readFeed(limit, zip);
		}
		// if more than one city is returns, build a select menu
		else if (cities.length > 1) {
			var select = $('<select id="cityselect" data-corners="false" data-mini="true"></select>');
			var options = '';
			$.each(cities, function() {
				var adminArea = $(this).attr('adminArea'),
				primaryPostalCode = $(this).attr('primaryPostalCode'),
				thisCity = $(this).attr('city'),
				location = $(this).attr('location');
				if (primaryPostalCode != undefined) {
					options += '<option value="' + primaryPostalCode + '">' + thisCity + ', ' + adminArea + '</option>';
				}
				else {
					options += '<option value="' + location + '">' + thisCity + ', ' + adminArea + '</option>';
				}
			});
			select.append(options);

			this.settings.$weatherContainer.find('#search_loc_text').hide();
			this.settings.$weatherContainer.find('#search_loc_btn').hide();
			this.settings.$weatherContainer.find('#search_loc_label').after(select);
			var $citySearchBtn = "<input type='image' border='0' align='absmiddle' class='search_btn' id='search_loc_btn_city' alt='Submit' src='images/btn_search_location.gif' style='margin:0;'>";
			select.after($citySearchBtn).selectmenu();
			
			// attach change event to new select
			$('body').on('click.ww', '#search_loc_btn_city', function (event) {
				event.preventDefault();
				var zip = select.val();
				$.cookie('loc_zipcode', zip, {expires: 7});
				ww.mod['weathermodulejs'].readFeed(4, zip);				
			});
		}
		// no city - show error
		else if (cities.length == 0) {
			var errorMsg = "Please enter a valid City or ZIP Code";
			this.formErrorState(errorMsg);		
		}
	},
	
	setLocation: function(data) {
		var curZip = $.cookie('loc_zipcode');
		this.readFeed(4, curZip || 60601);
		!curZip && navigator.geolocation && navigator.geolocation.getCurrentPosition(this.showPosition, this.showError);
	},
	
	showPosition: function (position) {
		// geonames convert lat/long to zip
		$.getJSON("http://ws.geonames.org/findNearestAddressJSON?callback=?", {
				lat : position.coords.latitude,
				lng : position.coords.longitude
			},
			function (data) {
				$.cookie('loc_zipcode', data.address.postalcode, {expires: 7});
				this.readFeed(4, data.address.postalcode);
			}
		);	
	},
	
	readFeed: function (limit, zip) {
		var zip = zip;
		var url = this.settings.zipUrl + zip;
		$.mobile.loading('show');
		
		// yahoo api for cross-domain xml request
		requestCrossDomain(url, function (result) {
			var browserName = navigator.appName;
			var doc;
			if (browserName == 'Microsoft Internet Explorer') {
				doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.async = 'false'
				doc.loadXML(result.results);
			} else {
				doc = (new DOMParser()).parseFromString(result.results, 'text/xml');
			}
			var $xml = $(doc);
			
			ww.mod['weathermodulejs'].setFeed(limit, $xml);
		});
	},
		
	setFeed: function (limit, $xml) {

		var cityErr;
		
		// get city from feed
		var city = $xml.find('local').find('city').text();
		if (!city){
			cityErr = 1;
			this.showLocationForm(cityErr);
			return;
		}
		
		// get severe weather warning
		var $watchwarning = $xml.find('watchwarnareas');		
		if ($watchwarning.attr('isactive')==1) {
			var warningUrl = $watchwarning.find('url').text();
			this.showWeatherWarning(warningUrl);
		}
		else {
			this.hideWeatherWarning();
		}

		// limit cityname to string of 18 character
		var cityname=city.substr(0, 18),
		num = 1
		// get current conditions
		currenttemp = $xml.find('currentconditions').find('temperature').text(),
		weathertext = $xml.find('currentconditions').find('weathertext').text(),
		$currentday = $xml.find('forecast').find('day').first(),
		currenthigh = $currentday.find('daytime').find('hightemperature').text(),
		currentlow = $currentday.find('daytime').find('lowtemperature').text(),
		currenticon = $xml.find('currentconditions').find('weathericon').text(),
		currentimg = "<img src = 'images/weather/icon_" + currenticon + ".png' />",
		firstLI = "<li class='today-item'>" + currentimg + "<div class='data-container'><p class='weather-location'>" + cityname + "</p><a data-rel='popup' href='#popupForm' class='location-change-trigger' id='location-change-trigger'>Change</a><p class='weather-temperature'><span class='weather-temperature-now'><em class='weather-deg'>" + currenthigh + "<sup>&#186;</sup> </em><sup>F</sup></span><span class='weather-temperature-forecast'>Hi " + currenthigh + "&#186; / Lo " + currentlow + "&#186; </span></p><a href='http://www.accuweather.com/' target='_blank' class='weather-provider'><img src='images/accuweather-logo.png' /></a></div></li>";
	
		//load results with current firstLI
		this.settings.$weatherContainer.find('li.form-item').remove();
		this.settings.$weatherContainer.find('li.today-item').remove();
		this.settings.$weatherContainer.find('li.forecast-item').remove();
		
		//this.settings.$weatherContainer.append(firstLI);
		var appitem = this.settings.$weatherContainer.find('.app-item').eq(0);
		if (appitem.length>0) {
			appitem.after(firstLI);
		}
		else {
			this.settings.$weatherContainer.append(firstLI);
		}		

		// get forecast
		var $forcast = $xml.find('forecast');
		var forcastLI = "";
		$forcast.find('day').each(function () {
			if (num <= limit) {
				var daycode = $(this).find('daycode').text(),
					obsdate = $(this).find('obsdate').text(),
					hightemp = $(this).find('daytime').find('hightemperature').text(),
					lowtemp = $(this).find('daytime').find('lowtemperature').text(),
					forcasticon = $(this).find('daytime').find('weathericon').text(),
					forcastimg = "<img class='forecast-image' src = 'images/weather/icon_" + forcasticon + ".png' />",
					newdate = new Date(obsdate),
					dateString = newdate.format("mmm d"),
					dayname = newdate.format("ddd");

				forcastLI += "<li class='forecast-item'>";
				forcastLI += "<p class='weather-date'>" + dayname + " " + dateString + "</p>";
				forcastLI += "<p>" + forcastimg + "</p>";
				forcastLI += "<span class='weater-forecast-max'>" + hightemp + "&#186; </span><span class='weater-forecast-min'>" + lowtemp + "&#186; </span>";
				forcastLI += "</li>";

				num++;
			}
		});

		// load forecast
		this.settings.$weatherContainer.find('li.today-item').eq(0).after(forcastLI);
		
		// refresh scroller
		this.refreshScroller();
		
		$.mobile.loading('hide');
	},

	showLocationForm: function(cityErr) {
	
		$.mobile.loading('show');

		var locationForm = "<li class='form-item'><div id='ww-weather-location'><form action='#' class='ww-weather' id='zipform'><fieldset><label for='ww-module-location' id='search_loc_label'>Local Weather</label><input type='text' size='20' name='l' class='search_text ui-input-text ui-body-a ui-shadow-inset' id='search_loc_text' placeholder='Enter City or ZIP Code'><input type='image' border='0' align='absmiddle' class='search_btn' id='search_loc_btn' alt='Submit' src='images/btn_search_location.gif'><p><a href='http://www.accuweather.com/' target='_blank' class='weather-provider'><img src='images/accuweather-logo.png' /></a></p></fieldset></form></div></li>";
		
		// check if form is already there		
		if (this.settings.$weatherContainer.find('#ww-weather-location').length == 0) {

			if (this.settings.$weatherContainer.find('.app-item').eq(0).length>0) {
				this.settings.$weatherContainer.find('.app-item').eq(0).after(locationForm).find('#search_loc_text').val('');
			}
			else {
				this.settings.$weatherContainer.prepend(locationForm).find('#search_loc_text').val('');
			}
			
			// refresh scroller
			this.refreshScroller();
		}
		else {
			if (cityErr==1) {
				var errorMsg = "Please enter a valid ZIP Code";
				this.formErrorState(errorMsg);
			}
		}
		$.mobile.loading('hide');
	},
	showWeatherWarning: function(warningUrl) {
		var weatherWarningContent = "<a href='" + warningUrl + "' target='_blank'><img src='images/weather/warning.jpg' />Severe weather alert. Learn more &gt;</a>";
		this.settings.$warningContainer.html(weatherWarningContent).show();
	},
	hideWeatherWarning: function() {
		this.settings.$warningContainer.fastempty().hide();
	},
	refreshScroller: function() {
		var scrollWidth = 0;
		this.settings.$scroller.find('li').each(function() {		
			scrollWidth += parseInt($(this).width(), 10);
		});

		// width of scroller	
		this.settings.$scroller.width(scrollWidth+10);
		setTimeout(function () { weatherScroll.refresh(); }, 0);
	},	
	showError: function(error) {
		switch(error.code)  {
			case error.PERMISSION_DENIED:
				ww.mod['weathermodulejs'].readFeed(4, 60601);
				break;
			case error.POSITION_UNAVAILABLE:
				ww.mod['weathermodulejs'].readFeed(4, 60601);
				break;
			case error.TIMEOUT:
				ww.mod['weathermodulejs'].showLocationForm();
				break;
			case error.UNKNOWN_ERROR:
				ww.mod['weathermodulejs'].showLocationForm();
				break;
		}	
	}
};

// yahoo api for cross-domain xml request
// Accepts a url and a callback function to run.
function requestCrossDomain(site, callback) {

	// If no url was passed, exit.
	if (!site) {
		//alert('No site was passed.');
		var errorMsg = "Please enter a valid City or ZIP Code";
		ww.mod['weathermodulejs'].formErrorState(errorMsg);	
		return false;
	}

	// Take the provided url, and add it to a YQL query. Make sure you encode it!
	var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from xml where url="' + site + '"') + '&format=xml&callback=?';

	// Request that YSQL string, and run a callback function.
	// Pass a defined function to prevent cache-busting.
	$.getJSON(yql, cbFunc);

	function cbFunc(data) {
		if (data.results[0]) {
			if (typeof callback === 'function') {
				callback(data);
			}
		}
		else {
			ww.mod['weathermodulejs'].showLocationForm();
		}
	}
}

var dateFormat = function () {
	var    token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;


		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var    _ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};

