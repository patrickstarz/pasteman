Now we have some shortcuts, but it is on beta state. Test and give me a feedback, thanks!

* `CmdOrCtrl+Shift+0` ~ get copied item on position #1
* `CmdOrCtrl+Shift+1` ~ get copied item on position #2
* `CmdOrCtrl+Shift+2` ~ get copied item on position #3
* `CmdOrCtrl+Shift+3` ~ get copied item on position #4
* `CmdOrCtrl+Shift+4` ~ get copied item on position #5
* `CmdOrCtrl+Shift+5` ~ get copied item on position #6
* `CmdOrCtrl+Shift+6` ~ get copied item on position #7
* `CmdOrCtrl+Shift+7` ~ get copied item on position #8
* `CmdOrCtrl+Shift+8` ~ get copied item on position #9
* `CmdOrCtrl+Shift+9` ~ get copied item on position #10
* `CmdOrCtrl+Shift+Y` ~ focus pastes _(only for windows)_
* `CmdOrCtrl+Shift+L` ~ open window with clipboard history _(by @savannahar68)_

## Windows

### How to do a Windown build (You can go with either Yarn build or Npm build) 
#### Yarn Build

```
$ git clone https://github.com/pastes/pastes.git
$ cd pastes
$ yarn
$ yarn build --win
```
#### NPM build
```
$ cd pastes
$ npm install
$ npm run build -- --win
```

Go to folder `dist` and execute the `pastes X.X.X.exe` or `pastes Setup X.X.X.exe` and be happy.

## Linux

### How to do a Linux build (You can go with either Yarn build or Npm build)
#### Yarn Build

```
$ git clone https://github.com/pastes/pastes.git
$ cd pastes
$ yarn
$ yarn build --linux
```

#### NPM build
```
$ git clone https://github.com/pastes/pastes.git
$ cd pastes
$ npm install
$ npm run build -- --linux
```

Go to folder `dist/` and execute the `pastes_X.X.X_<arch>.deb` or `pastes_X.X.X_<arch>.rpm` and be happy.

## Mac

### How to do a Mac build (You can go with either Yarn build or Npm build)
#### Yarn Build
```
$ git clone https://github.com/pastes/pastes.git
$ cd pastes
$ yarn
$ yarn build --mac
```

#### NPM build
```
$ git clone https://github.com/pastes/pastes.git
$ cd pastes
$ npm install
$ npm run build -- --mac
```

Go to folder `dist` and execute the `pastes-X.X.X.dmg` and be happy.
