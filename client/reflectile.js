const boardx = 160;
const boardy = 160;
const tilesize = 100;
const apiurl = "http://127.0.0.1:6677/api"
const minitilesize = 75;

var isDragging = false;


// Global variable that dictates what the next action is - 
// -1 - waiting for game to start
// 0 - waiting to pick a card from the hand
// 1 - waiting to pick a position or discard
// 2 - waiting to pick a color (conditional only on wildcard)
// 3 - waiting for other player to play their turn
// 4 - game end
var turn_state = -1;

var hand_state = [-1, -1, -1];

var board_state = -1;

var playerid = -1;
var gamename = "";
var playernamer = "";
var otherplayername = "";

function creategame() {
	$("#createjoin").hide();
	$("#namepanel").show();
	playerid = 1;
}
function joingame() {
	if ($("#joinidbox").val().length < 6) {
		$("#joinidbox").effect("shake");
		return;
	}
	$("#createjoin").hide();
	$("#namepanel").show();
	playerid = 2;
}



function joinWaitHandler() {
	$.ajax({
		'type': 'POST',
		'url': apiurl,
		'data': JSON.stringify({"command": "waitjoin", "gamename": gamename}),
		'dataType': "json",
		'success': function(resp) {
			if (resp["response"] == "wait") {
				setTimeout(joinWaitHandler, 1000);	
				return;
			}
			otherplayername = resp["otherplayername"].toUpperCase();
			$("#splash").animate({"top": -1000}, 500).promise().done(function() {
				$("#splash").hide();
			});
			gotoState0();
		}
	});
}


function entergame() {
	if($("#namebox").val().length == 0) {
		$("#namebox").effect("shake");
		return;
	}
	
	playername = $("#namebox").val();
	
	// We are ready to create or join a game	
	if (playerid == 1) {
		$.ajax({
			'type': 'POST',
			'url': apiurl,
			'data': JSON.stringify({"command": "create",
				"player_name": playername}),
			'dataType': "json",
			'success': function(resp) {
				if (resp["response"] != "created") {
					alert("Failed to create game");
					return;
				}
				$("#namepanel").hide();
				gamename = resp["gamename"];
				hand_state = resp["hand"];
				setCard(hand_state[0], 0);
				setCard(hand_state[1], 1);
				setCard(hand_state[2], 2);
				$("#waitingpanel").show();
				$("#gameidbox").html(gamename);
			
				setTimeout(joinWaitHandler, 1000);	
			}
		});
	} else {
		gamename = $("#joinidbox").val();
		$.ajax({
			'type': "POST",
			'url': apiurl, 
			'data': JSON.stringify({"command": "join", 
				"player_name": playername, 
				"gamename": gamename}),
			'dataType': "json", 
			'success': function(resp) {
				if (resp["response"] != "joined") {
					alert("Failed to join game, check Game ID");
					return;
				}
				$("#namepanel").hide();
				hand_state = resp["hand"];
				setCard(hand_state[0], 0);
				setCard(hand_state[1], 1);
				setCard(hand_state[2], 2);
				otherplayername = resp["otherplayername"];
				$("#splash").animate({"top": -1000}, 500).promise().done(function() {
					$("#splash").hide();
				});
				gotoState3();
			}
		});
	}
	
}



function cardIdToRule(card) {
	return ["RBW"[Math.floor(card / ruleset.length)], ruleset[card % ruleset.length]]
}

var picked_card_idx = -1;

function cardHandler(cardid) {
	// Clicking a card only makes sense if state is 0
	// If we allow repicking a card this could also be 1
	if (turn_state != 0 && turn_state != 1) return;
	picked_card_idx = cardid;

	// Highlight card
	$("#card0").removeClass("card-highlight");
	$("#card1").removeClass("card-highlight");
	$("#card2").removeClass("card-highlight");

	$("#card" + cardid).addClass("card-highlight");
	
	$("#discard-button").show();
	
	turn_state = 1;
}



