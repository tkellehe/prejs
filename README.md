# prejs
Pre-processor directives that can be applied client side in order to assist with writing browser independent code.

### Basics

The basic usage of __prejs__ is to provide a string of _JavaScript_ code in the `parse` function.
This will apply any pre-processor directives contained within the string and returne a modified string based on the directives.

```js
var code =
"function f() { DIRECTIVE.IFDEF.IN_CHROME console.log("Hello CHROME user!") DIRECTIVE.ELSE console.log("Why no CHROME?") DIRECTIVE.ENDIF }"

console.log(code);
code = prejs.parse(code);
console.log(code);
// Output if using CHROME...
"function f() {                           console.log("Hello CHROME user!")                                                              }"
// Output if not using CHROME...
"function f() {                                                                            console.log("Why no CHROME?")                 }"
```

All directives in __prejs__ start with `DIRECTIVE` where the delimiter between each directive is `.`.
This character was choosen because it is still valid syntax in _JavaScript_ which allows for 
your code to go through minification and still have the directives.

Also when a directive is removed, whitespace replaces the characters that are needed to be removed.
This allows for the parser to not re-ajust for the offset created when removing directives and
makes sure that the _JavaScript_ created will not have anything connected that was not supposed to be before.

There are currently `10` different directives that can be used:

`DEF`|`UNDEF`|`IFDEF`|`IFNDEF`|`ELIFDEF`|`ELIFNDEF`|`ELSE`|`REPEAT`|`CUT`|`PASTE`

---

### `DEF`

Adds an object to the `DEFS` property of __prejs__. Takes the next string of valid word characters following the delimiter after
the directive. Then adds a property to `DEFS` named by that string. This can now be used in directives such as `UNDEF`
and other that rely on an existance of a variable.

```js
DIRECTIVE.DEF.IN_MY_FILE
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
// Apply processing...
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
// Executing f...
/* === output ==
 * true
 */
```

It is important to note that if a variable was already defined it will be removed and a new one will be created.

Here are some built-in variables pertaining to type of browser which use the code from
[here](http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser)
to choose if they are to be defined:

`IN_FIRE_FOX`, `IN_SAFARI`, `IN_IE`, `IN_EDGE`, `IN_CHROME`, and `IN_BLINK`.

The variables `IS_BIG_ENDIAN` and `IS_LITTLE_ENDIAN` are aslo supported.

### `UNDEF`

Removes an object from the `DEFS` property of __prejs__. Takes the next string of valid word characters following the delimiter after
the directive. Then removes a property from `DEFS` named by that string. It is not necessary for the variable to
exist for `UNDEF` to still work, but it is a waste of processing.

```js
DIRECTIVE.DEF.IN_MY_FILE
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
DIRECTIVE.UNDEF.IN_MY_FILE
// Apply processing...
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
// Executing f...
/* === output ==
 * false
 */
```

### `IFDEF`

The first of the directives that must be closed by an `ENDIF`. This directive will take the block of code controled
and either erase it or leave it based off of the valid word characters following the directive. If the string is
a member of `DEFS` then the code will stay else it will be removed.

```js
DIRECTIVE.DEF.IN_MY_FILE
function f() { DIRECTIVE.IFDEF.IN_MY_FILE console.log("In my file!") DIRECTIVE.ENDIF }
DIRECTIVE.UNDEF.IN_MY_FILE
// After processing...
function f() { console.log("In my file!") }
```

### `IFNDEF`

Another of the directives that must be closed by an `ENDIF`. This directive will take the block of code controled
and either erase it or leave it based off of the valid word characters following the directive. If the string is
a member of `DEFS` then the code will be removed else it will stay.

```js
DIRECTIVE.DEF.IN_MY_FILE
function f() { DIRECTIVE.IFNDEF.IN_OTHER_FILE console.log("In my file!") DIRECTIVE.ENDIF }
DIRECTIVE.UNDEF.IN_MY_FILE
// After processing...
function f() { console.log("In my file!") }
```

### `ELIFDEF` and `ELIFNDEF`

Same as `IFDEF` and `IFNDEF` except can be used as an `else-if` statement.

```js
function f() { DIRECTIVE.IFDEF.IN_CHROME console.log("In chrome!") DIRECTIVE.IFDEF.IN_IE console.log("IE?") DIRECTIVE.ENDIF }
// After processing in chrome...
function f() { console.log("In chrome!") }
// After processing in ie...
function f() { console.log("IE?") }
```

### `ELSE`

Can be used as an `if-else` statement.

```js
function f() { DIRECTIVE.IFDEF.IS_LITTLE_ENDIAN console.log("little") DIRECTIVE.ELSE console.log("big") DIRECTIVE.ENDIF }
// After processing on a little endian...
function f() { console.log("little") }
// After processing on a big endian...
function f() { console.log("big") }
```

### `REPEAT`

A directive useful when you know that there are a finite number of times a block of code needs to be run, but do
not want the cost of looping or large file. This function takes the argument following it and parses it as a
number which indicates the number of times for the code between it and its respective `ENDREPEAT`. Note this number
must begin with the letter `N` (Or any other word character that is not a number really...).

```js
DIRECTIVE.REPEAT.N3
console.log("prejs")
DIRECTIVE.ENDREPEAT
// After processing...
console.log("prejs")
console.log("prejs")
console.log("prejs")
```

### `CUT` and `PASTE`

Takes the code between it and its respective `ENDCUT` and removes the code. The code is then stored in a member of `DEFS` 
named from the argument following `CUT` then placed into a member of that called `CODE`. This then can be used with `PASTE`
by specifying the argument of `PASTE` to be the same as `CUT` which will insert the code.

```js
DIRECTIVE.CUT.NAME "MY NAME IS ..." DIRECTIVE.ENDCUT
console.log(DIRECTIVE.PASTE.NAME)
// After processing...
console.log( "My name is ..." );
```
