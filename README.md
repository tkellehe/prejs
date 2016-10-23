# prejs
Pre-processor directives that can be applied client side in order to assist with writing browser independent code.

## Basics

The basic usage of __prejs__ is to provide a string of _JavaScript_ code in the `parse` function.
This will apply any pre-processor directives contained within the string and returne a modified string based on the directives.

```js
var code =
"function f() { DIRECTIVE.IFDEF.CHROME console.log("Hello CHROME user!") DIRECTIVE.ELSE console.log("Why no CHROME?") DIRECTIVE.ENDIF }"

console.log(code);
code = prejs.parse(code);
console.log(code);
// Output if using CHROME...
"function f() {                        console.log("Hello CHROME user!")                                                              }"
// Output if not using CHROME...
"function f() {                                                                         console.log("Why no CHROME?")                 }"
```

All directives in __prejs__ start with `DIRECTIVE` where the delimiter between each directive is `.`.
This character was choosen because it is still valid syntax in _JavaScript_ which allows for 
your code to go through minification and still have the directives.

Also when a directive is removed, whitespace replaces the characters that are needed to be removed.
This allows for the parser to not re-ajust for the offset created when removing directives and
makes sure that the _JavaScript_ created will not have anything connected that was not supposed to be before.

## DEFINE

Adds an object to the `DEFS` property of __prejs__. Takes the next string of valid word characters following the delimiter after
the directive. Then adds a property to `DEFS` named by that string. This can now be used in directives such as `UNDEF`
and other that rely on an existance of a variable.

```js
DIRECTIVE.DEFINE.IN_MY_FILE
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
// Apply processing...
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
// Executing f...
/* === output ==
 * true
 */
```

It is important to note that if a variable was already defined it will be removed and a new one will be created.

Here are some built-in variables which use the code from
[here](http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser)
to choose if they are to be defined:

`FIRE_FOX`, `SAFARI`, `IE`, `EDGE`, `CHROME`, and `BLINK`.

## UNDEF

Removes an object from the `DEFS` property of __prejs__. Takes the next string of valid word characters following the delimiter after
the directive. Then removes a property from `DEFS` named by that string.

```js
DIRECTIVE.DEFINE.IN_MY_FILE
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
DIRECTIVE.UNDEF.IN_MY_FILE
// Apply processing...
function f() {console.log(prejs.DEFS.IN_MY_FILE !== undefined)}
// Executing f...
/* === output ==
 * false
 */
```

## IFDEF

