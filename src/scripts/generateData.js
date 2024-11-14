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
  users: 500,
  completions: 10000,
  jobs: 25,
  startDate: new Date(2019, 0, 1),
  endDate: new Date(2024, 11, 31),
  locOrgsRange: [1, /* 500 */ 100],
  orgJobsRange: [1, 8],
};
