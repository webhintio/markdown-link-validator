/**
 * @fileoverview Options configuration for optionator.
 */
import { createRequire as _createRequire } from "module";
const __require = _createRequire(import.meta.url);
/*
 * ------------------------------------------------------------------------------
 * Requirements
 * ------------------------------------------------------------------------------
 */
const optionator = __require("optionator"); // `require` used because `optionator` exports a function
/*
 * ------------------------------------------------------------------------------
 * Initialization and Public Interface
 * ------------------------------------------------------------------------------
 */
export const options = optionator({
    defaults: {
        concatRepeatedArrays: true,
        mergeRepeatedObjects: true
    },
    options: [
        { heading: 'Basic configuration' },
        {
            alias: 'i',
            concatRepeatedArrays: [true, { oneValuePerFlag: true }],
            default: '[]',
            description: 'Regex to ignore links',
            option: 'ignorePatterns',
            type: 'path::[String]'
        },
        {
            default: '',
            description: 'File containing regex to ignore links (see --ignorePatterns option), one per line',
            option: 'ignorePatternsFrom',
            type: 'String'
        },
        {
            alias: 'f',
            dependsOn: ['or', 'ignorePatterns', 'ignorePatternsFrom'],
            description: 'Flags applied to the ignore patterns',
            option: 'flags',
            type: 'path::String'
        },
        {
            alias: 'e',
            description: 'File extension (.md) is optional for relative links, that can be also folders with an index.md file inside',
            option: 'optionalMdExtension',
            type: 'Boolean'
        },
        {
            alias: 'o',
            description: 'Relative links are valid also with extensions other than .md, including images',
            option: 'allowOtherExtensions',
            type: 'Boolean'
        },
        {
            alias: 'q',
            description: 'Show only errors in report',
            option: 'quietMode',
            type: 'Boolean'
        },
        {
            alias: 'h',
            description: 'Show help',
            option: 'help',
            type: 'Boolean'
        },
        { heading: 'Miscellaneous' },
        {
            default: false,
            description: 'Output debugging information',
            option: 'debug',
            type: 'Boolean'
        }
    ],
    prepend: 'markdown-link-validator ./path/to/mds [options]'
});
//# sourceMappingURL=options.js.map