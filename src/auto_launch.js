const db = require("./db");
const AutoLaunch = require("auto-launch");
const pastes = new AutoLaunch({
  name: title,
  isHidden: true
});

function toggle () {
  pastes
    .isEnabled()
    .then((isEnabled) => {
      db.set("autoLaunch", !isEnabled).write();
      if (isEnabled) {
        pastes.disable();
      } else {
        pastes.enable();
      }
    });
}

function isEnabled () {
  return db.get("autoLaunch").value();
}

module.exports = {toggle, isEnabled};
