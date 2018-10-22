import Diff from './base';
import {diffWords, diffWordsWithSpace} from './word';
import {generateOptions} from '../util/params';

export const customWordDiff = new Diff();

export function diffCustomWords(oldStr, newStr, options) {
    if (customWordDiff.customRegex) {
        options = generateOptions(options, {customTokenRegex: customWordDiff.customRegex});
    }
    return diffWords(oldStr, newStr, options);
}
export function diffCustomWordsWithSpace(oldStr, newStr, options) {
    if (customWordDiff.customRegex) {
        options = generateOptions(options, {customTokenRegex: customWordDiff.customRegex});
    }
    return diffWordsWithSpace(oldStr, newStr, options);
}
export function setCustomRegex(regex) {
    customWordDiff.customRegex = regex;
}
