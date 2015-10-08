var level;

$(document).ready(function(){
	// String replace
	if (!String.prototype.format) {
	  String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
		  return typeof args[number] != 'undefined'
			? args[number]
			: match
		  ;
		});
	  };
	}
});

function start(){
	restart();
	level = $('#levelOption').val();
	generateMaze();
	draw();
	return false;
}

function restart(){
	// Show/Hide sections
	$('#helpText').addClass('hidden');
	$('#maze').removeClass('hidden');
	$('#arrowButtons').removeClass('hidden');
	$('#stats').removeClass('hidden');
	$('#levelOptionText').text("Jump to Level");
	// Initialise vars
	playerPos = [];
	mazeGrid = [];
	startTime = 0;
	won = false;
}

var playerPos = [];
var mazeGrid = [];
var startTime;
var won = false;
var times = {};

function draw(){
	if (mazeGrid.length > 1){
		var jCanvas = $('#maze');
		var ctx = document.getElementById('maze').getContext('2d');
		var w = ctx.canvas.width = jCanvas.width();
		var h = ctx.canvas.height = jCanvas.width();
		var cellh = h / mazeGrid.length;
		var cellw = w / mazeGrid[0].length;
		// Background
		ctx.fillStyle="#999999";
		ctx.fillRect(0, 0, w, h);
		// Grid
		for (var i = 0; i < mazeGrid.length; i++){
			for (var j = 0; j < mazeGrid[i].length; j++){
				var v = mazeGrid[i][j];
				if (v == 0){
					ctx.fillStyle="#444444";
				} else {
					ctx.fillStyle="#999999";
				}
				ctx.fillRect(cellw*j, cellh*i, cellw, cellh);
				ctx.beginPath();
				ctx.moveTo(0, 0);
				if (v >= 8){
					// W
					v -= 8;
				} else {
					ctx.moveTo(cellw*j, cellh*i);
					ctx.lineTo(cellw*j, cellh*(i+1))
				}
				if (v >= 4){
					// S
					v -= 4;
				} else {
					ctx.moveTo(cellw*j, cellh*(i+1));
					ctx.lineTo(cellw*(j+1), cellh*(i+1))
				}
				if (v >= 2){
					// E
					v -= 2;
				} else {
					ctx.moveTo(cellw*(j+1), cellh*i);
					ctx.lineTo(cellw*(j+1), cellh*(i+1))
				}
				if (v >= 1){
					// N
					v -= 1;
				} else {
					ctx.moveTo(cellw*j, cellh*i);
					ctx.lineTo(cellw*(j+1), cellh*i)
				}
				ctx.stroke();
			}
		}
		// Player and Exit
		if (playerPos.length > 1){
			ctx.beginPath();
			ctx.rect(w-(cellw*4/5), h-(cellh*4/5), cellw*3/5, cellh*3/5);
			ctx.fillStyle = "blue";
			ctx.fill();
			ctx.stroke();
			
			ctx.beginPath();
			ctx.arc(cellw*(playerPos[0]+0.5), cellh*(playerPos[1]+0.5), cellw/3, 0, 2*Math.PI, false);
			ctx.fillStyle = "green";
			ctx.fill();
			ctx.stroke();
		}
	}
}

var mazeStep = 5; // How many levels before width increases
var mazeInit = 5; // How many cells per line initially
function generateMaze(){
	// Set seed for identical levels
	Math.seedrandom(level);
	// Set game size appropriate for level
	var mw = Math.floor(level / mazeStep) + mazeInit;
	var mh = mw;
	// Reset maze grid
	mazeGrid = [], row = [];
	var cols = mw;
	var rows = mh;
	while(cols--){row.push(0);}
	while(rows--){mazeGrid.push(row.slice());}
	// Pick random start location
	var x = rand(mw);
	var y = rand(mh);
	log("Starting position: ({0}, {1})".format(x, y));
	// Loop
	generateLoop(x, y, mw, mh);
	draw();
}

