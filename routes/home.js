function Home(app) {
    this.app = app;

}


Home.prototype.resource = function () {
    this.app.get('/', this.index);
};


Home.prototype.index = function (req, res, next) {

    res.render('index',{title:"Alchemy Data"});
};


module.exports = Home;