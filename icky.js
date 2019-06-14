/* icky.js
 * based on XKCD CLI by Chromakode
 */

function pathFilename(path) {
	var match = /\/([^\/]+)$/.exec(path);
	if (match) {
		return match[1];
	}
}

function getRandomInt(min, max) {
	// via https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Math/random#Examples
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
	return items[getRandomInt(0, items.length-1)];
}

function oneLiner(terminal, msg, msgmap) {
	if (msgmap.hasOwnProperty(msg)) {
		terminal.print(msgmap[msg]);
		return true;
	} else {
		return false;
	}
}

var xkcd = {
	latest: null,
	last: null,
	cache: {},
	base: 'https://dynamic.xkcd.com/api-0/jsonp/comic/',

	get:function(num,c,a){
		if(num==null){
			path=""
		}else{
			if(Number(num)){
				path=String(num)
			}else{
				a(false);
				return false
			}
		}
		if(num in this.cache){
			this.last=this.cache[num];	
			c(this.cache[num])
		}else{
			return $.ajax({
				url:this.base+path,dataType:"jsonp",
				success:$.proxy(
							function(d){
								this.last=this.cache[num]=d;
								c(d)
				},this),
				error:a}
				)
			}
		}
};
	
var xkcdDisplay = TerminalShell.commands['display'] = function(terminal, path) {
	function fail() {
		terminal.print($('<p>').addClass('error').text('display: unable to open image "'+path+'": No such file or directory.'));
		terminal.setWorking(false);
	}
			
	if (path) {
		path = String(path);
		num = Number(path.match(/^\d+/));
		filename = pathFilename(path);
		
		if (num > xkcd.latest.num) {
			terminal.print("Time travel mode not enabled.");
			return;
		}
	} else {
		num = xkcd.last.num;
	}
	
	terminal.setWorking(true);
	xkcd.get(num, function(data) {
		if (!filename || (filename == pathFilename(data.img))) {
			$('<img>')
				.hide()
				.load(function() {
					terminal.print($('<h3>').text(data.num+": "+data.title));
					$(this).fadeIn();
					
					var comic = $(this);
					if (data.link) {
						comic = $('<a>').attr('href', data.link).append($(this));
					}
					terminal.print(comic);
					
					terminal.setWorking(false);
				})
				.attr({src:data.img, alt:data.title, title:data.alt})
				.addClass('comic');
		} else {
			fail();
		}
	}, fail);
};

TerminalShell.commands['n'] =
TerminalShell.commands['next'] = function(terminal) {
	xkcdDisplay(terminal, xkcd.last.num+1);
};

TerminalShell.commands['p'] =
TerminalShell.commands['previous'] =
TerminalShell.commands['prev'] = function(terminal) {
	xkcdDisplay(terminal, xkcd.last.num-1);
};

TerminalShell.commands['first'] = function(terminal) {
	xkcdDisplay(terminal, 1);
};

TerminalShell.commands['latest'] =
TerminalShell.commands['last'] = function(terminal) {
	xkcdDisplay(terminal, xkcd.latest.num);
};

TerminalShell.commands['count'] = function(terminal) {
	terminal.print(xkcd.latest.num);
};

TerminalShell.commands['arandom'] = 
TerminalShell.commands['urandom'] = 
TerminalShell.commands['random'] = function(terminal) {
	terminal.print('That\'s not arc4random(3)...');
	xkcdDisplay(terminal, getRandomInt(1, xkcd.latest.num));
};

TerminalShell.commands['arc4random'] = function(terminal) {
	terminal.print('wow true random...');
	xkcdDisplay(terminal, getRandomInt(1, xkcd.latest.num));
};

TerminalShell.commands['goto'] = function(terminal, subcmd) {
	$('#screen').one('cli-ready', function(e) {
		terminal.print('Did you mean "display"?');
	});
	xkcdDisplay(terminal, 292);
};

TerminalShell.commands['gps'] = function(terminal) {
		var where = get_mylocation();
};

