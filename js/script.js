/*  Author: Johnny Rodgers
	Based on: https://github.com/tinyspeck/avatar-animations/ by Cal Henderson
*/

/* VARIABLES */
//Canvas
var canvas_w = 640, canvas_h = 320, background = new Image();
									background.src = "img/grass_field.png";

//Animations
var g_sheets = {}, g_anims = {}, g_index = {}, g_anim = 'idle4', prev_anim,
	g_next_frame, direction = 'none', frameRate = 33,
	animation_interval, animation_timeout, speak_flag = false,
	d_x, d_y, default_y, offset = 5, jump_counter = 0, jump_anim = 'jumpOver_test_sequence';

//Player
var player_tsid, location_tsid, last_update; 	
	
function load_animation_data(player_tsid) {

	jQuery.support.cors = true;

	$.ajax({
		'url' : 'http://api.glitch.com/simple/players.getAnimations',
		'dataType' : 'json',
		'data' : { 'player_tsid' : player_tsid },
		'success' : function(data, textStatus, jqXHR){
			if (data.ok){
				g_sheets = data.sheets;
				g_anims = data.anims;
				build_index();
				$('#player_tsid').val(player_tsid);
				$('#loading').text("Loading sheets...");
				load_sheets();
				load_player_data(player_tsid);
			} else {
				alert('API error');
			}
		},
		'error' : function(jqXHR, textStatus, errorThrown){
			alert('API error');
			alert(errorThrown);
		}
	});
	
};

function load_player_data(player_tsid) {
	
	$.ajax({
		'url' : 'http://api.glitch.com/simple/players.fullInfo',
		'dataType' : 'json',
		'data' : { 'player_tsid' : player_tsid },
		'success' : function(data, textStatus, jqXHR){
			if (data.ok){
				//set default update (...) if blank
				if (data.last_update.text != "") {
					last_update = data.last_update.text;
				} else {
					last_update = "...";
				}				
				$('#loading').text("Loading player data...");
				$('.player_name').html(data.player_name);
				$('.player_location').html(data.location.name);
				$('#instructions').show();
			}else{
				alert('API error');
			}
		},
		'error' : function(jqXHR, textStatus, errorThrown){
			alert('API error');
			alert(errorThrown);
		}
	});
	
};

function build_index(){
	for (var i in g_sheets){

		for (var j=0; j<g_sheets[i].frames.length; j++){

			var col = j % g_sheets[i].cols;
			var row = Math.floor(j / g_sheets[i].cols);

			g_index[g_sheets[i].frames[j]] = [i, col, row];
		}
	}
}

function load_sheets(){
	for (var i in g_sheets){
		g_sheets[i].img = new Image();
		g_sheets[i].img.onload = function(i){
			return function(){
				image_loaded(i);
			};
		}(i);
		g_sheets[i].img.onerror = image_failed;
		g_sheets[i].img.onabort = image_failed;
		g_sheets[i].loaded = false;
		g_sheets[i].img.src = g_sheets[i].url;
	}
}

function image_failed(){
	alert('failed to load an image :(');
}

function image_loaded(idx){

	g_sheets[idx].loaded = true;
	g_sheets[idx].frame_width = Math.round(g_sheets[idx].img.width / g_sheets[idx].cols);
	g_sheets[idx].frame_height = Math.round(g_sheets[idx].img.height / g_sheets[idx].rows);

	var done = 0;
	var num = 0;
	for (var i in g_sheets){
		num++;
		if (g_sheets[i].loaded) done++;
	}

	if (done == num){

		$('#loading').hide();
		$('#content').show();
		
		animate();
	}else{
		$('#loading').text("Loading sheets: "+done+"/"+num);
	}
}

function animate(){

	g_next_frame = 0;

	//clear animation interval if set
	window.clearInterval(animation_interval);

	//assign animation interval to variable for later clearing
	animation_interval = window.setInterval(nextFrame, frameRate);
}

function nextFrame(){

	drawFrame(g_anims[g_anim][g_next_frame]);

	g_next_frame++;
	if (g_next_frame >= g_anims[g_anim].length){
		g_next_frame = 0;
	}
}

