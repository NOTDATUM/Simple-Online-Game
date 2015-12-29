#!/usr/bin/python3

import json
from db import dbms

def process( request, response ):
	parameters = {}
	parameters[ 'roomNo' ] = request[ 'roomNo' ]
	parameters[ 'userId' ] = request[ 'userId' ]
	parameters[ 'speedV' ] = request[ 'speedV' ]
	parameters[ 'speedH' ] = request[ 'speedH' ]
	parameters[ 'left' ] = request[ 'left' ]
	parameters[ 'top' ] = request[ 'top' ]
	parameters[ 'direction' ] = request[ 'direction' ]
	parameters[ 'status' ] = request[ 'status' ]

	dbms.execute( dbms.UPDATE_SOG, parameters )
	result = { 'code' : 0, 'message' : 'success' }

	response.write( json.dumps( result ) )
