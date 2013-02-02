
/* Normalized hide address bar for iOS & Android (c) Scott Jehl, scottjehl.com MIT License */
(function(a){var b=a.document;if(!location.hash&&a.addEventListener){window.scrollTo(0,1);var c=1,d=function(){return a.pageYOffset||b.compatMode==="CSS1Compat"&&b.documentElement.scrollTop||b.body.scrollTop||0},e=setInterval(function(){if(b.body){clearInterval(e);c=d();a.scrollTo(0,c===1?0:1)}},15);a.addEventListener("load",function(){setTimeout(function(){if(d()<20){a.scrollTo(0,c===1?0:1)}},0)})}})(this);

if (window.ww) _ww = ww;

ww = {
	info : 'Weather Widget',
	log : function() {
		try{console.log.apply('',arguments);} catch(e) {}
	},
	scriptsLoc : 'js/modules/',
	contextPath: location.host,
	windowsOS: navigator.userAgent.match(/(Windows Phone)/i) ? true : false,
	uaCacheFix: (navigator.userAgent.indexOf('Windows Phone') > 0) ? Math.round((Math.random()*99999)) : '',
	IEPhone: $.browser.msie, // Fix for IE on WPhone
	mod : {
		'weathermodulejs': {}
	},
	loaded : [],
	init : function() {

		$.each(ww.mod, function(moduleName) {
			$.extend(ww.mod[moduleName], {
				className : '.mod-' + moduleName,
				load : function(m) {
					if ($.inArray(moduleName, ww.loaded) < 0) {

						var headElem = document.getElementsByTagName('head')[0];         
						var newScript = document.createElement('script');
						newScript.type = 'text/javascript';
						newScript.src = ww.scriptsLoc + 'ww.' + moduleName.replace(/_/g,'-') + '.js?' + ww.uaCacheFix;
						headElem.appendChild(newScript);

						(function(){
							if (!ww.mod[moduleName].init) {
								setTimeout(arguments.callee, 30);
								return;
							}
							ww.mod[moduleName].init(m);
						})();

						ww.loaded.push(moduleName);
					}
				}
			});

			var module = $('.'+moduleName.replace(/_/g,'-'));
			if (module.size()){
				ww.mod[moduleName].load(module);
			}
		});

	}

};

(function($) {
    $.fn.fastempty = function() {
	  if (this[0]) {
		while (this[0].hasChildNodes()) {
		    this[0].removeChild(this[0].lastChild);
		}
	  }

	  return this;
    };
})(jQuery);

// instantiate
$(document).ready(function() {
     // disabled JQM link binding
     $.mobile.linkBindingEnabled = false;
     ww.init();
});
