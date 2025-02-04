// Each rule in Reflectile is a function from 2 tiles to 3 tiles. The two tiles can be organized in a 2x2 grid, 
// the 3 tiles can potentially be in a 3x2 grid. We will list all combinations here and define objects to describe the rules
// In the rule set R/B are used for source tiles and A is used to describe the added tile which can be R/B/W but is not
// part of the rule description. The added colors are in order R-B-W so card id can be computed by 15 * add_color + rule_index
const ruleset = [
// RR   RRA #0
// --   ---
	"RRA ---", 
// RR   RR- #1
// --   -A-
	"RR- -A-", 
// BB   BBA #2
// --   ---
	"BBA ---", 
// BB   BB- #3
// --   -A-
	"BB- -A-", 
// RB   RBA #4
// --   ---
	"RBA ---", 
// RB   RB- #5
// --   -A-
	"RB- -A-", 
// BR   BRA #6
// --   ---
	"BRA ---", 
// BR   BR- #7
// --   -A-
	"BR- -A-", 
// R-   RA- #8
// -R   -R-
	"RA- -R-", 
// R-   R-- #9
// -R   -RA
	"R-- -RA", 
// B-   BA- #10
// -B   -B-
	"BA- -B-", 
// B-   B-- #11
// -B   -BA
	"B-- -BA", 
// B-   BA- #12
// -R   -R-
	"BA- -R-", 
// B-   B-- #13
// -R   -RA
	"B-- -RA", 
// R-   R-- #14
// -B   -BA
	"R-- -BA", 
]
