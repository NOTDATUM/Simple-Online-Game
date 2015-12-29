#!/usr/bin/python3

import sqlite3, sys

def dict_factory( cursor, row ):
	result = {}
	
	for index, column in enumerate( cursor.description ):
		result[ column[ 0 ] ] = row[ index ]
	
	return result

def execute( query, parameters = None ):
	connection = sqlite3.connect( 'db/simpledb.sqlite' )
	connection.row_factory = dict_factory
	cursor = connection.cursor()

	if parameters is not None:
		for key in parameters.keys():
			value = parameters[ key ]

			if type( value ) == str:
				value = "'" + value + "'"

			query = query.replace( '${' + str( key ) + '}', str( value ) )

	cursor.execute( query )	
	result = cursor.fetchall()
	
	connection.commit()
	connection.close()

	return result

CREATE_TABLE_SOG = """
	CREATE TABLE sog (
		userId TEXT NOT NULL,
		roomNo TEXT NOT NULL,
		left INTEGER NOT NULL,
		top INTEGER NOT NULL,
		speedV INTEGER NOT NULL,
		speedH INTEGER NOT NULL,
		direction TEXT NOT NULL,
		status TEXT NOT NULL,
		PRIMARY KEY( userId, roomNo )
	)
"""

SELECT_SOG = """
		  SELECT * FROM sog WHERE roomNo = ${roomNo}
"""

INSERT_SOG = """
		  INSERT INTO sog (
			userId,
			roomNo,
			left,
			top,
			speedV,
			speedH,
			direction,
			status
		  ) VALUES (
			${userId},
			${roomNo},
			0,
			0,
			${speedV},
			${speedH},
			${direction},
			${status}
	)
"""

UPDATE_SOG = """
	UPDATE
		sog
	SET
		left = ${left},
		top = ${top},
		speedV = ${speedV},
		speedH = ${speedH},
		direction = ${direction},
		status = ${status}
	WHERE 1 = 1
		AND userId = ${userId}
		AND roomNo = ${roomNo}
"""

DELETE_SOG = """
		DELETE FROM
			sog
		WHERE 1 = 1
			AND userId = ${userId}
			AND roomNo = ${roomNo}
"""
