// learnjq — Challenge Database
// 16 challenges from easy to expert difficulty.
// Each challenge has input JSON, expected output, and example solutions.
const CHALLENGES = [
  {
    id: "ch-1",
    title: "Extract Names",
    difficulty: "easy",
    desc: "Extract an array of all user names.",
    input: '[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Charlie","age":35}]',
    expected: '[\n  "Alice",\n  "Bob",\n  "Charlie"\n]',
    solutions: ["[.[].name]", "[.[] | .name]", "map(.name)"]
  },
  {
    id: "ch-2",
    title: "Sum Array",
    difficulty: "easy",
    desc: "Calculate the sum of all numbers in the array.",
    input: '[10, 20, 30, 40, 50]',
    expected: '150',
    solutions: ["add"]
  },
  {
    id: "ch-3",
    title: "Filter Adults",
    difficulty: "easy",
    desc: "Keep only users aged 18 or older.",
    input: '[{"name":"Alice","age":25},{"name":"Bob","age":15},{"name":"Charlie","age":30},{"name":"Diana","age":12}]',
    expected: '[\n  {\n    "name": "Alice",\n    "age": 25\n  },\n  {\n    "name": "Charlie",\n    "age": 30\n  }\n]',
    solutions: ["map(select(.age >= 18))", "[.[] | select(.age >= 18)]"]
  },
  {
    id: "ch-4",
    title: "Reverse Sort",
    difficulty: "easy",
    desc: "Sort the array of numbers in descending order.",
    input: '[5, 3, 8, 1, 9, 2, 7]',
    expected: '[\n  9,\n  8,\n  7,\n  5,\n  3,\n  2,\n  1\n]',
    solutions: ["sort | reverse"]
  },
  {
    id: "ch-5",
    title: "Word Count",
    difficulty: "medium",
    desc: "Count the number of words in the string.",
    input: '"The quick brown fox jumps over the lazy dog"',
    expected: '9',
    solutions: ['split(" ") | length']
  },
  {
    id: "ch-6",
    title: "Flatten & Unique",
    difficulty: "medium",
    desc: "Flatten the nested arrays and remove duplicates, sorted.",
    input: '[[1, 2, 3], [3, 4, 5], [5, 6, 1]]',
    expected: '[\n  1,\n  2,\n  3,\n  4,\n  5,\n  6\n]',
    solutions: ["flatten | unique"]
  },
  {
    id: "ch-7",
    title: "Top 3 Scorers",
    difficulty: "medium",
    desc: "Get the names of the top 3 scorers.",
    input: '[{"name":"Alice","score":85},{"name":"Bob","score":92},{"name":"Charlie","score":78},{"name":"Diana","score":95},{"name":"Eve","score":88}]',
    expected: '[\n  "Diana",\n  "Bob",\n  "Eve"\n]',
    solutions: ["sort_by(.score) | reverse | .[:3] | map(.name)", "[sort_by(-.score) | .[:3] | .[].name]"]
  },
  {
    id: "ch-8",
    title: "Group & Count",
    difficulty: "medium",
    desc: "Count items per category. Output as an object.",
    input: '[{"item":"A","cat":"fruit"},{"item":"B","cat":"veggie"},{"item":"C","cat":"fruit"},{"item":"D","cat":"fruit"},{"item":"E","cat":"veggie"}]',
    expected: '{\n  "fruit": 3,\n  "veggie": 2\n}',
    solutions: ['group_by(.cat) | map({key: .[0].cat, value: length}) | from_entries', 'reduce .[] as $x ({}; .[$x.cat] += 1)']
  },
  {
    id: "ch-9",
    title: "Nested Extract",
    difficulty: "medium",
    desc: "Extract all tags from all posts into one flat, unique, sorted array.",
    input: '{"posts":[{"title":"A","tags":["jq","json"]},{"title":"B","tags":["linux","jq"]},{"title":"C","tags":["json","bash","linux"]}]}',
    expected: '[\n  "bash",\n  "jq",\n  "json",\n  "linux"\n]',
    solutions: ["[.posts[].tags[]] | unique", ".posts | map(.tags) | flatten | unique"]
  },
  {
    id: "ch-10",
    title: "Reshape Data",
    difficulty: "hard",
    desc: "Transform the flat array into an object where keys are names and values are ages.",
    input: '[{"name":"Alice","age":30},{"name":"Bob","age":25},{"name":"Charlie","age":35}]',
    expected: '{\n  "Alice": 30,\n  "Bob": 25,\n  "Charlie": 35\n}',
    solutions: ['map({(.name): .age}) | add', 'reduce .[] as $x ({}; . + {($x.name): $x.age})', 'INDEX(.[]; .name) | map_values(.age)']
  },
  {
    id: "ch-11",
    title: "Running Average",
    difficulty: "hard",
    desc: "Calculate the running average at each position (cumulative average).",
    input: '[10, 20, 30, 40, 50]',
    expected: '[\n  10,\n  15,\n  20,\n  25,\n  30\n]',
    solutions: ['[foreach .[] as $x ({sum:0,n:0}; .sum += $x | .n += 1; .sum / .n)]']
  },
  {
    id: "ch-12",
    title: "Transpose Table",
    difficulty: "hard",
    desc: "Transpose the 2D array (swap rows and columns).",
    input: '[[1,2,3],[4,5,6],[7,8,9]]',
    expected: '[\n  [\n    1,\n    4,\n    7\n  ],\n  [\n    2,\n    5,\n    8\n  ],\n  [\n    3,\n    6,\n    9\n  ]\n]',
    solutions: ["transpose"]
  },
  {
    id: "ch-13",
    title: "Histogram",
    difficulty: "hard",
    desc: "Create a frequency histogram (count occurrences of each value).",
    input: '["a","b","a","c","b","a","d","b","a"]',
    expected: '{\n  "a": 4,\n  "b": 3,\n  "c": 1,\n  "d": 1\n}',
    solutions: ['group_by(.) | map({key: .[0], value: length}) | from_entries', 'reduce .[] as $x ({}; .[$x] += 1)']
  },
  {
    id: "ch-14",
    title: "Deep Merge",
    difficulty: "expert",
    desc: "Deep merge two objects (second overrides first, but nested objects merge recursively).",
    input: '[{"a":{"b":1,"c":2},"d":3},{"a":{"b":10,"e":5},"f":6}]',
    expected: '{\n  "a": {\n    "b": 10,\n    "c": 2,\n    "e": 5\n  },\n  "d": 3,\n  "f": 6\n}',
    solutions: [".[0] * .[1]"]
  },
  {
    id: "ch-15",
    title: "Tree Flatten",
    difficulty: "expert",
    desc: "Flatten a tree structure into a flat array with full path names (like 'root.child.leaf').",
    input: '{"name":"root","children":[{"name":"a","children":[{"name":"a1","children":[]},{"name":"a2","children":[]}]},{"name":"b","children":[]}]}',
    expected: '[\n  "root",\n  "root.a",\n  "root.a.a1",\n  "root.a.a2",\n  "root.b"\n]',
    solutions: ['def paths_: .name as $n | $n, (.children[] | .name = $n + "." + .name | paths_); [paths_]']
  },
  {
    id: "ch-16",
    title: "Pivot Table",
    difficulty: "expert",
    desc: "Pivot: group by month, sum revenue per product.",
    input: '[{"month":"Jan","product":"A","revenue":100},{"month":"Jan","product":"B","revenue":200},{"month":"Feb","product":"A","revenue":150},{"month":"Feb","product":"B","revenue":250}]',
    expected: '{\n  "Feb": {\n    "A": 150,\n    "B": 250\n  },\n  "Jan": {\n    "A": 100,\n    "B": 200\n  }\n}',
    solutions: ['group_by(.month) | map({key: .[0].month, value: (map({(.product): .revenue}) | add)}) | from_entries']
  }
];
