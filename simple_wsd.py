# Author: Johan Hanssen Seferidis
# License: MIT
 
import re, sys
import struct
import json
from base64 import b64encode
from hashlib import sha1
 
if sys.version_info[0] < 3 :
	from SocketServer import ThreadingMixIn, TCPServer, StreamRequestHandler
else:
	from socketserver import ThreadingMixIn, TCPServer, StreamRequestHandler
 
 
 
 
'''
+-+-+-+-+-------+-+-------------+-------------------------------+
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
'''
 
FIN    = 0x80
OPCODE = 0x0f
MASKED = 0x80
PAYLOAD_LEN = 0x7f
PAYLOAD_LEN_EXT16 = 0x7e
PAYLOAD_LEN_EXT64 = 0x7f
 
OPCODE_TEXT = 0x01
CLOSE_CONN  = 0x8
 
 
 
# -------------------------------- API ---------------------------------
 
class API():
	def run_forever(self):
		try:
			print("Listening on port %d for clients.." % self.port)
			self.serve_forever()
		except KeyboardInterrupt:
			self.server_close()
			print("Server terminated.")
		except Exception as e:
			print("ERROR: WebSocketsServer: "+str(e))
			exit(1)
	def new_client(self, client, server):
		pass
	def client_left(self, client, server):
		pass
	def message_received(self, client, server, message):
		pass
	def set_fn_new_client(self, fn):
		self.new_client=fn
	def set_fn_client_left(self, fn):
		self.client_left=fn
	def set_fn_message_received(self, fn):
		self.message_received=fn
	def send_message(self, client, msg):
		self._unicast_(client, msg)
	def send_message_to_all(self, msg):
		self._multicast_(msg)
 
 
 
# ------------------------- Implementation -----------------------------
 
class WebsocketServer(ThreadingMixIn, TCPServer, API):
 
	allow_reuse_address = True # 클라가 붙었을 때 서버 종료하고 재시작하면 다시 붙으면 이미 사용중 오류남, 소켓은 대기로 살아있기 떄문.. 이걸 True 해주면 다시 사용 인정되서 오류 안남
	daemon_threads = True # comment to keep threads alive until finished, 메인 프로세스 종료되고 나서도 데몬 쓰레드를 백그라운드에서 돌게함(예, 가비지 컬렉션)
 
	'''
	clients is a list of dict:
	    {
	     'id'      : id,
	     'handler' : handler,
	     'address' : (addr, port)
	    }
	'''
	clients=[]
	id_counter=0
 
	def __init__(self, port, host='0.0.0.0'):
		self.port=port
		TCPServer.__init__(self, (host, port), WebSocketHandler)
 
	def _message_received_(self, handler, msg):
		self.message_received(self.handler_to_client(handler), self, msg)
 
	def _new_client_(self, handler):
		self.id_counter += 1
		client={
			'id'      : self.id_counter,
			'handler' : handler,
			'address' : handler.client_address
		}
		self.clients.append(client)
		self.new_client(client, self)
 
	def _client_left_(self, handler):
		client=self.handler_to_client(handler)
		self.client_left(client, self)
		if client in self.clients:
			self.clients.remove(client)
	
	def _unicast_(self, to_client, msg):
		to_client['handler'].send_message(msg)
 
	def _multicast_(self, msg):
		for client in self.clients:
			self._unicast_(client, msg)
		
	def handler_to_client(self, handler):
		for client in self.clients:
			if client['handler'] == handler:
				return client
 
 
 
