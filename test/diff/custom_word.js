import {customWordDiff} from '../../lib/diff/custom_word';
import {setCustomRegex, diffCustomWords, diffCustomWordsWithSpace} from '../../lib/diff/custom_word';
import {convertChangesToXML} from '../../lib/convert/xml';

import {expect} from 'chai';

describe('CustomWordDiff', function() {
    describe('#setCustomRegex', function() {
       it('should set custom regex', function() {
           const customRegex = /(\(VO\)|\(ON\)|\(OFF\)|\s+|\b)/;
           expect(customWordDiff.customRegex).to.equal(null || undefined);
           setCustomRegex(customRegex);
           expect(customWordDiff.customRegex.toString()).to.equal(customRegex.toString());
       });
    });

    describe('#no regex set', function() {
        it('should work like word diff if custom regex is not defined', function() {
            setCustomRegex(null);
            let diffResult = diffCustomWords('New Value', 'New Value');
            expect(convertChangesToXML(diffResult)).to.equal('New Value');
            diffResult = diffCustomWordsWithSpace('New Value', 'New Value');
            expect(convertChangesToXML(diffResult)).to.equal('New Value');
        });
    });
    describe('#simulate word', function() {
        before(function() {
            setCustomRegex(/(\(VO\)|\(ON\)|\(OFF\)|\s+|\b)/);
        });
        describe('#diffCustomWords', function() {
            it('should diff whitespace', function() {
                const diffResult = diffCustomWords('New Value', 'New  ValueMoreData');
                expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins>');
            });

            it('should diff multiple whitespace values', function() {
                const diffResult = diffCustomWords('New Value  ', 'New  ValueMoreData ');
                expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins> ');
            });

            // Diff on word boundary
            it('should diff on word boundaries', function() {
                let diffResult = diffCustomWords('New :Value:Test', 'New  ValueMoreData ');
                expect(convertChangesToXML(diffResult)).to.equal('New  <del>:Value:Test</del><ins>ValueMoreData </ins>');

                diffResult = diffCustomWords('New Value:Test', 'New  Value:MoreData ');
                expect(convertChangesToXML(diffResult)).to.equal('New  Value:<del>Test</del><ins>MoreData </ins>');

                diffResult = diffCustomWords('New Value-Test', 'New  Value:MoreData ');
                expect(convertChangesToXML(diffResult)).to.equal('New  Value<del>-Test</del><ins>:MoreData </ins>');

                diffResult = diffCustomWords('New Value', 'New  Value:MoreData ');
                expect(convertChangesToXML(diffResult)).to.equal('New  Value<ins>:MoreData </ins>');
            });

            // Diff without changes
            it('should handle identity', function() {
                const diffResult = diffCustomWords('New Value', 'New Value');
                expect(convertChangesToXML(diffResult)).to.equal('New Value');
            });
            it('should handle empty', function() {
                const diffResult = diffCustomWords('', '');
                expect(convertChangesToXML(diffResult)).to.equal('');
            });
            it('should diff has identical content', function() {
                const diffResult = diffCustomWords('New Value', 'New  Value');
                expect(convertChangesToXML(diffResult)).to.equal('New  Value');
            });

            // Empty diffs
            it('should diff empty new content', function() {
                const diffResult = diffCustomWords('New Value', '');
                expect(diffResult.length).to.equal(1);
                expect(convertChangesToXML(diffResult)).to.equal('<del>New Value</del>');
            });
            it('should diff empty old content', function() {
                const diffResult = diffCustomWords('', 'New Value');
                expect(convertChangesToXML(diffResult)).to.equal('<ins>New Value</ins>');
            });

            // With without anchor (the Heckel algorithm error case)
            it('should diff when there is no anchor value', function() {
                const diffResult = diffCustomWords('New Value New Value', 'Value Value New New');
                expect(convertChangesToXML(diffResult)).to.equal('<del>New</del><ins>Value</ins> Value New <del>Value</del><ins>New</ins>');
            });
            it('should include count with identity cases', function() {
                expect(diffCustomWords('foo', 'foo')).to.eql([{value: 'foo', count: 1}]);
                expect(diffCustomWords('foo bar', 'foo bar')).to.eql([{value: 'foo bar', count: 3}]);
            });
            it('should include count with empty cases', function() {
                expect(diffCustomWords('foo', '')).to.eql([{value: 'foo', count: 1, added: undefined, removed: true}]);
                expect(diffCustomWords('foo bar', '')).to.eql([{value: 'foo bar', count: 3, added: undefined, removed: true}]);

                expect(diffCustomWords('', 'foo')).to.eql([{value: 'foo', count: 1, added: true, removed: undefined}]);
                expect(diffCustomWords('', 'foo bar')).to.eql([{value: 'foo bar', count: 3, added: true, removed: undefined}]);
            });

            it('should ignore whitespace', function() {
                expect(diffCustomWords('hase igel fuchs', 'hase igel fuchs')).to.eql([{ count: 5, value: 'hase igel fuchs' }]);
                expect(diffCustomWords('hase igel fuchs', 'hase igel fuchs\n')).to.eql([{ count: 5, value: 'hase igel fuchs\n' }]);
                expect(diffCustomWords('hase igel fuchs\n', 'hase igel fuchs')).to.eql([{ count: 5, value: 'hase igel fuchs\n' }]);
                expect(diffCustomWords('hase igel fuchs', 'hase igel\nfuchs')).to.eql([{ count: 5, value: 'hase igel\nfuchs' }]);
                expect(diffCustomWords('hase igel\nfuchs', 'hase igel fuchs')).to.eql([{ count: 5, value: 'hase igel fuchs' }]);
            });

            it('should diff whitespace with flag', function() {
                const diffResult = diffCustomWords('New Value', 'New  ValueMoreData', {ignoreWhitespace: false});
                expect(convertChangesToXML(diffResult)).to.equal('New<del> Value</del><ins>  ValueMoreData</ins>');
            });

            it('should diff with only whitespace', function() {
                let diffResult = diffCustomWords('', ' ');
                expect(convertChangesToXML(diffResult)).to.equal('<ins> </ins>');

                diffResult = diffCustomWords(' ', '');
                expect(convertChangesToXML(diffResult)).to.equal('<del> </del>');
            });
        });

        describe('#diffCustomWords - async', function() {
            it('should diff whitespace', function(done) {
                diffCustomWords('New Value', 'New  ValueMoreData', function(err, diffResult) {
                    expect(err).to.be.undefined;
                    expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins>');
                    done();
                });
            });

            it('should diff multiple whitespace values', function(done) {
                diffCustomWords('New Value  ', 'New  ValueMoreData ', function(err, diffResult) {
                    expect(err).to.be.undefined;
                    expect(convertChangesToXML(diffResult)).to.equal('New  <del>Value</del><ins>ValueMoreData</ins> ');
                    done();
                });
            });

            // Diff on word boundary
            it('should diff on word boundaries', function(done) {
                diffCustomWords('New :Value:Test', 'New  ValueMoreData ', function(err, diffResult) {
                    expect(err).to.be.undefined;
                    expect(convertChangesToXML(diffResult)).to.equal('New  <del>:Value:Test</del><ins>ValueMoreData </ins>');
                    done();
                });
            });

            // Diff without changes
            it('should handle identity', function(done) {
                diffCustomWords('New Value', 'New Value', function(err, diffResult) {
                    expect(err).to.be.undefined;
                    expect(convertChangesToXML(diffResult)).to.equal('New Value');
                    done();
                });
            });
            it('should handle empty', function(done) {
                diffCustomWords('', '', function(err, diffResult) {
                    expect(err).to.be.undefined;
                    expect(convertChangesToXML(diffResult)).to.equal('');
                    done();
                });
            });
            it('should diff has identical content', function(done) {
                diffCustomWords('New Value', 'New  Value', function(err, diffResult) {
                    expect(err).to.be.undefined;
                    expect(convertChangesToXML(diffResult)).to.equal('New  Value');
                    done();
                });
            });

            // Empty diffs
            it('should diff empty new content', function(done) {
                diffCustomWords('New Value', '', function(err, diffResult) {
                    expect(diffResult.length).to.equal(1);
                    expect(convertChangesToXML(diffResult)).to.equal('<del>New Value</del>');
                    done();
                });
            });
            it('should diff empty old content', function(done) {
                diffCustomWords('', 'New Value', function(err, diffResult) {
                    expect(convertChangesToXML(diffResult)).to.equal('<ins>New Value</ins>');
                    done();
                });
            });

            // With without anchor (the Heckel algorithm error case)
            it('should diff when there is no anchor value', function(done) {
                diffCustomWords('New Value New Value', 'Value Value New New', function(err, diffResult) {
                    expect(convertChangesToXML(diffResult)).to.equal('<del>New</del><ins>Value</ins> Value New <del>Value</del><ins>New</ins>');
                    done();
                });
            });
        });

        describe('#diffCustomWordsWithSpace', function() {
            it('should diff whitespace', function() {
                const diffResult = diffCustomWordsWithSpace('New Value', 'New  ValueMoreData');
                expect(convertChangesToXML(diffResult)).to.equal('New<del> Value</del><ins>  ValueMoreData</ins>');
            });

            it('should diff multiple whitespace values', function() {
                const diffResult = diffCustomWordsWithSpace('New Value  ', 'New  ValueMoreData ');
                expect(convertChangesToXML(diffResult)).to.equal('New<ins>  ValueMoreData</ins> <del>Value  </del>');
            });

            it('should perform async operations', function(done) {
                diffCustomWordsWithSpace('New Value  ', 'New  ValueMoreData ', function(err, diffResult) {
                    expect(convertChangesToXML(diffResult)).to.equal('New<ins>  ValueMoreData</ins> <del>Value  </del>');
                    done();
                });
            });
            describe('case insensitivity', function() {
                it("is considered when there's a difference", function() {
                    const diffResult = diffCustomWordsWithSpace('new value', 'New  ValueMoreData', {ignoreCase: true});
                    expect(convertChangesToXML(diffResult)).to.equal('New<del> value</del><ins>  ValueMoreData</ins>');
                });

                it("is considered when there's no difference", function() {
                    const diffResult = diffCustomWordsWithSpace('new value', 'New Value', {ignoreCase: true});
                    expect(convertChangesToXML(diffResult)).to.equal('New Value');
                });
            });
        });
    });
    describe('#diff dialogue tags', function() {
        before(function() {
            setCustomRegex(/(\(VO\)|\(ON\)|\(OFF\)|\s+|\b)/);
        });
        it('should diff vo on off', function() {
            let diffResult = diffCustomWordsWithSpace('(VO) gamal', '(VO)(ON) gamal');
            expect(convertChangesToXML(diffResult)).to.equal('(VO)<ins>(ON)</ins> gamal');
            diffResult = diffCustomWordsWithSpace('(ON) gamal', '(ON)(OFF) gamal');
            expect(convertChangesToXML(diffResult)).to.equal('(ON)<ins>(OFF)</ins> gamal');
        });
    });
});
