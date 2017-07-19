'use strict';

var fs = require('fs');
var url = require('url');
var path = require('path');
var glob = require('glob');
var child_process = require('child_process');
var make = require.resolve('elm/binwrappers/elm-make');
var errorFile = require.resolve('./Errors.elm');

class ElmLangCompiler {
    _parse (filename, fallback) {
        try {
            return JSON.parse(fs.readFileSync(filename, 'utf8'));
        } catch (error) {
            return fallback;
        }
    }

    _module (file) {
        return this.config['source-directories'].filter(source => {
            return file.path.startsWith(source);
        }).map(source => {
            return file.path.slice(source.length);
        }).map(module => {
            return path.parse(module);
        }).map(module => {
            return path.join(module.dir.slice(1), module.name);   
        })[0];
    }

    _compile (file, module) {
        let output = path.join(this.config.output, module + '.js');

        child_process.execFileSync(make, this.config.parameters.concat([
            '--output', output, file.path
        ]));

        return fs.readFileSync(output, 'utf8');
    }

    _fallbackCompile(error, module) {
        let output = path.join(this.config.output, module + '.js');

        let errorText = error.stderr.toString();
        let escaped = errorText.replace(/`/g, '\\`');
        let displayError = `
            document.body.style.backgroundColor = "#000";
            module.exports.Errors.fullscreen(\`${escaped}\`);`;
            
        child_process.execFileSync(make, this.config.parameters.concat([
            '--output', output, errorFile
        ]));

        return fs.readFileSync(output, 'utf8') + displayError;
    }

    constructor (config) {
        this.config = {
            compile: this._compile,
            fallbackCompile: this._fallbackCompile,
            parameters: ['--warn', '--yes'],
            output: null,
            renderErrors: false,
            'exposed-modules': [],
            'source-directories': []
        };
        
        let local = this._parse('elm-package.json', {
            'repository': 'https://github.com/user/project.git',
            'exposed-modules': [],
            'version': '2.0.0'
        });
        
        let elm = this._parse(require.resolve('elm/package.json'), {
            'version': '0.18.0'
        });
        
        let project = path.parse(url.parse(local.repository).path);

        this.config.output = [
            'elm-stuff',
            'build-artifacts',
            elm.version,
            project.dir.slice(1),
            project.name,
            local.version 
        ].join('/');

        this.config['exposed-modules'] = local['exposed-modules'] || [];
        this.config['source-directories'] = local['source-directories'] || [];

        config = config && config.plugins && config.plugins.elm || {};
        this.config = Object.assign(this.config, config);
    }

    getDependencies (file) {
        let module = this._module(file);
        if(this.config['exposed-modules'].indexOf(module) < 0) {
            return Promise.resolve([]);
        } else {
            let deps = this.config['source-directories']
                .reduce((acc, dir) => {
                    return acc.concat(glob.sync(`${dir}/**/*.elm`));
                }, []);
            return Promise.resolve(deps);
        }
    }

    compile (file) {
        let module = this._module(file);

        if (this.config['exposed-modules'].indexOf(module) < 0) {
            return Promise.resolve(null);
        } else {
            try {
                file.data = this.config.compile.call(this, file, module);
            } catch (err) {
                if (this.config.renderErrors) {
                    file.data = this.config.fallbackCompile.call(this, err, module);
                } else {
                    return Promise.reject(err);
                }
            }
            return Promise.resolve(file);
        }
    }

}

ElmLangCompiler.prototype.brunchPlugin = true;
ElmLangCompiler.prototype.type = 'javascript';
ElmLangCompiler.prototype.extension = 'elm';

module.exports = ElmLangCompiler;
