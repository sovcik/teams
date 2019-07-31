"use strict";

// Load the AWS SDK for Node.js
const awsS3 = require('aws-sdk/clients/s3');
const debugLib = require('debug')('storage');

const exp = {};
module.exports = exp;

// Create S3 service object
const s3 = new awsS3({
    apiVersion: '2006-03-01',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION});

// Create the parameters for calling listObjects
exp.bucketParams = {

};

exp.listFiles = function(prefix){
    return new Promise(
        async function (fulfill, reject) {
            let params = {
                Bucket : process.env.AWS_S3_BUCKET,
                Prefix : prefix
            };
            let debug = debugLib.extend('listFiles');
            debug("querying S3 bucketPar=%o", params);

            try {
                const data = await s3.listObjects(params).promise();
                debug("data received %o", data);
                fulfill(data);

            } catch(err) {
                debug("error occurred. err=%o", err);
                reject(err);
            }

        }
    )
};

exp.getFileStream = function(fileName, res){
    return new Promise(
        async function (fulfill, reject) {
            let params = {
                Bucket : process.env.AWS_S3_BUCKET,
                Key : fileName
            };
            let debug = debugLib.extend('dwnFile');
            debug("requesting download file=%o", params);

            try {
                let s = s3.getObject(params).createReadStream();
                debug("downloading file %o", params.Key);
                fulfill(s);

            } catch(err) {
                debug("error occurred. err=%o", err);
                reject(err);
            }

        }
    )
};



