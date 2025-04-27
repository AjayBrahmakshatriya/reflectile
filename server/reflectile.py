import random
import string
import os
import json

running_games = {}
unique_names = []
GAMESIZE = 40
class Player:
	def __init__(self, color, hand):
		self.name = ""
		self.color = color
		
		self.hand = hand



ruleset = ["RRA ---", "RR- -A-", "BBA ---", "BB- -A-", "RBA ---", "RB- -A-", "BRA ---", "BR- -A-", "RA- -R-", 
		"R-- -RA", "BA- -B-", "B-- -BA", "BA- -R-", "B-- -RA", "R-- -BA"]



# Game State enums
GAME_CREATED=0
GAME_PLAYER1_READY=1
GAME_PLAYER2_READY=2
GAME_PLAYER1_TURN=3
GAME_PLAYER2_TURN=4
GAME_END=5


class GameState:
	def __init__(self, gamename, size):
		self.gamename = gamename
		self.size = size
		boardx = size * 4;
		boardy = size * 4;
		self.board_state = [[' ' for y in range(boardy)] for x in range(boardx)]

		## Initial board state
		midx = boardx//2 - 1	
		midy = boardy//2 - 1
		
		self.board_state[midx][midy] = "R"
		self.board_state[midx+1][midy+1] = "R"
		self.board_state[midx][midy+1] = "B"
		self.board_state[midx+1][midy] = "B"

		self.rcount = size - 2;
		self.bcount = size - 2;

		self.deck = list(range(0, 45)) * 4;	
		random.shuffle(self.deck)
	
		colors = ["R", "B"]	
		random.shuffle(colors)
		
		self.player1 = Player(colors[0], [self.deck.pop(), self.deck.pop(), self.deck.pop()])
		self.player2 = Player(colors[1], [self.deck.pop(), self.deck.pop(), self.deck.pop()])

		self.lastmatchx = -1
		self.lastmatchy = -1
		self.lastmatch1x = -1
		self.lastmatch2x = -1
		self.lastmatch1y = -1
		self.lastmatch2y = -1
		self.lastcardplayed = -1
		self.lastcoloradded = -1

		self.state = GAME_CREATED				


def sample_name():
	global running_games
	global unique_names

	char_set = string.ascii_uppercase + string.digits
		
	while True:
		new_name = ''.join(random.sample(char_set*6, 6))	
		if new_name not in unique_names:
			unique_names.append(new_name)
			running_games[new_name] = 0
			return new_name	


def do_init():
	global unique_names
	unique_names = os.listdir("scratch/")	

def dump_game(game):
	game_json = game.__dict__.copy()
	game_json["player1"] = game.player1.__dict__.copy()
	game_json["player2"] = game.player2.__dict__.copy()
	file = open("scratch/" + game.gamename, "w")
	file.write(json.dumps(game_json))
	file.close()

def do_create(body_json):
	global running_games
	# First sample a game name 	
	gamename = sample_name()
	# default size 40
	game = GameState(gamename, GAMESIZE)	
	running_games[gamename] = game
	
	player1_name = body_json["player_name"]	
	game.player1.name = player1_name
	game.state = GAME_PLAYER1_READY

	resp_json = {"response": "created", "gamename": gamename, "playercolor": game.player1.color, "hand": game.player1.hand}

	return resp_json


def do_join(body_json):
	global running_games	
	
	gamename = body_json["gamename"]
	if gamename not in running_games.keys():
		return {"response": "badgamename"}

	game = running_games[gamename]

	if game.state != GAME_PLAYER1_READY:
		return {"response": "badgamename"}	
	
	player2_name = body_json["player_name"]
	game.player2.name = player2_name
	game.state = GAME_PLAYER2_READY	

	# game immediately goes to turn1

	game.state = GAME_PLAYER1_TURN

	dump_game(game)

	resp_json = {"response": "joined", "playercolor": game.player2.color, "hand": game.player2.hand, "otherplayername": game.player1.name}

	return resp_json

def do_waitjoin(body_json):
	global running_games
	gamename = body_json["gamename"]
	if gamename not in running_games.keys():
		return {"response": "badgamename"}

	game = running_games[gamename]
	if game.state == GAME_PLAYER1_READY:
		return {"response": "wait"}

	otherplayername = game.player2.name

	return {"response": "ready", "otherplayername": otherplayername}


def do_waitturn(body_json):
	global running_games
	gamename = body_json["gamename"]
	if gamename not in running_games.keys():
		return {"response": "badgamename"}

	game = running_games[gamename]

	playerid = body_json["playerid"]
	if playerid == 1 and game.state == GAME_PLAYER2_TURN or playerid == 2 and game.state == GAME_PLAYER1_TURN:
		return {"response": "wait"}
	
	if game.state == GAME_END:
		resp_json = {"response": "gameend"}
	else:
		resp_json = {"response": "continue"}
	
	# Turn done, return last turn info to player	
	resp_json["card"] = game.lastcardplayed
	resp_json["color"] = game.lastcoloradded

	if game.lastcoloradded != "D":
		resp_json["matchx"] = game.lastmatchx
		resp_json["matchy"] = game.lastmatchy
		resp_json["match1x"] = game.lastmatch1x
		resp_json["match1y"] = game.lastmatch1y
		resp_json["match2x"] = game.lastmatch2x
		resp_json["match2y"] = game.lastmatch2y

	return resp_json
	
def do_gameend(game):
	game.state = GAME_END
	dump_game(game)
	return {"response": "gameend"}