class WebSocketHandler(StreamRequestHandler): # rfile을 쓰기 위함인 듯, 스트림 형태의 리퀘스트 읽어 들여 처리하기 위함, rfile은 소켓.makefile
	# 여기 나오는 request = socket
	def __init__(self, socket, addr, server):
		self.server=server
		StreamRequestHandler.__init__(self, socket, addr, server)
 
	def setup(self):
		StreamRequestHandler.setup(self) # 여기서 rfile, wfile 이 셋팅 됨
		self.keep_alive = True
		self.handshake_done = False
		self.valid_client = False
 
	def handle(self):
		while self.keep_alive:
			if not self.handshake_done:
				self.handshake()
			elif self.valid_client:
				self.read_next_message()
 
	def read_bytes(self, num):
		# python3 gives ordinal of byte directly
		bytes = self.rfile.read(num)
		if sys.version_info[0] < 3:
			return map(ord, bytes)
		else:
			return bytes
 
	def read_next_message(self):
 
		b1, b2 = self.read_bytes(2)
 
 		# 웹 소켓 프레임 헤더의 각 값을 구하기 위해 알맞은 값을 & 연산 한다.
 		# http://alnova2.tistory.com/915 참조
		fin    = b1 & FIN
		opcode = b1 & OPCODE
		masked = b2 & MASKED
		payload_length = b2 & PAYLOAD_LEN
 
		if not b1: # 헤더가 0이면 클라이언트가 닫은거인가봄
			print("Client closed connection.")
			self.keep_alive = 0
			return
		if opcode == CLOSE_CONN: # opcode가 8 이면 클라이언트가 연결끊기를 요청함, opcode 뜻은 위 블로그 참조
			print("Client asked to close connection.")
			self.keep_alive = 0
			return
		if not masked: # masked 는 필수 1 인듯, 마스킹을 하는 이유는 cache-poisoning attack(캐쉬를 바꿔 공격자 도메인으로 넘어가게 하는방법(가짜 네이버 등))을 방지하기 위함이다. 그래서 필수로 일부로 했나
			print("Client must always be masked.")
			self.keep_alive = 0
			return
 
 		# unpack(format, byte array), >는 big endian(빅은 12가 1100, 리틀은 12가 0011)
		if payload_length == 126:
			payload_length = struct.unpack(">H", self.rfile.read(2))[0] # 126일 때 추가로 2바이트에 길이가 있음, H는 integer 2byte
		elif payload_length == 127:
			payload_length = struct.unpack(">Q", self.rfile.read(8))[0] # 127일 때 추가로 8바이트에 길이가 있음, Q는 integer 8byte
 
		masks = self.read_bytes(4) # MSK는 마스킹 필드로 1로 세팅되어 있으면 Payload 데이터에 마스크로 4바이트가 설정된다
		decoded = ""
		for char in self.read_bytes(payload_length):
			char ^= masks[len(decoded) % 4] # ^는 XOR 연산(하나만 참일 때 참, a xor b = c -> b xor c = a 따라서 b(mask)는 암호화 키 역할, char(c)는 암호문, 결과 a는 평문), masks[0,1,2,3,0,1,2,3..], char와 mask를 xor연산했을 때 원값이 나오나 봄
			decoded += chr(char) # 아스키 -> 한글 안되남? UTF8해야 하는거 아닌지.. 서버 클라리언트 전송의 기본은 UTF8
		self.server._message_received_(self, decoded)
 
	def send_message(self, message):
		self.send_text(message)
 
	def send_text(self, message):
		'''
		NOTES
		Fragmented(=continuation) messages are not being used since their usage
		is needed in very limited cases - when we don't know the payload length.
		'''
	
		# Validate message
		if isinstance(message, bytes):
			message = try_decode_UTF8(message) # this is slower but assures we have UTF-8
			if not message:
				print("Can\'t send message, message is not valid UTF-8")
				return False
		elif isinstance(message, str) or isinstance(message, unicode): # 나는 스트링 가정하고 하면 될듯
			pass
		else:
			print('Can\'t send message, message has to be a string or bytes. Given type is %s' % type(message))
			return False
 
		header  = bytearray()
		payload = encode_to_UTF8(message)
		payload_length = len(payload)
 
		# Normal payload
		if payload_length <= 125:
			header.append(FIN | OPCODE_TEXT) # OPCODE_TEXT = 1 은 UTF8의 Text라는 의미 => 1 0 0 0 0 0 0 1
			header.append(payload_length)
 
		# Extended payload
		elif payload_length >= 126 and payload_length <= 65535: # pow(2, 16) = 65535, 2byte
			header.append(FIN | OPCODE_TEXT)
			header.append(PAYLOAD_LEN_EXT16) # 126, 서버에서 클라이언트로 전송하는 경우에는 mask는 무조건 0임
			header.extend(struct.pack(">H", payload_length)) # integer -> 2진수, 2바이트로 채워야 하기 때문에 append(128)이 아닌 pack을 씀
 
		# Huge extended payload
		elif payload_length < 18446744073709551616: # pow(2, 64), 8byte
			header.append(FIN | OPCODE_TEXT)
			header.append(PAYLOAD_LEN_EXT64) # 127
			header.extend(struct.pack(">Q", payload_length))
			
		else:
			raise Exception("Message is too big. Consider breaking it into chunks.")
			return
 
		self.request.send(header + payload) # byte array 합치기
 
	def handshake(self):
		message = self.request.recv(1024).decode().strip() # recv는 수신대기, decode 기본이 utf8, strip은 공백 제거
		upgrade = re.search('\nupgrade[\s]*:[\s]*websocket', message.lower()) # string의 전체에 대해서 pattern이 존재하는지 검사하여 MatchObject 인스턴스를 반환
		if not upgrade:
			self.keep_alive = False
			return
		key = re.search('\n[sS]ec-[wW]eb[sS]ocket-[kK]ey[\s]*:[\s]*(.*)\r\n', message)
		if key:
			key = key.group(1) # sec-websocket-key의 값이 나옴 : 입력받은 인덱스에 해당하는 매칭된 문자열 결과의 부분 집합을 반환합니다. 인덱스가 '0'이거나 입력되지 않은 경우 전체 매칭 문자열을 반환합니다.
		else:
			print("Client tried to connect but was missing a key")
			self.keep_alive = False
			return
		response = self.make_handshake_response(key)
		self.handshake_done = self.request.send(response.encode()) # 뭘 주는지 나중에 잘 보자
		self.valid_client = True
		self.server._new_client_(self)
	
	# http://ohgyun.com/436 참조	
	def make_handshake_response(self, key):
		return \
		  'HTTP/1.1 101 Switching Protocols\r\n'\
		  'Upgrade: websocket\r\n'              \
		  'Connection: Upgrade\r\n'             \
		  'Sec-WebSocket-Accept: %s\r\n'        \
		  '\r\n' % self.calculate_response_key(key)
		
	def calculate_response_key(self, key):
		GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11' # 임의 값? 아님 고정값? - 고정값인듯 매직키 매직넘버 - 아무이유없고 그냥 잘 안쓰일꺼같아서 선택, 그냥 무작정 뜻을 부여한 걸 매직넘버라고 함
		hash = sha1(key.encode() + GUID.encode()) # sha1 객체가 나옴, sha1는 해싱 알고리즘, 해시함수란 어떤 값을 넣으면 일정 글자수로 고정되어 나오고 들어가는 값이 다르면 다른 해쉬값이 나오고 역은 성립안됨, 해시함수에 의해 얻어지는 값이 해시값
		response_key = b64encode(hash.digest()).strip() # digest 요약값?, sha1 객체를 실값(이진데이터)으로 변경, base64는 이진데이터를 ascii 문자열로 바꾸는 것, http://arabiannight.tistory.com/entry/IT%EC%9A%A9%EC%96%B4-Base64-%EB%9E%80 참조
		return response_key.decode('ASCII') # 여기만 아스키? base64.. 그래서 아스키? 그런듯
 
	def finish(self):
		self.server._client_left_(self)
 
 
 
