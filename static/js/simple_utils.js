var $util = ( function() {
	'use strict';

	var httpRequest = ( function() {
		if ( window.ActiveXObject ) {
			try {
				return new ActiveXObject( 'Msxml2.XMLHTTP' );
			} catch ( e1 ) {
				try {
					return new ActiveXObject( 'Microsoft.XMLHTTP' );
				} catch ( e2 ) { return null; }
			}
		} else if ( window.XMLHttpRequest ) {
			return new XMLHttpRequest;
		}
		
		return null;
	} )();

	return {
		element : function( $id ) {
			return document.getElementById( $id );
		},

		style : function( $element, $styles ) {
			if ( $styles ) { // setter
				for ( var attribute in $styles )
					$element.style[ attribute ] = $styles[ attribute ];
			} else { // getter
				if ( window.getComputedStyle )
					return $element.ownerDocument.defaultView.getComputedStyle( $element, null );
				else
					return $element.currentStyle;
			}
		},

		number : function( $str ) {
			return $str.replace ? Number( $str.replace( /[^0-9|.]/g, "" ) ) : "";
		},

		fn : function( $fn, $context, $parameters ) {
			$parameters = $parameters || [];
			
			return function( $addParams ) {
				$fn.apply( $context, $addParams ? $parameters.concat( $addParams ) : $parameters );
			};
		},

		ajax : function( $url, $method, $parameters, $callback, $sync ) {
			var callback = function() {
					if ( httpRequest.readyState == 4 ) {
						var result = JSON.parse( httpRequest.responseText );

						if ( httpRequest.status == 200 ) {
							if ( $callback ) $callback( result );
						} else {
							alert( result.message + '[' + result.code + ']' );
						}
					}
				};

			if ( $parameters ) {
				$parameters = encodeURIComponent( JSON.stringify( $parameters ) );
				if ( $method === "GET" ) $url += "?parameters=" + $parameters;
			}

			httpRequest.open( $method, $url, $sync === undefined ? true : $sync );
			httpRequest.setRequestHeader( 'Content-Type', 'application/json' );
			httpRequest.onreadystatechange = callback;
			httpRequest.send( $parameters && $method === "POST" ? $parameters : null );
		},

		clientSize : function() {
			return {
				'width'  : document.documentElement.clientWidth,
				'height' : document.documentElement.clientHeight
			};
		},

		hash : function( $value ) {
			if ( $value ) {
				location.hash = '#' + $value;
				location.hash = '';
				return;
			}

			return location.hash;
		},
		
		syncOnLoad : function( images, callback ) {
			var i, interval;
			
			interval =
				setInterval( function() {
					for ( i = 0; i < images.length; i++ ) {
						if ( !images[ i ].complete ) {
							return;
						}
					}
					
					clearInterval( interval );
					callback();
				}, 60 );
		}
	};
} )();