TerminalShell.commands['doas'] = function(terminal) {
	var cmd_args = Array.prototype.slice.call(arguments);
	cmd_args.shift(); // terminal
	if (cmd_args.join(' ') == 'you like') {
		terminal.print('I will, thank you.');
	} else {
		var cmd_name = cmd_args.shift();
		cmd_args.unshift(terminal);
		cmd_args.push('doas');
		if (TerminalShell.commands.hasOwnProperty(cmd_name)) {
			this.doas = true;
			this.commands[cmd_name].apply(this, cmd_args);
			delete this.doas;
		} else if (!cmd_name) {
			terminal.print('you can do as you like...');
		} else {
			terminal.print('doas: '+cmd_name+': command not found');
		}
	}
};

TerminalShell.commands['sudo'] = function(terminal) {
	var cmd_args = Array.prototype.slice.call(arguments);
	cmd_args.shift(); // terminal
	if (cmd_args.join(' ') == 'make me a sandwich') {
		xkcdDisplay(terminal, 149);
		terminal.print('Okay.');
	} else {
		var cmd_name = cmd_args.shift();
		cmd_args.unshift(terminal);
		cmd_args.push('sudo');
		if (TerminalShell.commands.hasOwnProperty(cmd_name)) {
			this.sudo = true;
			this.commands[cmd_name].apply(this, cmd_args);
			delete this.sudo;
		} else if (!cmd_name) {
			terminal.print('sudo what?');
		} else {
			terminal.print('sudo: '+cmd_name+': command not found');
		}
	}
};

TerminalShell.commands['uname'] = function(terminal) {
	var cmd_args = Array.prototype.slice.call(arguments);
	var os = 'OpenBSD ';
	var ver = '5.8 ';
	var host = 'icky.schoolio.co.uk ';
	var build = randomChoice(['GENERIC.MP#42 ','GENERIC#914 ']);
	var arch = randomChoice(['amd64 ', 'arm ', 'sparc ', 'sparc64 ', 'zaurus ']);
	cmd_args.shift(); // terminal
	if (cmd_args.join(' ') == '-a') {
		terminal.print(os+host+ver+build+arch);
	} else if (cmd_args.join(' ') == '-n') {
		terminal.print(host);
	} else {
		terminal.print(os);
	}
};

TerminalShell.filters.push(function (terminal, cmd) {
	if (/!!/.test(cmd)) {
		var newCommand = cmd.replace('!!', this.lastCommand);
		terminal.print(newCommand);
		return newCommand;
	} else {
		return cmd;
	}
});

TerminalShell.commands['shutdown'] = 
TerminalShell.commands['poweroff'] = function(terminal) {
	if (this.doas) {
		terminal.print('Broadcast message from '+name+'@icky');
		terminal.print();
		terminal.print('The system is going down for maintenance NOW!');
		return $('#screen').fadeOut(5000);
	} else {
		terminal.print('Must be root.');
	}
};

TerminalShell.commands['bye'] = function(terminal) {
	terminal.print('do you think this is ftp?');
};

TerminalShell.commands['sendbug'] = function(terminal) {
	terminal.print('it\'s too late ... its crawling with ticks!');
};

TerminalShell.commands['logout'] =
TerminalShell.commands['exit'] = 
TerminalShell.commands['quit'] = function(terminal) {
	terminal.print('Bye.');
	$('#prompt, #cursor').hide();
	terminal.promptActive = false;
};

TerminalShell.commands['halt'] = 
TerminalShell.commands['restart'] = 
TerminalShell.commands['reboot'] = function(terminal) {
	if (this.doas) {
		TerminalShell.commands['poweroff'](terminal).queue(function(next) {
			window.location.reload();
		});
	} else {
		terminal.print('Must be root.');
	}
};

TerminalShell.commands['su'] = function(terminal,name) {
	$('#prompt').fadeOut(500);
	if(!name) {
		name = 'root';
	}
	terminal.config.prompt = setPrompt(name,'icky','/');
	$('#prompt').fadeIn();
};

