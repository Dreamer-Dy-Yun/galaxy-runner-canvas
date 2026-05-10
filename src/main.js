// Galaxy Runner - main
// Split from the original single-file prototype so each system can evolve independently.

const game = new Game(
  document.getElementById("game"),
  document.getElementById("restart")
);

requestAnimationFrame((time) => game.frame(time));
