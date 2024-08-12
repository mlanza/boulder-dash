# Boulder Dash

Demo building a real-time 2D game using [Atomic](https://github.com/mlanza/atomic) and a simple ECS.  [Boulder Dash](https://boulder-dash.com/online-free-game/) is a classic from my childhood.

![Screenshot](./images/screenshot.png)

I've had a longtime fascination with [Entity Component Systems](Entity_component_system) and this felt a good opportunity to scratch that itch.  Although the concept came about to facilitate better performance, I wanted to model mine as a simulation using persistent data structures to see how well it might fit the functional paradigm.

As usual my early commits especially are experimental, figuring out how best to proceed.

The protagonist is directed via the keyboard:
* Arrow Keys to move
* Shift is used with Arrow Keys to dig or collect without moving
* Escape to abort

Use the query string to modify how the app is loaded:
* `l`: the level number, default is 1
* `debug`: 1 or 0, default is 0 - displays `falling` as a visual cues
* `smooth`: 1 or 0, default is 0 - allows repositioned elements to glide into place

## License
MIT

