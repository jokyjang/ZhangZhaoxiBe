#!/bin/sh

########
# This script simulates playing a Blinkayles game
########

do_post () {
    # This is a simple wrapper for the curl command
	echo ""
	echo "$1"
	curl "$1" -X POST
	echo ""
}

PORT="80"

PLAYER1="player1"
PLAYER2="player2"
PLAYER3="player3"

do_post "http://localhost:${PORT}/tournament?count=3"
do_post "http://localhost:${PORT}/tournament/start/game"
do_post "http://localhost:${PORT}/move/${PLAYER1}/1"
do_post "http://localhost:${PORT}/move/${PLAYER2}/5,6"
do_post "http://localhost:${PORT}/move/${PLAYER1}/7"
do_post "http://localhost:${PORT}/move/${PLAYER2}/3,4"
do_post "http://localhost:${PORT}/move/${PLAYER1}/0"
do_post "http://localhost:${PORT}/move/${PLAYER2}/2"
do_post "http://localhost:${PORT}/move/${PLAYER1}/8,9"
do_post "http://localhost:${PORT}/tournament/end/game"

do_post "http://localhost:${PORT}/tournament/start/game"
do_post "http://localhost:${PORT}/move/${PLAYER3}/1"
do_post "http://localhost:${PORT}/move/${PLAYER1}/5,6"
do_post "http://localhost:${PORT}/move/${PLAYER3}/7"
do_post "http://localhost:${PORT}/move/${PLAYER1}/3,4"
do_post "http://localhost:${PORT}/move/${PLAYER3}/0"
do_post "http://localhost:${PORT}/move/${PLAYER1}/2"
do_post "http://localhost:${PORT}/move/${PLAYER3}/8,9"
do_post "http://localhost:${PORT}/tournament/end/game"

