# asteroid
v0.0.1

## Install

    slnode install asteroid -g
    
## Example

    var asteroid = require('asteroid');
    var app = asteroid();

    app.use(asteroid.configure());
    app.use(asteroid.resources());

    app.listen(3000);
