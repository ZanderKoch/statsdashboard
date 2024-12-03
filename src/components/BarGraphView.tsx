import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

interface RowObject {
  organization: string;
  jobName: string;
  uniqueUsers: number;
}

interface BarGraphViewProps {
  dataset: RowObject[];
}

interface Organization {
  name: string;
  jobNames: { [key: string]: number };
  total: number;
}

const BarGraphView: React.FC<BarGraphViewProps> = ({ dataset }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    setOrganizations(aggregateOrganizations(dataset));
  }, [dataset]);

  //TODO: comments
  function aggregateOrganizations(data: RowObject[]) {
    const result: Organization[] = [];

    data.forEach((row) => {
      const { organization, jobName, uniqueUsers } = row;
      const existingOrganization = result.find(
        (resultRow) => organization === resultRow.name
      );

      if (!existingOrganization) {
        result.push({
          name: organization,
          jobNames: { [jobName]: uniqueUsers },
          total: uniqueUsers,
        });
      } else {
        existingOrganization.jobNames[jobName] = uniqueUsers;
        existingOrganization.total += uniqueUsers;
      }
    });

    const jobsArray = getUniqueJobNameArray(data);
    result.forEach((organization) => {
      for (const uniqueJobName of jobsArray) {
        if (!(uniqueJobName in organization.jobNames)) {
          organization.jobNames[uniqueJobName] = 0;
        }
      }
    });

    return result;
  }

  function getUniqueJobNameArray(dataset: RowObject[]): string[] {
    const jobNamesSet: Set<string> = new Set();
    dataset.forEach((row) => {
      jobNamesSet.add(row.jobName);
    });
    return Array.from(jobNamesSet);
  }

  /**
   * Generates all bar elements that the graph needs for the supplied dataset
   * @param {RowObject[]} dataset
   * @return {JSX.Element[]}
   */
  function generateBars(dataset: RowObject[]): JSX.Element[] {
    const bars: JSX.Element[] = [];
    const jobNames = getUniqueJobNameArray(dataset);
    const colors = ['#FF6347', '#32CD32', '#00BFFF']; //predefined colors

    jobNames.forEach((jobName, index) => {
      bars.push(
        <Bar
          key={jobName}
          dataKey={`jobNames.${jobName}`}
          stackId="stack"
          fill={colors[index % colors.length]}
          isAnimationActive={false}
        />
      );
    });

    return bars;
  }

  function CustomTooltip({
    active,
    payload,
    label,
  }: TooltipProps<ValueType, NameType>) {
    if (!(active && payload)) {
      return null;
    } else {
      let payloadReversed = [...payload].reverse();
      /*for some reason payload is in reverse order to the bars on the chart
        by default*/
      return (
        <div className="bg-white p-1 rounded-md">
          <p className="font-bold">{label}</p>
          <ul>
            {payloadReversed.map((item) => {
              if (item.value === 0) {
                return null;
              } else {
                const nameString = item.name as string;
                const formattedName = nameString.replace(/^jobNames\./, '');
                return (
                  <li style={{ color: item.color }} key={item.name}>
                    {formattedName}: {item.value}
                  </li>
                );
              }
            })}
          </ul>
          <p>
            Totalt: {organizations.find((item) => item.name === label)?.total}
          </p>
        </div>
      );
    }
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={
          //display organization in decending order of total members
          organizations.sort((a, b) => b.total - a.total)
        }
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        {generateBars(dataset)}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarGraphView;
