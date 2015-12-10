(function() {
	'use strict';
	
	var initialize, Game, Server, Sprite, Painter, Actors, U_PAINTER, D_PAINTER, L_PAINTER, R_PAINTER, A_PAINTER;
	
	Game = function( $params ) {
		this.context = $params.context;
		this.server = $params.server;
		this.room = $params.room;
		this.uid = $params.uid;
		this.sprite = {};
		this.sprite.p1 = $params.sprite;
		this.sprite.p2 = null;
	};
	
	Game.prototype.start = function() {
		this.server.register( this.room, this.uid );
		requestAnimationFrame( $util.fn( this.progress, this ) );
	};
	
	Game.prototype.progress = function( $time ) {
		var data = this.server.data();
		
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.sprite.p1.update( data.p1, $time );
		this.sprite.p1.paint( this.context );

		if ( data.p2 ) {
			if ( !this.sprite.p2 ) {
				this.sprite.p2 = new Sprite( D_PAINTER );
			}
			this.sprite.p2.update( data.p2, $time );
			this.sprite.p2.paint( this.context );
		}
		
		requestAnimationFrame( $util.fn( this.progress, this ) );
	};
	
	Server = function( $params ) {
		this.host = $params.host;
		this.dataUrl = $params.dataUrl;
		this.registerUrl = $params.registerUrl;
	};
	
	Server.prototype.data = function() {
		return {
			p1 : {},
			p2 : {}
		};
	};
	
	Server.prototype.register = function( $room, $uid ) {
		
	};
	
	Sprite = function( $painter, $actors ) {
		this.painter = $painter;
		this.actors = $actors || [];
		this.left = 0;
		this.top = 0;
	};
	
	Sprite.prototype.paint = function( $context ) {
		this.painter.paint( this, $context );
	};
	
	Sprite.prototype.update = function( $data, $time ) {
		for ( var i in this.actors ) {
			this.actors[ i ].execute( this, $data, $time );
		}
	};
	
	Painter = function( $image, $active ) {
		this.image = $image;
		this.active = $active;
		this.index = 0;
	};
	
	Painter.prototype.paint = function( $sprite, $context ) {
		var active = this.active[ this.index ];
		
		$context.drawImage(
			this.image,
			active.left, active.top, active.width, active.height,
			$sprite.left, $sprite.top, this.image.width, this.image.height
		);
	};
	
	Painter.prototype.advance = function() {
		this.index++;
		
		if ( this.index > this.active.length - 1 ) {
			this.index = 0;
		}
	};
	
	Actors = {
		move : {
			execute : function( $sprite, $data, $time ) {
				if ( $sprite.painter === R_PAINTER )
					$sprite.left += 1;
				if ( $sprite.painter === L_PAINTER )
					$sprite.left -= 1;
				if ( $sprite.painter === D_PAINTER )
					$sprite.top += 1;
				if ( $sprite.painter === U_PAINTER )
					$sprite.top -= 1;
			}
		},
		next : {
			interval : 20,
			lastTime : 0,
			execute : function( $sprite, $data, $time ) {
				if ( $time - this.lastTime > this.interval ) {
					this.lastTime = $time;
					$sprite.painter.advance();
				}
			}
		}
	};
	
	initialize = function() {
		var
		GAME,
		CHARACTER_SIZE = 96,
		CONTEXT = document.getElementById( 'canvas' ).getContext( '2d' ),
		
		moveUp = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
		moveDown = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
		moveLeft = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
		moveRight = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
		attack = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
		
		activeDown = [
			{left: 0, top: 0, width: 1024, height: 1024},
			{left: 1024, top: 0, width: 1024, height: 1024},
			{left: 2048, top: 0, width: 1024, height: 1024}
		],
		activeUp = [
			{left: 0, top: 0, width: 1024, height: 1024},
			{left: 1024, top: 0, width: 1024, height: 1024},
			{left: 2048, top: 0, width: 1024, height: 1024}
		],
		activeRight = [
			{left: 0, top: 0, width: 1024, height: 1024},
			{left: 1024, top: 0, width: 1024, height: 1024},
			{left: 2048, top: 0, width: 1024, height: 1024},
			{left: 3072, top: 0, width: 1024, height: 1024},
			{left: 4096, top: 0, width: 1024, height: 1024},
			{left: 5120, top: 0, width: 1024, height: 1024},
			{left: 6144, top: 0, width: 1024, height: 1024},
			{left: 7168, top: 0, width: 1024, height: 1024}
		],
		activeLeft = [
			{left: 0, top: 0, width: 1024, height: 1024},
			{left: 1024, top: 0, width: 1024, height: 1024},
			{left: 2048, top: 0, width: 1024, height: 1024},
			{left: 3072, top: 0, width: 1024, height: 1024},
			{left: 4096, top: 0, width: 1024, height: 1024},
			{left: 5120, top: 0, width: 1024, height: 1024},
			{left: 6144, top: 0, width: 1024, height: 1024},
			{left: 7168, top: 0, width: 1024, height: 1024}
		],
		activeAttack = [
			{left: 0, top: 0, width: 512, height: 512},
			{left: 512, top: 0, width: 512, height: 512},
			{left: 1024, top: 0, width: 512, height: 512},
			{left: 1536, top: 0, width: 512, height: 512},
			{left: 2048, top: 0, width: 512, height: 512},
			{left: 2560, top: 0, width: 512, height: 512},
			{left: 3072, top: 0, width: 512, height: 512},
			{left: 3584, top: 0, width: 512, height: 512}
		]
		;
		
		moveUp.src = 'img/toBack.png';
		moveDown.src = 'img/toStright.png';
		moveLeft.src = 'img/goLeft.png';
		moveRight.src = 'img/goRight.png';
		attack.src = 'img/Stright_Sprite.png';
		
		U_PAINTER = new Painter( moveUp, activeUp );
		D_PAINTER = new Painter( moveDown, activeDown );
		L_PAINTER = new Painter( moveLeft, activeLeft );
		R_PAINTER = new Painter( moveRight, activeRight );
		A_PAINTER = new Painter( attack, activeAttack );
		
		document.addEventListener( 'keydown', function( $event ) {
			var	keys = { '38' : U_PAINTER, '40' : D_PAINTER, '37' : L_PAINTER, '39' : R_PAINTER, '32' : A_PAINTER };
			
			if ( $event.keyCode in keys ) {
				if ( GAME.sprite.p1.painter !== keys[ $event.keyCode ] ) {
					GAME.sprite.p1.painter = keys[ $event.keyCode ];
				}
				if ( GAME.sprite.p1.actors.indexOf( Actors.next ) === -1 ) {
					GAME.sprite.p1.actors.push( Actors.next );
				}
				if ( GAME.sprite.p1.actors.indexOf( Actors.move ) === -1 ) {
					GAME.sprite.p1.actors.push( Actors.move );
				}
			}
		}, false );
		
		document.addEventListener( 'keyup', function( $event ) {
			var i, k;
			
			for ( k in Actors ) {
				if ( ( i = GAME.sprite.p1.actors.indexOf( Actors[ k ] ) ) > -1 ) {
					GAME.sprite.p1.actors.splice( i, 1 );
				}
			}
		}, false );
		
		$util.syncOnLoad( [moveUp, moveDown, moveLeft, moveRight], function() {
			var server = new Server( { host : 'http://127.0.0.1', dataUrl : '/data', registerUrl : '/register' } );
			
			GAME = new Game( { context : CONTEXT, server : server, room : '', uid : '', sprite : new Sprite( D_PAINTER ) } );
			
			document.removeEventListener( 'DOMContentLoaded', initialize, false );
			GAME.start();
		} );
	};
	
	document.addEventListener( 'DOMContentLoaded', initialize, false );
})();
