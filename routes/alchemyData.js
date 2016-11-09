function AlchemyData(app) {

    this.app = app;
    this.api = '/api/';
    this.mainRoute = `${this.api}alchemydata`;
}


AlchemyData.prototype.resource = function () {
    this.app.get(this.mainRoute, this.index);
};


AlchemyData.prototype.index = function (req, res, next) {

    var event_data = {
        data: req.query,
        cb: function (response) {

            return res.json(response);
        }
    };
    req.app.ee.emit('AlchemyDataGet', event_data);
};


module.exports = AlchemyData;