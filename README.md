# markdown-link-validator

`markdown-link-validator` is a CLI tool that validates all the links
in your markdown files (external or internal).
There are multiple tools that validate links to external urls, but none
that validate relative URLs. `markdown-link-validator` will verify that
the file you are pointing at exists in your file system. Even more, if
it links to a heading in the document it will validate it exists as well!


## Usage

Install it globally `npm install -g markdown-link-validator` or locally
as a `devDependency` via `npm install -D markdown-link-validator`.

Then execute it passing the folder to analyze as the first parameter:

```
markdown-link-validator ./documentation
```

### Options

```
markdown-link-validator ./path/to/mds [options]

Basic configuration:
  -i, --ignorePatterns path::[String]  Regex to ignore links - default: []
  --ignorePatternsFromFile String      File containing regex to ignore links (see --ignorePatterns option), one per line
  -f, --flags path::String             Flags applied to the ignore patterns
  -c, --ignoreStatusCodes [Number]     HTTP status code to ignore links - default: [200]
  -e, --optionalMdExtension Boolean    File extension (.md) is optional for relative links, that can be also folders with an index.md file inside#
  -o, --allowOtherExtensions Boolean   Relative links are valid also with extensions other than .md, including images
  --noEmptyFiles Boolean               Links to empty files are invalid
  -q, --quietMode Boolean              Show only errors in report
  -h, --help                           Show help

Miscellaneous:
  --debug                              Output debugging information
```

The following will analyze all the `.md` files found under `./docs` and
ignore any links that match the regular expression `/https?:\/\/test\.com\/.*/gi`:

`markdown-link-validator ./docs -i https?:\/\/test\.com\/.* -f gi`

The regular expression is passed via the `-i` parameter, and its flags via `-f`.
