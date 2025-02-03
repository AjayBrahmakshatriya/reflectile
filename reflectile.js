const boardx = 160;
const boardy = 160;
const tilesize = 100;


var nextclass="red-tile";
var nextnextclass="blue-tile";

$(function() {
	for (x = 0; x < boardx; x++) {
		for (y = 0; y < boardy; y++) {
			var t = y * tilesize - (tilesize * boardy/2);
			var l = x * tilesize - (tilesize * boardx/2);
			tile = $("<div>", {
				id: 'tile-' + x + '-' + y,
				class: 'tile',
				style:	'top: ' + t + '; left : ' + l + ';',
			});
			tile.on('click', function() {
				$(this).addClass(nextclass);
				[nextclass, nextnextclass] = [nextnextclass, nextclass];
			});
			$('#tilecontainer').append(tile);	
		}
	} 

	midx=boardx/2 - 1;
	midy=boardy/2 - 1;

	$('#tile-' + midx + '-' + midy).addClass("red-tile");	
	$('#tile-' + (midx + 1) + '-' + (midy + 1)).addClass("red-tile");	
	$('#tile-' + (midx + 1) + '-' + midy).addClass("blue-tile");	
	$('#tile-' + midx+'-' + (midy + 1)).addClass("blue-tile");	

	$("#tilepadding").draggable();

});
