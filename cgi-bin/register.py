#!/usr/bin/python3

import json
from db import dbms

def process( request, response ):
	parameters = {}
	parameters[ 'roomNo' ] = request[ 'roomNo' ]

	users = dbms.execute( dbms.SELECT_SOG, parameters ) or [{'userId' : None}]

	if len( users ) < 2:
		userId = users[ 0 ][ 'userId' ]

		parameters[ 'userId' ] = userId and ( userId == 'p1' and 'p2' or 'p1' ) or 'p1'
		parameters[ 'speedV' ] = 0
		parameters[ 'speedH' ] = 0
		parameters[ 'direction' ] = 'DOWN'
		parameters[ 'status' ] = 'STAY'

		dbms.execute( dbms.INSERT_SOG, parameters )
		result = { 'code' : 0, 'message' : 'success', 'data' : { 'userId' : parameters[ 'userId' ] } }
	else:
		result = { 'code' : -1, 'message' : 'Many peoples' }

	response.write( json.dumps( result ) )
