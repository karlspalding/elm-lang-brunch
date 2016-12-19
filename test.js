'use strict';

const expect = require('chai').expect;
const Plugin = require('./');

describe('ElmLangCompiler', () => {
    let plugin;

    let defaults = {
        paths: {
            watched: []
        },
        _normalized: {
            join: {
                javascripts: {
                    '*': {}
                }
            }
        }
    };

    beforeEach(() => {
        plugin = new Plugin(defaults);
    });

    it('should be an object', () => {
        expect(plugin).to.be.ok;
    });

    it('should have a #compile method', () => {
        expect(plugin).to.respondTo('compile');
    });

    it('should have a #getDependencies method', () => {
        expect(plugin).to.respondTo('getDependencies');
    });

    it('should have a sane default config', () => {
        expect(plugin.watched).to.be.empty;
        expect(plugin.targets).to.be.empty;
        expect(plugin.parameters).to.deep.equal(['--warn', '--yes']);
    });

    it('should allow overriding config', () => {
        plugin = new Plugin(Object.assign({}, defaults, {
            plugins: {
                elm: []
            }
        }));

        expect(plugin.parameters).to.deep.equal([]);
    });

    describe('#getDependencies()', () => {
        beforeEach(() => {
            plugin = new Plugin(Object.assign({}, defaults, {
                _normalized: {
                    join: {
                        javascripts: {
                            '*': {
                                'a.js': () => true
                            }
                        }
                    }
                }
            }));
        });

        it('should return an empty array', () => {
            return plugin.getDependencies({}).then(x => expect(x).to.be.empty);
        });

        it('should return the correct dependencies', () => {
            return plugin.getDependencies({ path: 'a/Example.elm' }).then(x => {
                expect(x).to.be.empty;
                expect(x.patterns).to.not.be.empty;
                expect(x.patterns[0]).to.equal(plugin.targets['a.js']);
            });
        });
    });

    describe('#compile()', () => {
        beforeEach(() => {
            plugin = new Plugin(defaults);

            plugin._parse = () => {
                return {
                    repository: 'https://github.com/user/project.git',
                    version: '1.0.0'
                };
            };
        });

        it('should not compile all modules', () => {
            return plugin.compile({
                path: 'src/Example.elm'
            }).then(x => expect(x).to.equal(null));
        });

        it('should compile canonical modules', () => {
            return plugin.compile({
                path: 'src/Canonical.elm'
            }).then(x => expect(x).to.be.null);
        });
    });
});
