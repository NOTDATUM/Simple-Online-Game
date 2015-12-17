#!/usr/bin/python3

import json, sys
from db import dbms

def process( request, response ):	
	parameters = { 'roomNo' : request[ 'roomNo' ] }
	result = dbms.execute( dbms.SELECT_SOG, parameters )
	response.write( json.dumps( result ) )
