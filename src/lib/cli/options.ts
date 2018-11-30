/**
 * @fileoverview Options configuration for optionator.
 */

/*
 * ------------------------------------------------------------------------------
 * Requirements
 * ------------------------------------------------------------------------------
 */

import optionator = require('optionator'); // `require` used because `optionator` exports a function

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
        {heading: 'Basic configuration'},
        {
            alias: 'p',
            description: 'Pattern to ignore links (work in progress)',
            option: 'pattern',
            type: 'path::String'
        },
        {heading: 'Miscellaneous'},
        {
            default: false,
            description: 'Output debugging information',
            option: 'debug',
            type: 'Boolean'
        }
    ],
    prepend: 'markdown-link-validator [options] ./docs'
});
