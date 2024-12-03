# Statsdashboard

This project is a small statistics visualization dashboard for course completion data that I made as part of my work training at FoUU Region Kronoberg. The aim of the project was primarily to explore possibilities for using data visualization and data analysis within the organization.
because of the exploratory nature of the project and the organization not not normally doing any sort of software development it did not make sense to set a server up.

# How it works

The first step would normally have been to get a `.csv` report file of course completions from FoUU's Learning Management System. That data is confidential though so I am working on a script that generates suitable dummy data.

The `.csv` file should be named `input.csv` and placed in the root directory of the project so the script `processData.js` can find it.
That script will then read all the data in the `.csv` file, cryptographically hash the usernames and add the data to an SQLite database which is saved as a `.sqlite` file in the `public` directory.

Since the database file was put in the `public` directory the frontend will easily be able to access it once a development preview server has been started or a build has been made.
Because this makes the entire database available to the frontend of instead having the frontend sending requests to a backend which queries the database and sends back only the information needed the usernames have to be cryptographically hashed with a secret key. The hashing is needed to anonymize the database entries while still leaving an identifier that's unique to each user to differentiate them in queries.
A hashing algorithm that uses a private key was chosen to defend against the possibility of rainbow table attacks. Salting was not used since it would mean that the same input username would not always generate the same output hash.

When the frontend is openened in the browser it loads the `.sqlite` file and uses it to initialize an sql.js database, which uses uses a virtual database file stored in memory and a WebAssembly compilation of SQLite. This lets database queries be made directly in the client's browser, eliminating the need for any sort of backend.

Once the database has been loaded on the frontend the user will be presented with filters for date, job name(s), and course(s) which are applied to all queries, the total number of course completions in the database, and the number total number of participants at each location geographically overlaid atop a map graphic of the region. Clicking on a location will display a stacked bar graph that breaks down non-repeat course completions by organization and job within that organization.

# Commands

## Generate new data

Once fully implemented this command will generate an `input.csv` file full of dummy data according to the values of the `params` object

```bash
npm run generate-data
```

## Generate database from `.csv` file

Generates a .sqlite database file from a .csv file, which will be used by the frontend. The script is made to work with the `.csv` report files exactly as they are when exported from FoUU Region Kronoberg's LMS, meaning double quotes for quotation, ; as the delimiter, dates in the format `YYYY-MM-DD`, column names on the second row, and data on the third row and down like so:
|         |                           |                       |                 |         |                           |
|:--------|:--------------------------|:----------------------|:----------------|:--------|:--------------------------|
|Username |Course title               |Course completion date |Job name         |Location |Organization               |
|ZAKOC    |Spreadsheets for developers|2024-12-02             |Software engineer|Växjö    |FoUU utbildning och lärande|
|...      |...                        |...                    |...              |...      |...                        |

```bash
npm run generate-data
```

## Start development preview server

```bash
npm start
```

## make a local build

```bash
PUBLIC_URL=. npm run build
```

## making a build for web deployment

See [Create React App's documentation on the subject](https://create-react-app.dev/docs/deployment/) for more info

```bash
npm run build
```