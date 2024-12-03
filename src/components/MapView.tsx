import { useEffect, useState } from 'react';
import chroma from 'chroma-js';

interface MapViewerProps {
  onLocationSelect: (location: string) => void;
  participantsPerLocation: { [key: string]: number };
  totalCompletions: number | undefined;
}

interface Location {
  name: string;
  x: number;
  y: number;
  styles: { [key: string]: string };
}

function minMaxLerp(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((x - inMin) * (outMax - outMin)) / (inMax - inMin);
}

const MapView: React.FC<MapViewerProps> = ({
  onLocationSelect,
  participantsPerLocation,
  totalCompletions,
}) => {
  const MAP_IMAGE_WIDTH = 1622;
  const MAP_IMAGE_HEIGHT = 1056;

  const [locations, setLocations] = useState<Location[] | null>(null);

  //load locations list first time component is loaded
  useEffect(() => {
    async function fetchLocationsData() {
      try {
        const response = await fetch(
          `${process.env.PUBLIC_URL}/locations.json`
        );
        const result: Location[] = await response.json();

        //turn x and y into percentage offsets
        const processedData = result.map((item) => ({
          ...item,
          x: Math.round((item.x / MAP_IMAGE_WIDTH) * 100),
          y: Math.round((item.y / MAP_IMAGE_HEIGHT) * 100),
        }));

        setLocations(processedData);
      } catch (error) {
        console.error('Error fetching location list:', error);
      }
    }

    fetchLocationsData();
  }, []);

  //setting up the color scale
  const participantsValues = Object.values(participantsPerLocation);
  const participantsMin = Math.min(...participantsValues);
  const participantsMax = Math.max(...participantsValues);
  const colorScale = chroma
    .scale(['blue', 'cyan', 'lime', 'yellow', 'red'])
    .domain([participantsMin, participantsMax]);

  return (
    <div className="relative w-full mb-8">
      <img
        alt="stiliserad karta av Kronoberg"
        src={`${process.env.PUBLIC_URL}/kronoberg.png`}
        className="w-full opacity-85"
      />
      <p className="absolute" style={{ left: '5%', top: '5%' }}>
        <span className="text-2xl">Totala Kursgenomförningar:</span>
        <br />
        <span className="text-6xl">{totalCompletions}</span>
      </p>
      {locations?.map((item, index) => (
        <p
          key={index}
          className="absolute text-center"
          style={{ left: `${item.x}%`, top: `${item.y}%`, ...item.styles }}
          onClick={() => onLocationSelect(item.name)}
        >
          <span
            style={{
              color: colorScale(participantsPerLocation[item.name]).hex(),
              fontSize: `${minMaxLerp(
                participantsPerLocation[item.name],
                participantsMin,
                participantsMax,
                8,
                24
              )}px`,
            }}
          >
            ⬤
          </span>
          <br />
          <span>
            {item.name} {participantsPerLocation[item.name]}
          </span>
          <br />
          <span></span>
        </p>
      ))}
    </div>
  );
};

export default MapView;
