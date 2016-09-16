var path = require('path');
var SG = require('strong-globalize');

SG.SetRootDir(path.join(__dirname, '..'), { autonomousMsgLoading: 'all' });
module.exports = SG();
