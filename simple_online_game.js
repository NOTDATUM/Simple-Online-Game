(function() {
	'use strict';
	
	var
	CHARACTER_SIZE = 96,
	initialize, painters, sog, Game, Server, Sprite, Painter, Actors, PainterFactory,
	
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
	
	function createPlayerPainters() {
		var painters = {};
		
		for ( var p in sog.sprite ) {
			painters[ p ] = {
				UP : {
					STAY : PainterFactory.create( PainterFactory.UP ),
					MOVE : PainterFactory.create( PainterFactory.UP ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK )
				},
				DOWN : {
					STAY : PainterFactory.create( PainterFactory.DOWN ),
					MOVE : PainterFactory.create( PainterFactory.DOWN ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK )
				},
				LEFT : {
					STAY : PainterFactory.create( PainterFactory.LEFT ),
					MOVE : PainterFactory.create( PainterFactory.LEFT ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK )
				},
				RIGHT : {
					STAY : PainterFactory.create( PainterFactory.RIGHT ),
					MOVE : PainterFactory.create( PainterFactory.RIGHT ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK )
				}
			};
		}
		
		return painters;
	}
	
	function setSpriteData( $sprite, $data ) {
		var painter = painters[ $sprite === sog.sprite.p1 ? 'p1' : 'p2' ][ $data.direction ][ $data.status ];
		
		if ( $sprite.painter !== painter ) {
			$sprite.painter = painter;
		}
		if ( $data.status === 'MOVE' || $data.status === 'ATTACK' ) {
			setAllActors( $sprite );
		} else {
			clearAllActors( $sprite );
		}
		if ( $sprite === sog.sprite.p1 ) {
			sog.server.update( { speedV : $data.speedV, speedH : $data.speedH } );
		}
	}
	
	function setAllActors( $sprite ) {
		for ( var name in Actors ) {
			if ( !( name in $sprite.actors ) ) {
				$sprite.actors[ name ] = new Actors[ name ];
			}
		}
	}
	
	function clearAllActors( $sprite ) {
		for ( var name in Actors ) {
			delete $sprite.actors[ name ];
		}
	}
	
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
		painters = createPlayerPainters();
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
				this.sprite.p2 = new Sprite;
			}
			
			setSpriteData( this.sprite.p2, data.p2 );
			this.sprite.p2.update( data.p2, $time );
			this.sprite.p2.paint( this.context );
		}
		
		requestAnimationFrame( $util.fn( this.progress, this ) );
	};
	
	Server = function( $params ) {
		this.host = $params.host;
		this.dataUrl = $params.dataUrl;
		this.registerUrl = $params.registerUrl;
		this.characterData = {};
	};
	
	Server.prototype.data = function() {
		if ( !sog.sprite.p2 ) {
			this.characterData.p2 = { speedV : 1, speedH : 0, direction : 'RIGHT', status : 'MOVE' };
		}
		if ( sog.sprite.p2 && sog.sprite.p2.left > sog.context.canvas.width - 120 ) {
			this.characterData.p2 = { speedV : -1, speedH : 0, direction : 'LEFT', status : 'MOVE' };
		}
		if ( sog.sprite.p2 && sog.sprite.p2.left < 20 ) {
			this.characterData.p2 = { speedV : 1, speedH : 0, direction : 'RIGHT', status : 'MOVE' };
		}
		
		return this.characterData;
	};
	
	Server.prototype.register = function( $room, $uid ) {
		
	};
	
	Server.prototype.update = function( $data ) {
		this.characterData.p1 = $data;
	};
	
	Sprite = function( $painter, $actors ) {
		this.painter = $painter;
		this.actors = $actors || {};
		this.left = 0;
		this.top = 0;
	};
	
	Sprite.prototype.paint = function( $context ) {
		this.painter.paint( this, $context );
	};
	
	Sprite.prototype.update = function( $data, $time ) {
		for ( var name in this.actors ) {
			this.actors[ name ].execute( this, $data, $time );
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
	
	Actors = (function() {
		var move, next;
		
		move = function() {};
		move.prototype.execute = function( $sprite, $data, $time ) {
			$sprite.left += $data.speedV;
			$sprite.top += $data.speedH;
		};
		
		next = function() {
			this.interval = 20;
			this.lastTime = 0;
		};
		next.prototype.execute = function( $sprite, $data, $time ) {
			if ( $time - this.lastTime > this.interval ) {
				this.lastTime = $time;
				$sprite.advance();
			}
		};
		
		return {
			move : move,
			next : next
		};
	})();
	
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
		keyInfo = {
			'38' : { speedV : 0, speedH : -1, direction : 'UP', status : 'MOVE' },
			'40' : { speedV : 0, speedH : 1, direction : 'DOWN', status : 'MOVE' },
			'37' : { speedV : -1, speedH : 0, direction : 'LEFT', status : 'MOVE' },
			'39' : { speedV : 1, speedH : 0, direction : 'RIGHT', status : 'MOVE' },
			'32' : { speedV : 0, speedH : 0, direction : 'DOWN', status : 'ATTACK' }
		};
		
		document.addEventListener( 'keydown', function( $event ) {
			if ( $event.keyCode in keyInfo ) {
				setSpriteData( sog.sprite.p1, keyInfo[ $event.keyCode ] );
			}
		}, false );
		
		document.addEventListener( 'keyup', function( $event ) {
			clearAllActors( sog.sprite.p1 );
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
