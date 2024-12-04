const fs = require('fs');
const { faker, en } = require('@faker-js/faker');
const { writeToStream } = require('fast-csv');

function getLocationNameListFromFile(path) {
  const json = fs.readFileSync(path, { encoding: 'utf8' });
  const parsed = JSON.parse(json);
  console.log(parsed);
  const names = parsed.map((location) => {
    return location.name;
  });
  console.log(names);

  return names;
}

//generation parameters
const params = {
  locations: getLocationNameListFromFile('locations.json'),
  users: 500,
  completions: 10000,
  jobs: 25,
  courses: 750,
  startDate: new Date(2019, 0, 1),
  endDate: new Date(2024, 11, 31),
  locOrgsRange: [1, 100],
  orgJobsRange: [1, 8],
};

//create locations objects with orgs
const locations = params.locations.map((location) => {
  return {
    name: location,
    orgs: [
      ...new Set(
        faker.helpers.multiple(faker.person.jobArea, {
          count: { min: params.locOrgsRange[0], max: params.locOrgsRange[1] },
        })
      ),
    ],
  };
});
console.log('locations: ', locations);

//create jobs
const jobs = faker.helpers.multiple(faker.person.jobTitle, {
  count: params.jobs,
});

console.log(jobs);

//give each org a random number of jobs it employs
//loop through each org in each location
console.log(typeof locations);

locations.forEach((location) => {
  location.orgs = location.orgs.map((org) => {
    return {
      name: org,
      employs: faker.helpers.arrayElements(jobs, {
        min: params.orgJobsRange[0],
        max: params.orgJobsRange[1],
      }),
    };
  });
});

console.log(locations[0]);
console.log(locations[0].orgs[0]);

//create users
const usernames = [];

for (let i = 0; i < params.users; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  const nameString =
    firstName.substring(0, 2).toUpperCase() +
    lastName.substring(0, 3).toUpperCase() +
    (faker.helpers.maybe(
      () => faker.helpers.rangeToNumber({ min: 1, max: 10 }),
      {
        probability: 0.01,
      }
    ) ?? '');

  if (i == 0) {
    console.log(firstName, lastName, nameString);
  }
  usernames.push(nameString);
}

/* give each user a location where they live, an org there that they work for,
   and a job that said org employs */
const users = usernames.map((user) => {
  const location = faker.helpers.arrayElement(locations);
  const org = faker.helpers.arrayElement(location.orgs);
  const job = faker.helpers.arrayElement(org.employs);

  return {
    username: user,
    location: location.name,
    organization: org.name,
    jobName: job,
  };
});

console.log(users);

//generate course names
const coursenames = [];
for (let i = 0; i < params.courses; i++) {
  const level = faker.helpers.arrayElement([
    'Basic',
    'Intermediate',
    'Advanced',
  ]);
  const adjective = faker.company.buzzAdjective();
  const noun = faker.company.buzzNoun();

  coursenames.push(`${level} ${adjective} ${noun}`);
}

//record random users completing random courses on random days
const completions = [];
for (let i = 0; i < params.completions; i++) {
  const user = faker.helpers.arrayElement(users);

  const course = faker.helpers.arrayElement(coursenames);

  const date = faker.date.between({
    from: params.startDate,
    to: params.endDate,
  });
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const dateString = `${year}-${month}-${day}`;

  const entry = { ...user, completionDate: dateString, course: course };

  if (i == 0) {
    console.log(entry);
  }

  completions.push(entry);
}

//save to .csv
/* transform completion objects into arrays of values in the same order that
   they should be in the csv */
const transformedCompletions = completions.map((entry) => {
  return [
    entry.username,
    entry.course,
    entry.completionDate,
    entry.jobName,
    entry.location,
    entry.organization,
  ];
});

const data = [
  [],
  [
    'Användarnamn',
    'Utbildning Titel',
    'Slutförd utbildning datum',
    'Jobbfamilj Namn',
    'Ort',
    'Organisation',
  ],
].concat(transformedCompletions);

const options = {
  delimiter: ';',
  quote: '"',
  headers: false,
  writeHeaders: false,
  quoteColumns: true,
};

const writeStream = fs.createWriteStream('input.csv');

writeToStream(writeStream, data, options)
  .on('finish', () => {
    console.log('CSV file has been written successfully.');
  })
  .on('error', (err) => {
    console.error('Error writing to CSV:', err);
  });
