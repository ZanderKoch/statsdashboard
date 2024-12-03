import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import MapView from './components/MapView';
import BarGraphView from './components/BarGraphView';
import { DateRange } from './shared';
import DateRangeSelector from './components/DateRangeSelector';
import Selector from './components/Selector';

const App: React.FC = () => {
  //STATE STUFF
  const [db, setDb] = useState<Database | undefined>();

  const [data, setData] = useState<any[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const handleLocationSelect = useCallback((location: string) => {
    setSelectedLocation(location);
  }, []);

  const [barGraphReady, setBarGraphReady] = useState<boolean>(false);

  const [participantsPerLocation, setParticipantsPerLocation] = useState<{
    [key: string]: number;
  }>({});

  const currentYear = new Date().getFullYear();
  const dataDateBounds: DateRange = {
    startDate: new Date(2019, 0),
    endDate: new Date(currentYear, 11), //december of current year
  };
  const [selectedDateRange, setSelectedDateRange] =
    useState<DateRange>(dataDateBounds);
  const handleDateRangeChange = useCallback((dateRange: DateRange) => {
    setSelectedDateRange(dateRange);
  }, []);

  const [totalCompletions, setTotalCompletions] = useState<number>();

  const [uniqueJobNames, setUniqueJobNames] = useState<string[]>([
    'Inga yrken laddade än.',
  ]);
  const [selectedJobNames, setSelectedJobNames] = useState<string[]>();
  const handleJobNameSelectionChange = useCallback((jobNames: string[]) => {
    setSelectedJobNames(jobNames);
  }, []);

  const [uniqueCourses, setUniqueCourses] = useState<string[]>([
    'Inga kurser laddade än.',
  ]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const handleCourseSelectionChange = useCallback((courses: string[]) => {
    setSelectedCourses(courses);
  }, []);

  //UTILITY STUFF
  /**
   * Returns a string that can be added to a db query to filter entries to only
   * those whose value in the provided column matches one of the provided values.
   *
   * @param {(string[] | undefined)} values Values to filter by.
   * @param {string} column Name of the colum to filter
   * @return {*}
   */
  function getListFilterString(
    values: string[] | undefined,
    column: string
  ): string {
    if (values === undefined || values.length === 0) {
      return ''; //return an empty string if there are no values
    }

    // escape single quotes in values to prevent SQL injection
    const escapedJobNames = values
      .map((name) => `'${name.replace(/'/g, "''")}'`)
      .join(', ');
    return `AND ${column} IN (${escapedJobNames}) `;
  }

  //USEEFFECT STUFF
  //load database on initial page load only
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        //load SQLite Wasm file and initialize a db with database.sqlite
        const SQL: SqlJsStatic = await initSqlJs({
          locateFile: (file) => `${process.env.PUBLIC_URL}/static/js/${file}`,
        });

        const databaseFile = await fetch(
          `${process.env.PUBLIC_URL}/database.sqlite`
        );
        const buffer = await databaseFile.arrayBuffer();

        setDb(new SQL.Database(new Uint8Array(buffer)));
        console.log('database loaded');
      } catch (err) {
        console.error('Error fetching database:', err);
      }
    };

    loadDatabase();
  }, []);

  //get data filtered to specific location and date range whenever those update
  useEffect(() => {
    console.log(selectedLocation);
    if (!db) {
      console.log('error loading data, SQLite has not yet been initialized');
      return; //database wasn't ready yet
    } else {
      let result = [];

      const getStatement = db.prepare(
        "SELECT organization, jobName, count(DISTINCT hashedUsername || '-' || course) AS uniqueUsers " +
          'FROM data ' +
          'WHERE location=$location ' +
          'AND completionDate BETWEEN $startDate AND $endDate ' +
          getListFilterString(selectedJobNames, 'jobName') +
          getListFilterString(selectedCourses, 'course') +
          'GROUP BY organization, jobName ' +
          'ORDER BY organization ASC '
      );
      getStatement.bind({
        $location: selectedLocation,
        $startDate: selectedDateRange.startDate.toISOString(),
        $endDate: selectedDateRange.endDate.toISOString(),
      });
      while (getStatement.step()) {
        //console.log(getStatement.getAsObject());
        result.push(getStatement.getAsObject());
      }

      getStatement.free();
      getStatement.freemem();

      console.log(result);

      setData(result);
      setBarGraphReady(true);
    }
  }, [selectedLocation, selectedDateRange, selectedJobNames, selectedCourses]);

  //get total participants per location for current filters whenever filters change
  useEffect(() => {
    if (!db) {
      console.log('error loading data, SQLite has not yet been initialized');
      return; //database wasn't ready yet
    } else {
      const rows: Array<{ location: string; uniqueUsers: number }> = [];

      const getStatement = db.prepare(
        "SELECT location, COUNT(DISTINCT hashedUsername || '-' || course) AS uniqueUsers " +
          'FROM data ' +
          'WHERE completionDate BETWEEN $startDate AND $endDate ' +
          getListFilterString(selectedJobNames, 'jobName') +
          getListFilterString(selectedCourses, 'course') +
          'GROUP BY location'
      );
      getStatement.bind({
        $startDate: selectedDateRange.startDate.toISOString(),
        $endDate: selectedDateRange.endDate.toISOString(),
      });

      while (getStatement.step()) {
        rows.push(
          getStatement.getAsObject() as {
            location: string;
            uniqueUsers: number;
          }
        );
      }

      getStatement.free();
      getStatement.freemem();

      //rearange query result into form that makes more sense for map labels
      const result: { [key: string]: number } = rows.reduce(
        (accumumulator, row) => {
          accumumulator[row.location] = row.uniqueUsers;
          return accumumulator;
        },
        {} as { [key: string]: number }
      );
      console.log(result);
      setParticipantsPerLocation(result);
    }
  }, [selectedDateRange, db, selectedJobNames, selectedCourses]);

  //find total number of course completions for current filter
  useEffect(() => {
    if (!db) {
      console.log('error loading data, SQLite has not yet been initialized');
      return; //database wasn't ready yet
    } else {
      const getStatement = db.prepare(
        'SELECT COUNT(*) AS totalCompletions ' +
          'FROM data ' +
          'WHERE completionDate BETWEEN $startDate AND $endDate ' +
          getListFilterString(selectedJobNames, 'jobName') +
          getListFilterString(selectedCourses, 'course')
      );

      console.log(
        'SELECT COUNT(*) AS totalCompletions ' +
          'FROM data ' +
          'WHERE completionDate BETWEEN $startDate AND $endDate ' +
          getListFilterString(selectedJobNames, 'jobName') +
          getListFilterString(selectedCourses, 'course')
      );

      getStatement.bind({
        $startDate: selectedDateRange.startDate.toISOString(),
        $endDate: selectedDateRange.endDate.toISOString(),
      });

      const result = getStatement.step()
        ? getStatement.getAsObject()
        : { totalCompletions: 0 };

      getStatement.free();
      getStatement.freemem();

      console.log(result.totalCompletions);
      setTotalCompletions(result.totalCompletions as number);
    }
  }, [selectedDateRange, db, selectedJobNames, selectedCourses]);

  //load list of unique jobNames once db is ready
  useEffect(() => {
    if (!db) {
      console.log('error loading data, SQLite has not yet been initialized');
      return; //database wasn't ready yet
    } else {
      const getStatement = db.prepare(
        'SELECT DISTINCT jobName AS jobName ' +
          'FROM data ' +
          'ORDER BY jobName ASC'
      );

      const jobNames: string[] = [];
      while (getStatement.step()) {
        jobNames.push(getStatement.getAsObject()?.jobName as string);
      }

      getStatement.free();
      getStatement.freemem();

      setUniqueJobNames(jobNames);
    }
  }, [db]);

  //load list of unique courses once db is ready
  useEffect(() => {
    if (!db) {
      console.log('error loading data, SQLite has not yet been initialized');
      return; //database wasn't ready yet
    } else {
      const getStatement = db.prepare(
        'SELECT DISTINCT course AS course ' +
          'FROM data ' +
          'ORDER BY course ASC'
      );

      const courses: string[] = [];
      while (getStatement.step()) {
        courses.push(getStatement.getAsObject()?.course as string);
      }

      getStatement.free();
      getStatement.freemem();

      setUniqueCourses(courses);
    }
  }, [db]);

  return (
    <>
      <main>
        <div className="mx-8">
          <DateRangeSelector
            onChange={handleDateRangeChange}
            bounds={dataDateBounds}
          />
          <Selector
            options={uniqueJobNames}
            callback={handleJobNameSelectionChange}
            placeholder="Välj yrkeskategorier"
          ></Selector>
          <Selector
            options={uniqueCourses}
            callback={handleCourseSelectionChange}
            placeholder="Välj kurser"
          ></Selector>
        </div>

        <MapView
          onLocationSelect={handleLocationSelect}
          participantsPerLocation={participantsPerLocation}
          totalCompletions={totalCompletions}
        />
        {barGraphReady ? <BarGraphView dataset={data} /> : null}
      </main>
      <footer className="flex flex-row gap-x-3">
        <a href="https://github.com/ZanderKoch/statsdashboard/blob/main/LICENSE.txt">
          License
        </a>
        <a href="https://github.com/ZanderKoch/statsdashboard/blob/main/NOTICE.txt">
          3rd party attributions
        </a>
      </footer>
    </>
  );
};

export default App;
