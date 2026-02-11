// learnjq — Filter Explainer (explainshell-style for jq)
// Tokenizes any jq filter expression and annotates each token
// with its type, description, and documentation.
// Uses a hand-written tokenizer that understands jq syntax:
// strings, variables, dot-access, operators, builtins, keywords, etc.

const JQ_TOKENS = {
  // Identity & Access
  '.': { cat: 'access', desc: 'Identity — returns the entire input unchanged', doc: 'The simplest filter. Takes the input and produces it as output.' },
  '.[]': { cat: 'access', desc: 'Iterate — outputs each element of an array or each value of an object', doc: 'If the input is [1,2,3], outputs 1, 2, 3 separately.' },
  '.[]?': { cat: 'access', desc: 'Iterate (safe) — like .[] but suppresses errors on non-iterable input', doc: 'Won\'t error if input is null, string, number, etc.' },
  '..': { cat: 'access', desc: 'Recursive descent — outputs every value at every level of nesting', doc: 'Useful for searching deeply nested structures.' },

  // Pipe & Comma
  '|': { cat: 'operator', desc: 'Pipe — sends the output of the left filter as input to the right filter', doc: 'Like Unix pipes. .foo | .bar is equivalent to .foo.bar' },
  ',': { cat: 'operator', desc: 'Output both — produces multiple outputs by running each expression', doc: '.a, .b outputs .a then .b. Can be used anywhere.' },

  // Comparison
  '==': { cat: 'operator', desc: 'Equal — true if both values are identical', doc: 'Works on all types including objects and arrays.' },
  '!=': { cat: 'operator', desc: 'Not equal — true if values differ', doc: 'Opposite of ==' },
  '<': { cat: 'operator', desc: 'Less than', doc: 'For numbers, strings (lexicographic), and null < false < true < number < string < array < object' },
  '>': { cat: 'operator', desc: 'Greater than', doc: 'See < for type ordering.' },
  '<=': { cat: 'operator', desc: 'Less than or equal', doc: '' },
  '>=': { cat: 'operator', desc: 'Greater than or equal', doc: '' },

  // Arithmetic
  '+': { cat: 'operator', desc: 'Add — numbers: sum; strings: concat; arrays: concat; objects: merge', doc: 'Type-polymorphic. null + x = x.' },
  '-': { cat: 'operator', desc: 'Subtract — numbers or array difference', doc: '[1,2,3] - [2] = [1,3]' },
  '*': { cat: 'operator', desc: 'Multiply — numbers or deep-merge objects', doc: 'obj * obj does recursive merge.' },
  '/': { cat: 'operator', desc: 'Divide — numbers or split string', doc: '"a,b,c" / "," = ["a","b","c"]' },
  '%': { cat: 'operator', desc: 'Modulo — remainder after division', doc: '' },

  // Update
  '|=': { cat: 'operator', desc: 'Update — apply filter to the selected value in-place', doc: '.a |= . + 1 increments .a' },
  '+=': { cat: 'operator', desc: 'Add-update — shorthand for |= . +', doc: '.a += 1 is .a |= . + 1' },
  '-=': { cat: 'operator', desc: 'Subtract-update', doc: '.a -= 1' },
  '*=': { cat: 'operator', desc: 'Multiply-update', doc: '' },
  '/=': { cat: 'operator', desc: 'Divide-update', doc: '' },
  '//': { cat: 'operator', desc: 'Alternative — use right value if left is null or false', doc: '.foo // "default" — like a null coalescing operator.' },

  // Logic
  'and': { cat: 'keyword', desc: 'Logical AND — true if both operands are truthy', doc: 'null and false are falsy; everything else is truthy.' },
  'or': { cat: 'keyword', desc: 'Logical OR — true if either operand is truthy', doc: '' },
  'not': { cat: 'keyword', desc: 'Logical NOT — inverts truthiness', doc: 'null | not = true. 0 | not = false (0 is truthy!)' },

  // Conditionals
  'if': { cat: 'keyword', desc: 'Start conditional — if COND then EXPR elif COND then EXPR else EXPR end', doc: 'else is required. elif is optional.' },
  'then': { cat: 'keyword', desc: 'Then branch of if-then-else', doc: '' },
  'elif': { cat: 'keyword', desc: 'Else-if branch', doc: 'Can chain multiple elif.' },
  'else': { cat: 'keyword', desc: 'Else branch (required in jq)', doc: 'Unlike most languages, else is not optional.' },
  'end': { cat: 'keyword', desc: 'End of if-then-else or try-catch block', doc: '' },
  'try': { cat: 'keyword', desc: 'Suppress errors — if expression fails, produce no output', doc: 'try .foo catches errors from missing keys.' },
  'catch': { cat: 'keyword', desc: 'Handle errors — . inside catch is the error message string', doc: 'try .foo catch "fallback"' },

  // Variables & Functions
  'as': { cat: 'keyword', desc: 'Bind to variable — EXPR as $name | ...', doc: '.foo as $x | ... binds .foo to $x for the rest of the pipeline.' },
  'def': { cat: 'keyword', desc: 'Define function — def name(args): body;', doc: 'args separated by ; not commas.' },
  'reduce': { cat: 'keyword', desc: 'Fold/accumulate — reduce EXPR as $var (init; update)', doc: 'Like Array.reduce(). Loops over EXPR, accumulates result.' },
  'foreach': { cat: 'keyword', desc: 'Running accumulation — foreach EXPR as $var (init; update; extract)', doc: 'Like reduce but outputs intermediate values.' },
  'label': { cat: 'keyword', desc: 'Label for break — label $name | ...', doc: 'Used with break for early exit from loops.' },
  'break': { cat: 'keyword', desc: 'Break out of labeled expression', doc: 'break $name exits the label $name scope.' },

  // Core builtins
  'length': { cat: 'builtin', desc: 'Length — string chars, array elements, object keys, null=0', doc: '"hi" → 2, [1,2,3] → 3, {} → 0, null → 0' },
  'utf8bytelength': { cat: 'builtin', desc: 'Byte length of string in UTF-8 encoding', doc: '"ä" | utf8bytelength = 2' },
  'keys': { cat: 'builtin', desc: 'Object keys as sorted array, or array indices', doc: '{"b":1,"a":2} → ["a","b"]. [5,6] → [0,1]' },
  'keys_unsorted': { cat: 'builtin', desc: 'Object keys in original insertion order', doc: '' },
  'values': { cat: 'builtin', desc: 'Object values as array', doc: '{"a":1,"b":2} → [1,2]' },
  'type': { cat: 'builtin', desc: 'Type name as string — "null","boolean","number","string","array","object"', doc: '' },
  'empty': { cat: 'builtin', desc: 'Produce no output at all', doc: 'Useful in conditionals: if .x then . else empty end' },
  'error': { cat: 'builtin', desc: 'Raise an error with the input as message', doc: '"bad input" | error stops execution.' },
  'null': { cat: 'literal', desc: 'JSON null value', doc: '' },
  'true': { cat: 'literal', desc: 'JSON boolean true', doc: '' },
  'false': { cat: 'literal', desc: 'JSON boolean false', doc: '' },

  // Type conversion
  'tostring': { cat: 'builtin', desc: 'Convert to string', doc: '42 → "42", null → "null"' },
  'tonumber': { cat: 'builtin', desc: 'Convert string to number', doc: '"42" → 42. Errors on non-numeric strings.' },
  'tojson': { cat: 'builtin', desc: 'Serialize value as JSON string', doc: '{a:1} | tojson = "{\"a\":1}"' },
  'fromjson': { cat: 'builtin', desc: 'Parse JSON string to value', doc: '"{\"a\":1}" | fromjson = {a:1}' },
  'ascii_downcase': { cat: 'builtin', desc: 'Convert string to lowercase', doc: '"HELLO" → "hello"' },
  'ascii_upcase': { cat: 'builtin', desc: 'Convert string to uppercase', doc: '' },

  // String builtins
  'ltrimstr': { cat: 'builtin', desc: 'Remove prefix string if present', doc: '"hello" | ltrimstr("hel") = "lo"' },
  'rtrimstr': { cat: 'builtin', desc: 'Remove suffix string if present', doc: '"hello" | rtrimstr("lo") = "hel"' },
  'startswith': { cat: 'builtin', desc: 'Test if string starts with argument (boolean)', doc: '' },
  'endswith': { cat: 'builtin', desc: 'Test if string ends with argument (boolean)', doc: '' },
  'split': { cat: 'builtin', desc: 'Split string into array by separator', doc: '"a,b,c" | split(",") = ["a","b","c"]' },
  'join': { cat: 'builtin', desc: 'Join array elements into string with separator', doc: '["a","b"] | join("-") = "a-b"' },
  'test': { cat: 'builtin', desc: 'Test if string matches regex (boolean)', doc: '"foo123" | test("[0-9]+") = true. Use test("re";"i") for case-insensitive.' },
  'match': { cat: 'builtin', desc: 'Regex match details — returns {offset, length, string, captures}', doc: '' },
  'capture': { cat: 'builtin', desc: 'Named regex captures as object', doc: '"foo42" | capture("(?<word>\\w+)(?<num>\\d+)") = {word:"foo4",num:"2"}' },
  'scan': { cat: 'builtin', desc: 'Find all regex matches as array of arrays', doc: '"12ab34" | scan("[0-9]+") = [["12"],["34"]]' },
  'sub': { cat: 'builtin', desc: 'Replace first regex match', doc: '"hello" | sub("l";"L") = "heLlo"' },
  'gsub': { cat: 'builtin', desc: 'Replace all regex matches', doc: '"hello" | gsub("l";"L") = "heLLo"' },
  'explode': { cat: 'builtin', desc: 'String to array of Unicode codepoints', doc: '"Hi" → [72,105]' },
  'implode': { cat: 'builtin', desc: 'Array of codepoints to string', doc: '[72,105] → "Hi"' },

  // Array builtins
  'map': { cat: 'builtin', desc: 'Apply filter to each element — shorthand for [.[] | f]', doc: '[1,2,3] | map(. * 2) = [2,4,6]' },
  'map_values': { cat: 'builtin', desc: 'Apply filter to each value (works on objects too)', doc: '{a:1,b:2} | map_values(. + 10) = {a:11,b:12}' },
  'select': { cat: 'builtin', desc: 'Keep value only if condition is true, otherwise produce nothing', doc: '.[] | select(.age > 30) filters array to matching elements.' },
  'sort': { cat: 'builtin', desc: 'Sort array (ascending)', doc: 'Compares by jq ordering: null < false < true < numbers < strings < arrays < objects' },
  'sort_by': { cat: 'builtin', desc: 'Sort array by expression', doc: 'sort_by(.age) sorts objects by their age field.' },
  'reverse': { cat: 'builtin', desc: 'Reverse array or string', doc: '[1,2,3] | reverse = [3,2,1]' },
  'group_by': { cat: 'builtin', desc: 'Group array into sub-arrays by expression', doc: 'group_by(.city) groups objects sharing the same city.' },
  'unique': { cat: 'builtin', desc: 'Remove duplicates (also sorts)', doc: '[3,1,2,1] | unique = [1,2,3]' },
  'unique_by': { cat: 'builtin', desc: 'Unique by expression', doc: 'unique_by(.name) keeps first occurrence per name.' },
  'flatten': { cat: 'builtin', desc: 'Flatten nested arrays into single array', doc: '[[1,[2]],3] | flatten = [1,2,3]. flatten(1) for one level.' },
  'min': { cat: 'builtin', desc: 'Minimum value in array', doc: '[3,1,2] | min = 1' },
  'max': { cat: 'builtin', desc: 'Maximum value in array', doc: '' },
  'min_by': { cat: 'builtin', desc: 'Element with minimum value of expression', doc: 'min_by(.age) returns the youngest.' },
  'max_by': { cat: 'builtin', desc: 'Element with maximum value of expression', doc: '' },
  'add': { cat: 'builtin', desc: 'Sum/concatenate all elements — numbers: sum, strings: concat, arrays: concat', doc: '[1,2,3] | add = 6. ["a","b"] | add = "ab"' },
  'any': { cat: 'builtin', desc: 'True if any element is truthy (or matches condition)', doc: 'any(. > 5) — true if any element > 5' },
  'all': { cat: 'builtin', desc: 'True if all elements are truthy (or match condition)', doc: '' },
  'first': { cat: 'builtin', desc: 'First output of expression', doc: 'first(.[] | select(. > 2))' },
  'last': { cat: 'builtin', desc: 'Last output of expression', doc: '' },
  'nth': { cat: 'builtin', desc: 'Nth output (0-based)', doc: 'nth(2; .[] | select(. > 0))' },
  'limit': { cat: 'builtin', desc: 'Take first N outputs of expression', doc: '[limit(2; .[])] takes first 2 elements.' },
  'range': { cat: 'builtin', desc: 'Generate sequence of numbers', doc: 'range(5) = 0,1,2,3,4. range(2;5) = 2,3,4.' },
  'indices': { cat: 'builtin', desc: 'All indices where value appears', doc: '"abcabc" | indices("bc") = [1,4]' },
  'index': { cat: 'builtin', desc: 'First index of value (-1 if missing)', doc: '' },
  'rindex': { cat: 'builtin', desc: 'Last index of value', doc: '' },
  'transpose': { cat: 'builtin', desc: 'Transpose 2D array (swap rows/columns)', doc: '[[1,2],[3,4]] | transpose = [[1,3],[2,4]]' },
  'until': { cat: 'builtin', desc: 'Loop until condition is true', doc: '0 | until(. >= 10; . + 3) = 12' },
  'while': { cat: 'builtin', desc: 'Loop while condition is true, outputting each step', doc: '' },
  'repeat': { cat: 'builtin', desc: 'Infinite loop — use with limit or first', doc: '1 | [limit(5; repeat(. * 2))] = [2,4,8,16,32]' },
  'recurse': { cat: 'builtin', desc: 'Recursive descent with filter', doc: '2 | recurse(. * .; . < 100) = 2, 4, 16' },
  'walk': { cat: 'builtin', desc: 'Apply filter to all values recursively (bottom-up)', doc: 'walk(if type == "string" then ascii_upcase else . end)' },
  'isnan': { cat: 'builtin', desc: 'True if value is NaN', doc: '' },
  'isinfinite': { cat: 'builtin', desc: 'True if value is infinite', doc: '' },
  'nan': { cat: 'builtin', desc: 'NaN value', doc: '' },
  'infinite': { cat: 'builtin', desc: 'Infinity value', doc: '' },
  'isempty': { cat: 'builtin', desc: 'True if expression produces no output', doc: 'isempty(empty) = true' },
  'builtins': { cat: 'builtin', desc: 'List all builtin function names', doc: '' },
  'input': { cat: 'builtin', desc: 'Read next JSON input from stdin', doc: '' },
  'inputs': { cat: 'builtin', desc: 'Read all remaining inputs', doc: '' },
  'debug': { cat: 'builtin', desc: 'Print value to stderr, pass through unchanged', doc: 'Useful for debugging pipelines.' },

  // Object builtins
  'has': { cat: 'builtin', desc: 'True if object has the given key', doc: '{a:1} | has("a") = true' },
  'in': { cat: 'builtin', desc: 'True if input key exists in given object', doc: '"a" | in({a:1}) = true' },
  'contains': { cat: 'builtin', desc: 'True if input contains the argument recursively', doc: '{a:1,b:2} | contains({a:1}) = true' },
  'inside': { cat: 'builtin', desc: 'True if input is contained inside argument', doc: 'Inverse of contains.' },
  'to_entries': { cat: 'builtin', desc: 'Object → array of {key, value} pairs', doc: '{a:1} → [{key:"a",value:1}]' },
  'from_entries': { cat: 'builtin', desc: 'Array of {key, value} → object', doc: '[{key:"a",value:1}] → {a:1}. Also works with {name,value}.' },
  'with_entries': { cat: 'builtin', desc: 'Transform object entries — shorthand for to_entries | map(f) | from_entries', doc: 'with_entries(select(.value > 1)) filters object by values.' },
  'del': { cat: 'builtin', desc: 'Delete key or path from object/array', doc: '{a:1,b:2} | del(.a) = {b:2}' },
  'getpath': { cat: 'builtin', desc: 'Get value at path array', doc: '{a:{b:1}} | getpath(["a","b"]) = 1' },
  'setpath': { cat: 'builtin', desc: 'Set value at path array', doc: '{} | setpath(["a","b"]; 1) = {a:{b:1}}' },
  'delpaths': { cat: 'builtin', desc: 'Delete multiple paths', doc: '' },
  'path': { cat: 'builtin', desc: 'Path to value as array of keys/indices', doc: '{a:{b:1}} | path(.a.b) = ["a","b"]' },
  'paths': { cat: 'builtin', desc: 'All paths in the value', doc: 'Can filter: paths(type == "number")' },
  'leaf_paths': { cat: 'builtin', desc: 'Paths to leaf (non-container) values', doc: '' },
  'tostream': { cat: 'builtin', desc: 'Convert to stream of [path, value] pairs', doc: '' },
  'fromstream': { cat: 'builtin', desc: 'Reconstruct value from stream', doc: '' },
  'INDEX': { cat: 'builtin', desc: 'Build lookup object indexed by expression', doc: '[{id:1,n:"a"},{id:2,n:"b"}] | INDEX(.id) = {"1":{...},"2":{...}}' },
  'IN': { cat: 'builtin', desc: 'Check if value is in the output of expression', doc: '.[] | IN(2,3) — true for 2 and 3.' },

  // Format strings
  '@base64': { cat: 'format', desc: 'Base64 encode string', doc: '"hello" | @base64 = "aGVsbG8="' },
  '@base64d': { cat: 'format', desc: 'Base64 decode', doc: '"aGVsbG8=" | @base64d = "hello"' },
  '@csv': { cat: 'format', desc: 'Format array as CSV row', doc: '["a","b",1] | @csv = "\\"a\\",\\"b\\",1"' },
  '@tsv': { cat: 'format', desc: 'Format array as tab-separated values', doc: '' },
  '@html': { cat: 'format', desc: 'HTML entity encode', doc: '"<b>" | @html = "&lt;b&gt;"' },
  '@uri': { cat: 'format', desc: 'URL/percent encode', doc: '"hello world" | @uri = "hello%20world"' },
  '@json': { cat: 'format', desc: 'JSON-encode value as string', doc: 'Like tojson.' },
  '@text': { cat: 'format', desc: 'Convert to plain text (tostring)', doc: '' },
};