def get_next_card(game):
	# If the deck is empty, shuffle the remaining cards and deal
	if len(game.deck) == 0:
		self.deck = list(range(0, 45)) * 4;	
		# Remove the cards currently in play
		# The card just played has been removed already
		for card in game.player1.hand:
			self.deck.remove(card)
		for card in game.player2.hand:
			self.deck.remove(card)
		random.shuffle(self.deck)
	return game.deck.pop()

def card_id_to_rule(card):
	global ruleset
	return ("RBW"[card // len(ruleset)], ruleset[card % len(ruleset)])

def rotate_rulet(rulet):
	(tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char) = rulet
	rulet = (tpos1y, -tpos1x, tpos1char, tpos2y, -tpos2x, tpos2char)
	return rulet
def mirror_rulet(rulet):
	(tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char) = rulet
	rulet = (-tpos1x, tpos1y, tpos1char, -tpos2x, tpos2y, tpos2char)
	return rulet

def check_match(game, x, y, rulet):
	(tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char) = rulet
	if game.board_state[x + tpos1x][y + tpos1y] == tpos1char:
		if game.board_state[x + tpos2x][y + tpos2y] == tpos2char:
			game.lastmatch1x = x + tpos1x;
			game.lastmatch1y = y + tpos1y;
			game.lastmatch2x = x + tpos2x;
			game.lastmatch2y = y + tpos2y;
			game.lastmatchx = x;
			game.lastmatchy = y;	
			return True
	return False
	
def check_valid_play(game, cardplayed, posx, posy, playcolor):
	game.lastmatchx = posx
	game.lastmatchy = posy
	# Dummy positions for now
	game.lastmatch1x = posx - 1
	game.lastmatch1y = posy - 1
	game.lastmatch2x = posx + 1
	game.lastmatch2y = posy + 1

	(addcolor, rule) = card_id_to_rule(cardplayed)
	
	if addcolor != playcolor and addcolor != 'W':
		return False
	
	if game.board_state[posx][posy] != ' ' and addcolor != 'W':
		return False

	rulestr = rule.replace(" ", "")

	addpos = rulestr.find("A")
	addx = addpos % 3
	addy = addpos // 3

	tpos1 = rulestr.find("R")
	if tpos1 == -1:
		tpos1 = rulestr.find("B")
	tpos1char = rulestr[tpos1]
	tpos1x = tpos1 % 3
	tpos1y = tpos1 // 3
	rulestr = rulestr[:tpos1] + 'X' + rulestr[tpos1+1:]

	tpos2 = rulestr.find("R")
	if tpos2 == -1:
		tpos2 = rulestr.find("B")
	tpos2char = rulestr[tpos2]
	tpos2x = tpos2 % 3
	tpos2y = tpos2 // 3
	rulestr = rulestr[:tpos2] + 'X' + rulestr[tpos2+2:]

	tpos1x -= addx
	tpos2x -= addx
	tpos1y -= addy
	tpos2y -= addy	

	rulet = (tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char)
	originalrulet = rulet

	if check_match(game, posx, posy, rulet):
		return True
	rulet = rotate_rulet(rulet)
	if check_match(game, posx, posy, rulet):
		return True
	rulet = rotate_rulet(rulet)
	if check_match(game, posx, posy, rulet):
		return True
	rulet = rotate_rulet(rulet)
	if check_match(game, posx, posy, rulet):
		return True

	rulet = mirror_rulet(originalrulet)	
	if check_match(game, posx, posy, rulet):
		return True
	rulet = rotate_rulet(rulet)
	if check_match(game, posx, posy, rulet):
		return True
	rulet = rotate_rulet(rulet)
	if check_match(game, posx, posy, rulet):
		return True
	rulet = rotate_rulet(rulet)
	if check_match(game, posx, posy, rulet):
		return True

	return False


def do_playturn(body_json):
	global running_games
	gamename = body_json["gamename"]
	if gamename not in running_games.keys():
		return {"response": "badgamename"}
	game = running_games[gamename]

	playerid = body_json["playerid"]

	if playerid == 1 and game.state == GAME_PLAYER2_TURN or playerid == 2 and game.state == GAME_PLAYER1_TURN:
		return {"response": "outofturn"}

	player = 0
	if playerid == 1:
		player = game.player1	
	else:
		player = game.player2

	cardplayed = body_json["card"]

	if cardplayed not in player.hand:
		return {"response": "badturn"}	
	
	playcolor = body_json["color"]
	
	if playcolor != "D":
		posx = body_json["posx"]
		posy = body_json["posy"]
	
		if check_valid_play(game, cardplayed, posx, posy, playcolor) == False:
			return {"response": "badturn"}

		# All good update game state
		if game.board_state[posx][posy] == "R":
			game.rcount+=1
		elif game.board_state[posx][posy] == "B":
			game.bcount+=1
			
		game.board_state[posx][posy] = playcolor

		if playcolor == "R":
			game.rcount-=1
		else:
			game.bcount-=1	

	else:
		game.lastmatchx = -1
		game.lastmatchy = -1
		game.lastmatch1x = -1
		game.lastmatch2x = -1
		game.lastmatch1y = -1
		game.lastmatch2y = -1


	game.lastcoloradded = playcolor
	game.lastcardplayed = cardplayed
	
	# remove the card from the players hand
	player.hand.remove(cardplayed)
	newcard = get_next_card(game)	
	player.hand += [newcard]

	if playerid == 1:
		game.state = GAME_PLAYER2_TURN
	else:
		game.state = GAME_PLAYER1_TURN

	if game.rcount == 0 or game.bcount == 0:
		return do_gameend(game)		
	
	return {"response": "continue", "newcard": newcard}
