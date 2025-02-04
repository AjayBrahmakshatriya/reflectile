const boardx = 16;
const boardy = 16;
const tilesize = 100;

const minitilesize = 75;

var nextclass="R";
var nextnextclass="B";

var isDragging = false;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function cardIdToRule(card) {
	return ["RBW"[Math.floor(card / ruleset.length)], ruleset[card % ruleset.length]]
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
}


function tileHandler(x, y) {
	if (!isDragging) {
		setTileColor(x, y, nextclass);
		[nextclass, nextnextclass] = [nextnextclass, nextclass];
	}
	isDragging = false;
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
}



$(function() {

	
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

	const total_cards = ruleset.length * 3;

	setCard(getRandomInt(total_cards), 1);
	setCard(getRandomInt(total_cards), 2);
	setCard(getRandomInt(total_cards), 3);

});