// Category colors
const CAT_COLORS = {
  access: '#7dcfff',    // cyan
  operator: '#bb9af7',  // purple
  keyword: '#ff9e64',   // orange
  builtin: '#7aa2f7',   // blue
  literal: '#9ece6a',   // green
  format: '#e0af68',    // yellow
  string: '#9ece6a',    // green
  number: '#ff9e64',    // orange
  variable: '#f7768e',  // red/pink
  unknown: '#565f89',   // dim
  field: '#c0caf5',     // fg
};

// Tokenize a jq filter into annotated segments
function tokenizeJq(filter) {
  const tokens = [];
  let i = 0;
  const s = filter;

  while (i < s.length) {
    // Skip whitespace
    if (/\s/.test(s[i])) {
      let ws = '';
      while (i < s.length && /\s/.test(s[i])) ws += s[i++];
      tokens.push({ text: ws, cat: 'space' });
      continue;
    }

    // String literals
    if (s[i] === '"') {
      let str = '"';
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === '\\') { str += s[i++]; }
        str += s[i++];
      }
      if (i < s.length) str += s[i++]; // closing "
      tokens.push({ text: str, cat: 'string', desc: 'String literal', doc: 'Supports \\n, \\t, \\( interpolation)' });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(s[i]) && (i === 0 || !/\w/.test(s[i-1]))) {
      let num = '';
      while (i < s.length && /[0-9.eE+\-]/.test(s[i])) num += s[i++];
      tokens.push({ text: num, cat: 'number', desc: `Number literal: ${num}`, doc: '' });
      continue;
    }

    // Variables ($name)
    if (s[i] === '$') {
      let v = '$';
      i++;
      while (i < s.length && /\w/.test(s[i])) v += s[i++];
      if (v === '$ENV') {
        tokens.push({ text: v, ...JQ_TOKENS['$ENV'] || { cat: 'variable', desc: 'Environment variables object', doc: '' } });
      } else {
        tokens.push({ text: v, cat: 'variable', desc: `Variable ${v} — bound with "as ${v}" or function parameter`, doc: 'Variables are immutable in jq. Rebinding creates a new scope.' });
      }
      continue;
    }

    // @ format strings
    if (s[i] === '@') {
      let fmt = '@';
      i++;
      while (i < s.length && /\w/.test(s[i])) fmt += s[i++];
      const info = JQ_TOKENS[fmt];
      tokens.push({ text: fmt, cat: info?.cat || 'format', desc: info?.desc || `Format: ${fmt}`, doc: info?.doc || '' });
      continue;
    }

    // Two-char operators
    const two = s.slice(i, i+2);
    if (['|=', '+=', '-=', '*=', '/=', '%=', '//', '==', '!=', '<=', '>=', '?/'].includes(two)) {
      const info = JQ_TOKENS[two];
      tokens.push({ text: two, cat: info?.cat || 'operator', desc: info?.desc || two, doc: info?.doc || '' });
      i += 2;
      continue;
    }

    // Dot access (.foo, .foo.bar, .[n], .[], .[]?)
    if (s[i] === '.') {
      let dot = '.';
      i++;
      // .[] or .[]?
      if (i < s.length && s[i] === '[' && s[i+1] === ']') {
        dot += '[]';
        i += 2;
        if (i < s.length && s[i] === '?') { dot += '?'; i++; }
        const info = JQ_TOKENS[dot];
        tokens.push({ text: dot, cat: 'access', desc: info?.desc || 'Array/object iteration', doc: info?.doc || '' });
        continue;
      }
      // .[n] or .[n:m]
      if (i < s.length && s[i] === '[') {
        dot += '[';
        i++;
        while (i < s.length && s[i] !== ']') dot += s[i++];
        if (i < s.length) { dot += ']'; i++; }
        if (i < s.length && s[i] === '?') { dot += '?'; i++; }
        const isSlice = dot.includes(':');
        tokens.push({ text: dot, cat: 'access', desc: isSlice ? `Array slice: ${dot}` : `Array index: ${dot}`, doc: isSlice ? 'Slice [start:end] (end exclusive)' : 'Zero-based index. Negative counts from end.' });
        continue;
      }
      // .foo, .foo?, .foo[], .foo[]?
      if (i < s.length && /[a-zA-Z_]/.test(s[i])) {
        while (i < s.length && /\w/.test(s[i])) dot += s[i++];
        // Check for [] or []? after field name
        if (i + 1 < s.length && s[i] === '[' && s[i+1] === ']') {
          dot += '[]';
          i += 2;
          if (i < s.length && s[i] === '?') { dot += '?'; i++; }
          const field = dot.slice(1).replace(/\[\]\??$/, '');
          tokens.push({ text: dot, cat: 'access', desc: `Access field "${field}" then iterate all its elements`, doc: `Equivalent to .${field} | .[] — extracts the array and outputs each element.` });
          continue;
        }
        if (i < s.length && s[i] === '?') { dot += '?'; i++; }
        const field = dot.slice(1).replace('?', '');
        tokens.push({ text: dot, cat: 'field', desc: `Access field "${field}" from the input object`, doc: dot.endsWith('?') ? 'The ? suppresses errors if the field doesn\'t exist.' : 'Errors if input is not an object or field is missing (use .foo? to suppress).' });
        continue;
      }
      // .. (recursive descent)
      if (i < s.length && s[i] === '.') {
        dot += '.';
        i++;
        const info = JQ_TOKENS['..'];
        tokens.push({ text: dot, cat: 'access', desc: info?.desc || 'Recursive descent', doc: info?.doc || '' });
        continue;
      }
      // Bare .
      const info = JQ_TOKENS['.'];
      tokens.push({ text: dot, cat: 'access', desc: info?.desc || 'Identity', doc: info?.doc || '' });
      continue;
    }

    // Single-char operators/brackets
    if ('|,;()[]{}:?'.includes(s[i])) {
      const ch = s[i];
      i++;
      if (ch === '|') {
        tokens.push({ text: ch, ...JQ_TOKENS['|'] });
      } else if (ch === ',') {
        tokens.push({ text: ch, ...JQ_TOKENS[','] });
      } else if (ch === ';') {
        tokens.push({ text: ch, cat: 'operator', desc: 'Argument separator — separates function arguments', doc: 'In jq, function args are separated by ; not commas.' });
      } else if ('()'.includes(ch)) {
        tokens.push({ text: ch, cat: 'operator', desc: ch === '(' ? 'Open group/function args' : 'Close group/function args', doc: '' });
      } else if ('[]'.includes(ch)) {
        tokens.push({ text: ch, cat: 'operator', desc: ch === '[' ? 'Start array construction' : 'End array construction', doc: '[expr] collects all outputs of expr into an array.' });
      } else if ('{}'.includes(ch)) {
        tokens.push({ text: ch, cat: 'operator', desc: ch === '{' ? 'Start object construction' : 'End object construction', doc: '{key: expr} builds objects. {name} is shorthand for {name: .name}.' });
      } else if (ch === ':') {
        tokens.push({ text: ch, cat: 'operator', desc: 'Key-value separator in object construction', doc: '' });
      } else if (ch === '?') {
        tokens.push({ text: ch, cat: 'operator', desc: 'Try operator — suppress errors', doc: '.foo? is .foo with error suppression.' });
      }
      continue;
    }

    // Single-char operators
    if ('+-*/%<>='.includes(s[i])) {
      const ch = s[i];
      i++;
      const info = JQ_TOKENS[ch];
      tokens.push({ text: ch, cat: info?.cat || 'operator', desc: info?.desc || ch, doc: info?.doc || '' });
      continue;
    }

    // Words (builtins, keywords, identifiers)
    if (/[a-zA-Z_]/.test(s[i])) {
      let word = '';
      while (i < s.length && /\w/.test(s[i])) word += s[i++];
      const info = JQ_TOKENS[word];
      if (info) {
        tokens.push({ text: word, ...info });
      } else {
        // Check if inside {} — likely an object shorthand key
        let braceDepth = 0;
        let inObject = false;
        for (const prev of tokens) {
          if (prev.text === '{') braceDepth++;
          if (prev.text === '}') braceDepth--;
        }
        if (braceDepth > 0) {
          tokens.push({ text: word, cat: 'field', desc: `Object shorthand — outputs the "${word}" field as "${word}": .${word}`, doc: `{${word}} is equivalent to {"${word}": .${word}}` });
        } else {
          tokens.push({ text: word, cat: 'unknown', desc: `"${word}" — user-defined function or unknown builtin`, doc: '' });
        }
      }
      continue;
    }

    // Anything else
    tokens.push({ text: s[i], cat: 'unknown', desc: s[i], doc: '' });
    i++;
  }

  return tokens;
}
