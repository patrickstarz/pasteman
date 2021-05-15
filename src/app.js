const { app, BrowserWindow, Tray, Menu, Notification, clipboard, dialog, globalShortcut, ipcMain } = require('electron')
const path = require('path')
const db = require('./db')
const autoLaunch = require('./auto_launch')
const robot = require('robotjs')

let tray = null
let clipWin = null
let trayMenu

const copiedLimit = 5
var items = []
var moreTemplate = [
  {
    label: '使用手册',
    click: function () {
      notice("该功能暂未实现，敬请期待")
    }
  },
  {
    label: '反馈建议',
    click: function () {
      notice("该功能暂未实现，敬请期待")
    }
  },
  {
    type: 'separator'
  },
  {
    label: '开机启动',
    click: (menuItem) => {
      autoLaunch.toggle()
      const index = moreTemplate.findIndex(item => item.label === menuItem.label)
      setTimeout(() => {
        moreTemplate[index].checked = autoLaunch.isEnabled()
        reloadContextMenu()
      }, 1000)
    },
    type: 'checkbox',
    checked: autoLaunch.isEnabled()
  },
  {
    label: '设置',
    click: () => {
      win.show()
    }
  },
  {
    label: '关于',
    click: () => {
      win.show()
    }
  },
  {
    label: '退出',
    click: () => {
      app.exit()
    }
  }
]
var template = [
  {
    type: 'separator'
  },
  {
    label: '清空剪切板',
    click: clearClipboard
  },
  {
    label: `更多`,
    type: 'submenu',
    submenu: Menu.buildFromTemplate(moreTemplate),
    id: 'submenuHistoryLimit'
  }
]
let defaultMenuLength = template.length
let lastText = null

function createWindow () {
  global.win = new BrowserWindow({
    width: 320,
    height: 270,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    show: false,
    title,
    icon: path.join(__dirname, '..', 'icons/icon_16x16.png'),
    webPreferences: {
      nodeIntegration: true
    },
    skipTaskbar: true
  })

  win.loadFile(path.join(__dirname, '..', 'index.html')).then(() => {})

  // win.setVisibleOnAllWorkspaces(true)
  win.setMenu(null)

  ipcMain.handle('setClipboard', (events, args) => {
    clipboard.writeText(args)
    persistCopied(args)
    clipWin.close()
  })

  win.on('close', (event) => {
    event.preventDefault()
    win.hide()
  })
}

function isFirstTime () {
  return !db.get('firstTime').value()
}

function getCopiedQty () {
  return db.get('copiedQty').value()
}

/**
 * 第一次打开app，提示
 */
function welcomeAtFirstTime () {
  if (isFirstTime()) {
    const content = 'I\'ll stay here if you need me..'
    notice(title, content)

    db.set('firstTime', true).write()
    autoLaunch.toggle()
  }
}

/**
 * 发送通知
 */
function notice (title, content) {
  const icon = path.join(__dirname, '..', 'icons/icon_16x16.png')

  if (process.platform === 'win32') {
    tray.displayBalloon({ title, content, icon })
  } else {
    const notification = {title: title, body: content}
    new Notification(notification).show()
  }
}

/**
 * 清空剪切板
 */
function clearClipboard () {
  return dialog.showMessageBox({
    title: 'Clear clipboard history',
    type: 'question',
    message: 'Do you really want to clear your clipboard history? This action cannot be reversed!',
    buttons: ['Yes, clear', 'No, thanks']
  }).then(clickedButton => {
    if (clickedButton.response !== 0){
      return
    }
    items = []
    clipboard.clear()
    // const copiedLength = db.get('copied').value().length
    db.set('copied', []).write()
    reloadContextMenu()
    // getCopied()
  })
}

/**
 * 创建菜单栏图标(托盘)
 */
function createTray () {
  const icon = {
    linux: 'icons/icon_64x64.png',
    win32: 'icons/icon.ico',
    darwin: 'icons/icon_16x16.png'
  }
  tray = new Tray(path.join(__dirname, '..', icon[process.platform]))
  tray.setToolTip('multi copy, multi paste')
}

/**
 * 重新加载菜单项
 */
function reloadContextMenu () {
  // const copiedQty = getCopiedQty()
  template = template.slice(template.length - defaultMenuLength)
  // console.log(defaultMenuLength);
  // console.log(template);
  if (items.length > 0) {
    for (let i = items.length - 1; i >= 0; i--) {
      let item = items[i]
      let checked = i === 0
      template.unshift({
        label: item.text,
        click: () => {
          paste(item)
        },
        type: 'radio',
        checked
      })
    }
  }
  // template[template.length - 2].checked = autoLaunch.isEnabled()
  setAcceleratorTemplate()
  trayMenu = Menu.buildFromTemplate(template)
  tray.closeContextMenu()
  tray.setContextMenu(trayMenu)
  tray.on('click', () => {
    tray.popUpContextMenu(trayMenu)
  })
}

/**
 * 为菜单项设置快捷键提示
 */
function setAcceleratorTemplate () {
  const length = template.length
  const limit = length < 10 ? length : 10
  for (let i = 0; i < limit; i++) {
    template[i].accelerator = `CmdOrCtrl+Shift+${i}`
  }
}

function persistCopied (currentText) {
  const copiedQty = getCopiedQty()

  db.get('copied').pull(currentText).write()
  const copied = db.get('copied').push(currentText).write()
  const length = copied.length

  if (length > copiedLimit) getSubCopied()

  if (length > copiedQty) {
    copied.splice(0, length - copiedQty)
    db.set('copied', copied).write()
  }
}

