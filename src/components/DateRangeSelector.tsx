import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useState } from 'react';
import { DateRange } from 'src/shared';

const DateRangeSelector: React.FC<{
  onChange: (dates: DateRange) => void;
  bounds: DateRange;
}> = ({ onChange, bounds }) => {
  const [displayedDateRange, setDisplayedDateRange] =
    useState<DateRange>(bounds);

  function handleSliderChange(values: number[]) {
    const newRange: DateRange = {
      startDate: new Date(values[0]),
      endDate: new Date(values[1]),
    };

    newRange.endDate = new Date(
      newRange.endDate.getFullYear(),
      newRange.endDate.getMonth(),
      31
    );
    onChange(newRange);
  }

  function handleSliderDisplayValueChange(values: number[]) {
    const newRange: DateRange = {
      startDate: new Date(values[0]),
      endDate: new Date(values[1]),
    };
    setDisplayedDateRange(newRange);
    //onChange(newRange); //makes the bar graph react to the date range selection
    //in real time. very neat but too performance intensive.
  }

  function generateMonthlyMarks(start: Date, end: Date) {
    const marks: { [key: number]: string } = {};
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const isJanuary = current.getMonth() === 0;
      marks[current.getTime()] = isJanuary
        ? current.getFullYear().toString()
        : /* current.toLocaleDateString(undefined, { month: 'short' })
        // gives each mark text for the name of its month  */ ' ';
      current.setMonth(current.getMonth() + 1);
    }
    return marks;
  }

  const marks = generateMonthlyMarks(bounds.startDate, bounds.endDate);

  return (
    <div className="w-full py-8">
      {displayedDateRange && (
        <div className="flex w-full text-4xl mb-4">
          <div className="text-center">
            {displayedDateRange.startDate
              .toLocaleString(undefined, {
                month: 'long',
                year: 'numeric',
              })
              .toUpperCase()}
          </div>
          <div className="text-center">&nbsp;-&nbsp;</div>
          <div className="text-center">
            {displayedDateRange.endDate
              .toLocaleString(undefined, {
                month: 'long',
                year: 'numeric',
              })
              .toUpperCase()}
          </div>
        </div>
      )}

      <Slider
        range
        min={bounds.startDate.getTime()}
        max={bounds.endDate.getTime()}
        defaultValue={[bounds.startDate.getTime(), bounds.endDate.getTime()]}
        onChange={(value) => handleSliderDisplayValueChange(value as number[])}
        onChangeComplete={(value) => handleSliderChange(value as number[])}
        allowCross={false}
        marks={marks} //add stepping
        step={null} /*prevent them from crossing over? they have to be able to
          be on the same mark though or it'll be impossible to select a single
          year/month/week*/
        style={{ zIndex: 0 }}
      />
    </div>
  );
};

export default DateRangeSelector;
