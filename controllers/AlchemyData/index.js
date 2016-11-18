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
    var reverseGeoCodeData = [];
    var formattedAddress = 'Pakistan';
    var formattedAddresses = [];
    try {
        reverseGeoCodeData = JSON.parse(data.result);
        for (var i = 0; i < reverseGeoCodeData.length; i++) {
            formattedAddresses.push({formattedAddress: reverseGeoCodeData[i]});
        }//end of for
        formattedAddress = reverseGeoCodeData[0].formatted_address;
    } catch (ex) {
        formattedAddresses.push({formattedAddress: formattedAddress});
        console.error(ex.message);
    }//end of try-catch

    formattedAddress = formattedAddress.replace(', ', '^');

    var params = {
        start: 'now-3h',
        end: 'now',
        outputMode: 'json',
        count: 10,
        return: 'enriched.url.title,enriched.url.text,enriched.url.author,original.url',
        q: `q.enriched.url.entities.entity.text=O[${formattedAddress}]`

    };
    var newsResult = null;
    alchemyDataNews.getNews(params, function (err, news) {

        if (err) {
            newsResult = err;
            console.error('AlchemyData:', 'alchemyDataNews:', 'error:', err);
            if (err.code == 400) {

                var errorObj = {
                    status: 'error',
                    statusCode: err.code,
                    error: err.message
                };
                console.error('AlchemyData:', 'alchemyDataNews:', errorObj);

            }//in case of api limit is exceeded


        } else {
            newsResult = news;
            console.info('AlchemyData:', 'alchemyDataNews:', news);

        }//end of if-else

        //index is necessary for searching in cloudant db
        var index = {
            "index": {},
            "type": "text"
        };

        alchemyNewsDB.index(index, function (err, response) {
            if (err) {
                console.error('AlchemyData:', 'alchemyNewsDB', err);
            } else {
                console.info('AlchemyData:', 'alchemyNewsDB', response.result);
            }
        });

        var records = null;
        if (newsResult.status == 'OK' && newsResult.result.docs) {
            var docs = newsResult.result.docs;
            records = [{
                lat: lat,
                lng: lng,
                formattedAddresses: formattedAddresses,
                docs: docs
            }];
        } else {

            records = [];

        }//end of if-else
        try {

            var ids = [];

            async.forEach(records, function (record, callback) {

                    alchemyNewsDB.insert(record, function (err, body, header) {
                        ids.push(body.id);
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

                    var result = null;
                    async.forEach(ids, function (id, callback) {

                            alchemyNewsDB.get(id, function (err, data, header) {
                                if (err) {
                                    console.error('AlchemyData:', 'alchemyNewsDB', data);
                                    callback(err);
                                } else {
                                    console.info('AlchemyData:', 'alchemyNewsDB', data);
                                    result = data;
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

                            if (result != null) {

                                return (_.isFunction(eventObj.cb)) ? eventObj.cb({
                                    status: 'OK',
                                    statusCode: 200,
                                    result: {docs: [result]}
                                }) : '';

                            } else {

                                //@Todo : Executed in case of if Alchemy API's data
                                //limit is reached or found empty results as a result of
                                //given query.This workaround may be removed in feature
                                //it getting values from the db and give it to user

                                var query = {
                                    selector: {
                                        formattedAddresses: {
                                            $elemMatch: {
                                                formattedAddress: formattedAddress
                                            }
                                        }
                                    }
                                };
                                alchemyNewsDB.find(query, function (err, result, header) {
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
                            }//end of if-else
                        });
                });

        } catch (ex) {
            console.error(ex);
            return (_.isFunction(eventObj.cb)) ? eventObj.cb(ex) : '';
        }//end of try-catch

    });
};


AlchemyData.prototype.show = function (eventObj) {

    var query = {
        selector: {
            docs: {
                $elemMatch: {
                    id: eventObj.data
                }
            }
        },
        fields: [
            'docs'
        ]
    };
    alchemyNewsDB.find(query, function (err, result, header) {
        if (err) {

            console.error('AlchemyData:', 'alchemyNewsDB', result);
            var errorObj = {
                status: 'error',
                statusCode: err.headers.statusCode,
                error: err.message
            };
            return (_.isFunction(eventObj.cb)) ? eventObj.cb(errorObj) : '';

        } else {
            try {

                var docs = result.docs[0].docs;
                var index = _.findIndex(docs, function (o) {
                    return o.id == eventObj.data;
                });
                var doc = docs[index];

            } catch (ex) {
                console.error(ex);
            }//end of try-catch

            console.info('AlchemyData:', 'alchemyNewsDB', doc);
            return (_.isFunction(eventObj.cb)) ? eventObj.cb({
                status: 'OK',
                statusCode: 200,
                result: doc
            }) : '';

        }//end of if-else
    });
};


module.exports = AlchemyData;