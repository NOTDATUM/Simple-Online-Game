(function() {
	'use strict';
	
	var
	CHARACTER_SIZE = 96,
	initialize, painters, requestId, sog, Game, Server, Sprite, Painter, Actors, PainterFactory,
	
	moveUp = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	moveDown = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	moveLeft = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	moveRight = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	attackUp = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	attackDown = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	attackLeft = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	attackRight = new Image( CHARACTER_SIZE, CHARACTER_SIZE ),
	
	activeUp = [
		{left: 0, top: 0, width: 1024, height: 1024},
		{left: 1024, top: 0, width: 1024, height: 1024},
		{left: 2048, top: 0, width: 1024, height: 1024}
	],
	activeDown = [
		{left: 0, top: 0, width: 1024, height: 1024},
		{left: 1024, top: 0, width: 1024, height: 1024},
		{left: 2048, top: 0, width: 1024, height: 1024}
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
	activeAttackUp = [
		{left: 0, top: 0, width: 1024, height: 1024},
		{left: 1024, top: 0, width: 1024, height: 1024},
		{left: 2048, top: 0, width: 1024, height: 1024}
	],
	activeAttackDown = [
		{left: 0, top: 0, width: 1024, height: 1024},
		{left: 1024, top: 0, width: 1024, height: 1024},
		{left: 2048, top: 0, width: 1024, height: 1024}
	],
	activeAttackLeft = [
		{left: 0, top: 0, width: 512, height: 512},
		{left: 512, top: 0, width: 512, height: 512},
		{left: 1024, top: 0, width: 512, height: 512},
		{left: 1536, top: 0, width: 512, height: 512},
		{left: 2048, top: 0, width: 512, height: 512},
		{left: 2560, top: 0, width: 512, height: 512}
	],
	activeAttackRight = [
		{left: 0, top: 0, width: 512, height: 512},
		{left: 512, top: 0, width: 512, height: 512},
		{left: 1024, top: 0, width: 512, height: 512},
		{left: 1536, top: 0, width: 512, height: 512},
		{left: 2048, top: 0, width: 512, height: 512},
		{left: 2560, top: 0, width: 512, height: 512}
	]
	;
	
	function createPlayerPainters() {
		var painters = {};
		
		for ( var p in sog.sprite ) {
			painters[ p ] = {
				UP : {
					STAY : PainterFactory.create( PainterFactory.UP ),
					MOVE : PainterFactory.create( PainterFactory.UP ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK_UP )
				},
				DOWN : {
					STAY : PainterFactory.create( PainterFactory.DOWN ),
					MOVE : PainterFactory.create( PainterFactory.DOWN ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK_DOWN )
				},
				LEFT : {
					STAY : PainterFactory.create( PainterFactory.LEFT ),
					MOVE : PainterFactory.create( PainterFactory.LEFT ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK_LEFT )
				},
				RIGHT : {
					STAY : PainterFactory.create( PainterFactory.RIGHT ),
					MOVE : PainterFactory.create( PainterFactory.RIGHT ),
					ATTACK : PainterFactory.create( PainterFactory.ATTACK_RIGHT )
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
		this.sprite = {};
		this.sprite.p1 = $params.sprite;
		this.sprite.p2 = null;
	};
	
	Game.prototype.start = function() {
		painters = createPlayerPainters();
		this.server.connect( this.registerCB, this.dataCB );
	};
	
	Game.prototype.progress = function( $time ) {
		this.server.data( $time );
	};

	Game.prototype.registerCB = function( $data ) {
		this.server.userId = $data.userId;
		requestId = requestAnimationFrame( $util.fn( this.progress, this ) );
	};

	Game.prototype.dataCB = function( $data, $time ) {
		var p2, id;

		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		setSpriteData( this.sprite.p1, $data[ this.server.userId ] );
		this.sprite.p1.update( $data[ this.server.userId ], $time );
		this.sprite.p1.paint( this.context );

		for ( id in $data ) {
			if ( id != this.server.userId ) {
				p2 = id;
			}
		}

		if ( p2 ) {
			if ( !this.sprite.p2 ) {
				this.sprite.p2 = new Sprite;
				this.sprite.p2.left = $data[ p2 ].left;
				this.sprite.p2.top = $data[ p2 ].top;
			}

			setSpriteData( this.sprite.p2, $data[ p2 ] );
			this.sprite.p2.update( $data[ p2 ], $time );
			this.sprite.p2.paint( this.context );
		}
		
		requestId = requestAnimationFrame( $util.fn( this.progress, this ) );
	};

	Server = function( $params ) {
		this.userId = null;
		this.roomNo = $params.roomNo;
		this.socket = null;
		this.command = { REGISTER : 'register', UPDATE : 'update', DATA : 'data' };
	};

	Server.prototype.connect = function( $registerCB, $dataCB ) {
		var self = this;
		this.socket = new WebSocket('ws://' + ( window.location.hostname || 'localhost' ) + ':8080');
		this.socket.addEventListener( 'open', function() { self.register(); } );
		this.socket.addEventListener ( 'message', function( $event ) {
			var result = JSON.parse( $event.data ),
				data = result.data;

			if ( result.code === 0 ) {
				if ( result.status === self.command.REGISTER ) {
					$registerCB.apply( sog, [ data ] );
				} else if ( result.status === self.command.DATA ) {
					$dataCB.apply( sog, [ data, result.time ] );
				}
			} else {
				self.exit();
				alert( data.message );
			}
		} );
		this.socket.addEventListener( 'close' , function( $event ) {
			document.getElementById( 'exit' ).style.display = 'none';
			sog.context.clearRect( 0, 0, sog.context.canvas.width, sog.context.canvas.height );
		} );
	};
	
	Server.prototype.data = function( $time ) {
		this.socket.send( this.command.DATA + '::' + JSON.stringify( { roomNo : this.roomNo, time : $time } ) );
	};
	
	Server.prototype.register = function() {	
		this.socket.send( this.command.REGISTER + '::' + JSON.stringify( { roomNo : this.roomNo } ) );
	};

	Server.prototype.update = function( $data ) {
		this.socket.send( this.command.UPDATE + '::' + JSON.stringify( {
			roomNo : this.roomNo,
			userId : this.userId,
			speedV : $data.speedV,
			speedH : $data.speedH,
			left : sog.sprite.p1.left + $data.speedV,
			top : sog.sprite.p1.top + $data.speedH,
			direction : $data.direction,
			status : $data.status
		} ) );
	};
	
	Server.prototype.exit = function( $target ) {
		cancelAnimationFrame( requestId );
		requestId = null;
		this.socket.close();
	};
	
	Sprite = function( $painter, $actors ) {
		this.painter = $painter;
		this.actors = $actors || {};
		this.data = null;
		this.left = 0;
		this.top = 0;
	};
	
	Sprite.prototype.paint = function( $context ) {
		this.painter.paint( this, $context );
	};
	
	Sprite.prototype.update = function( $data, $time ) {
		this.data = $data;
		
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
		ATTACK_UP : 'ATTACK_UP',
		ATTACK_DOWN : 'ATTACK_DOWN',
		ATTACK_LEFT : 'ATTACK_LEFT',
		ATTACK_RIGHT : 'ATTACK_RIGHT',
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
			case this.ATTACK_UP:
				return new Painter( attackUp, activeAttackUp );
				break;
			case this.ATTACK_DOWN:
				return new Painter( attackDown, activeAttackDown );
				break;
			case this.ATTACK_LEFT:
				return new Painter( attackLeft, activeAttackLeft );
				break;
			case this.ATTACK_RIGHT:
				return new Painter( attackRight, activeAttackRight );
				break;
			}
		}
	};
	
	initialize = function() {
		var
		exit = document.getElementById( 'exit' ),
		context = document.getElementById( 'canvas' ).getContext( '2d' ),
		keyInfo = {
			'38' : { speedV : 0, speedH : -1, direction : 'UP', status : 'MOVE' },
			'40' : { speedV : 0, speedH : 1, direction : 'DOWN', status : 'MOVE' },
			'37' : { speedV : -1, speedH : 0, direction : 'LEFT', status : 'MOVE' },
			'39' : { speedV : 1, speedH : 0, direction : 'RIGHT', status : 'MOVE' },
			'32' : { speedV : 0, speedH : 0, direction : 'DOWN', status : 'ATTACK' }
		};
		
		exit.addEventListener( 'click', function( $event ) {
			sog.server.exit();
		} );
		
		document.addEventListener( 'keydown', function( $event ) {
			if ( $event.keyCode in keyInfo ) {
				var data = keyInfo[ $event.keyCode ];
				if ( data.status === 'ATTACK' ) {
					data.direction = sog.sprite.p1.data.direction;
				}
				sog.server.update( data );
			}
		}, false );
		
		document.addEventListener( 'keyup', function( $event ) {
			var sprite = sog.sprite.p1;
			sog.server.update( { speedV : 0, speedH : 0, direction : sprite.data.direction, status : 'STAY' } );
		}, false );
		
		moveUp.src = 'static/img/moveUp.png';
		moveDown.src = 'static/img/moveDown.png';
		moveLeft.src = 'static/img/moveLeft.png';
		moveRight.src = 'static/img/moveRight.png';
		attackUp.src = 'static/img/attackUp.png';
		attackDown.src = 'static/img/attackDown.png';
		attackLeft.src = 'static/img/attackLeft.png';
		attackRight.src = 'static/img/attackRight.png';
		
		$util.syncOnLoad( [ moveUp, moveDown, moveLeft, moveRight, attackUp, attackDown, attackLeft, attackRight ], function() {
			var server = new Server( { roomNo : 'ROOM1' } );
			sog = new Game( { context : context, server : server, sprite : new Sprite( PainterFactory.create( PainterFactory.DOWN ) ) } );
			
			document.removeEventListener( 'DOMContentLoaded', initialize, false );
			sog.start();
		} );
	};
	
	document.addEventListener( 'DOMContentLoaded', initialize, false );
})();
