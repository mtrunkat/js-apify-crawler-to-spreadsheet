const Apify = require('apify');
const _ = require('underscore');
const GoogleSpreadsheet = require('google-spreadsheet');
const md5 = require('md5');
const Promise = require('bluebird');

// Executes array of promises in a sequence.
// This is needed when we are inserting new rows to Google spreadsheet to don't exceed limits.
const sequentializePromises = (promises) => {
    return promises.reduce((prev, next) => {
        return prev.then(() => next());
    }, Promise.resolve());
};

Apify.main(async () => {
    let input = await Apify.getValue('INPUT');

    if (!input) throw new Error('Input is required!');
    if (_.isString(input)) input = JSON.parse(input);
    if (!input.data) throw new Error('Input.data is required!');

    input.data = JSON.parse(input.data);

    if (!input._id) throw new Error('Input must contain act execution ID!');
    if (!input.data.googleCredentialsEmail) throw new Error('Parameter input.googleCredentialsEmail is required.');
    if (!input.data.googleCredentialsPrivateKey) throw new Error('Parameter input.googleCredentialsPrivateKey is required.');
    if (!input.data.spreadsheetKey) throw new Error('Parameter input.spreadsheetKey is required.');
    if (!_.isNumber(input.data.spreadsheetPage)) throw new Error('Parameter input.spreadsheetPage is required.');

    console.log('Requesting data ... ');
    const response = await Apify.client.crawlers.getExecutionResults({ executionId: input._id, simplified: 1 });
    const newData = response.items;
    console.log(`... got ${newData.length} items from last crawler run ...`);

    const doc = new GoogleSpreadsheet(input.data.spreadsheetKey);
    // Authenticates to Google API.
    await Promise.promisify(doc.useServiceAccountAuth)({
        client_email: input.data.googleCredentialsEmail,
        private_key: input.data.googleCredentialsPrivateKey,
    });
    // Gets info about document
    const info = await Promise.promisify(doc.getInfo)();
    // Returns selected sheet page.
    const sheet = info.worksheets[input.data.spreadsheetPage];

    // Add an array containing old dataset to result.
    // Getting *2 records because some rows might got deleted at Heureka meanwhile.
    const oldData = await Promise.promisify(sheet.getRows)({ reverse: true, limit: 2 * newData.length });
    const hashRow = row => md5(_.toArray(_.omit(row, 'url')).join(''));
    const oldHashes = _.pluck(oldData, 'hash');

    const promises = newData
        // Add hash.
        .map(row => _.extend(row, { hash: hashRow(row) }))
        // Filter out already inserted items.
        .filter(row => !_.contains(oldHashes, row.hash))
        // Insert new row to spreadsheet (maps to promise).
        .map(row => (() => Promise.promisify(sheet.addRow)(row)));

    console.log(`... ${promises.length} of them are new ...`);
    console.log('... inserting new items do Google spreadsheet ...')

    // Inserts new rows 1 by 1.
    await sequentializePromises(promises);
});