<p align="center">
    🚧 &nbsp;Work in Progress!&nbsp;🚧
</p>

<div align="center">
<img alt="Prettier"
  src="https://raw.githubusercontent.com/prettier/prettier-logo/master/images/prettier-icon-light.png">
<img alt="Lua" height="180" hspace="25" vspace="15"
  src="https://upload.wikimedia.org/wikipedia/commons/6/6a/Lua-logo-nolabel.svg">
</div>

<h2 align="center">Prettier Lua Plugin</h2>

## WORK IN PROGRESS

Please note that this plugin is currently in alpha stage and still under active development. We encourage everyone to try it and give feedback, but we don't recommend it for production use yet.

## Intro

Prettier is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules that take the maximum line length into account, wrapping code when necessary.

This plugin adds support for the Lua language to Prettier.

### Input

```lua
function deepcopy(orig)
  local orig_type = type(orig)
     local copy

  if orig_type == 'table' then; copy = {}
  for orig_key, orig_value in next, orig, nil do
  copy[deepcopy(orig_key)] = deepcopy(orig_value)
          end
          setmetatable(
            copy,
            deepcopy(
              getmetatable(orig)))
      else
          copy = orig
      end
    return copy
  end
```

### Output

```lua
function deepcopy(orig)
	local orig_type = type(orig)
	local copy

	if orig_type == "table" then
		copy = {}
		for orig_key, orig_value in next, orig, nil do
			copy[deepcopy(orig_key)] = deepcopy(orig_value)
		end
		setmetatable(copy, deepcopy(getmetatable(orig)))
	else
		copy = orig
	end
	return copy
end
```

## Install

yarn:

```bash
yarn add --dev prettier @prettier/plugin-lua
# or globally
yarn global add prettier @prettier/plugin-lua
```

npm:

```bash
npm install --save-dev prettier @prettier/plugin-lua
# or globally
npm install --global prettier @prettier/plugin-lua
```

## Use

If you installed prettier as a local dependency, you can add prettier as a script in your `package.json`,

```json
"scripts": {
  "prettier": "prettier"
}
```

and then run it via

```bash
yarn run prettier path/to/file.lua --write
# or
npm run prettier -- path/to/file.lua --write
```

If you installed globally, run

```bash
prettier path/to/file.lua --write
```

## Editor integration

Integration in the prettier plugin for your favorite editor might not be working yet, see see the related issues for [VS Code](https://github.com/prettier/prettier-vscode/issues/395), [Atom](https://github.com/prettier/prettier-atom/issues/395) and [Vim](https://github.com/prettier/vim-prettier/issues/119).

For the moment, you can set up prettier to run on save like this:

### Atom

Install [save-autorun](https://atom.io/packages/save-autorun) and create a `.save.cson` file in your project with the following content:

```cson
"**/*.lua": "prettier ${path} --write"
```

### VScode

Install [Run on Save](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave) and add the following section to your settings:

```json
"emeraldwalk.runonsave": {
  "commands": [
    {
      "match": "\\.lua$",
        "cmd": "prettier ${file} --write"
    }
  ]
}
```

### Vim

Adding the following to `.vimrc` will define a custom command `:PrettierLua` that runs the plugin while preserving the cursor position and run it on save.

```vim
" Prettier for Lua
function PrettierLuaCursor()
  let save_pos = getpos(".")
  %! prettier --stdin --parser=lua
  call setpos('.', save_pos)
endfunction
" define custom command
command PrettierLua call PrettierLuaCursor()
" format on save
autocmd BufwritePre *.lua PrettierLua
```

## Contributing

If you're interested in contributing to the development of Prettier for Lua, you can follow the [CONTRIBUTING guide from Prettier](https://github.com/prettier/prettier/blob/master/CONTRIBUTING.md), as it all applies to this repository too.

To test it out on a Lua file:

- Clone this repository.
- Run `yarn`.
- Create a file called `test.lua`.
- Run `yarn prettier test.lua` to check the output.