def encode_to_UTF8(data):
	try:
		return data.encode('UTF-8')
	except UnicodeEncodeError as e:
		print("Could not encode data to UTF-8 -- %s" % e)
		return False
	except Exception as e:
		raise(e)
		return False
 
 
 
def try_decode_UTF8(data):
	try:
		return data.decode('utf-8')
	except UnicodeDecodeError:
		return False
	except Exception as e:
		raise(e)
		
 
 
# This is only for testing purposes
class DummyWebsocketHandler(WebSocketHandler):
    def __init__(self, *_):
        pass
 
 
# Operation Structs
# 	base => operation::data
# 		operation => register, data, update, exit
# 		data => '{"speedV":1,"speedH":0,"left":10,"top":20,"direction":"RIGHT","status":"MOVE"}'
g_data = {}
 
# Called for every client connecting (after handshake)
def new_client(client, server):
	print("In client : " + str( client['id'] ) )
 
 
# Called for every client disconnecting
def client_left(client, server):
	print("Exit client : " + str( client['id'] ) )
	global g_data
	del g_data[ client['id'] ]
	server.send_message( client, json.dumps( { 'code' : 0, 'message' : 'success' } ) )
 
# Called when a client sends a message
def message_received(client, server, message):
	global g_data
	
	oper, data = message.split( '::' )
	data = json.loads( data )
 
	if oper == 'register':
		if len( g_data ) == 2:
			server.send_message( client, json.dumps( { 'code' : -1, 'message' : 'Many peoples' } ) )
			return
		print("Register client : " + str( client['id'] ) )
		g_data[ client['id'] ] = { 'speedV' : 0, 'speedH' : 0, 'left' : 0, 'top' : 0, 'direction' : 'DOWN', 'status' : 'STAY', 'attackStatus' : 'none', 'energy' : 30 }
		server.send_message( client, json.dumps( { 'code' : 0, 'message' : 'success', 'data' : { 'userId' : client['id'] }, 'status' : 'register' } ) )
	elif oper == 'data':
		server.send_message( client, json.dumps( { 'code' : 0, 'message' : 'success', 'data' : g_data, 'time' : data[ 'time' ], 'status' : 'data' } ) )
	elif oper == 'update':
		g_data[ client['id'] ][ 'speedV' ] = data[ 'speedV' ]
		g_data[ client['id'] ][ 'speedH' ] = data[ 'speedH' ]
		g_data[ client['id'] ][ 'left' ] = data[ 'left' ]
		g_data[ client['id'] ][ 'top' ] = data[ 'top' ]
		g_data[ client['id'] ][ 'direction' ] = data[ 'direction' ]
		g_data[ client['id'] ][ 'status' ] = data[ 'status' ]
		g_data[ client['id'] ][ 'attackStatus' ] = data[ 'attackStatus' ]
 
		if data[ 'attackStatus' ] == 'success':
			for key in g_data.keys():
				if key != client[ 'id' ]:
					g_data[ key ][ 'energy' ] = g_data[ key ][ 'energy' ] - 1
 
		server.send_message( client, json.dumps( { 'code' : 0, 'message' : 'success', 'status' : 'update' } ) )
 
