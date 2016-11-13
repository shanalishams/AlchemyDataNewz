'use strict';
var _ = require("lodash");
var Cloudant = require('cloudant');
var async = require('async');
var AlchemyDataNewsV1 = require('watson-developer-cloud/alchemy-data-news/v1');

var cloudant = Cloudant({
    account: '{}',
    password: '{}'
});
var alchemyNewsDB = cloudant.db.use('alchemy_new');

var alchemyDataNews = new AlchemyDataNewsV1({
    api_key: process.env.ALCHEMY_API_KEY
});

function AlchemyData(app) {
    this.app = app;
    this.app.ee.on('AlchemyDataGet', this.get);
    this.app.ee.on('AlchemyDataShow', this.show);
}


AlchemyData.prototype.get = function (eventObj) {
    var data = eventObj.data;
    var lat = data.lat;
    var lng = data.lng;
    var reverseGeoCodeData = null;
    var formattedAddress = 'Pakistan';
    try {
        reverseGeoCodeData = JSON.parse(data.result);
        formattedAddress = reverseGeoCodeData[0].formatted_address;
        formattedAddress = formattedAddress.replace(', ', '^');
    } catch (ex) {
        console.log(ex.message);
    }//end of try-catch


    var params = {
        start: 'now-3h',
        end: 'now',
        outputMode: 'json',
        count: 5,
        return: 'enriched.url.title,enriched.url.text,enriched.url.author,original.url',
        q: `q.enriched.url.entities.entity.text=O[${formattedAddress}]`

    };
    var newsResult = null;
    alchemyDataNews.getNews(params, function (err, news) {

        if (err) {
            newsResult = err;
            console.error('AlchemyData:', 'alchemyDataNews:', 'error:', err);

        } else {
            newsResult = news;
            console.info('AlchemyData:', 'alchemyDataNews:', news);

        }//end of if-else

        var docs = null;
        if (newsResult.status == 'OK' && newsResult.result.docs) {
            docs = newsResult.result.docs;
        } else {
            docs = [];
        }//end of if-else
        try {

            var ids = [];

            async.forEach(docs, function (doc, callback) {

                    alchemyNewsDB.insert(doc, doc.id, function (err, body, header) {
                        ids.push(doc.id);
                        if (err) {
                            console.error('AlchemyData:', 'alchemyNewsDB', body);
                        } else {
                            console.info('AlchemyData:', 'alchemyNewsDB', body);
                        }//end of if-else
                        callback();
                    });

                },
                function (err) {

                    if (err) {
                        console.error('AlchemyData:', 'alchemyNewsDB', err.message);
                    }
                    var result = [];
                    async.forEach(ids, function (id, callback) {

                            alchemyNewsDB.get(id, function (err, data, header) {
                                if (err) {
                                    console.error('AlchemyData:', 'alchemyNewsDB', data);
                                    callback(err);
                                } else {
                                    console.info('AlchemyData:', 'alchemyNewsDB', data);
                                    result.push(data);
                                    callback();
                                }//end of if-else
                            });
                        }
                        , function (err) {

                            if (err) {
                                console.error('AlchemyData:', 'alchemyNewsDB', err.message);
                                var errorObj = {
                                    status: 'error',
                                    statusCode: err.headers.statusCode,
                                    error: err.message
                                };
                                return (_.isFunction(eventObj.cb)) ? eventObj.cb(errorObj) : '';
                            }//end of if

                            console.info('AlchemyData:', 'alchemyNewsDB', result);

                            return (_.isFunction(eventObj.cb)) ? eventObj.cb({
                                status: 'OK',
                                statusCode: 200,
                                result: result
                            }) : '';
                        });
                });

        } catch (ex) {
            console.error(ex);
            return (_.isFunction(eventObj.cb)) ? eventObj.cb(ex) : '';
        }//end of try-catch

    });
};


AlchemyData.prototype.show = function (eventObj) {

    alchemyNewsDB.get(eventObj.data, function (err, result, header) {
        if (err) {

            console.error('AlchemyData:', 'alchemyNewsDB', result);
            var errorObj = {
                status: 'error',
                statusCode: err.headers.statusCode,
                error: err.message
            };
            return (_.isFunction(eventObj.cb)) ? eventObj.cb(errorObj) : '';

        } else {

            console.info('AlchemyData:', 'alchemyNewsDB', result);
            return (_.isFunction(eventObj.cb)) ? eventObj.cb({
                status: 'OK',
                statusCode: 200,
                result: result
            }) : '';

        }//end of if-else
    });
};


module.exports = AlchemyData;