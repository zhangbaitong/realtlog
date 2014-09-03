var utils=require('./log-utils');
//zserver
var handlers=require('./log-handlers');
var http=require('http');
//zclient
var fs = require('fs');

var zclient = function(proName,interval,position,path){

    var _self = this;

    this.path = path;

    this.position = position;

    this.proName = proName;

    this.interval = interval;

    this.watchfile;


    this.checkDateChange = function(){
        if(_self.interval == 0)return;
        setInterval(function(){
            utils.info('check file change by day ...');
            if(!_self.watchfile){
                console.log(_self.watchfile);
                _self.watchFile();
            }else if(_self.watchfile == utils.replaceDate(_self.path)){
                utils.info('no file changed');
            }else if(_self.watchfile != utils.replaceDate(_self.path)){
                utils.info('file has changed');
                _self.unwatchFile();
                _self.watchfile = utils.replaceDate(_self.path);
                _self.watchFile();
            }else{
                console.log('what happen ?!');
            }
        },_self.interval);
    };

    this.unwatchFile = function(){
        var result = fs.existsSync(_self.watchfile);
        if(!result){
            utils.info('file not exist!'+_self.watchfile);
            return;
        }else{
            utils.info('watch file ...'+_self.watchfile);
            fs.unwatchFile(_self.watchfile);
        }
    };

    this.watchFile = function(){
        var path = _self.watchfile = utils.replaceDate(_self.path);

        var result = fs.existsSync(path);
        if(!result){
            utils.info('file not exist!'+path);
            //setTimeout(this.watchFile,1000);
            //return;
            _self.watchfile = "";
        }else{
            utils.info('watch file ...'+path);
            var currSize = fs.statSync(path).size;
            console.log('currSize is ',currSize);
            fs.watchFile(path, { persistent: true, interval: 1000 },function (curr, prev) {
                if(curr.mtime == prev.mtime){
                    console.log("no change ...");
                }else{
                    console.log("yes change ...");
                    fs.stat(path,function(err,stat){
                        console.log('new currSize is ',stat.size);
                        _self.readNewLogs(path,stat.size,currSize);
                        currSize = stat.size;
                    });
                }
            });
        };
    };


    this.readNewLogs = function(path,curr,prev){
        console.log('readNewLogs ...',path,curr,prev);
        if(curr < prev)return;
        var rstream = fs.createReadStream(path,{encoding:'utf8',start: prev,end: curr});
        rstream.on('data',function(data){
            console.log('change content:',data);
            var lines = data.split('\n');
            for(var i=0;i<lines.length;i++){
                console.log('line:',lines[i]);
                _self.socket.emit('agents',_self.proName+'-###-'+_self.position+'-###-'+lines[i]);
            }
        });
    };

    this.start = function(){
        utils.info('start','client is running ...');
        var io = require('socket.io-client');
        _self.socket = io(utils.config.server.server);

        console.log('info','connect on ',utils.config.server.server);

        _self.socket.on('connect',function(){
            console.log('connected ...');
            _self.socket.on('msg',function(data){
                console.log(data);
            });
        });

        //_self.watchFile();
        _self.checkDateChange();
    };
};

var zserver = function(){

    var _self = this;

    this.start = function(){
        utils.info('server is running on port ' + utils.config.server.port + ' ...');
        var httpserver = http.createServer(handlers.pageHandler);
        var io = require('socket.io')(httpserver);
        httpserver.listen(utils.config.server.port);
        io.on('connection', function (socket) {
            _self.sio = socket;
            //socket.emit('clients', 'welcome ...');
            socket.on('clients', function (data) {
                socket.join('clients');
                console.log(data);
            });
            socket.on('agents', function (data) {
                socket.join('agents');
                socket.to('clients').emit('clients',data);
                console.log(data);
            });
        });
    };
};

var server = function(){
    this.server = new zserver();
    var settings = utils.config;
    this.start = function(){
        if(utils.arguments == 'client'){
            for(var pname in settings){
                if(settings[pname].logs){
                    if(settings[pname].logs['log-top-left']){
                        new zclient(pname,settings[pname].interval,'log-top-left',settings[pname].logs['log-top-left']).start();
                    };
                    if(settings[pname].logs['log-top-right']){
                        new zclient(pname,settings[pname].interval,'log-top-right',settings[pname].logs['log-top-right']).start();
                    };
                    if(settings[pname].logs['log-bottom-left']){
                        new zclient(pname,settings[pname].interval,'log-bottom-left',settings[pname].logs['log-bottom-left']).start();
                    };
                    if(settings[pname].logs['log-bottom-right']){
                        new zclient(pname,settings[pname].interval,'log-bottom-right',settings[pname].logs['log-bottom-right']).start();
                    };
                }
            }
            return;
        }
        if(utils.arguments == 'server'){
            this.server.start();
            return;
        }
        if(utils.arguments == 'test'){
            for (var pname in utils.config){
                if(utils.config[pname].logs){
                    setInterval(function(){
                        var testLeftStr = 'append to '+utils.config[pname].logs['log-top-left']+' at '+Date.now();
                        if(utils.replaceDate(utils.config[pname].logs['log-top-left'])){
                            fs.appendFile(utils.replaceDate(utils.config[pname].logs['log-top-left']),testLeftStr, function (err) {
                                if (err) throw err;
                                console.log(testLeftStr);
                            });
                        }
                        testLeftStr = 'append to '+utils.config[pname].logs['log-bottom-right']+' at '+Date.now();
                        if(utils.replaceDate(utils.config[pname].logs['log-bottom-left'])){
                            fs.appendFile(utils.replaceDate(utils.config[pname].logs['log-bottom-right']),testLeftStr, function (err) {
                                if (err) throw err;
                                console.log(testLeftStr);
                            });
                        }
                    },1000);
                }
            }
            return;
        }
        console.log('INFO:','Pls input like : node log-start.js client|server|test');
    };
};

module.exports = server;