// Function sets a specific card in hand panel at the specific position
// card is simply an index
function setCard(card, position) {
	[addcolor, rule] = cardIdToRule(card);

	$("#card" + position).empty();

	rule_rows = rule.split(" ");

	dst_block = $('<div>', {
		class: "ruleblock"
	});

	maxwidth=0
	maxheight=0

	for (y = 0; y < 2; y++) {
		for (x = 0; x < 3; x++) {
			rulecolor = rule_rows[y][x];
			if (rulecolor == "A") rulecolor = addcolor;
			if (rulecolor == "R" || rulecolor == "B" || rulecolor == "W") {
				minitile = $('<div>', {
					class: "mini-tile"
				});

				if (rule_rows[y][x] != "A") 
					minitile.addClass("mini-tile-dimmed");

				minitile.css('top', x * minitilesize);
				minitile.css('left', y * minitilesize);

				if (rulecolor == "R")
					minitile.addClass("mini-tile-red");
				else if (rulecolor == "B")
					minitile.addClass("mini-tile-blue");
				else 
					minitile.addClass("mini-tile-wildcard");

				dst_block.append(minitile);
				if (maxwidth < y) maxwidth = y;
				if (maxheight < x) maxheight= x;
			}
		}
	}

	rule_size_x = (maxwidth + 1) * minitilesize;
	rule_size_y = (maxheight + 1) * minitilesize;
	

	dst_block.css('top', 150 - rule_size_y / 2);
	dst_block.css('left', 100 - rule_size_x / 2);

	$("#card" + position).append(dst_block);

	if (position == 4) return;
	
	// Finally set the card in the hand (unless it is discard pile)
	hand_state[position] = card;

}

var highanimator = $("<div>");

function highlightLast() {

	if (lastmatchx == -1) return;

	const highduration = 3000;

	highanimator.stop(true, true);

	highanimator.css({"opacity": 1});

	highanimator.animate({"opacity": 0}, {
		duration: highduration, 
		step: function(lastmatchx, lastmatchy, lastmatch1x, lastmatch1y, lastmatch2x, lastmatch2y) {
			return function() {
				$("#tile-" + lastmatchx + "-" + lastmatchy).css({"border": "2px rgba(209, 241, 128, "+this.style.opacity+") solid"});	
				$("#tile-" + lastmatch1x + "-" + lastmatch1y).css({"border": "2px rgba(249, 220, 92, "+this.style.opacity+") solid"});
				$("#tile-" + lastmatch2x + "-" + lastmatch2y).css({"border": "2px rgba(249, 220, 92, "+this.style.opacity+") solid"});
			}
		} (lastmatchx, lastmatchy, lastmatch1x, lastmatch1y, lastmatch2x, lastmatch2y), 
		complete: function(lastmatchx, lastmatchy, lastmatch1x, lastmatch1y, lastmatch2x, lastmatch2y) {
			return function() {
				$("#tile-" + lastmatchx + "-" + lastmatchy).css({"border": ""});	
				$("#tile-" + lastmatch1x + "-" + lastmatch1y).css({"border": ""});
				$("#tile-" + lastmatch2x + "-" + lastmatch2y).css({"border": ""});
			}
		} (lastmatchx, lastmatchy, lastmatch1x, lastmatch1y, lastmatch2x, lastmatch2y), 
	});
	
}

function playCardAt(card, addcolor, posx, posy) {
	if (addcolor != "D") {
		setTileColor(posx, posy, addcolor);
		highlightLast();
	}
	setCard(card, 4);
}


function gotoState0() {
	$("#comm-banner").html("Your Turn");
	turn_state = 0;
}


function state3Handler() {
	$.ajax({
		'type': 'POST',
		'url': apiurl,
		'data': JSON.stringify({"command": "waitturn", "gamename": gamename, "playerid": playerid}),
		'dataType': "json",
		'success': function(resp) {
			if (resp["response"] == "wait") {
				setTimeout(state3Handler, 1000);	
				return;
			}
			color = resp["color"];
			card = resp["card"];
			if (color == "D") {
				lastmatchx = -1
				lastmatchy = -1
				lastmatch1x = -1
				lastmatch1y = -1
				lastmatch2x = -1
				lastmatch2y = -1
				setCard(card, 4);
				gotoState0();
			} else {
				x = resp["matchx"];
				y = resp["matchy"];
				lastmatchx = x;
				lastmatchy = y;
				lastmatch1x = resp["match1x"];
				lastmatch1y = resp["match1y"];
				lastmatch2x = resp["match2x"];
				lastmatch2y = resp["match2y"];
				playCardAt(card, color, x, y);
				gotoState0();
			}
		}
	});
}

