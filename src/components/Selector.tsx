import React from 'react';
import Select, { MultiValue } from 'react-select';

interface SelectorProps {
  callback: (selection: string[]) => void;
  options: string[];
  placeholder: string;
}

function generateOptionObjects(options: string[]) {
  return options.map((option) => {
    return { value: option, label: option };
  });
}

const Selector: React.FC<SelectorProps> = ({
  callback,
  options,
  placeholder,
}) => {
  const handleChange = (
    selectedOptions: MultiValue<{ value: string; label: string }>
  ) => {
    const values = selectedOptions.map((option) => option.value);
    callback(values);
  };
  return (
    <Select
      className="mb-2"
      options={generateOptionObjects(options)}
      isMulti
      onChange={handleChange}
      placeholder={placeholder}
    ></Select>
  );
};

export default Selector;
