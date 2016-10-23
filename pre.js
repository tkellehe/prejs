(function(global){

/////////////////////////////////////////////////////////////////////////////////////////
/// Special processing for handling if based directives
/////////////////////////////////////////////////////////////////////////////////////////

function find_ifs_end(lexer, next) {
  var counter = 0;
  while(1) {
    next = lexer.soft_next(next.lastIndex);
    if(next.statement[1] === "ENDIF") {
      if(counter) {
        --counter;
      } else {
        next.is_end = true;
        break;
      }
    } else if(next.statement[1] === "IFDEF" ||
              next.statement[1] === "IFNDEF") {
      ++counter;
    } else if(next.statement[1] === "ELSE") {
      if(counter === 0) {
        next.is_end = false;
        break;
      }
    }
  }

  return next;
}

function remove_ifs(lexer, next) {
  var counter = 0;
  var start_region = undefined
  lexer.remove(next);
  while(1) {
    next = lexer.soft_next(next.lastIndex);
    if(next.statement[1] === "ENDIF") {
      if(counter) {
        --counter;
      } else if(start_region) {
        lexer.remove_region(start_region.index, next.end);
        break;
      } else {
        lexer.remove(next);
        break;
      }
    } else if(next.statement[1] === "IFDEF" ||
              next.statement[1] === "IFNDEF") {
      ++counter;
    } else if(next.statement[1] === "ELSE") {
      if(counter === 0 && start_region === undefined) {
        start_region = next;
      }
    }
  }
}

function process_ifs(lexer, capture, didPass) {
  var next = find_ifs_end(lexer, capture);
  if(didPass) {
    remove_ifs(lexer, capture);
  } else {
    // Did not pass therein check to see if next statement is successful.
    lexer.remove_region(capture.index, next.index);
    if(next.is_end) {
      lexer.remove(next);
    } else {
      // Need to keep going until all have been evaluated.
      prejs[next.statement[1]](lexer, next, 2);
    }
  }
}

/////////////////////////////////////////////////////////////////////////////////////////
/// All of the directives contained within prejs.
/////////////////////////////////////////////////////////////////////////////////////////
var prejs = {
  DEFS: {},
  DEF: function(lexer, capture, start) {
    delete prejs.DEFS[capture.statement[start]];
    prejs.DEFS[capture.statement[start]] = {};

    lexer.remove(capture);
  },
  UNDEF: function(lexer, capture, start) {
    delete prejs.DEFS[capture.statement[start]];

    lexer.remove(capture);
  },
  IFDEF: function(lexer, capture, start) {
    process_ifs(lexer, capture, prejs.DEFS[capture.statement[start]] !== undefined);
  },
  IFNDEF: function(lexer, capture, start) {
    process_ifs(lexer, capture, prejs.DEFS[capture.statement[start]] === undefined);
  },
  ELSE: function(lexer, capture, start) {
    if(capture.statement[start] === undefined) {
      process_ifs(lexer, capture, true);
    } else {
      prejs[capture.statement[start]](lexer, capture, start + 1);
    }
  },
  REPEAT: function(lexer, capture, start) {
    // First must find the valid ENDREPEAT.
    var counter = 0, next = capture;
    while(1) {
      next = lexer.soft_next(next.lastIndex);
      if(next.statement[1] === "ENDREPEAT") {
        if(counter) {
          --counter;
        } else {
          break;
        }
      } else if(next.statement[1] === "REPEAT") {
        ++counter;
      }
    }

    lexer.remove(capture);
    // Captue the upper and lower portions not containing the directive.
    var upper = lexer.string.slice(0, capture.end);
    var lower = lexer.string.slice(next.end);
    // The code to be repeated should be contained within.
    var code = lexer.string.slice(capture.end, next.index);
    // The replacement string that will contain the repeated code.
    var replacement = ""

    // Must ignore the first character for it should be a word character.
    var i = +capture.statement[start].slice(1);
    while(i--) replacement += code;

    lexer.string = upper + replacement + lower;
  },
  CUT: function(lexer, capture, start) {
    // First must find the valid ENDCOPY.
    var counter = 0, next = capture;
    while(1) {
      next = lexer.soft_next(next.lastIndex);
      if(next.statement[1] === "ENDCUT") {
        if(counter) {
          --counter;
        } else {
          break;
        }
      } else if(next.statement[1] === "CUT") {
        ++counter;
      }
    }

    lexer.remove(capture);
    // Captue the upper and lower portions not containing the directive.
    var upper = lexer.string.slice(0, capture.end);
    var lower = lexer.string.slice(next.end);
    // The code to be repeated should be contained within.
    var code = lexer.string.slice(capture.end, next.index);
    
    lexer.string = upper + lower;

    if(prejs.DEFS[capture.statement[2]] === undefined) {
      prejs.DEFS[capture.statement[2]] = {};
    }

    prejs.DEFS[capture.statement[2]].CODE = code;
  },
  PASTE: function(lexer, capture, start) {
    lexer.remove(capture);
    var upper = lexer.string.slice(0, capture.end);
    var lower = lexer.string.slice(capture.end);
    lexer.string = (upper + prejs.DEFS[capture.statement[2]].CODE + lower);
  }
};

/////////////////////////////////////////////////////////////////////////////////////////
/// Defines to assist users.
/////////////////////////////////////////////////////////////////////////////////////////

// Pulled from http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    // Opera 8.0+
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';
    // At least Safari 3+: "[object HTMLElementConstructor]"
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;
    // Edge 20+
var isEdge = !isIE && !!window.StyleMedia;
    // Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;
    // Blink engine detection
var isBlink = (isChrome || isOpera) && !!window.CSS;

if(isOpera) {
  prejs.DEFS["IN_OPERA"] = {};
}
if(isFirefox) {
  prejs.DEFS["IN_FIRE_FOX"] = {};
}
if(isSafari) {
  prejs.DEFS["IN_SAFARI"] = {};
}
if(isIE) {
  prejs.DEFS["IN_IE"] = {};
}
if(isEdge) {
  prejs.DEFS["IN_EDGE"] = {};
}
if(isChrome) {
  prejs.DEFS["IN_CHROME"] = {}
}
if(isBlink) {
  prejs.DEFS["IN_BLINK"] = {};
}

var isLittleEndian = ((new Uint32Array((new Uint8Array([1,2,3,4])).buffer))[0] === 0x04030201)
if(isLittleEndian) {
  prejs.DEFS["IS_LITTLE_ENDIAN"] = {};
} else {
  prejs.DEFS["IS_BIG_ENDIAN"] = {};
}

/////////////////////////////////////////////////////////////////////////////////////////
/// Actual Parsing code.
/////////////////////////////////////////////////////////////////////////////////////////

function regex_exec(regex, string) {
  var r = regex.exec(string);
  var result = {
    grabbed: "",
    groups: [],
    index: -1,
    matched: false,
    lastIndex: regex.lastIndex
  };
  if(r) {
    result.grabbed = r[0];
    result.index = r.index;
    result.matched = true;
    for(var i = 1, l = r.length; i < l; ++i) result.groups.push(r[i]);
  }

  return result;
}

/// Main class used to interface with the code provided by the user.
function Lexer(string) {
  this.regex = /(DIRECTIVE(?:\.[\w]+)+)/g;
  this.string = string;
}

Lexer.prototype.next = function() {
  var result = regex_exec(this.regex, this.string);
  if(result.matched) {
    result.statement = result.groups[0].split(".");
    result.end = result.index + result.groups[0].length;
  }
  return result;
}

Lexer.prototype.soft_next = function(lastIndex) {
  var temp = this.regex.lastIndex;
  this.regex.lastIndex = lastIndex;
  var result = this.next();
  this.regex.lastIndex = temp;
  return result;
}

// Stop is exclusive.
Lexer.prototype.remove_region = function(start, stop) {
  var filler = ""
  for(var i = start; i < stop; ++i) {
    filler += " ";
  }
  var upper = this.string.slice(0, start);
  var lower = this.string.slice(stop);
  this.string = upper + filler + lower;
}

Lexer.prototype.remove = function(capture) {
  this.remove_region(capture.index, capture.end);
}

/// Main function for the user to utilize when parsing.
prejs.parse = function(string) {
  var lexer = new Lexer(string);

  // Loop through all of the statements within the string.
  while(1) {
    var capture = lexer.next();
    if(capture.matched) {
      prejs[capture.statement[1]](lexer, capture, 2);
    } else {
      break;
    }
  }

  return lexer.string;
}

/// Takes in a block of code then creates a script tag to let the browser
/// interpret the code.
prejs.exec = function(string) {
  var script = document.createElement("script");
  script.textContent = string;
  var head = document.getElementsByTagName("head")[0];
  head.appendChild(script);
}

/// Provides the prejs object to the global object.
global.prejs = prejs;

})(this)