function linkFile(url) {
	return {type:'dir', enter:function() {
		window.location = url;
	}};
}

Filesystem = {
	'motd': {type:'file', read:function(terminal) {
		terminal.print($('<h4>').text('ICKY-not-quite-current (GENERIC) #888 '));
		terminal.print($('<h4>').text('Welcome to the ICKY console.'));
		terminal.print($('<p>').html('To report a bug use <a href="mailto:bugs@crowsons.com" title="bugs">sendbug(1)</a>'));
	}},
	'welcome.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h4>').text('Welcome to the ICKY console.'));
		terminal.print('To navigate use a map');
		terminal.print('or *NIX commands.');
		terminal.print($('<p>').html('To report a bug use <a href="mailto:bugs@crowsons.com" title="bugs">sendbug(1)</a>'));
	}},
	'license.txt': {type:'file', read:function(terminal) {
		terminal.print($('<p>').html('Client-side logic for Wordpress CLI theme :: <a href="http://thrind.xamai.ca/">R. McFarland, 2006, 2007, 2008</a>'));
		terminal.print($('<p>').html('jQuery rewrite and overhaul :: <a href="http://www.chromakode.com/">Chromakode, 2010</a>'));
		terminal.print($('<p>').html('ICKY overhaul :: <a href="https://github.com/fcbsd/icky">fcbsd, 2014</a>'));
		terminal.print();
		$.each([
			'This program is free software; you can redistribute it and/or',
			'modify it under the terms of the GNU General Public License',
			'as published by the Free Software Foundation; either version 2',
			'of the License, or (at your option) any later version.',
			'',
			'This program is distributed in the hope that it will be useful,',
			'but WITHOUT ANY WARRANTY; without even the implied warranty of',
			'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the',
			'GNU General Public License for more details.',
			'',
			'You should have received a copy of the GNU General Public License',
			'along with this program; if not, write to the:',
			'',
			'Free Software Foundation, Inc.,',
			'51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.'
		], function(num, line) {
			terminal.print(line);
		});
	}}
};

Filesystem['incite'] = linkFile('http://www.schoolio.co.uk/diary/');
Filesystem['store'] = linkFile('https://www.openbsdstore.com/');
Filesystem['about'] = linkFile('http://www.schoolio.co.uk/about.php');

TerminalShell.pwd = Filesystem;

TerminalShell.commands['cd'] = function(terminal, path) {
	if (path in this.pwd) {
		if (this.pwd[path].type == 'dir') {
			this.pwd[path].enter(terminal);
		} else if (this.pwd[path].type == 'file') {
			terminal.print('cd: '+path+': Not a directory');
		}
	} else {
		terminal.print('cd: '+path+': No such file or directory');
	}
};

TerminalShell.commands['dir'] = function(terminal, path) {
	terminal.print('dir: not found');
};

TerminalShell.commands['ls'] = function(terminal, path) {
	var name_list = $('<ul>');
	$.each(this.pwd, function(name, obj) {
		if (obj.type == 'dir') {
			name += '/';
		}
		name_list.append($('<li>').text(name));
	});
	terminal.print(name_list);
};

TerminalShell.commands['cat'] = function(terminal, path) {
	if (path in this.pwd) {
		if (this.pwd[path].type == 'file') {
			this.pwd[path].read(terminal);
		} else if (this.pwd[path].type == 'dir') {
			terminal.print('cat: '+path+': Is a directory');
		}
	} else if (pathFilename(path) == 'alt.txt') {
		terminal.setWorking(true);
		num = Number(path.match(/^\d+/));
		xkcd.get(num, function(data) {
			terminal.print(data.alt);
			terminal.setWorking(false);
		}, function() {
			terminal.print($('<p>').addClass('error').text('cat: "'+path+'": No such file or directory.'));
			terminal.setWorking(false);
		});
	} else {
		terminal.print('You\'re a kitty!');
	}
};

