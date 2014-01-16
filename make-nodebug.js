var through = require('through');

function compile(data){
    var lines = data.split('\n');
    lines = lines.filter(function(line){
        return line.indexOf("//!!DEBUG") === -1;
    });
    data = lines.join("\n");
    return data;
}

module.exports = function (file) {
    return through(write, end);
    var data = '';
    function write (buf) { data += buf }
    function end () {
        this.queue(compile(data));
        this.queue(null);
    }
};
