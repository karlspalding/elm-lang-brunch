'use strict';

const expect = require('chai').expect;
const Plugin = require('./');

describe('ElmLangCompiler', () => {
    let plugin;

    beforeEach(() => {
        plugin = new Plugin({});
    });

    it('should be an object', () => {
        expect(plugin).to.be.ok;
    });

    it('should have a #compile method', () => {
        expect(plugin).to.respondTo('compile');
    });

    it('should have a sane default config', () => {
        expect(plugin.config).to.deep.equal({
            compile: plugin._compile,
            fallbackCompile: plugin._fallbackCompile,
            parameters: ['--warn', '--yes'],
            output: 'elm-stuff/build-artifacts/0.18.0/user/project/2.0.0',
            renderErrors: false,
            'exposed-modules': [],
            'source-directories': []
        });
    });

    it('should allow overriding config', () => {
        plugin = new Plugin({
            plugins: {
                elm: {
                    compile: null,
                    fallbackCompile: null,
                    parameters: [],
                    output: '',
                    renderErrors: true,
                    'exposed-modules': ['Test'],
                    'source-directories': ['src']
                }
            }
        });
        expect(plugin.config).to.deep.equal({
            compile: null,
            fallbackCompile: null,
            parameters: [],
            output: '',
            renderErrors: true,
            'exposed-modules': ['Test'],
            'source-directories': ['src']
        });
    });

    describe('#compile()', () => {
        beforeEach(() => {
            plugin = new Plugin({
                plugins: {
                    elm: {
                        compile: () => 'COMPILED',
                        fallbackCompile: () => 'ERRORS',
                        'exposed-modules': ['Compile', 'Also/Valid'],
                        'source-directories': ['src']
                    }
                }
            });
        });

        it('should not compile all modules', () => {
            return plugin.compile({
                path: 'src/Other.elm'
            }).then(x => expect(x).to.be.null);
        });

        it('should compare full module names', () => {
            return plugin.compile({
                path: 'src/NoCompile.elm'
            }).then(x => expect(x).to.be.null);
        });

        it('should consider module source directories', () => {
            return plugin.compile({
                path: 'Compile.elm'
            }).then(x => expect(x).to.be.null);
        });

        it('should compare full module paths', () => {
            return plugin.compile({
                path: 'src/Also/Compile.elm'
            }).then(x => expect(x).to.be.null);
        });

        it('should compile specified modules', () => {
            plugin.compile({
                path: 'src/Compile.elm'
            }).then(x => expect(x.data).to.equal('COMPILED'));
        });

        it('should compile submodules', () => {
            return plugin.compile({
                path: 'src/Also/Valid.elm'
            }).then(x => expect(x.data).to.equal('COMPILED'));
        });

        it('should not fallback by default', () => {
            plugin.config.compile = () => {throw {stderr: 'failure'};};
            return plugin.compile({
                path: 'src/Compile.elm'
            }).catch(x => expect(x.stderr).to.equal('failure'));
        });

        it('should fallback when configured to', () => {
            plugin.config.renderErrors = true;
            plugin.config.compile = () => {throw {stderr: 'failure'};};
            return plugin.compile({
                path: 'src/Compile.elm'
            }).then(x => expect(x.data).to.equal('ERRORS'));
        });
    });
});