TerminalShell.commands['finger'] = function(terminal, name) {
	if (!name) {
		terminal.print('Mmmmm...');
	} else if (name == 'mouse') {
		linkFile('http://en.wikipedia.org/wiki/Fingermouse').enter();
	} else {
		terminal.print('finger: you cannot poke '+name+' today!');
	}
};

TerminalShell.commands['rm'] = function(terminal, flags, path) {
	if (flags && flags[0] != '-') {
		path = flags;
	}
	if (!path) {
		terminal.print('rm: missing operand');
	} else if (path in this.pwd) {
		if (this.pwd[path].type == 'file') {
			delete this.pwd[path];
		} else if (this.pwd[path].type == 'dir') {
			if (/r/.test(flags)) {
				delete this.pwd[path];
			} else {
				terminal.print('rm: cannot remove '+path+': Is a directory');
			}
		}
	} else if (flags == '-rf' && path == '/') {
		if (this.doas) {
			TerminalShell.commands = {};
		} else {
			terminal.print('rm: cannot remove /: Permission denied');
		}
	}
};

TerminalShell.commands['motd'] = function(terminal) {
	terminal.print($('<a>').text('MOTD: there is no message of the day...').attr('href', 'http://ict.crowsons.com/unix/').attr('title','Message of the Day'));
}; 

TerminalShell.commands['cheat'] = function(terminal) {
	terminal.print($('<a>').text('*** YOU WILL BE CAUGHT ***').attr('href', 'https://www.openbsdstore.com/').attr('title','YOU HAVE BEEN WARNED'));
}; 

TerminalShell.commands['reddit'] = function(terminal, num) {
	num = Number(num);
	if (num) {
		url = 'https://xkcd.com/'+num+'/';
	} else {
		var url = window.location;
	}
	terminal.print($('<iframe src="https://www.reddit.com/static/button/button1.html?width=140&url='+encodeURIComponent(url)+'&newwindow=1" height="22" width="140" scrolling="no" frameborder="0"></iframe>'));
};

TerminalShell.commands['wget'] = 
TerminalShell.commands['curl'] = function(terminal, dest) {
	if (dest) {
		terminal.setWorking(true);
		var browser = $('<div>')
			.addClass('browser')
			.append($('<iframe>')
					.attr('src', dest).width("100%").height(600)
					.one('load', function() {
						terminal.setWorking(false);
					}));
		terminal.print(browser);
		return browser;
	} else {
		terminal.print("Please specify a URL.");
	}
};

TerminalShell.commands['write'] =
TerminalShell.commands['irc'] = function(terminal, nick, channel) {
	if (!channel) { 
			channel='%23xkcd'; 
			var url = "http://widget.mibbit.com/?server=irc.foonetic.net&channel="+channel;
	}
	if (nick) {
		$('.irc').slideUp('fast', function() {
			$(this).remove();
		});
		var url = "http://widget.mibbit.com/?server=orwell.freenode.net&channel="+channel;
		if (nick) {
			url += "&nick=" + encodeURIComponent(nick);
		}
		TerminalShell.commands['curl'](terminal, url).addClass('irc');
	} else {
		terminal.print('usage: irc <nick>');
	}
};

TerminalShell.commands['unixkcd'] = function(terminal, nick) {
	TerminalShell.commands['curl'](terminal, "http://uni.xkcd.com/");
};