function generateLoop(x, y, mw, mh){
	var match = false;
	// Walk the maze
	// Pick random direction
	var ds = [0, 1, 2, 3]; // N, E, S, W
	var moved = false;
	while (ds.length > 0 && !moved){
		var d = ds.splice(rand(ds.length), 1)[0];
		var nx = x + [0, 1, 0, -1][d];
		var ny = y + [-1, 0, 1, 0][d];
		if (nx >= 0 && ny >= 0 && nx < mw && ny < mh && mazeGrid[ny][nx] == 0){
			log("Moving to: ({0}, {1})".format(nx, ny));
			moved = true;
			// Add the new holes to each side
			mazeGrid[y][x] += [1, 2, 4, 8][d];
			mazeGrid[ny][nx] += [4, 8, 1, 2][d];
			x = nx;
			y = ny;
			break;
		}
	}
	if (moved){
		match = true;
	} else {
		// Hunt for untouched square
		for (var j = 0; j < mazeGrid.length; j++){
			for (var i = 0; i < mazeGrid[j].length; i++){
				if (mazeGrid[j][i] == 0){
					// Join square to existing network
					x = i;
					y = j;
					var ds = [0, 1, 2, 3]; // N, E, S, W
					while (ds.length > 0 && !moved){
						var d = ds.splice(rand(ds.length), 1)[0];
						var nx = x + [0, 1, 0, -1][d];
						var ny = y + [-1, 0, 1, 0][d];
						if (nx >= 0 && ny >= 0 && nx < mw && ny < mh && mazeGrid[ny][nx] > 0){
							log("Joining ({0}, {1}) to ({2}, {3})".format(x, y, nx, ny));
							moved = true;
							// Add the new holes to each side
							mazeGrid[y][x] += [1, 2, 4, 8][d];
							mazeGrid[ny][nx] += [4, 8, 1, 2][d];
						}
					}
					if (moved){
						match = true;
						break;
					}
				}
			}
			if (match){
				break;
			}
		}
	}
	if (match){
		if (debug || $('#loadAnimation')[0].checked){
			draw();
			setTimeout(generateLoop, 50, x, y, mw, mh);
		} else {
			setTimeout(generateLoop, 0, x, y, mw, mh);
		}
	} else {
		// Init player
		playerPos = [0, 0];
		log("Maze Completed");
		draw();
		$('#maze').focus();
		startTime = new Date().getTime();
		overlayText("Go!");
	}
}

function moveUp(){
	var event = [];
	event.which = 119;
	event.preventDefault = function(){};
	movePlayer(event);
}
function moveLeft(){
	var event = [];
	event.which = 97;
	event.preventDefault = function(){};
	movePlayer(event);
}
function moveDown(){
	var event = [];
	event.which = 115;
	event.preventDefault = function(){};
	movePlayer(event);
}
function moveRight(){
	var event = [];
	event.which = 100;
	event.preventDefault = function(){};
	movePlayer(event);
}

function movePlayer(event){
	var c = event.which;
	if (playerPos.length > 1 && !won){
		var g = mazeGrid[playerPos[1]][playerPos[0]];
		if (c == 119 || c == 87 || c == 38){
			event.preventDefault();
			// N
			if (playerPos[1] > 0 && g%2 == 1){
				playerPos[1]--;
			}
		} else if (c == 100 || c == 68 || c == 39){
			event.preventDefault();
			// E
			if (g >= 8){
				g -= 8;
			}
			if (g >= 4){
				g -= 4;
			}
			if (playerPos[0] < mazeGrid.length-1 && g >= 2){
				playerPos[0]++;
			}
		} else if (c == 115 || c == 83 || c == 40){
			event.preventDefault();
			// S
			if (g >= 8){
				g -= 8;
			}
			if (playerPos[1] < mazeGrid[0].length-1 && g >= 4){
				playerPos[1]++;
			}
		} else if (c == 97 || c == 65 || c == 37){
			event.preventDefault();
			// W
			if (playerPos[0] > 0 && g >= 8){
				playerPos[0]--;
			}
		}
		if (playerPos[0] == mazeGrid.length-1 && playerPos[1] == mazeGrid[0].length-1){
			win();
		}
	} else if (c == 13){
		start();
	}
	draw();
}

function win(){
	won = true;
	var t = new Date().getTime() - startTime;
	times[level] = t;
	log("Player wins with a time of {0}".format(t/1000));
	var total = 0;
	var count = 0;
	var highest = 0;
	for (var k in times){
		total += times[k];
		count++;
		if (parseInt(k) > highest){
			highest = parseInt(k);
		}
	}
	log("Player total time of {0} over {1} levels".format(k, count));
	overlayText("You finished level {0} in {1} seconds!".format(level, t/1000), 10000);
	$('#levelOption').val(parseInt(level)+1);
	// Update stats
	$('#statCount').text(count);
	$('#statHighest').text(highest);
	$('#statTotal').text(total/1000);
	$('#statAverage').text(Math.floor((total)/count)/1000);
}

// Next int
function rand(max){
	if (max){
		return Math.floor(Math.random() * max);
	}
	return Math.random();
}

function overlayText(text, timeout){
	var o = $('#overlay');
	o.text(text);
	o.show();
	o.removeClass('hidden');
	if (timeout === 'undefined'){
		timeout = 0;
	}
	setTimeout(fadeOverlay, timeout);
}

function fadeOverlay(){
	$('#overlay').fadeOut("slow", function(){
		$('#overlay').addClass('hidden');
	});
}

var debug = false;
function log(s){
	if (debug){
		console.log(s);
	}
}