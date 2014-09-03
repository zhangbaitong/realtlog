var settings = require("../etc/settings.json");
var moment = require("moment");
var zlog = function (){

    this.arguments = process.argv.splice(2);
    this.config = settings;

    this.info = function(data){
        console.log('INFO:',data);
    };

    this.infos = function(name,data){
        console.log('INFO:',name,'-',data);
    };

    this.detail = function(){
        this.info('=== settings ===');
        this.info(this.config);
        this.info('=== arguments ===');
        this.info(this.arguments);
    };

    this.getday = function(){
        var day = new Date();
        day.getFullYear() + '-' +
            (day.getMonth()+1) + '-' +
        day.getDate();
        var now = moment();
        //var day = moment("9/12/2010 19:05:25", "MM/DD/YYYY HH:mm:ss");
        return now.format('YYYY-MM-DD');
    };
    this.getmonth = function(){
        var now = moment();
        return now.format('YYYY-MM');
    };

    this.replaceDate = function(str){
        return str.replace("{date}",this.getday()).replace("{month}",this.getmonth());
    };

};

module.exports = new zlog();