TerminalShell.commands['pkg_add'] = function(terminal, subcmd) {
	if (!this.doas && (subcmd in {'-u':true, '-vui':true, 'moo':true, 'puffy':true})) {
		terminal.print('Fatal error: pkg_add must be run as root');
	} else {
		if (subcmd == '-u') {
			terminal.print('Reading package lists... Done');
		} else if (subcmd == 'puffy') {
				terminal.print("              |    .");
				terminal.print("          .   |L  /|   .");
				terminal.print("      _ . |\ _| \--+._/| .");
				terminal.print("     / ||\| Y J  )   / |/| ./");
				terminal.print("    J  |)'( |        ` F`.'/");
				terminal.print("  -<|  F         __     .-<");
				terminal.print("    | /       .-'. `.  /-. L___");
				terminal.print("    J \      <    \  | | O\|.-'");
				terminal.print("  _J \  .-    \/ O | | \  |F");
				terminal.print(" '-F  -<_.     \   .-'  `-' L__");
				terminal.print("__J  _   _.     >-'  )._.   |-'");
				terminal.print("`-|.'   /_.           \_|   F ");
				terminal.print("  /.-   .                _.< ");
				terminal.print(" /'    /.'             .'  `\ ");
				terminal.print("  /L  /'   |/      _.-'-\ ");
				terminal.print(" /'J       ___.---'\| ");
				terminal.print("   |\  .--' V  | `. ` ");
				terminal.print("   |/`. `-.     `._) ");
				terminal.print("      / .-.\ ");
				terminal.print("VK    \ (  `\ ");
				terminal.print("       `.\ ");
				terminal.print('...."Puffy Power!"...');
		} else if (subcmd == 'moo') {
			terminal.print('        (__)');
			terminal.print('        (oo)');
			terminal.print('  /------\\/ ');
			terminal.print(' / |    ||  ');
			terminal.print('*  /\\---/\\  ');
			terminal.print('   ~~   ~~  '); 
			terminal.print('...."Have you mooed today?"...');
		} else if (subcmd == '-vui') {
			terminal.print('is this interactive enough for you?');
		} else if (!subcmd) {
			terminal.print('This pkg_add has Puffer Fish Powers.');
		} else {
			terminal.print('Can\'t find '+subcmd);
		}
	}
};

TerminalShell.commands['man'] = function(terminal, man) {
	manpages = {
		'cat':  'You are now riding a half-man half-cat.',
		'help': 'Man, help me out here.',
		'last': 'Man, last night was AWESOME.',
		'man': 'yep he is a man.',
		'uname': 'me Tarzan',
		'next': 'Request confirmed; you will be reincarnated as a man next.',
		'sendbug': 'View the source Luke'
	};
	if (!oneLiner(terminal, man, manpages)) {
		terminal.print('Oh, I\'m sure you can figure it out.');
	}
};

TerminalShell.commands['locate'] = function(terminal, what) {
	keywords = {
		'ninja': 'Ninja cannot be found!',
		'keys': 'Have you checked your coat pocket?',
		'joke': 'Joke found on user.',
		'problem': 'Problem exists between keyboard and chair.',
		'raptor': 'BEHIND YOU!!!'
	};
	if (!oneLiner(terminal, what, keywords)) {
		if(!what) {
			terminal.print('Locate what?');
		} else {
			terminal.print('Locate '+what+'?');
		}
	}
};

Adventure = {
	rooms: {
		0:{description:'You are at a computer using a shell.', exits:{west:1, south:10}},
		1:{description:'Life is peaceful there.', exits:{east:0, west:2}},
		2:{description:'In the open air.', exits:{east:1, west:3}},
		3:{description:'Where the skies are blue.', exits:{east:2, west:4}},
		4:{description:'This is what we\'re gonna do.', exits:{east:3, west:5}},
		5:{description:'Sun in wintertime.', exits:{east:4, west:6}},
		6:{description:'We will do just fine.', exits:{east:5, west:7}},
		7:{description:'Where the skies are blue.', exits:{east:6, west:8}},
		8:{description:'This is what we\'re gonna do.', exits:{east:7}},
		10:{description:'A dark hallway.', exits:{north:0, south:11}, enter:function(terminal) {
				if (!Adventure.status.lamp) {
					terminal.print('You are eaten by a grue.');
					Adventure.status.alive = false;
					Adventure.goTo(terminal, 666);
				}
			}
		},
		11:{description:'Bed. This is where you sleep.', exits:{north:10}},
		666:{description:'You\'re dead!'}
	},
	
	status: {
		alive: true,
		lamp: false
	},
	
	goTo: function(terminal, id) {
		Adventure.location = Adventure.rooms[id];
		Adventure.look(terminal);
		if (Adventure.location.enter) {
			Adventure.location.enter(terminal);
		}
	}
};
Adventure.location = Adventure.rooms[0];

