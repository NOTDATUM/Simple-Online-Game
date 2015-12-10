(function() {
	'use strict';
	
	var
	CHARACTER_SIZE = 96,
	
	initialize, sog, Game, Server, Sprite, Painter, Actors, PainterFactory,
	
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
				this.sprite.p2 = new Sprite( PainterFactory.create( PainterFactory.DOWN ) );
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
		
		this.tmp = {};
	};
	
	Server.prototype.data = function() {
		return this.tmp;
	};
	
	Server.prototype.register = function( $room, $uid ) {
		
	};
	
	Server.prototype.update = function( $data ) {
		this.tmp.p1 = $data;
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
	
	Sprite.prototype.advance = function() {
		this.painter.advance();
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
				$sprite.left += $data.speedLeft;
				$sprite.top += $data.speedTop;
			}
		},
		next : {
			interval : 20,
			lastTime : 0,
			execute : function( $sprite, $data, $time ) {
				if ( $time - this.lastTime > this.interval ) {
					this.lastTime = $time;
					$sprite.advance();
				}
			}
		}
	};
	
	PainterFactory = {
		UP : 'UP',
		DOWN : 'DOWN',
		LEFT : 'LEFT',
		RIGHT : 'RIGHT',
		ATTACK : 'ATTACK',
		create : function( $status ) {
			switch ( $status ) {
			case this.UP:
				return new Painter( moveUp, activeUp );
				break;
			case this.DOWN:
				return new Painter( moveDown, activeDown );
				break;
			case this.LEFT:
				return new Painter( moveLeft, activeLeft );
				break;
			case this.RIGHT:
				return new Painter( moveRight, activeRight );
				break;
			case this.ATTACK:
				return new Painter( attack, activeAttack );
				break;
			}
		}
	};
	
	initialize = function() {
		var
		context = document.getElementById( 'canvas' ).getContext( '2d' ),
		keyInfos = {
			'38' : { painter : PainterFactory.create( PainterFactory.UP ), speedLeft : 0, speedTop : -1, status : 'MOVE' },
			'40' : { painter : PainterFactory.create( PainterFactory.DOWN ), speedLeft : 0, speedTop : 1, status : 'MOVE' },
			'37' : { painter : PainterFactory.create( PainterFactory.LEFT ), speedLeft : -1, speedTop : 0, status : 'MOVE' },
			'39' : { painter : PainterFactory.create( PainterFactory.RIGHT ), speedLeft : 1, speedTop : 0, status : 'MOVE' },
			'32' : { painter : PainterFactory.create( PainterFactory.ATTACK ), speedLeft : 0, speedTop : 0, status : 'ATTACK' }
		};
		
		document.addEventListener( 'keydown', function( $event ) {
			var	keyInfo, painter, p1 = sog.sprite.p1;
			
			if ( $event.keyCode in keyInfos ) {
				keyInfo = keyInfos[ $event.keyCode ];
				
				if ( p1.painter !== keyInfo.painter ) {
					p1.painter = keyInfo.painter;
				}
				if ( p1.actors.indexOf( Actors.next ) === -1 ) {
					p1.actors.push( Actors.next );
				}
				if ( p1.actors.indexOf( Actors.move ) === -1 ) {
					p1.actors.push( Actors.move );
				}
				
				sog.server.update( {
					speedLeft : keyInfo.speedLeft,
					speedTop : keyInfo.speedTop
				} );
			}
		}, false );
		
		document.addEventListener( 'keyup', function( $event ) {
			var i, k;
			
			for ( k in Actors ) {
				if ( ( i = sog.sprite.p1.actors.indexOf( Actors[ k ] ) ) > -1 ) {
					sog.sprite.p1.actors.splice( i, 1 );
				}
			}
		}, false );
		
		moveUp.src = 'img/toBack.png';
		moveDown.src = 'img/toStright.png';
		moveLeft.src = 'img/goLeft.png';
		moveRight.src = 'img/goRight.png';
		attack.src = 'img/Stright_Sprite.png';
		
		$util.syncOnLoad( [moveUp, moveDown, moveLeft, moveRight], function() {
			var server = new Server( { host : 'http://127.0.0.1', dataUrl : '/data', registerUrl : '/register' } );
			
			sog = new Game( { context : context, server : server, room : '', uid : '', sprite : new Sprite( PainterFactory.create( PainterFactory.DOWN ) ) } );
			
			document.removeEventListener( 'DOMContentLoaded', initialize, false );
			sog.start();
		} );
	};
	
	document.addEventListener( 'DOMContentLoaded', initialize, false );
})();