PORT=8080
server = WebsocketServer(PORT)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()

"""
WebsocketServer(ThreadingMixIn, TCPServer):
	# 클라이언트가 접속 중 일때 서버를 재시작하고 다시 접속하면 "이미 사용 중" 오류, 서버는 죽어어도 소켓은 대기로 살아있기 때문. 이 값을 True로 하면 유휴중인 소켓을 다시 사용하여 정상 작동함.
	allow_reuse_address = True

	# True 일 때, 메인 프로세스가 종료되어도 데몬 쓰레드는 백그라운드에서 계속 진행됨(예, 가비지 컬렉션), 따라서 서버가 중지되어도 실행 중인 처리는 마무리 됨.
	daemon_threads = True

	# clients 관리
	clients = []

	# TCPServer.__init__ 호출; 파라미터 host(0.0.0.0 전체허용), WebsocketRequestHandler
	def __init__
	
	def inClient
	def outClient
	def reciveMessage

# 스트림 형태의 request를 읽어 들여 처리하기 위함(즉, 그 결과물인 self.rfile을 쓰기 위함)
# rfile은 socket.makefile의 결과물
# self.request = socket
WebsocketRequestHandler(StreamRequestHandler)
	# StreamRequestHandler.__init__ 호출
	def __init__
	
	# override; StreamRequestHandler.setup 호출 및 초기값 셋팅
	def setup

	# override; 루프 메서드
	def handle

	# override
	def finish
	
	# Websocket 핵심 메서드 3개(Websocket 스펙 참조하여 개발)
	def sendMessage
	def receiveMessage
	def handshake
"""