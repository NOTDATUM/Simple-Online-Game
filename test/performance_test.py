#!/usr/bin/python3

import time, threading, urllib.request

def stress_test():
	for i in range( 1, 100 ):
		f = urllib.request.urlopen( 'http://192.168.123.109:8000/test' )
		print( f.readline() )
		f.close()

def main():
	for i in range( 1, 100 ):
		t = threading.Thread( target = stress_test )
		t.start()

if __name__ == '__main__':
	main()