module.exports = function(grunt){

    var proxy = grunt.option('proxy');

    if (typeof(proxy) !== 'boolean') {
        proxy = false;
    }

    return {
        all: {
            options: {
                src: './.tmp/concat/hasplayer.js',
                dest: './.tmp/concat/hasplayer.js',
                template:'./grunt/templates/umd.hbs',
                objectToExport: proxy ? 'OrangeHasPlayer' : 'MediaPlayer'
            }
        }
    };
};