# Sticky, Sticky Notes!
**https://sticky-sticky-notes.glitch.me/**

Easy-to-use sticky notes accessible from the browser. Features include drag-and-drop to move sticky notes anywhere on the screen, undo/redo in case
undesirable mistakes are made in the workspace, and saving so the notes remain just as they were left when the browser is closed and reopened later.
It's also mobile friendly!

## Development Setup
### Requirements
- [Node.js](https://nodejs.org/en/)
- Git

Clone the repo
```
git clone https://github.com/carterldavis2002/sticky-sticky-notes.git
```
In the project directory, install the dependencies
```
npm install
```

To create a development build, run `npm run build-dev` and then run `npm run dev-server` to start a live-reloading server as well as open the browser.

To create a production build, run `npm run build` and then run `npm start` to start the express server. The app can then be accessed by navigating the
browser to http://127.0.0.1:3000/
