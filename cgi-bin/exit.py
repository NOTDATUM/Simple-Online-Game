#!/usr/bin/python3

import json
from db import dbms

def process( request, response ):
	parameters = {}
	parameters[ 'roomNo' ] = request[ 'roomNo' ]
	parameters[ 'userId' ] = request[ 'userId' ]

	dbms.execute( dbms.DELETE_SOG, parameters )
	result = { 'code' : 0, 'message' : 'success' }

	response.write( json.dumps( result ) )
