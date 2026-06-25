---
id: string-functions
title: String functions
sidebar_label: String Functions
---

## `$string()`

**Signature:** `$string(arg, prettify)`

Casts the `arg` parameter to a string using the following casting rules

- Strings are unchanged
- Functions are converted to an empty string
- Numeric infinity and NaN throw an error because they cannot be represented as a JSON number
- All other values are converted to a JSON string using the [JSON.stringify](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) function

If `arg` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `arg`.

If `prettify` is true, then "prettified" JSON is produced. i.e One line per field and lines will be indented based on the field depth.

**Examples**

- `$string(5)` => `"5"`
- `[1..5].$string()` => `["1", "2", "3", "4", "5"]`

## `$length()`

**Signature:** `$length(str)`

Returns the number of characters in the string `str`. If `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`. An error is thrown if `str` is not a string.

**Examples**

- `$length("Hello World")` => `11`

## `$substring()`

**Signature:** `$substring(str, start[, length])`

Returns a string containing the characters in the first parameter `str` starting at position `start` (zero-offset). If `str` is not specified (i.e. this function is invoked with only the numeric argument(s)), then the context value is used as the value of `str`. An error is thrown if `str` is not a string.

If `length` is specified, then the substring will contain maximum `length` characters.

If `start` is negative then it indicates the number of characters from the end of `str`. See [substr](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substr) for full definition.

**Examples**

- `$substring("Hello World", 3)` => `"lo World"`
- `$substring("Hello World", 3, 5)` => `"lo Wo"`
- `$substring("Hello World", -4)` => `"orld"`
- `$substring("Hello World", -4, 2)` => `"or"`

## `$substringBefore()`

**Signature:** `$substringBefore(str, chars)`

Returns the substring before the first occurrence of the character sequence `chars` in `str`. If `str` is not specified (i.e. this function is invoked with only one argument), then the context value is used as the value of `str`. If `str` does not contain `chars`, then it returns `str`. An error is thrown if `str` and `chars` are not strings.

**Examples**

- `$substringBefore("Hello World", " ")` => `"Hello"`

## `$substringAfter()`

**Signature:** `$substringAfter(str, chars)`

Returns the substring after the first occurrence of the character sequence `chars` in `str`. If `str` is not specified (i.e. this function is invoked with only one argument), then the context value is used as the value of `str`. If `str` does not contain `chars`, then it returns `str`. An error is thrown if `str` and `chars` are not strings.

**Examples**

- `$substringAfter("Hello World", " ")` => `"World"`

## `$uppercase()`

**Signature:** `$uppercase(str)`

Returns a string with all the characters of `str` converted to uppercase. If `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`. An error is thrown if `str` is not a string.

**Examples**

- `$uppercase("Hello World")` => `"HELLO WORLD"`

## `$lowercase()`

**Signature:** `$lowercase(str)`

Returns a string with all the characters of `str` converted to lowercase. If `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`. An error is thrown if `str` is not a string.

**Examples**

- `$lowercase("Hello World")` => `"hello world"`

## `$trim()`

**Signature:** `$trim(str)`

Normalizes and trims all whitespace characters in `str` by applying the following steps:

- All tabs, carriage returns, and line feeds are replaced with spaces.
- Contiguous sequences of spaces are reduced to a single space.
- Trailing and leading spaces are removed.

If `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`. An error is thrown if `str` is not a string.

**Examples**

- `$trim("   Hello    \n World  ")` => `"Hello World"`

## `$pad()`

**Signature:** `$pad(str, width [, char])`

Returns a copy of the string `str` with extra padding, if necessary, so that its total number of characters is at least the absolute value of the `width` parameter. If `width` is a positive number, then the string is padded to the right; if negative, it is padded to the left. The optional `char` argument specifies the padding character(s) to use. If not specified, it defaults to the space character.

**Examples**

- `$pad("foo", 5)` => `"foo  "`
- `$pad("foo", -5)` => `"  foo"`
- `$pad("foo", -5, "#")` => `"##foo"`
- `$formatBase(35, 2) ~> $pad(-8, '0')` => `"00100011"`

## `$contains()`

**Signature:** `$contains(str, pattern)`

