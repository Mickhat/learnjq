// learnjq — Complete Lesson Database
// 57 interactive lessons covering all jq features from basics to real-world patterns.
// Each lesson has: id, category, title, description, explanation (HTML),
// input JSON, optional pre-filled filter, expected output, and a hint.

const LESSONS = [
  // ═══════════════════════════════════════════
  // CATEGORY 1: BASICS
  // ═══════════════════════════════════════════
  {
    id: "identity",
    category: "Basics",
    title: "Identity: .",
    desc: "The simplest jq filter — pass through input unchanged",
    explanation: `
<p>The <code>.</code> (dot) is the <strong>identity filter</strong>. It takes the input and produces it unchanged as output.</p>
<p>Think of it as "the current value" — like <code>this</code> in JavaScript or <code>self</code> in Python.</p>
<h3>Try it</h3>
<p>The filter <code>.</code> is already entered. Notice the output matches the input exactly.</p>
    `,
    input: '{"name": "Alice", "age": 30}',
    filter: ".",
    expected: '{\n  "name": "Alice",\n  "age": 30\n}',
    hint: "What single character represents the current input?"
  },
  {
    id: "object-field",
    category: "Basics",
    title: "Object Field Access: .foo",
    desc: "Extract a single field from an object",
    explanation: `
<p>Use <code>.fieldname</code> to extract a specific field from a JSON object.</p>
<pre>.name     → gets the "name" field
.age      → gets the "age" field</pre>
<h3>Exercise</h3>
<p>Extract the <code>name</code> field from the input object.</p>
    `,
    input: '{"name": "Alice", "age": 30, "city": "Berlin"}',
    filter: "",
    expected: '"Alice"',
    hint: "Use dot followed by the field name to extract it."
  },
  {
    id: "nested-field",
    category: "Basics",
    title: "Nested Access: .foo.bar",
    desc: "Access deeply nested fields",
    explanation: `
<p>Chain field accesses with dots to reach nested values:</p>
<pre>.address.city      → object.address.city
.config.db.host    → three levels deep</pre>
<h3>Exercise</h3>
<p>Extract the <code>city</code> from the nested <code>address</code> object.</p>
    `,
    input: '{"name": "Alice", "address": {"street": "Main St", "city": "Berlin", "zip": "10115"}}',
    filter: "",
    expected: '"Berlin"',
    hint: "You can chain dot-access for nested fields — go deeper step by step."
  },
  {
    id: "array-index",
    category: "Basics",
    title: "Array Index: .[n]",
    desc: "Access array elements by index",
    explanation: `
<p>Use <code>.[n]</code> to access the nth element (0-indexed):</p>
<pre>.[0]    → first element
.[1]    → second element
.[-1]   → last element
.[-2]   → second to last</pre>
<h3>Exercise</h3>
<p>Get the <strong>second</strong> element from the array.</p>
    `,
    input: '["apple", "banana", "cherry", "date"]',
    filter: "",
    expected: '"banana"',
    hint: "Square brackets after dot access array indices. Remember: counting starts at 0!"
  },
  {
    id: "array-slice",
    category: "Basics",
    title: "Array Slice: .[m:n]",
    desc: "Extract a sub-array",
    explanation: `
<p>Slice arrays with <code>.[start:end]</code> (end is exclusive):</p>
<pre>.[0:2]   → first two elements
.[2:]    → from index 2 to end
.[:3]    → first three elements
.[-2:]   → last two elements</pre>
<h3>Exercise</h3>
<p>Get elements at index 1 and 2 (banana and cherry).</p>
    `,
    input: '["apple", "banana", "cherry", "date"]',
    filter: "",
    expected: '[\n  "banana",\n  "cherry"\n]',
    hint: "Slicing uses [start:end] where end is exclusive. How many elements is that?"
  },
  {
    id: "pipe",
    category: "Basics",
    title: "Pipe: |",
    desc: "Chain filters together",
    explanation: `
<p>The pipe <code>|</code> passes the output of one filter as input to the next — just like Unix pipes:</p>
<pre>.users | .[0] | .name
# Step 1: Get .users array
# Step 2: Get first element
# Step 3: Get .name field</pre>
<h3>Exercise</h3>
<p>Get the name of the first user using pipes.</p>
    `,
    input: '{"users": [{"name": "Alice", "role": "admin"}, {"name": "Bob", "role": "user"}]}',
    filter: "",
    expected: '"Alice"',
    hint: "Chain three steps: get the array, pick the first element, then extract the field."
  },
  {
    id: "comma",
    category: "Basics",
    title: "Multiple Outputs: ,",
    desc: "Produce multiple values from one input",
    explanation: `
<p>The comma <code>,</code> produces multiple outputs:</p>
<pre>.name, .age     → outputs name, then age (two separate values)
.[0], .[-1]     → first and last element</pre>
<p>Each output is on its own line in the result.</p>
<h3>Exercise</h3>
<p>Extract both <code>name</code> and <code>city</code> from the object.</p>
    `,
    input: '{"name": "Alice", "age": 30, "city": "Berlin"}',
    filter: "",
    expected: '"Alice"\n"Berlin"',
    hint: "The comma operator outputs multiple expressions separately."
  },
  {
    id: "optional",
    category: "Basics",
    title: "Optional: ?",
    desc: "Suppress errors for missing fields",
    explanation: `
<p>Adding <code>?</code> after a filter suppresses errors instead of failing:</p>
<pre>.foo?           → null if .foo doesn't exist (no error)
.[]?            → empty if input isn't iterable
.foo.bar?       → safe nested access</pre>
<h3>Exercise</h3>
<p>Try accessing <code>.missing</code> — notice it returns <code>null</code>. Now try <code>.name</code> to get the actual value.</p>
    `,
    input: '{"name": "Alice"}',
    filter: ".name",
    expected: '"Alice"',
    hint: "The ? suffix suppresses errors on missing fields. Try accessing the field name normally."
  },

  // ═══════════════════════════════════════════
  // CATEGORY 2: TYPES & VALUES
  // ═══════════════════════════════════════════
  {
    id: "types",
    category: "Types & Values",
    title: "JSON Types",
    desc: "null, boolean, number, string, array, object",
    explanation: `
<p>jq works with all JSON types:</p>
<pre>null              → null
true, false       → booleans
42, 3.14          → numbers
"hello"           → strings
[1, 2, 3]         → arrays
{"key": "value"}  → objects</pre>
<p>Use <code>type</code> to check what type a value is.</p>
<h3>Exercise</h3>
<p>Use the <code>type</code> filter to check the type of the input.</p>
    `,
    input: '{"name": "Alice", "scores": [95, 87, 92]}',
    filter: "",
    expected: '"object"',
    hint: "There is a builtin that returns the type name as a string."
  },
  {
    id: "type-check",
    category: "Types & Values",
    title: "Type Checking",
    desc: "Check types of values",
    explanation: `
<p>Check types of individual fields:</p>
<pre>.foo | type          → "string", "number", etc.
.[] | type           → type of each element
[.[] | type]         → array of types</pre>
<h3>Exercise</h3>
<p>Get an array showing the type of each value in the object.</p>
    `,
    input: '{"name": "Alice", "age": 30, "active": true, "scores": [1,2,3]}',
    filter: "",
    expected: '[\n  "string",\n  "number",\n  "boolean",\n  "array"\n]',
    hint: "Iterate the array, get each type, then collect into an array with [ ]."
  },
  {
    id: "length",
    category: "Types & Values",
    title: "Length",
    desc: "Count elements, characters, or keys",
    explanation: `
<p><code>length</code> works on multiple types:</p>
<pre>"hello" | length      → 5 (characters)
[1,2,3] | length      → 3 (elements)
{"a":1,"b":2} | length → 2 (keys)
null | length          → 0</pre>
<h3>Exercise</h3>
<p>Get the number of users in the array.</p>
    `,
    input: '{"users": ["Alice", "Bob", "Charlie", "Diana"]}',
    filter: "",
    expected: '4',
    hint: "The length builtin works on arrays, strings, and objects."
  },
  {
    id: "keys-values",
    category: "Types & Values",
    title: "Keys & Values",
    desc: "Extract keys or values from objects",
    explanation: `
<p>Decompose objects into their parts:</p>
<pre>keys       → ["age", "name"] (sorted!)
keys_unsorted → ["name", "age"] (original order)
values     → ["Alice", 30]
has("name") → true/false</pre>
<h3>Exercise</h3>
<p>Get all the keys of the input object (they'll be sorted alphabetically).</p>
    `,
    input: '{"name": "Alice", "age": 30, "city": "Berlin"}',
    filter: "",
    expected: '[\n  "age",\n  "city",\n  "name"\n]',
    hint: "A builtin extracts all keys from an object as a sorted array."
  },

  // ═══════════════════════════════════════════
  // CATEGORY 3: ARRAY OPERATIONS
  // ═══════════════════════════════════════════
  {
    id: "array-iterate",
    category: "Arrays",
    title: "Array Iteration: .[]",
    desc: "Produce each element as separate output",
    explanation: `
<p><code>.[]</code> "explodes" an array — each element becomes a separate output:</p>
<pre>[1, 2, 3] | .[]   → 1, then 2, then 3 (three outputs)</pre>
<p>This is the foundation for map/filter/transform operations.</p>
<h3>Exercise</h3>
<p>Iterate over the array to output each fruit separately.</p>
    `,
    input: '["apple", "banana", "cherry"]',
    filter: "",
    expected: '"apple"\n"banana"\n"cherry"',
    hint: "The iterator operator .[] outputs each element separately."
  },
  {
    id: "array-construct",
    category: "Arrays",
    title: "Array Construction: [...]",
    desc: "Collect outputs into a new array",
    explanation: `
<p>Wrap any expression in <code>[...]</code> to collect all its outputs into an array:</p>
<pre>[.[] | . * 2]     → double each element, collect into array
[.foo, .bar]      → array of two fields
[range(5)]        → [0, 1, 2, 3, 4]</pre>
<h3>Exercise</h3>
<p>Create an array containing just the names of all users.</p>
    `,
    input: '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}, {"name": "Charlie", "age": 35}]',
    filter: "",
    expected: '[\n  "Alice",\n  "Bob",\n  "Charlie"\n]',
    hint: "Iterate, access a field per element, then wrap results in [ ]."
  },
  {
    id: "map",
    category: "Arrays",
    title: "Map: transform each element",
    desc: "Apply a filter to every array element",
    explanation: `
<p><code>map(f)</code> applies filter <code>f</code> to each element and collects results:</p>
<pre>map(. + 1)        → add 1 to each number
map(.name)        → extract name from each object
map(select(. > 3)) → keep only elements > 3</pre>
<p><code>map(f)</code> is shorthand for <code>[.[] | f]</code>.</p>
<h3>Exercise</h3>
<p>Double every number in the array using <code>map</code>.</p>
    `,
    input: '[1, 2, 3, 4, 5]',
    filter: "",
    expected: '[\n  2,\n  4,\n  6,\n  8,\n  10\n]',
    hint: "map() applies a filter to each element. What arithmetic doubles a number?"
  },
  {
    id: "select",
    category: "Arrays",
    title: "Select: filter elements",
    desc: "Keep only elements matching a condition",
    explanation: `
<p><code>select(condition)</code> keeps the value if the condition is true, otherwise produces nothing:</p>
<pre>.[] | select(. > 3)           → numbers greater than 3
.[] | select(.age >= 18)      → adults only
.[] | select(.name | test("^A")) → names starting with A</pre>
<p>Often combined with <code>map</code>: <code>map(select(...))</code></p>
<h3>Exercise</h3>
<p>Filter the array to keep only users older than 28.</p>
    `,
    input: '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}, {"name": "Charlie", "age": 35}]',
    filter: "",
    expected: '[\n  {\n    "name": "Alice",\n    "age": 30\n  },\n  {\n    "name": "Charlie",\n    "age": 35\n  }\n]',
    hint: "select() keeps elements where a condition is true. Combine with map() or [.[] | ...]."
  },
  {
    id: "sort-by",
    category: "Arrays",
    title: "Sort: sort_by, reverse",
    desc: "Sort arrays by a field or expression",
    explanation: `
<p>Sorting functions:</p>
<pre>sort                  → sort array (natural order)
sort_by(.age)         → sort objects by age field
sort_by(.name)        → sort alphabetically by name
reverse               → reverse the array
sort_by(.age) | reverse → sort descending</pre>
<h3>Exercise</h3>
<p>Sort the users by age in ascending order.</p>
    `,
    input: '[{"name": "Charlie", "age": 35}, {"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]',
    filter: "",
    expected: '[\n  {\n    "name": "Bob",\n    "age": 25\n  },\n  {\n    "name": "Alice",\n    "age": 30\n  },\n  {\n    "name": "Charlie",\n    "age": 35\n  }\n]',
    hint: "sort_by() takes an expression. Which field determines the order?"
  },
  {
    id: "group-by",
    category: "Arrays",
    title: "Group: group_by",
    desc: "Group array elements by a key",
    explanation: `
<p><code>group_by(.field)</code> groups elements with the same field value:</p>
<pre>group_by(.dept)   → [[{dept:"eng",...},...], [{dept:"sales",...},...]]</pre>
<p>Returns an array of arrays (groups). Often combined with <code>map</code> for aggregation.</p>
<h3>Exercise</h3>
<p>Group the items by their <code>category</code> field.</p>
    `,
    input: '[{"item":"A","category":"fruit"},{"item":"B","category":"veggie"},{"item":"C","category":"fruit"},{"item":"D","category":"veggie"}]',
    filter: "",
    expected: '[\n  [\n    {\n      "item": "A",\n      "category": "fruit"\n    },\n    {\n      "item": "C",\n      "category": "fruit"\n    }\n  ],\n  [\n    {\n      "item": "B",\n      "category": "veggie"\n    },\n    {\n      "item": "D",\n      "category": "veggie"\n    }\n  ]\n]',
    hint: "group_by() creates sub-arrays by a shared value. Which field groups these items?"
  },
  {
    id: "unique",
    category: "Arrays",
    title: "Unique & Flatten",
    desc: "Deduplicate and flatten arrays",
    explanation: `
<p>Useful array transformations:</p>
<pre>unique            → remove duplicates
unique_by(.name)  → unique by a field
flatten           → flatten nested arrays: [[1],[2,3]] → [1,2,3]
flatten(1)        → flatten only 1 level deep
add               → sum numbers, concat strings/arrays</pre>
<h3>Exercise</h3>
<p>Remove duplicates from the number array.</p>
    `,
    input: '[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]',
    filter: "",
    expected: '[\n  1,\n  2,\n  3,\n  4,\n  5,\n  6,\n  9\n]',
    hint: "A builtin removes duplicates from an array."
  },
  {
    id: "min-max",
    category: "Arrays",
    title: "Min, Max, Add",
    desc: "Aggregate operations on arrays",
    explanation: `
<p>Array aggregation:</p>
<pre>min               → smallest value
max               → largest value
min_by(.age)      → object with minimum age
max_by(.score)    → object with highest score
add               → sum all elements (numbers)
add               → concatenate (strings/arrays)
length            → count elements
add / length      → average (mean)</pre>
<h3>Exercise</h3>
<p>Calculate the average of the numbers.</p>
    `,
    input: '[10, 20, 30, 40, 50]',
    filter: "",
    expected: '30',
    hint: "Average = sum / count. Two builtins give you those values."
  },
  {
    id: "range",
    category: "Arrays",
    title: "Range: generate sequences",
    desc: "Generate number sequences",
    explanation: `
<p><code>range</code> generates numbers:</p>
<pre>range(5)          → 0, 1, 2, 3, 4
range(2; 5)       → 2, 3, 4
range(0; 10; 2)   → 0, 2, 4, 6, 8 (step by 2)
[range(5)]        → [0, 1, 2, 3, 4]</pre>
<p>Note: jq uses <code>;</code> not <code>,</code> to separate arguments!</p>
<h3>Exercise</h3>
<p>Generate an array of even numbers from 0 to 10 (inclusive).</p>
    `,
    input: 'null',
    filter: "",
    expected: '[\n  0,\n  2,\n  4,\n  6,\n  8,\n  10\n]',
    hint: "range() accepts start, end, and step arguments. Wrap in [ ] to collect."
  },
  {
    id: "first-last",
    category: "Arrays",
    title: "First, Last, Nth, Limit",
    desc: "Pick specific elements from iterators",
    explanation: `
<p>Control which outputs you get:</p>
<pre>first(.[] | select(. > 3))   → first match
last(.[] | select(. > 3))    → last match
nth(2; .[] | select(. > 0))  → 3rd match
limit(3; .[])                → first 3 elements
first, last                  → shorthand for .[0], .[-1]</pre>
<h3>Exercise</h3>
<p>Get the first user whose age is over 30.</p>
    `,
    input: '[{"name":"Alice","age":25},{"name":"Bob","age":35},{"name":"Charlie","age":40}]',
    filter: "",
    expected: '{\n  "name": "Bob",\n  "age": 35\n}',
    hint: "Combine iteration + filtering, then take only the first match."
  },

  // ═══════════════════════════════════════════
  // CATEGORY 4: OBJECT OPERATIONS
  // ═══════════════════════════════════════════
  {
    id: "object-construct",
    category: "Objects",
    title: "Object Construction: {...}",
    desc: "Build new objects from existing data",
    explanation: `
<p>Construct new objects by selecting and renaming fields:</p>
<pre>{name, age}                → pick fields (shorthand)
{user: .name, years: .age} → rename fields
{(.key): .value}           → dynamic key from expression</pre>
<h3>Exercise</h3>
<p>Create a new object with only <code>name</code> and <code>city</code> from the input.</p>
    `,
    input: '{"name": "Alice", "age": 30, "city": "Berlin", "country": "DE"}',
    filter: "",
    expected: '{\n  "name": "Alice",\n  "city": "Berlin"\n}',
    hint: "Object shorthand: just list field names inside { } to pick them."
  },
  {
    id: "entries",
    category: "Objects",
    title: "to_entries / from_entries",
    desc: "Convert objects to/from key-value pairs",
    explanation: `
<p>Transform between objects and arrays of key-value pairs:</p>
<pre>to_entries    → [{"key":"name","value":"Alice"}, ...]
from_entries  → back to object
with_entries(f) → transform each entry, then back to object</pre>
<p>This is incredibly useful for transforming objects dynamically.</p>
<h3>Exercise</h3>
<p>Convert the object to an array of key-value pair objects.</p>
    `,
    input: '{"a": 1, "b": 2, "c": 3}',
    filter: "",
    expected: '[\n  {\n    "key": "a",\n    "value": 1\n  },\n  {\n    "key": "b",\n    "value": 2\n  },\n  {\n    "key": "c",\n    "value": 3\n  }\n]',
    hint: "A builtin converts objects into [{key, value}, ...] arrays."
  },
  {
    id: "with-entries",
    category: "Objects",
    title: "with_entries: transform object",
    desc: "Modify all key-value pairs in an object",
    explanation: `
<p><code>with_entries(f)</code> = <code>to_entries | map(f) | from_entries</code></p>
<pre># Prefix all keys with "old_"
with_entries(.key = "old_" + .key)

# Double all values
with_entries(.value *= 2)

# Filter entries
with_entries(select(.value > 10))</pre>
<h3>Exercise</h3>
<p>Make all keys UPPERCASE using <code>with_entries</code> and <code>ascii_upcase</code>.</p>
    `,
    input: '{"name": "Alice", "age": 30, "city": "Berlin"}',
    filter: "",
    expected: '{\n  "NAME": "Alice",\n  "AGE": 30,\n  "CITY": "Berlin"\n}',
    hint: "with_entries() lets you transform keys. How do you uppercase a string in jq?"
  },
  {
    id: "object-merge",
    category: "Objects",
    title: "Object Merge: + and *",
    desc: "Combine objects together",
    explanation: `
<p>Merge objects:</p>
<pre>. + {"new_field": "value"}   → add/overwrite fields
. * {"nested": {"a": 1}}     → deep merge (recursive)
{a:1} + {b:2}                → {a:1, b:2}
{a:1} + {a:2}                → {a:2} (right wins)</pre>
<h3>Exercise</h3>
<p>Add a <code>country</code> field with value <code>"DE"</code> to the existing object.</p>
    `,
    input: '{"name": "Alice", "city": "Berlin"}',
    filter: "",
    expected: '{\n  "name": "Alice",\n  "city": "Berlin",\n  "country": "DE"\n}',
    hint: "The + operator merges two objects. Build a small object with the new field."
  },
  {
    id: "has-in",
    category: "Objects",
    title: "has, in, contains",
    desc: "Check if keys or values exist",
    explanation: `
<p>Existence checks:</p>
<pre>has("name")         → true if key "name" exists
"name" | in({"name":1})  → true
contains({"name":"A"})   → true if input contains subset
inside({"name":"A","b":2}) → true if input is subset of arg</pre>
<h3>Exercise</h3>
<p>Check if the object has a <code>email</code> field.</p>
    `,
    input: '{"name": "Alice", "age": 30}',
    filter: "",
    expected: 'false',
    hint: "A builtin checks if a key exists and returns true/false."
  },
  {
    id: "del",
    category: "Objects",
    title: "del: remove fields",
    desc: "Delete keys from objects or elements from arrays",
    explanation: `
<p><code>del(path)</code> removes elements:</p>
<pre>del(.foo)           → remove key "foo"
del(.foo, .bar)     → remove multiple keys
del(.[2])           → remove 3rd array element
del(.[] | select(. < 0))  → remove negative numbers</pre>
<h3>Exercise</h3>
<p>Remove the <code>password</code> field from the object.</p>
    `,
    input: '{"name": "Alice", "email": "alice@example.com", "password": "secret123"}',
    filter: "",
    expected: '{\n  "name": "Alice",\n  "email": "alice@example.com"\n}',
    hint: "A builtin specifically removes fields from objects."
  },

  // ═══════════════════════════════════════════
  // CATEGORY 5: STRINGS
  // ═══════════════════════════════════════════
  {
    id: "string-interpolation",
    category: "Strings",
    title: "String Interpolation: \\(expr)",
    desc: "Embed expressions inside strings",
    explanation: `
<p>jq uses <code>\\(expression)</code> for string interpolation:</p>
<pre>"Hello \\(.name)"             → "Hello Alice"
"\\(.name) is \\(.age) years old" → "Alice is 30 years old"
"Count: \\(.items | length)"   → "Count: 5"</pre>
<h3>Exercise</h3>
<p>Create the string: <code>"Alice lives in Berlin"</code></p>
    `,
    input: '{"name": "Alice", "city": "Berlin"}',
    filter: "",
    expected: '"Alice lives in Berlin"',
    hint: "String interpolation uses \(...) inside double quotes to embed expressions."
  },
  {
    id: "string-funcs",
    category: "Strings",
    title: "String Functions",
    desc: "split, join, test, match, ltrimstr, rtrimstr",
    explanation: `
<p>Essential string operations:</p>
<pre>split(",")          → "a,b,c" → ["a","b","c"]
join("-")           → ["a","b","c"] → "a-b-c"
ascii_downcase      → "HELLO" → "hello"
ascii_upcase        → "hello" → "HELLO"
ltrimstr("http://") → remove prefix
rtrimstr(".json")   → remove suffix
startswith("http")  → true/false
endswith(".json")   → true/false
length              → string length
tostring            → convert to string
tonumber            → convert to number</pre>
<h3>Exercise</h3>
<p>Split the CSV string by commas and output as an array.</p>
    `,
    input: '"apple,banana,cherry,date"',
    filter: "",
    expected: '[\n  "apple",\n  "banana",\n  "cherry",\n  "date"\n]',
    hint: "A string builtin splits on a separator into an array."
  },
  {
    id: "regex",
    category: "Strings",
    title: "Regex: test, match, capture",
    desc: "Pattern matching with regular expressions",
    explanation: `
<p>jq has full regex support:</p>
<pre>test("pattern")       → true/false (does it match?)
match("pattern")      → match object with offset, length
capture("(?&lt;name>\\\\w+)") → named captures as object
scan("\\\\d+")          → array of all matches
sub("old";"new")      → replace first match
gsub("old";"new")     → replace all matches</pre>
<p>Flags: <code>test("pat"; "i")</code> for case-insensitive, <code>"x"</code> for extended, <code>"g"</code> for global.</p>
<h3>Exercise</h3>
<p>Extract all numbers from the string as an array.</p>
    `,
    input: '"Order #42: 3 items at $19.99 each"',
    filter: "",
    expected: '[\n  "42",\n  "3",\n  "19",\n  "99"\n]',
    hint: "scan() finds all regex matches. What regex pattern matches digits?"
  },
  {
    id: "gsub",
    category: "Strings",
    title: "Search & Replace: sub, gsub",
    desc: "Replace text in strings",
    explanation: `
<p>Replace patterns in strings:</p>
<pre>sub("world"; "jq")       → replace first "world" with "jq"
gsub("\\\\s+"; "-")         → replace all whitespace with dashes
gsub("(?&lt;x>\\\\d+)"; "N")  → replace all numbers with "N"</pre>
<h3>Exercise</h3>
<p>Replace all spaces with underscores.</p>
    `,
    input: '"hello beautiful world"',
    filter: "",
    expected: '"hello_beautiful_world"',
    hint: "gsub(pattern; replacement) replaces all matches. Two arguments separated by semicolon."
  },

  // ═══════════════════════════════════════════
  // CATEGORY 6: CONDITIONALS & LOGIC
  // ═══════════════════════════════════════════
  {
    id: "if-then-else",
    category: "Conditionals",
    title: "if-then-else",
    desc: "Conditional expressions",
    explanation: `
<p>jq's conditional syntax:</p>
<pre>if .age >= 18 then "adult" else "minor" end
if .score >= 90 then "A"
elif .score >= 80 then "B"
elif .score >= 70 then "C"
else "F" end</pre>
<p><strong>Important:</strong> <code>end</code> is required! Both <code>null</code> and <code>false</code> are falsy.</p>
<h3>Exercise</h3>
<p>Classify each score: ≥90 = "A", ≥80 = "B", ≥70 = "C", else "F".</p>
    `,
    input: '[95, 82, 67, 91, 73]',
    filter: "",
    expected: '[\n  "A",\n  "B",\n  "F",\n  "A",\n  "C"\n]',
    hint: "Use if-elif-else-end inside map(). Check the highest threshold first."
  },
  {
    id: "alternative",
    category: "Conditionals",
    title: "Alternative Operator: //",
    desc: "Provide default values",
    explanation: `
<p>The <code>//</code> operator provides a fallback for null/false:</p>
<pre>.name // "unknown"           → use "unknown" if .name is null
.config.port // 8080         → default port
(.age // 0) + 1              → safe arithmetic</pre>
<p>This is like <code>??</code> in JavaScript or <code>or</code> in Python.</p>
<h3>Exercise</h3>
<p>Get each user's nickname, falling back to their name if no nickname exists.</p>
    `,
    input: '[{"name":"Alice","nickname":"Ali"},{"name":"Bob"},{"name":"Charlie","nickname":"Chuck"}]',
    filter: "",
    expected: '[\n  "Ali",\n  "Bob",\n  "Chuck"\n]',
    hint: "The // operator provides a fallback when the left side is null or false."
  },
  {
    id: "try-catch",
    category: "Conditionals",
    title: "try-catch",
    desc: "Handle errors gracefully",
    explanation: `
<p>Catch errors instead of failing:</p>
<pre>try .foo.bar catch "error"      → "error" if path doesn't exist
try tonumber catch "not a number" → safe number conversion
try error("boom") catch .        → "boom" (. = error message)</pre>
<h3>Exercise</h3>
<p>Try to convert each value to a number; use <code>null</code> for non-numbers.</p>
    `,
    input: '["42", "hello", "3.14", "world"]',
    filter: "",
    expected: '[\n  42,\n  null,\n  3.14,\n  null\n]',
    hint: "try suppresses errors, catch provides a fallback value."
  },
  {
    id: "comparison",
    category: "Conditionals",
    title: "Comparison & Logic",
    desc: "==, !=, <, >, and, or, not",
    explanation: `
<p>All comparison and logical operators:</p>
<pre>== != < > <= >=     → comparison (work on all types)
and or not           → boolean logic
.a == .b             → compare fields
null == false        → false (different types!)
any                  → true if any element is truthy
all                  → true if all elements are truthy
any(. > 10)          → true if any element > 10
all(. > 0)           → true if all elements > 0</pre>
<h3>Exercise</h3>
<p>Check if all scores are passing (≥ 60).</p>
    `,
    input: '[85, 92, 58, 77, 63]',
    filter: "",
    expected: 'false',
    hint: "all() with a condition checks if every element passes. What is the passing threshold?"
  },

  // ═══════════════════════════════════════════
  // CATEGORY 7: UPDATE OPERATORS
  // ═══════════════════════════════════════════
  {
    id: "update",
    category: "Update Operators",
    title: "Update: |=",
    desc: "Modify values in place",
    explanation: `
<p>The update operator <code>|=</code> modifies a value at a path:</p>
<pre>.name |= ascii_upcase        → uppercase the name
.scores |= sort              → sort scores in place
.[].age |= . + 1             → increment all ages
.prices[] |= . * 1.1         → 10% price increase</pre>
<p>Think of it as: "apply this function to the value at this path".</p>
<h3>Exercise</h3>
<p>Uppercase all the names in the array of users.</p>
    `,
    input: '[{"name":"alice","age":30},{"name":"bob","age":25}]',
    filter: "",
    expected: '[\n  {\n    "name": "ALICE",\n    "age": 30\n  },\n  {\n    "name": "BOB",\n    "age": 25\n  }\n]',
    hint: "The |= operator updates in-place. Apply a string transform to a nested field."
  },
  {
    id: "arithmetic-update",
    category: "Update Operators",
    title: "Arithmetic Update: +=, -=, *=, /=",
    desc: "Modify numeric values with arithmetic",
    explanation: `
<p>Shorthand update operators:</p>
<pre>.count += 1          → increment
.price -= 5          → subtract
.scores[] *= 2       → double all scores
.tax /= 100          → divide
.tags += ["new"]     → append to array
.name += " Jr."      → append to string</pre>
<h3>Exercise</h3>
<p>Give everyone a 10% raise (multiply salary by 1.1).</p>
    `,
    input: '[{"name":"Alice","salary":50000},{"name":"Bob","salary":60000}]',
    filter: "",
    expected: '[\n  {\n    "name": "Alice",\n    "salary": 55000\n  },\n  {\n    "name": "Bob",\n    "salary": 66000\n  }\n]',
    hint: "The *= operator multiplies in-place. What multiplier gives a 10% increase?"
  },

  // ═══════════════════════════════════════════
  // CATEGORY 8: VARIABLES & FUNCTIONS
  // ═══════════════════════════════════════════
  {
    id: "variables",
    category: "Variables & Functions",
    title: "Variables: . as $x",
    desc: "Bind values to variables",
    explanation: `
<p>Store values in variables with <code>as</code>:</p>
<pre>.max_score as $max | .scores | map(. / $max * 100)
. as $orig | keys | map({key: ., value: $orig[.]})
.threshold as $t | .values | map(select(. > $t))</pre>
<p>Variables start with <code>$</code> and are immutable.</p>
<h3>Exercise</h3>
<p>Calculate each score as a percentage of the max_score.</p>
    `,
    input: '{"max_score": 50, "scores": [45, 30, 50, 25, 40]}',
    filter: "",
    expected: '[\n  90,\n  60,\n  100,\n  50,\n  80\n]',
    hint: "Bind a value with 'as $var' then reference it later in the pipeline."
  },
  {
    id: "destructure",
    category: "Variables & Functions",
    title: "Destructuring",
    desc: "Extract multiple values at once",
    explanation: `
<p>Destructure objects and arrays:</p>
<pre>. as {name: $n, age: $a} | "\\($n) is \\($a)"
. as [$first, $second] | $first + $second
.[] as {name: $n, score: $s} | "\\($n): \\($s)"</pre>
<h3>Exercise</h3>
<p>Destructure to create strings like "Alice: 30".</p>
    `,
    input: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]',
    filter: "",
    expected: '"Alice: 30"\n"Bob: 25"',
    hint: "Destructuring binds object fields to variables: . as {field: $var} | ..."
  },
  {
    id: "def-functions",
    category: "Variables & Functions",
    title: "Custom Functions: def",
    desc: "Define reusable functions",
    explanation: `
<p>Define custom functions with <code>def</code>:</p>
<pre>def double: . * 2;                    → no-arg function
def addtax(rate): . * (1 + rate);     → with parameter
def greet(name): "Hello \\(name)!";   → string function
def factorial: if . <= 1 then 1 else . * ((. - 1) | factorial) end;  → recursive!</pre>
<p>Functions must be defined before use. Chain with <code>;</code> at end.</p>
<h3>Exercise</h3>
<p>Define a <code>celsius_to_fahrenheit</code> function and apply it to all temperatures.</p>
    `,
    input: '[0, 20, 37, 100]',
    filter: "",
    expected: '[\n  32,\n  68,\n  98.6,\n  212\n]',
    hint: "Define a function with 'def name: body;' then apply it to each element."
  },
  {
    id: "reduce",
    category: "Variables & Functions",
    title: "Reduce",
    desc: "Accumulate a value across elements",
    explanation: `
<p><code>reduce</code> folds an array into a single value:</p>
<pre>reduce .[] as $x (0; . + $x)         → sum
reduce .[] as $x (""; . + $x)        → concatenate
reduce .[] as $x ({}; . + {($x.key): $x.value})  → build object</pre>
<p>Syntax: <code>reduce EXPR as $var (INIT; UPDATE)</code></p>
<h3>Exercise</h3>
<p>Use reduce to build a lookup object from an array of key-value pairs.</p>
    `,
    input: '[{"key":"name","value":"Alice"},{"key":"age","value":30},{"key":"city","value":"Berlin"}]',
    filter: "",
    expected: '{\n  "name": "Alice",\n  "age": 30,\n  "city": "Berlin"\n}',
    hint: "reduce starts with an initial value and accumulates. Start empty, merge each item."
  },
  {
    id: "foreach",
    category: "Variables & Functions",
    title: "foreach",
    desc: "Running accumulation with output at each step",
    explanation: `
<p><code>foreach</code> is like reduce but outputs at each step:</p>
<pre>foreach .[] as $x (0; . + $x)
# Running sum: 1, 3, 6, 10, 15 for [1,2,3,4,5]

foreach .[] as $x (0; . + $x; . > 10)
# With EXTRACT: outputs true/false at each step</pre>
<p>Syntax: <code>foreach EXPR as $var (INIT; UPDATE; EXTRACT)</code></p>
<h3>Exercise</h3>
<p>Generate running totals for the array.</p>
    `,
    input: '[10, 20, 30, 40, 50]',
    filter: "",
    expected: '10\n30\n60\n100\n150',
    hint: "foreach outputs intermediate accumulated values. Start at 0, keep a running total."
  },

  // ═══════════════════════════════════════════
  // CATEGORY 9: ADVANCED
  // ═══════════════════════════════════════════
  {
    id: "recursion",
    category: "Advanced",
    title: "Recursion: .., recurse",
    desc: "Walk deep into nested structures",
    explanation: `
<p><code>..</code> recursively descends into all values:</p>
<pre>.. | numbers         → all numbers, anywhere in the structure
.. | strings         → all strings
.. | select(type == "number" and . > 100)  → large numbers anywhere
[.. | .name? // empty]  → all "name" fields at any depth</pre>
<p><code>recurse(f)</code> gives more control: <code>recurse(.children[]?)</code></p>
<h3>Exercise</h3>
<p>Find all numbers anywhere in the nested structure.</p>
    `,
    input: '{"a":1,"b":{"c":2,"d":{"e":3}},"f":[4,5]}',
    filter: "",
    expected: '1\n2\n3\n4\n5',
    hint: "Recursive descent (..) visits every nested value. Combine with a type filter."
  },
  {
    id: "path-ops",
    category: "Advanced",
    title: "Path Operations",
    desc: "getpath, setpath, delpaths, path, paths",
    explanation: `
<p>Work with paths as arrays:</p>
<pre>path(.a.b)           → ["a","b"]
getpath(["a","b"])   → value at .a.b
setpath(["a","b"]; 42) → set .a.b to 42
delpaths([["a"]])    → delete .a
paths                → all paths as arrays
[paths(numbers)]     → paths to all numbers
leaf_paths           → paths to all leaf values</pre>
<h3>Exercise</h3>
<p>Get all paths that lead to string values.</p>
    `,
    input: '{"name":"Alice","age":30,"address":{"city":"Berlin","zip":"10115"}}',
    filter: "",
    expected: '[\n  "name"\n]\n[\n  "address",\n  "city"\n]\n[\n  "address",\n  "zip"\n]',
    hint: "paths() with a filter returns path arrays to matching values."
  },
  {
    id: "format-strings",
    category: "Advanced",
    title: "Format Strings: @base64, @csv, @html, @uri",
    desc: "Encode values in various formats",
    explanation: `
<p>Format strings encode data:</p>
<pre>@base64              → base64 encode
@base64d             → base64 decode
@csv                 → CSV format (for arrays)
@tsv                 → tab-separated
@html                → HTML entity encode
@uri                 → URL encode
@json                → JSON encode (as string)
@text                → plain text</pre>
<h3>Exercise</h3>
<p>Convert the arrays to CSV lines.</p>
    `,
    input: '[["Alice",30,"Berlin"],["Bob",25,"Munich"]]',
    filter: "",
    expected: '"Alice",30,"Berlin"\n"Bob",25,"Munich"',
    rawOutput: true,
    hint: "Format strings (@csv, @tsv, etc.) convert arrays to formatted strings."
  },
  {
    id: "env",
    category: "Advanced",
    title: "Environment: env, $ENV",
    desc: "Access environment variables",
    explanation: `
<p>Access system environment variables:</p>
<pre>env.HOME             → "/home/user"
env.PATH             → PATH variable
$ENV.HOME            → same thing
$ENV | keys[:5]      → first 5 env var names</pre>
<p>Useful for making jq scripts configurable.</p>
<h3>Exercise</h3>
<p>This is a demo — just use <code>.</code> to pass through the input. In real use, <code>env</code> reads actual environment variables.</p>
    `,
    input: '{"demo": "env vars require -n flag and real shell"}',
    filter: ".",
    expected: '{\n  "demo": "env vars require -n flag and real shell"\n}',
    hint: "Sometimes the simplest filter is all you need."
  },
  {
    id: "streaming",
    category: "Advanced",
    title: "Streaming: tostream, fromstream",
    desc: "Process data as a stream of path-value pairs",
    explanation: `
<p>Streaming decomposes JSON into path-value pairs:</p>
<pre>tostream     → [["name"],"Alice"], [["age"],30], ...
fromstream   → reconstruct from stream
truncate_stream(f)  → remove top-level path element</pre>
<p>Useful for processing very large JSON without loading entirely into memory.</p>
<h3>Exercise</h3>
<p>Convert the object to a stream of path-value pairs and keep only the leaf entries.</p>
    `,
    input: '{"a": 1, "b": 2}',
    filter: "",
    expected: '[\n  [\n    "a"\n  ],\n  1\n]\n[\n  [\n    "b"\n  ],\n  2\n]',
    hint: "tostream produces [path, value] pairs. Filter for entries that have both parts."
  },
  {
    id: "sql-style",
    category: "Advanced",
    title: "SQL-Style: INDEX, IN, GROUP_BY",
    desc: "Database-style operations",
    explanation: `
<p>jq has SQL-inspired functions:</p>
<pre>INDEX(.name)              → build lookup by name: {"Alice": {...}, ...}
INDEX(.[]; .id)           → index array by .id
IN("Alice", "Bob")        → check if value is in set
GROUP_BY(.dept)           → group (like SQL GROUP BY)
[.[] | {key: .id | tostring, value: .}] | from_entries  → manual INDEX</pre>
<h3>Exercise</h3>
<p>Create a lookup object indexed by the <code>id</code> field.</p>
    `,
    input: '[{"id":"a1","name":"Alice"},{"id":"b2","name":"Bob"},{"id":"c3","name":"Charlie"}]',
    filter: "",
    expected: '{\n  "a1": {\n    "id": "a1",\n    "name": "Alice"\n  },\n  "b2": {\n    "id": "b2",\n    "name": "Bob"\n  },\n  "c3": {\n    "id": "c3",\n    "name": "Charlie"\n  }\n}',
    hint: "INDEX() builds a lookup object keyed by an expression."
  },
  {
    id: "limit-until-while",
    category: "Advanced",
    title: "limit, until, while, repeat",
    desc: "Loop control",
    explanation: `
<p>Control loops and iteration:</p>
<pre>limit(3; repeat(. * 2))     → 3 iterations of doubling
until(. > 100; . * 2)       → double until > 100
while(. < 100; . * 2)       → double while < 100
label $out | foreach range(10) as $x (0; . + $x; if . > 20 then ., break $out else . end)</pre>
<h3>Exercise</h3>
<p>Starting from 1, keep doubling until the result exceeds 1000.</p>
    `,
    input: '1',
    filter: "",
    expected: '1024',
    hint: "until(condition; update) loops until the condition is true."
  },

  // ═══════════════════════════════════════════
  // CATEGORY 10: REAL-WORLD PATTERNS
  // ═══════════════════════════════════════════
  {
    id: "api-response",
    category: "Real-World",
    title: "API Response Processing",
    desc: "Extract data from typical API responses",
    explanation: `
<p>APIs often return nested structures. jq excels at extracting what you need:</p>
<pre># GitHub API: get repo names
.[] | .name

# Paginated response: extract items
.data.items[] | {id, title, status}

# Error handling
if .error then .error.message else .data end</pre>
<h3>Exercise</h3>
<p>Extract an array of objects with just <code>name</code> and <code>stars</code> from the API response, sorted by stars descending.</p>
    `,
    input: '{"status":"ok","data":{"repos":[{"name":"alpha","stars":150,"lang":"Go"},{"name":"beta","stars":89,"lang":"Rust"},{"name":"gamma","stars":312,"lang":"Python"}]}}',
    filter: "",
    expected: '[\n  {\n    "name": "gamma",\n    "stars": 312\n  },\n  {\n    "name": "alpha",\n    "stars": 150\n  },\n  {\n    "name": "beta",\n    "stars": 89\n  }\n]',
    hint: "Navigate to the array, extract fields, sort, and reverse. Chain with pipes."
  },
  {
    id: "log-parsing",
    category: "Real-World",
    title: "Log Parsing & Aggregation",
    desc: "Analyze structured logs",
    explanation: `
<p>Process arrays of log/event objects:</p>
<pre># Count by status
group_by(.status) | map({status: .[0].status, count: length})

# Find errors
map(select(.level == "error"))

# Time-based filtering
map(select(.timestamp > "2024-01-01"))</pre>
<h3>Exercise</h3>
<p>Count how many events there are per <code>level</code> (group and count).</p>
    `,
    input: '[{"level":"info","msg":"start"},{"level":"error","msg":"fail"},{"level":"info","msg":"retry"},{"level":"warn","msg":"slow"},{"level":"error","msg":"timeout"},{"level":"info","msg":"done"}]',
    filter: "",
    expected: '[\n  {\n    "level": "error",\n    "count": 2\n  },\n  {\n    "level": "info",\n    "count": 3\n  },\n  {\n    "level": "warn",\n    "count": 1\n  }\n]',
    hint: "First group the items, then transform each group into a summary with count."
  },
  {
    id: "csv-transform",
    category: "Real-World",
    title: "JSON ↔ CSV Conversion",
    desc: "Convert between JSON and CSV formats",
    explanation: `
<p>Transform between JSON arrays and CSV:</p>
<pre># Array of objects → CSV
(.[0] | keys) as $headers |
$headers, (.[] | [.[$headers[]]]) | @csv

# Array of arrays → CSV
.[] | @csv</pre>
<h3>Exercise</h3>
<p>Convert the array of user objects to CSV lines (name,age,city).</p>
    `,
    input: '[{"name":"Alice","age":30,"city":"Berlin"},{"name":"Bob","age":25,"city":"Munich"}]',
    filter: "",
    expected: '"Alice",30,"Berlin"\n"Bob",25,"Munich"',
    rawOutput: true,
    hint: "Build an array per object with the right fields, then format each row."
  },
  {
    id: "config-transform",
    category: "Real-World",
    title: "Config File Transformation",
    desc: "Modify JSON config files",
    explanation: `
<p>Common config file operations:</p>
<pre># Set a nested value
.database.host = "prod-db.example.com"

# Toggle a boolean
.debug |= not

# Merge environment overrides
. * $env_overrides

# Remove sensitive fields
del(.credentials, .api_keys)</pre>
<h3>Exercise</h3>
<p>Update the config: set debug to false, change port to 443, and add a new "env" field with value "production".</p>
    `,
    input: '{"app":"myservice","debug":true,"port":8080,"host":"localhost"}',
    filter: "",
    expected: '{\n  "app": "myservice",\n  "debug": false,\n  "port": 443,\n  "host": "localhost",\n  "env": "production"\n}',
    hint: "The = operator sets field values. Chain assignments with pipes."
  },
  {
    id: "k8s-kubectl",
    category: "Real-World",
    title: "Kubernetes / kubectl",
    desc: "Process kubectl JSON output",
    explanation: `
<p>Common kubectl + jq patterns:</p>
<pre># List pod names and status
.items[] | {name: .metadata.name, phase: .status.phase}

# Find crashing pods
.items[] | select(.status.containerStatuses[]?.restartCount > 5)

# Extract all image names
[.items[].spec.containers[].image] | unique

# Node capacity
.items[] | {node: .metadata.name, cpu: .status.capacity.cpu}</pre>
<h3>Exercise</h3>
<p>Extract pod names and their ready status from the kubectl output.</p>
    `,
    input: '{"items":[{"metadata":{"name":"web-abc12","namespace":"default"},"status":{"phase":"Running","containerStatuses":[{"ready":true}]}},{"metadata":{"name":"api-def34","namespace":"default"},"status":{"phase":"Pending","containerStatuses":[{"ready":false}]}}]}',
    filter: "",
    expected: '[\n  {\n    "name": "web-abc12",\n    "ready": true\n  },\n  {\n    "name": "api-def34",\n    "ready": false\n  }\n]',
    hint: "Navigate the nested structure step by step. Extract just what you need into a new object."
  },
  {
    id: "terraform",
    category: "Real-World",
    title: "Terraform State",
    desc: "Query Terraform state files",
    explanation: `
<p>Extract info from Terraform state JSON:</p>
<pre># List all resources
.resources[] | {type, name, provider}

# Find specific resource types
.resources[] | select(.type == "aws_instance")

# Extract outputs
.outputs | to_entries[] | {(.key): .value.value}</pre>
<h3>Exercise</h3>
<p>List all resources with their type and name.</p>
    `,
    input: '{"resources":[{"type":"aws_instance","name":"web","provider":"aws","instances":[{"attributes":{"id":"i-123"}}]},{"type":"aws_s3_bucket","name":"data","provider":"aws","instances":[{"attributes":{"id":"my-bucket"}}]}]}',
    filter: "",
    expected: '[\n  {\n    "type": "aws_instance",\n    "name": "web"\n  },\n  {\n    "type": "aws_s3_bucket",\n    "name": "data"\n  }\n]',
    hint: "Iterate the array and use object shorthand { } to pick specific fields."
  },
  {
    id: "docker",
    category: "Real-World",
    title: "Docker / docker inspect",
    desc: "Process Docker JSON output",
    explanation: `
<p>Docker outputs JSON that jq can process:</p>
<pre># Container IPs
.[].NetworkSettings.Networks[].IPAddress

# Port mappings
.[].NetworkSettings.Ports | to_entries[] | {port: .key, host: .value[0].HostPort}

# Image + status table
.[] | [.Names[0], .Image, .State] | @tsv</pre>
<h3>Exercise</h3>
<p>Extract container name and IP address from each container.</p>
    `,
    input: '[{"Name":"/web","State":{"Running":true},"NetworkSettings":{"Networks":{"bridge":{"IPAddress":"172.17.0.2"}}}},{"Name":"/db","State":{"Running":true},"NetworkSettings":{"Networks":{"bridge":{"IPAddress":"172.17.0.3"}}}}]',
    filter: "",
    expected: '[\n  {\n    "name": "/web",\n    "ip": "172.17.0.2"\n  },\n  {\n    "name": "/db",\n    "ip": "172.17.0.3"\n  }\n]',
    hint: "Navigate deeply nested paths. Rename fields in the output object with {newname: .path}."
  }
];