function truncateCurrentText (currentText, length = 50, replaceBreakLine = true) {
  if (replaceBreakLine){
    currentText = currentText.trim().replace(/\n/g, '\\n')
  }

  return (currentText.length > length) ? currentText.substring(0, length) + '...' : currentText
}

/**
 * 添加新的条目到栈顶
 */
function addItem (currentText, persist) {
  if (!currentText) return
  persist = persist !== false
  if (persist) {
    // persistCopied(currentText)
  }

  if (items.length >= copiedLimit) {
    items = items.slice(0, copiedLimit - 1)
  }
  items.unshift(currentText)
  reloadContextMenu()
}

function getCopiedFromDb () {
  const copiedQty = getCopiedQty()
  const copied = db.get('copied')
    .take(copiedQty)
    .value()
  const length = copied.length

  return { copied, length }
}

function getCopiedFromDbWithLabel () {
  let { copied, length } = getCopiedFromDb()
  copied = copied.map(currentText => {
    return {
      text: currentText,
      label: truncateCurrentText(currentText, 100, false)
    }
  })
  return { copied, length }
}

function getSubCopied () {
  const { copied, length } = getCopiedFromDb()
  const size = length - copiedLimit
  const subCopied = copied.splice(0, size)
  copied.slice(size)

  if (subCopied.length === 0) return { copied, length: copied.length }

  const subCopiedTemplate = subCopied.map(currentText => {
    return {
      label: truncateCurrentText(currentText),
      click: () => {
        clipboard.writeText(currentText)
      }
    }
  }).reverse()

  const index = template.findIndex(item => item.id === 'subCopied')
  const setLabel = (length) => {
    const subCopiedPlural = subCopied.length === 1 ? 'clip' : 'clips'
    return `More ${length} ${subCopiedPlural}...`
  }
  if (index > -1) {
    template[index].submenu = Menu.buildFromTemplate(subCopiedTemplate)
    template[index].label = setLabel(subCopied.length)
    template[index].visible = true
  }

  reloadContextMenu()

  return { copied, length: copied.length }
}

function getCopied () {
  let { copied, length } = getCopiedFromDb()

  if (length > copiedLimit) {
    const getSubCopiedRes = getSubCopied()
    copied = getSubCopiedRes.copied
    length = getSubCopiedRes.length
  }

  if (length === 0) {
    addItem(clipboard.readText())
  } else {
    copied.forEach((item, i) => {
      // const checked = (i + 1 === length)
      addItem(item, i === 0, false)
    })
  }
}

let clipboardMonitor = null

/**
 * 开始监控剪切板
 */
function startMonitoringClipboard () {
  // 不断扫描剪切板，判断当前内容和之前的内容是否一致，不一致则说明用户新复制了内容
  if (!clipboardMonitor) {
    clipboardMonitor = setInterval(() => {
      let currentText = clipboard.readText()
      // console.log(currentText);
      if (!!currentText && lastText !== currentText) {
        lastText = currentText
        contentChanged()
      }
    }, 200)
  }

  // 剪切板内容发生变化时，把新内容记录到栈顶
  const contentChanged = () => {
    let formats = clipboard.availableFormats()
    let isFile = false;
    for (let index in formats) {
      let format = formats[index]
      if(format.indexOf("image/") !== -1){
        isFile = true
        break
      }
    }

    if (!isFile) {
      let currentText = clipboard.readText()
      const newTruncatedText = truncateCurrentText(currentText)
      addItem({type: 'text', text: currentText, format: formats[0], content: newTruncatedText})
    } else {
      let currentText = clipboard.readText()
      let format = formats[formats.length - 1]
      // let filePath = clipboard.read("public.file-url").replace('file://', '')
      let file = clipboard.readImage()
      // let file = clipboard.readBuffer(format)

      addItem({type: 'file', text: currentText, format: format, content: file})
    }
  }
}

/**
 * 注册快捷键
 */
function registerGlobalShortcuts () {
  // 数字快捷键，粘贴指定项
  for (let i = 1; i < 10; i++) {
    globalShortcut.register(`CmdOrCtrl+Shift+${i}`, () => {
      paste(items[i-1])
    })
  }

  // 打开主窗口
  globalShortcut.register('CmdOrCtrl+Shift+Y', () => {
    tray.popUpContextMenu()
  })

  // 顺序粘贴(粘贴后删除)
  globalShortcut.register('CmdOrCtrl+Shift+L', () => {
    if (items.length > 0) {
      let item = items.shift()
      paste(item)
    } else {
      console.log('剪切板为空')
    }
  })

  // 选择性粘贴
  globalShortcut.register('CmdOrCtrl+Shift+V', () => {
    // let mouse = robot.getMousePos()
    // contextMenu.popup({ x: mouse.x, y: mouse.y })
    trayMenu.popup({})
  })
}

/**
 * 粘贴指定内容
 */
function paste(item) {
  // console.log(item);
  setTimeout(() => {
    lastText = item.text
    if (item.type === 'file'){
      // clipboard.write({text:item.text, image: item.content})
      clipboard.clear()
      clipboard.writeImage(item.content)
    } else {
      clipboard.writeText(item.content)
    }
    robot.keyTap('v', process.platform === 'darwin' ? 'command' : 'control')
  }, 10)
}

module.exports = () => {
  // 只创建一个实例
  let lock = !app.requestSingleInstanceLock()
  if (lock) {
    return app.quit()
  }

  createWindow()
  welcomeAtFirstTime()
  createTray()
  reloadContextMenu()
  startMonitoringClipboard()
  registerGlobalShortcuts()
}