Returns `true` if `str` is matched by `pattern`, otherwise it returns `false`. If `str` is not specified (i.e. this function is invoked with one argument), then the context value is used as the value of `str`.

The `pattern` parameter can either be a string or a regular expression (regex). If it is a string, the function returns `true` if the characters within `pattern` are contained contiguously within `str`. If it is a regex, the function will return `true` if the regex matches the contents of `str`.

**Examples**

- `$contains("abracadabra", "bra")` => `true`
- `$contains("abracadabra", /a.*a/)` => `true`
- `$contains("abracadabra", /ar.*a/)` => `false`
- `$contains("Hello World", /wo/)` => `false`
- `$contains("Hello World", /wo/i)` => `true`
- `Phone[$contains(number, /^077/)]` => `{ "type": "mobile", "number": "077 7700 1234" }`

## `$split()`

**Signature:** `$split(str, separator [, limit])`

Splits the `str` parameter into an array of substrings. If `str` is not specified, then the context value is used as the value of `str`. It is an error if `str` is not a string.

The `separator` parameter can either be a string or a regular expression (regex). If it is a string, it specifies the characters within `str` about which it should be split. If it is the empty string, `str` will be split into an array of single characters. If it is a regex, it splits the string around any sequence of characters that match the regex.

The optional `limit` parameter is a number that specifies the maximum number of substrings to include in the resultant array. Any additional substrings are discarded. If `limit` is not specified, then `str` is fully split with no limit to the size of the resultant array. It is an error if `limit` is not a non-negative number.

**Examples**

- `$split("so many words", " ")` => `[ "so", "many", "words" ]`
- `$split("so many words", " ", 2)` => `[ "so", "many" ]`
- `$split("too much, punctuation. hard; to read", /[ ,.;]+/)` => `["too", "much", "punctuation", "hard", "to", "read"]`

## `$join()`

**Signature:** `$join(array[, separator])`

Joins an array of component strings into a single concatenated string with each component string separated by the optional `separator` parameter.

It is an error if the input array contains an item which isn't a string.

If `separator` is not specified, then it is assumed to be the empty string, i.e. no separator between the component strings. It is an error if `separator` is not a string.

**Examples**

- `$join(['a','b','c'])` => `"abc"`
- `$split("too much, punctuation. hard; to read", /[ ,.;]+/, 3) ~> $join(', ')` => `"too, much, punctuation"`

## `$match()`

**Signature:** `$match(str, pattern [, limit])`

Applies the `str` string to the `pattern` regular expression and returns an array of objects, with each object containing information about each occurrence of a match withing `str`.

The object contains the following fields:

- `match` - the substring that was matched by the regex.
- `index` - the offset (starting at zero) within `str` of this match.
- `groups` - if the regex contains capturing groups (parentheses), this contains an array of strings representing each captured group.

If `str` is not specified, then the context value is used as the value of `str`. It is an error if `str` is not a string.

**Examples**

`$match("ababbabbcc",/a(b+)/)` =>

```
[
  {
    "match": "ab",
    "index": 0,
    "groups": ["b"]
  },
  {
    "match": "abb",
    "index": 2,
    "groups": ["bb"]
  },
  {
    "match": "abb",
    "index": 5,
    "groups": ["bb" ]
  }
]
```

## `$replace()`

**Signature:** `$replace(str, pattern, replacement [, limit])`

Finds occurrences of `pattern` within `str` and replaces them with `replacement`.

If `str` is not specified, then the context value is used as the value of `str`. It is an error if `str` is not a string.

The `pattern` parameter can either be a string or a regular expression (regex). If it is a string, it specifies the substring(s) within `str` which should be replaced. If it is a regex, its is used to find .

The `replacement` parameter can either be a string or a function. If it is a string, it specifies the sequence of characters that replace the substring(s) that are matched by `pattern`. If `pattern` is a regex, then the `replacement` string can refer to the characters that were matched by the regex as well as any of the captured groups using a `$` followed by a number `N`:

- If `N = 0`, then it is replaced by substring matched by the regex as a whole.
- If `N > 0`, then it is replaced by the substring captured by the Nth parenthesised group in the regex.
- If `N` is greater than the number of captured groups, then it is replaced by the empty string.
- A literal `$` character must be written as `$$` in the `replacement` string

If the `replacement` parameter is a function, then it is invoked for each match occurrence of the `pattern` regex. The `replacement` function must take a single parameter which will be the object structure of a regex match as described in the `$match` function; and must return a string.

The optional `limit` parameter, is a number that specifies the maximum number of replacements to make before stopping. The remainder of the input beyond this limit will be copied to the output unchanged.

**Examples**

  <div class="jsonata-ex">
    <div>$replace("John Smith and John Jones", "John", "Mr")</div>
    <div>"Mr Smith and Mr Jones"</div>
  </div>

  <div class="jsonata-ex">
    <div>$replace("John Smith and John Jones", "John", "Mr", 1)</div>
    <div>"Mr Smith and John Jones"</div>
  </div>

  <div class="jsonata-ex">
    <div>$replace("abracadabra", /a.*?a/, "*")</div>
    <div>"*c*bra"</div>
  </div>

  <div class="jsonata-ex">
    <div>$replace("John Smith", /(\w+)\s(\w+)/, "$2, $1")</div>
    <div>"Smith, John"</div>
  </div>

  <div class="jsonata-ex">
    <div>$replace("265USD", /([0-9]+)USD/, "$$$1")</div>
    <div>"$265"</div>
  </div>

  <div class="jsonata-ex">
    <div>(
  $convert := function($m) {
    ($number($m.groups[0]) - 32) * 5/9 & "C"
  };
  $replace("temperature = 68F today", /(\d+)F/, $convert)
)</div>
    <div>"temperature = 20C today"</div>
  </div>

## `$eval()`

**Signature:** `$eval(expr [, context])`

Parses and evaluates the string `expr` which contains literal JSON or a JSONata expression using the current context as the context for evaluation.

**Examples**

<div class="jsonata-ex">
  <div>$eval("[1,2,3]")</div>
  <div>[1, 2, 3]</div>
</div>

<div class="jsonata-ex">
  <div>$eval('[1,$string(2),3]')</div>
  <div>[1,"2",3]</div>
</div>

Optionally override the context by specifying the second parameter

## `$base64encode()`

**Signature:** `$base64encode()`

Converts an ASCII string to a base 64 representation. Each each character in the string is treated as a byte of binary data. This requires that all characters in the string are in the 0x00 to 0xFF range, which includes all characters in URI encoded strings. Unicode characters outside of that range are not supported.

**Examples**

- `$base64encode("myuser:mypass")` => `"bXl1c2VyOm15cGFzcw=="`

## `$base64decode()`

**Signature:** `$base64decode()`

Converts base 64 encoded bytes to a string, using a UTF-8 Unicode codepage.

**Examples**

- `$base64decode("bXl1c2VyOm15cGFzcw==")` => `"myuser:mypass"`

## `$encodeUrlComponent()`

**Signature:** `$encodeUrlComponent(str)`

Encodes a Uniform Resource Locator (URL) component by replacing each instance of certain characters by one, two, three, or four escape sequences representing the UTF-8 encoding of the character.

**Examples**

- `$encodeUrlComponent("?x=test")` => `"%3Fx%3Dtest"`

## `$encodeUrl()`

**Signature:** `$encodeUrl(str)`

Encodes a Uniform Resource Locator (URL) by replacing each instance of certain characters by one, two, three, or four escape sequences representing the UTF-8 encoding of the character.

**Examples**

- `$encodeUrl("https://mozilla.org/?x=шеллы")` => `"https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B"`

## `$decodeUrlComponent()`

**Signature:** `$decodeUrlComponent(str)`

Decodes a Uniform Resource Locator (URL) component previously created by encodeUrlComponent.

**Examples**

- `$decodeUrlComponent("%3Fx%3Dtest")` => `"?x=test"`

## `$decodeUrl()`

**Signature:** `$decodeUrl(str)`

Decodes a Uniform Resource Locator (URL) previously created by encodeUrl.

**Examples**

- `$decodeUrl("https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B")` => `"https://mozilla.org/?x=шеллы"`
