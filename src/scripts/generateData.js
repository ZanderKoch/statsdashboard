const fs = require("fs");
const { faker } = require("@faker-js/faker");

function getLocationNameListFromFile(path) {
  const json = fs.readFileSync(path, { encoding: "utf8" });
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
  locations: getLocationNameListFromFile("locations.json"),
  users: /* 500 */ 10,
  completions: 10000,
  jobs: 25,
  startDate: new Date(2019, 0, 1),
  endDate: new Date(2024, 11, 31),
  locOrgsRange: [1, /* 500 */ /* 100 */ 5],
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
console.log("locations: ", locations);

//create jobs

const jobs = faker.helpers.multiple(faker.person.jobTitle, { count: 25 });

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
const users = [];

for (let i = 0; i < params.users; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  if (i == 0) {
    console.log(firstName, lastName);
  }
  const nameString =
    firstName.substring(0, 2).toUpperCase() +
    lastName.substring(0, 3).toUpperCase() +
    (faker.helpers.maybe(
      () => faker.helpers.rangeToNumber({ min: 1, max: 10 }),
      {
        probability: 0.01,
      }
    ) ?? "");
  console.log(nameString);
}

//asign
