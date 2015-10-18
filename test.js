require('fs').readdirSync('./test').forEach(file => require('./test/' + file));
