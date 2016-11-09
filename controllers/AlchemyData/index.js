function AlchemyData(app) {
    this.app = app;
    this.app.ee.on('AlchemyDataGet', this.get);

}


AlchemyData.prototype.get = function (event_data) {



//    return (_.isFunction(obj.cb)) ? obj.cb(obj) : '';

};


module.exports = AlchemyData;