TerminalShell.commands['look'] = Adventure.look = function(terminal) {
	terminal.print(Adventure.location.description);	
	if (Adventure.location.exits) {

		terminal.print();
		
		var possibleDirections = [];
		$.each(Adventure.location.exits, function(name, id) {
			possibleDirections.push(name);
		});
		terminal.print('Exits: '+possibleDirections.join(', '));
	}
};

TerminalShell.commands['go'] = Adventure.go = function(terminal, direction) {
	if (Adventure.location.exits && direction in Adventure.location.exits) {
		Adventure.goTo(terminal, Adventure.location.exits[direction]);
	} else if (!direction) {
		terminal.print('Go where?');
	} else if (direction == 'down') {
		terminal.print("On our first date?");
	} else {
		terminal.print('You cannot go '+direction+'.');
	}
};

TerminalShell.commands['bash'] = function(terminal, what) {
	if (what == "(){:;;}") {
		if (!Adventure.status.lamp) {
			terminal.print('you have been hacked.');
			Adventure.status.lamp = true;
		} else {
			terminal.print('Give Up!?!');
		}
	} else {
		if (!what) { what="head"; }
		terminal.print('Bashing your '+what+' will hurt...');
	}
};

TerminalShell.commands['light'] = function(terminal, what) {
	if (what == "lamp") {
		if (!Adventure.status.lamp) {
			terminal.print('You set your lamp ablaze.');
			Adventure.status.lamp = true;
		} else {
			terminal.print('Your lamp is already lit!');
		}
	} else {
		terminal.print('Light what?');
	}
};

TerminalShell.commands['sleep'] = function(terminal, duration) {
	duration = Number(duration);
	if (!duration) {
		duration = 1;
	}
	terminal.setWorking(true);
	terminal.print("You take a nap.");
	$('#screen').fadeOut(1000);
	window.setTimeout(function() {
		terminal.setWorking(false);
		$('#screen').fadeIn();
		terminal.print("You awake refreshed.");
	}, 1000*duration);
};

// No peeking!
TerminalShell.commands['help'] = function(terminal) {
	terminal.print('That would be cheating!');
}; 

