'use strict';

var fs = require('fs');
var glob = require('glob');
var path = require('path');
var child_process = require('child_process');
var make = require.resolve('elm/binwrappers/elm-make');


function promise(fn) {
    return function () {
        let parameters = Array.prototype.slice.call(arguments);
        return new Promise((resolve, reject) => {
            fn.apply(null, parameters.concat((error, data) => {
                error === null ? resolve(data) : reject(error);
            }));
        });
    };
}

class ElmLangCompiler {
    _glob (path) {
        return promise(glob)(path + '/**/*.elm');
    }

    _make (parameters) {
        return promise(child_process.execFile)(make, parameters);
    }

    _read (path) {
        return promise(fs.readFile)(path, 'utf8');
    }

    _target (path) {
        return Object.keys(this.targets).find(x => this.targets[x](path));
    }

    _sources (target) {
        return Promise.all(this.watched.map(this._glob))
            .then(xs => xs.reduce((a, b) => a.concat(b)))
            .then(xs => xs.filter(this.targets[target]));
    }

    _compile (sources, target) {
        let output = path.join('elm-stuff', 'build-artifacts', target);
        return this._make(this.parameters.concat('--output', output, sources))
            .then(() => this._read(output));
    }

    constructor (config) {
        this.watched = config.paths.watched;
        this.targets = config._normalized.join.javascripts['*'];
        this.parameters = (config.plugins && config.plugins.elm) || ['--warn', '--yes'];
    }

    getDependencies (file) {
        let deps = [];
        deps.patterns = [this.targets[this._target(file.path)]];
        return Promise.resolve(deps);
    }

    compile (file) {
        let target = this._target(file.path);
        return this._sources(target).then(sources => {
            if (file.path === sources[0]) {
                return this._compile(sources, target);
            } else {
                return Promise.resolve(null);
            }
        });
    }
}

ElmLangCompiler.prototype.brunchPlugin = true;
ElmLangCompiler.prototype.type = 'javascript';
ElmLangCompiler.prototype.extension = 'elm';

module.exports = ElmLangCompiler;
