function AlchemyData(app) {
    this.app = app;

}


AlchemyData.prototype.resource = function (mp) {
    this.mainRoute = `${mp}alchemydata`;
    this.app.get(`${this.mainRoute}/news/:id`, this.show);
    this.app.get(`${this.mainRoute}/news`, this.index);
};


AlchemyData.prototype.index = function (req, res, next) {

    var eventObj = {
        data: req.query,
        cb: function (response) {

            return res.json(response);
        }
    };
    req.app.ee.emit('AlchemyDataGet', eventObj);
};

AlchemyData.prototype.show = function (req, res, next) {
    var eventObj = {
        data: req.query,
        cb: function (response) {

            return res.json(response);
        }
    };
    req.app.ee.emit('AlchemyDataShow', eventObj);
};


module.exports = AlchemyData;