TerminalShell.fallback = function(terminal, cmd) {
	oneliners = {
		'ed': 'You are not a diety.',
		'enable time travel': 'TARDIS error: Time Lord missing.',
		'make me a sandwich': 'What? Make it yourself.',
		'make love': 'I put on my robe and wizard hat.',
		'i read the source code': '<3',
		'pwd': 'You are in a maze of twisty passages, all alike.',
		'lpr': 'PC LOAD LETTER',
		'hello joshua': 'How about a nice game of Global Thermonuclear War?',
		'date': 'March 32nd',
		'hello': 'Why hello there!',
		'xkcd': 'Yes?',
		'fuck': 'I have a headache.',
		'whoami': 'ask Theo de Raadt...',
		'nano': 'Seriously? Why don\'t you just use MS Paint?',
		'top': 'It\'s up there --^',
		'moo':'moo',
		'ping': 'There is another submarine three miles ahead, bearing 225, forty fathoms down.',
		'find': 'What do you want to find? Kitten would be nice.',
		'hello':'Hello.','more':'Oh, yes! More! More!',
		'your gay': 'Keep your hands off it!',
		'hi':'Hi.','echo': 'ECHO ... ECHo ... ECho ... Echo ... echo ... echo ...',
		'ssh': 'ssh, this is a library.',
		'kill': 'Terminator deployed to 1984.',
		'use the force luke': 'I believe you mean source.',
		'use the source luke': 'I\'m not luke, you\'re luke!',
		'vim': 'no improved vi here...',
		'serenity': 'You can\'t take the sky from me.',
		'who': 'Doctor Who?',
		'xyzzy': 'Nothing happens.'
	};
	oneliners['emacs'] = 'You should really use vim.';
	oneliners['vi'] = 'You should really use mg.';
	
	cmd = cmd.toLowerCase();
	if (!oneLiner(terminal, cmd, oneliners)) {
		if (cmd == "asl" || cmd == "a/s/l") {
			terminal.print(randomChoice([
				'2/AMD64/Server Rack',
				'328/M/Transylvania',
				'6/M/Battle School',
				'48/M/The White House',
				'7/F/Rapture',
				'In your age range/A gender you\'re attracted to/Far far away...',
				'7,831/F/Lothlórien',
				'42/M/FBI Field Office'
			]));
		} else if  (cmd == "hint") {
			terminal.print(randomChoice([
 				'We offer some really nice polos.',
 				$('<p>').html('This terminal will remain available at <a href="http://uni.xkcd.com/" title="unixkcd">http://uni.xkcd.com/</a>'),
 				'Use the source, Luke!',
 				'There are cheat codes.'
 			]));
		} else if (cmd == 'find kitten') {
			terminal.print('dead');
		} else if (cmd == 'buy stuff') {
			Filesystem['store'].enter();
		} else if (cmd == 'time travel') {
			xkcdDisplay(terminal, 630);
		} else if (/:\(\)\s*{\s*:\s*\|\s*:\s*&\s*}\s*;\s*:/.test(cmd)) {
			// this matches a fork bomb :(){:|:&};:
			// thanks to https://regex101.com/
			terminal.setWorking(true);
			window.setTimeout( function() { 
				terminal.setWorking(false); 
				terminal.print(randomChoice([
					'All process terminated',
					'fork bomber',
					'sysadmin angry...',
					'raptors loose...'
				]));
				}, 1000 * getRandomInt(10,20));
		} else {
			$.get("/unix/miss.php", {search: cmd});
			return false;
		}
	}
	return true;
};

var konamiCount = 0;
$(document).ready(function() {
	Terminal.promptActive = false;
	$('#screen').bind('cli-load', function(e) {
		xkcd.get(null, function(data) {
			xkcd.latest = data;
			$('#screen').one('cli-ready', function(e) {
				Terminal.runCommand('cat welcome.txt');
			});
				Terminal.runCommand('random');
		}, function() {
			Terminal.print($('<p>').addClass('error').html('XKCD terminal is available at <a href="http://uni.xkcd.com/">unixkcd</a>'));
			Terminal.promptActive = true;
		});
	});
	
	$(document).konami(function(){
		function shake(elems) {
			elems.css('position', 'relative');
			return window.setInterval(function() {
				elems.css({top:getRandomInt(-3, 3), left:getRandomInt(-3, 3)});
			}, 100);	
		}
		
		if (konamiCount == 0) {
			$('#screen').css('text-transform', 'uppercase');
		} else if (konamiCount == 1) {
			$('#screen').css('text-shadow', 'gray 0 0 2px');
		} else if (konamiCount == 2) {
			$('#screen').css('text-shadow', 'orangered 0 0 10px');
		} else if (konamiCount == 3) {
			shake($('#screen'));
		} else if (konamiCount == 4) {
			$('#screen').css('background', 'url(/unix/puffy.png) center no-repeat');
		}
		
		$('<div>')
			.height('100%').width('100%')
			.css({background:'white', position:'absolute', top:0, left:0})
			.appendTo($('body'))
			.show()
			.fadeOut(1000);
		
		if (Terminal.buffer.substring(Terminal.buffer.length-2) == 'ba') {
			Terminal.buffer = Terminal.buffer.substring(0, Terminal.buffer.length-2);
			Terminal.updateInputDisplay();
		}
		TerminalShell.sudo = true;
		konamiCount += 1;
	});
});
