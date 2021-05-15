global.win = null;
global.title = "pastes";

const {app, Menu} = require("electron");
const createWindow = require("./src/app");

require("./src/events")();

Menu.setApplicationMenu(null);
app.dock.hide();
app.hide();
// win.setSkipTaskbar(true)
app.on("ready", createWindow);

/**
 * 不允许多开
 */
app.on("second-instance", () => {
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
