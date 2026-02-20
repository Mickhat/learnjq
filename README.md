# learnjq

> Interactive jq tutorial & playground — learn JSON processing from basics to expert.

**🚀 Try it live: [learnjq.dev](https://learnjq.dev)**

![learnjq screenshot](https://learnjq.dev/favicon.svg)

## Features

- **📚 57 Lessons** — From identity (`.`) to advanced reducers, with hands-on exercises for every topic
- **🏆 16 Challenges** — Test your skills with real-world data transformation problems
- **⚡ Playground** — Paste your own JSON, experiment freely with `-r`, `-s`, `-n` flags
- **🔬 Pipe Visualizer** — See how data transforms at each step of a jq pipeline
- **💡 Filter Explainer** — Paste any jq expression and get a step-by-step annotation (like explainshell.com for jq)
- **📖 Reference** — Searchable jq cheat sheet with examples
- **🚀 Getting Started** — Interactive 5-minute intro for complete beginners
- **🔗 Shareable URLs** — Share any lesson, challenge, or playground state via URL
- **📊 Progress Tracking** — LocalStorage-based, pick up where you left off
- **🌙 Dark/Light Mode** — Because your eyes matter

## Lesson Topics

| Category | Topics |
|----------|--------|
| **Basics** | Identity, field access, nested access, array index/slice, pipes, multiple outputs, optional operator |
| **Types & Values** | JSON types, type checking, length, keys & values |
| **Arrays** | Iteration, construction, map, select, sort, group, unique, flatten, min/max/add, range, first/last/nth/limit |
| **Objects** | Construction, merge, to/from_entries, with_entries, paths, del, getpath/setpath, leaf_paths |
| **Strings** | Concatenation, interpolation, split/join, test/match/capture, sub/gsub |
| **Conditionals** | if-then-else, alternative operator, try-catch, comparison & logic |
| **Update Operators** | Update (`\|=`), arithmetic update (`+=`, `-=`, `*=`, `/=`) |
| **Variables & Functions** | Variables (`. as $x`), destructuring, custom functions (`def`), reduce, foreach |
| **Advanced** | Recursion (`..`, `recurse`), path operations, format strings (`@csv`, `@base64`, etc.), env, streaming, SQL-style, limit/until/while/repeat |
| **Real-World** | API responses, log parsing, JSON↔CSV, config transformation, Kubernetes/kubectl, Docker |

## Tech Stack

- **Backend:** Node.js + Express
- **jq execution:** Server-side via `execFile` (real `jq` binary, not WASM)
- **Frontend:** Vanilla JS — zero dependencies, no build step
- **Hosting:** K3s cluster with Traefik ingress + Let's Encrypt TLS

## Security

jq execution is sandboxed with defense-in-depth:

1. `execFile` (no shell injection)
2. `--` separator (no flag injection via filter)
3. Empty `env: {}` (no secret leakage)
4. Blocklist for `env`, `debug`, `$ENV`, `input`, `inputs`, `stderr`
5. 5-second timeout + 512KB output limit
6. Rate limiting (60 req/min per IP)

## Self-Hosting

```bash
# Prerequisites: Node.js 18+ and jq 1.6+
git clone https://github.com/Mickhat/learnjq.git
cd learnjq
npm install
node server.js
# → http://localhost:3210
```

### Docker

```bash
docker build -t learnjq .
docker run -p 3210:3210 learnjq
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3210` | Server port |

## Contributing

Issues and PRs welcome! Some ideas:

- More lessons (especially real-world scenarios)
- More challenges (goal: 50+)
- jq Golf mode (shortest solution wins)
- Mobile improvements
- Translations

## License

MIT — do whatever you want with it.

## Support

If you find learnjq useful, consider buying me a coffee:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20learnjq-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/mickhat)

---

Built with ☕ and curiosity.
