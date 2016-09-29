elm-lang-brunch
===================

Adds [elm](http://elm-lang.org) support to [brunch](http://brunch.io).

## Install
	npm install --save-dev elm-lang-brunch

## Usage

The plugin will run automatically. Note that by default no elm files will
be compiled unless `elm-package.json` or `brunch-config.js` specifies
`exposed-modules`. See below for details.

## Configuration

The following defaults can be overridden in `brunch-config.js`:

```javacript
{
  ...
  plugins: {
    elm: {
      "exposed-modules": [],
      "source-directories": [],
      parameters: ['--warn', '--yes']
    }
  }
  ...
}
```

The `exposed-modules` and `source-directories` fields correspond to
the fields of the same name in `elm-package.json` and will be
parsed from that file if it is present. These two fields determine
what modules to compile and where to find them.

The `parameters` array is passed as additional arguments to `elm-make`.

## Example

If all elm code is kept in `web/static/elm` and we wish to compile
`web/static/elm/Main.elm` ensure the following configuration is present
in `elm-package.json` or the `brunch-config.js` plugin configuration:

```javascript
{
  ...
  "exposed-modules": ["Main"],
  "source-directories": ["web/static/elm"]
  ...
}
```
