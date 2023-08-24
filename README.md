# Reversecord

Here is a repository containing reverse engineered discord app source code. 

# Documentation

`app` folder contains the source of main application and `common` folder contains all the utility functions for the discord application. 

use `npm` to install the dependencies:

```bash
git clone https://github.com/enginestein/Reversecord.git
cd Reversecord
npm install
```

Now, there are other helping folders that contains code for rich feaures of discord besides just texting, for example discord webhooks.

Below are the helping folders of the discord application:

- Cloudsync
- Dispatch
- erlpack
- Game utils
- Hook
- Krisp
- Media
- Overlay
- RPC
- Spellcheck
- Utils
- Voice

# Usage

The entry point of the app is `index.js` which is in `app` folder. After installing all the modules you can run `index.js`:

```bash
node index.js
```

There are no `run` scripts available, but I am sure that it works with `index.js` because in the `package.json` the entry point is `index.js`
