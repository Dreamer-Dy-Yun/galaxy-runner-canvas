// Galaxy Runner - input
// Split from the original single-file prototype so each system can evolve independently.

class InputController {
  constructor(game, restartButton) {
    this.game = game;
    this.keys = new Set();
    this.controlCodes = new Set(INPUT_CONFIG.preventDefaultCodes);
    this.pauseCodes = new Set(INPUT_CONFIG.pauseCodes);

    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    restartButton.addEventListener("click", () => {
      this.game.reset();
      this.game.start();
    });
    this.game.canvas.addEventListener("click", (event) => this.game.handleCanvasClick(event));
  }

  handleKeyDown(event) {
    if (this.controlCodes.has(event.code)) {
      event.preventDefault();
    }

    this.keys.add(event.code);

    if (this.pauseCodes.has(event.code)) {
      this.game.togglePause();
      return;
    }

    if (event.code === INPUT_CONFIG.startCode && this.game.state.mode !== "running") {
      this.game.start();
    }

    if (event.code === INPUT_CONFIG.restartCode) {
      this.game.reset();
      this.game.start();
    }
  }

  isDown(code) {
    return this.keys.has(code);
  }
}
