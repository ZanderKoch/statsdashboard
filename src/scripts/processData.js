const fs = require('fs');
const fastCsv = require('fast-csv');
const crypto = require('crypto');
const initSqlJs = require('sql.js');

const secretKey = crypto.randomBytes(32).toString('hex');

function hashUsername(username) {
  return crypto.createHmac('SHA512', secretKey).update(username).digest('hex');
}

const options = {
  objectMode: true,
  delimiter: ';',
  quote: '"',
  headers: [
    'username',
    'course',
    'completionDate',
    'jobName',
    'location',
    'organization',
  ],
  renameHeaders: true,
  discardUnmappedColumns: true,
  skipRows: 1 /* Shouldn't be needed according to this official example 
  https://c2fo.github.io/fast-csv/docs/parsing/examples/#renaming-headers,
  yet without it the top row with the headers gets included */,
};

const data = [];

fs.createReadStream('input.csv', 'utf-8')
  .pipe(fastCsv.parse(options))
  .on('error', (error) => {
    console.log(error);
  })
  .on('data', (row) => {
    data.push(row);
  })
  .on('end', (rowCount) => {
    console.log(`Found ${rowCount} entries`);

    //perform processing on each row object
    const processedData = data.map((row) => {
      /*
        Hash usernames so that unique users can be identified while also
        keeping the data anonymous
      */
      row.hashedUsername = hashUsername(row.username);
      delete row.username;

      /*
        Dates are in the format YYYY-MM-DD in the input file but that will not
        work with SQLite so we convert to "YYYY-MM-DD HH:MM:SS.SSS"
      */
      row.completionDate += ' 00:00:00.000';

      return row;
    });

    initSqlJs().then((SQL) => {
      const database = new SQL.Database();

      database.run(
        'CREATE TABLE IF NOT EXISTS data (' +
          'completionDate TEXT NOT NULL, ' +
          'course TEXT NOT NULL, ' +
          'jobName TEXT NOT NULL, ' +
          'location TEXT NOT NULL, ' +
          'organization TEXT NOT NULL, ' +
          'hashedUsername TEXT NOT NULL)'
      );

      const statement = database.prepare(
        'INSERT INTO data ' +
          '(completionDate, course, jobName, location, organization, hashedUsername) ' +
          'VALUES (?, ?, ?, ?, ?, ?)'
      );

      /* 
        insert each row into the data table by binding current row's values to
        each ? in the prepared statement 
      */
      processedData.forEach((row) => {
        statement.run([
          row.completionDate,
          row.course,
          row.jobName,
          row.location,
          row.organization,
          row.hashedUsername,
        ]); //probably far from the best ways to do this
      });
      statement.free();

      //getting some information from the database to confirm that it works, comment out later
      const getStatement = database.prepare('SELECT * FROM data LIMIT 3;');
      while (getStatement.step()) {
        console.log(getStatement.getAsObject());
      }

      //save database as a .sqlite file
      const databaseData = database.export();
      const buffer = Buffer.from(databaseData);
      fs.writeFileSync('public/database.sqlite', buffer);
    });
  });