function gotoState3() {
	$("#comm-banner").html("Waiting for " + otherplayername + " to play");
	turn_state = 3;
	setTimeout(state3Handler, 1000);
}

var picked_x = -1;
var picked_y = -1;

function gotoState2() {
	$("#color-picker-panel").show();	
	
	$("#tile-" + picked_x + "-" + picked_y).addClass("tile-highlight");	

	turn_state = 2;
	return;
}


function rotateRulet(rulet) {
	[tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char] = rulet;
	rulet = [tpos1y, -tpos1x, tpos1char, tpos2y, -tpos2x, tpos2char];
	return rulet;
}
function mirrorRulet(rulet) {
	[tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char] = rulet;
	rulet = [-tpos1x, tpos1y, tpos1char, -tpos2x, tpos2y, tpos2char];
	return rulet;
	
}

var lastmatch1x = -1, lastmatch1y = -1, lastmatch2x = -1, lastmatch2y = -1;
var lastmatchx = -1, lastmatchy = -1;
function checkMatch(x, y, rulet) {
	[tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char] = rulet;

	if (board_state[x + tpos1x][y + tpos1y] == tpos1char) {
		if (board_state[x + tpos2x][y + tpos2y] == tpos2char) {
			lastmatch1x = x + tpos1x;
			lastmatch1y = y + tpos1y;
			lastmatch2x = x + tpos2x;
			lastmatch2y = y + tpos2y;
			lastmatchx = x;
			lastmatchy = y;	
			return true;
		}
	}	
	return false;
}

function checkValidPick(x, y) {
	// get rule details		
	[addcolor, rule] = cardIdToRule(hand_state[picked_card_idx]);
	
	// If there is already a tile in place and the new color is not wildcard return false
	if (board_state[x][y] != ' ' && addcolor != 'W') return false;

	// Create rule info - relative position of the two tiles relative to the add
	// find add position

	rulestr = rule.replace(" ", "")

	addpos = rulestr.search("A")			
	addx = addpos % 3;
	addy = Math.floor(addpos / 3);

	tpos1 = rulestr.search("R|B")
	tpos1x = tpos1 % 3;
	tpos1y = Math.floor(tpos1 / 3);
	tpos1char = rulestr[tpos1];
	
	// Erase the character from the string
	rulestr = rulestr.split('');
	rulestr[tpos1] = 'X';
	rulestr = rulestr.join('');

	tpos2 = rulestr.search("R|B")
	tpos2x = tpos2 % 3;
	tpos2y = Math.floor(tpos2 / 3);
	tpos2char = rulestr[tpos2];
	
	// Make the positions relative
	tpos1x -= addx;
	tpos2x -= addx;
	tpos1y -= addy;
	tpos2y -= addy;

	rulet = [tpos1x, tpos1y, tpos1char, tpos2x, tpos2y, tpos2char];
	originalrulet = rulet;	


	if (checkMatch(x, y, rulet)) return true;
	// 90 rotate
	rulet = rotateRulet(rulet);
	if (checkMatch(x, y, rulet)) return true;

	// 180 rotate
	rulet = rotateRulet(rulet);
	if (checkMatch(x, y, rulet)) return true;

	// 270 rotate
	rulet = rotateRulet(rulet);
	if (checkMatch(x, y, rulet)) return true;

	// Mirror
	rulet = mirrorRulet(originalrulet);
	if (checkMatch(x, y, rulet)) return true;
	// 90 rotate
	rulet = rotateRulet(rulet);
	if (checkMatch(x, y, rulet)) return true;

	// 180 rotate
	rulet = rotateRulet(rulet);
	if (checkMatch(x, y, rulet)) return true;

	// 270 rotate
	rulet = rotateRulet(rulet);
	if (checkMatch(x, y, rulet)) return true;
	

	return false;
}


function playTurn(card, color, x, y) {
	playCardAt(card, color, x, y);
	$("#card" + picked_card_idx).empty();
	$.ajax({
		'type': 'POST',
		'url': apiurl,
		'data': JSON.stringify({"command": "playturn", "gamename": gamename, "playerid": playerid, 
			"card": card, 
			"color": color, 
			"posx": x,
			"posy": y, 
			}),
		'dataType': "json",
		'success': function(resp) {
			if (resp["response"] != "continue") {
				alert("Failed to play turn, this could be a server error");
				return;
			}	
			setCard(resp["newcard"], picked_card_idx);
			picked_card_idx = -1;
			gotoState3();
		}
	});

}