function drawFrame(id){

	// frame info
	var sheet = g_index[id][0];
	var col = g_index[id][1];
	var row = g_index[id][2];

	// source image
	var f_w = g_sheets[sheet].frame_width;
	var f_h = g_sheets[sheet].frame_height;
	var f_x = f_w * col;
	var f_y = f_h * row;

	// destination image
	if (d_x == undefined) {
		//set initial position
		default_y = canvas_h - f_h - 65;
		d_x = (canvas_w / 2) - (f_w / 2);
		d_y = default_y;
	}

	// canvas
	var canvas = document.getElementById("landscape");
	var context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas_w, canvas_h);

	// ground
	context.drawImage(background, 0, 0);
	
	// movement
	if (g_anim == 'walk2x') {
		if (direction == 'right') {
			if ((d_x + f_w) >= canvas_w + 5) {
				//bump into right edge
				animation.emotion('angry');
			} else {
				d_x += offset;
			}
		} else {
			if (d_x <= -10) {
				//bump into left edge
				animation.emotion('surprise');
			} else {
				d_x -= offset;
			}
		}
	}
	
	//jump
	if (g_anim == jump_anim) {		
		//add pseudo-easing to the jump to stall at the top
		var jump_sequence = g_anims[jump_anim].length;
		var jump_third = jump_sequence / 3;
		if (jump_counter <= jump_third) {
			d_y -= 4;
		} else if (jump_counter <= jump_third*2) {
			d_y -= 0;
		} else {
			d_y += 4;
		}
		//distance of jump
		if (direction == 'right') {			
			d_x += 4;
		} else if (direction == 'left'){
			d_x -= 4;
		}
		jump_counter++;
	} else {
		d_y = default_y;
	}
	
	// draw sprite
	if (direction == 'left') {
		context.save();
		context.scale(-1,1);
		context.drawImage(g_sheets[sheet].img, f_x, f_y, f_w, f_h, -(d_x) - f_w, d_y, f_w, f_h);
		context.restore();
	} else {
		context.drawImage(g_sheets[sheet].img, f_x, f_y, f_w, f_h, d_x, d_y, f_w, f_h);
	}
	
	// shading
	context.shadowColor = "#222222;"
	context.shadowBlur = 1.5;
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 1;

	// speech bubble
	if (speak_flag) {
		context.font = "14pt Arial";
		context.textAlign = "center";
		context.fillStyle = "#FFFFFF";
		context.fillText(last_update, d_x + (f_w / 2), d_y - 15);
	}

	// debug
	if (debug.bounding_box) {
		context.beginPath();
		context.lineWidth = 2;
		context.strokeStyle = "#FFFFFF";
		context.rect(d_x, d_y, f_w, f_h);
		context.stroke();
		context.closePath();
	}
	debug.coordinates(d_x, d_y);
}

//capture control input from keyboard
$('body').keydown(function(e) {

	//key presses
	switch(e.keyCode) {
		//enter
		case 13:
			animation.speak();
			break;
		//left
		case 37:
			direction = 'left';
			animation.walk();
			break;
		//right
		case 39:
			direction = 'right';
			animation.walk();
			break;
		//up
		case 38: 
			animation.jump();
			break;
		//down	
		case 40: 
			animation.idle();
			break;
	}
});

//define animation functions in namespace
var animation = {

	idle: function() {
		animation.reset();
		g_anim = 'idle4';
		jump_counter = 0;
	},

	walk: function() {
		animation.reset();
		g_anim = 'walk2x';
	},
	
	jump: function() {
		animation.reset();
		g_anim = jump_anim;
		//determine number of frames to play this animation
		var frames = g_anims[jump_anim].length * frameRate;					
		//return to previous animation state upon completion
		animation_timeout = window.setTimeout(function() {
			switch(prev_anim) {
				case 'idle4':
					animation.idle();
					break;
				case 'walk2x':
					animation.walk();
					break;
				default:
					animation.idle();
					break;
			}		
		}, frames);
	},
	
	emotion: function(type) {		
		animation.reset();
		g_anim = type;
		//determine number of frames to play this animation
		var frames = g_anims[type].length * frameRate;					
		//return to idle state upon completion		
		animation_timeout = window.setTimeout(animation.idle, frames);
	},
	
	speak: function() {
		speak_flag = true;
		animation.emotion('happy');
		//clear text after timeout
		window.setTimeout(function() {
			speak_flag = false;
		}, 3000);
	},
	
	reset: function() {
		prev_anim = g_anim;
		clearTimeout(animation_timeout);
		g_next_frame = 0;
		jump_counter = 0;
	}	
	
}

/* SETTINGS */
//load specified player on form submit
$('#settings').bind('submit', function() {
	player_tsid = $('#player_tsid').val();
	load_animation_data(player_tsid);
	return false;
});

$('#bounding_box').bind('click', function() {
	debug.bounding_box = $('#bounding_box').is(':checked');
});

/* CONTROLS */
$('#control_left').bind('click', function() {
	direction = 'left';
	animation.walk();
	return false;
});
$('#control_right').bind('click', function() {
	direction = 'right';
	animation.walk();
	return false;
});
$('#control_jump').bind('click', function() {
	animation.jump();
	return false;
});
$('#control_stop').bind('click', function() {
	animation.idle();
	return false;
});
$('#control_speak').bind('click', function() {
	animation.speak();
	return false;
});

//DEBUG
var debug = {
	
	bounding_box: false,
	
	coordinates: function(x, y) {
		$('#coordinates').val(x + ", " + y);
	}
	
}

/* UTILITIES */
//jQuery URL parsing function from http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

/* DOC READY */
$(document).ready(function() {
	$(window).load(function() {
		
		//load player specified by query param player_tsid, or use default
		if (getURLParameter('player_tsid') !== 'null') {
			player_tsid = getURLParameter('player_tsid');
		} else {
			player_tsid = 'PUV1DNS5B4H2AL9';
		}	
		//load data on document ready
		load_animation_data(player_tsid);
	});
});