function discardHandler() {
	if (turn_state != 1) return;
	color = "D";
	card = hand_state[picked_card_idx];

	$("#card0").removeClass("card-highlight");
	$("#card1").removeClass("card-highlight");
	$("#card2").removeClass("card-highlight");
	
	$("#discard-button").hide();	
	lastmatchx = -1;
	lastmatchy = -1;
	lastmatchx1 = -1;
	lastmatchy1 = -1;
	lastmatchx2 = -1;
	lastmatchy2= -1;
	
	playTurn(card, color, -1, -1);
}

function pickColor(color) {
	if (turn_state != 2) return;
	
	x = picked_x;
	y = picked_y;	
	$("#color-picker-panel").hide();	
	$("#tile-" + picked_x + "-" + picked_y).removeClass("tile-highlight");	
	picked_x = -1;
	picked_y = -1;

	$("#card0").removeClass("card-highlight");
	$("#card1").removeClass("card-highlight");
	$("#card2").removeClass("card-highlight");

	playTurn(hand_state[picked_card_idx], color, x, y);
}
function tileHandler(x, y) {
	// If we are in the middle of a drag, just ignore the action
	if (isDragging) {isDragging = false; return;}

	// Cards can be selected only when in state 1
	if (turn_state != 1) return;

	
	// Check if this is a valid target for the picked card	
	if (!checkValidPick(x, y)) {
		var tilename = "#tile-" + x + "-" + y;
		$(tilename).effect("shake", {distance: "5", times: 3});
		return;
	}

	// Everything is good, place the tile
	$("#discard-button").hide();

	[addcolor, rule] = cardIdToRule(hand_state[picked_card_idx]);

	if (addcolor == "W") {
		picked_x = x;
		picked_y = y;
		gotoState2();
		return;
	}

	$("#card0").removeClass("card-highlight");
	$("#card1").removeClass("card-highlight");
	$("#card2").removeClass("card-highlight");

	playTurn(hand_state[picked_card_idx], addcolor, x, y);
}

function createTile(x, y) {
	if (x < 0 || x >= boardx || y < 0 || y >= boardy) return;
	var tilename = "#tile-" + x + "-" + y;
	if ($(tilename).length > 0) return;
	var t = y * tilesize - (tilesize * boardy/2);
	var l = x * tilesize - (tilesize * boardx/2);
	tile = $("<div>", {
		id: 'tile-' + x + '-' + y,
		class: 'tile',
		style:	'top: ' + t + '; left : ' + l + ';',
	});
	tile.on('click', function(x, y) { return function() {tileHandler(x, y);}} (x, y));
	$('#tilecontainer').append(tile);	
}

function setTileColor(x, y, color) {
	if (x < 0 || x >= boardx || y < 0 || y >= boardy) return;
	// This tile must already exist, if not create
	var tilename = "#tile-" + x + "-" + y;

	if ($(tilename).length == 0) 
		createTile(x, y);

	$(tilename).removeClass("red-tile");
	$(tilename).removeClass("blue-tile");
	if (color == "R")
		$(tilename).addClass("red-tile");
	else
		$(tilename).addClass("blue-tile");

	createTile(x, y - 1);
	createTile(x - 1, y);
	createTile(x + 1, y);	
	createTile(x, y + 1);

	// Update board state
	board_state[x][y] = color;
}



$(function() {

	// Initialize board state 
	
	board_state = new Array(boardx);
	for (i = 0; i < boardx; i++) {
		board_state[i] = new Array(boardy);
		for (j = 0; j < boardy; j++) {
			board_state[i][j] = ' ';
		}
	}
	
	// Setup initial tiles
	midx=boardx/2 - 1;
	midy=boardy/2 - 1;

	setTileColor(midx, midy, "R");	
	setTileColor(midx + 1, midy + 1, "R");	
	setTileColor(midx + 1, midy, "B");	
	setTileColor(midx, midy + 1, "B");	

	$("#tilepadding").draggable({start: function() {
		isDragging = true;
	}});
	$("#tilepadding").on('mousedown', function() {
		isDragging = false;
	});

});
